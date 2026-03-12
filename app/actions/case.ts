"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getCaseGraph(caseId: string) {
  const nodes = await prisma.node.findMany({
    where: { caseId },
    include: { document: true },
  });

  const edges = await prisma.edge.findMany({
    where: { caseId },
  });

  // Transform DB nodes to React Flow format
  const rfNodes = nodes.map((n) => {
    // Parse stored JSON content for rich entity data
    let parsedContent: Record<string, unknown> = {};
    try {
      if (n.content) parsedContent = JSON.parse(n.content);
    } catch {
      /* use defaults */
    }

    const isEntity = n.type.toLowerCase().includes("entity");
    const rfType = isEntity
      ? "entity"
      : n.type === "DOCUMENT"
        ? "evidence"
        : "hypothesis";

    return {
      id: n.id,
      type: rfType,
      position: { x: n.positionX, y: n.positionY },
      data: {
        ...parsedContent,
        name: (parsedContent.name as string) || n.label,
        label: n.label,
        role: (parsedContent.role as string) || "",
        type:
          (parsedContent.type as string) ||
          n.type.toLowerCase().replace("entity_", ""),
        status: (parsedContent.status as string) || "Active",
        riskScore: (parsedContent.riskScore as number) ?? 0,
        credibilityScore: (parsedContent.credibilityScore as number) ?? 80,
        industry: (parsedContent.industry as string) || "",
        location: (parsedContent.location as string) || "",
        avatar:
          parsedContent.type === "person"
            ? `https://i.pravatar.cc/150?u=${n.id}`
            : undefined,
        text: (parsedContent.text as string) || n.label,
        prefix: (parsedContent.prefix as string) || "",
      },
    };
  });

  // Transform DB edges to React Flow format
  const rfEdges = edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    type: "relation",
    label: e.relationshipType,
    data: { credibilityScore: 85 },
    style: e.relationshipType.includes("Money Flow")
      ? { stroke: "#10b981", strokeWidth: 2.5 }
      : { stroke: "#8b5cf6", strokeWidth: 1.5 },
    animated: e.relationshipType.includes("Money Flow"),
    labelStyle: { fill: "#60a5fa", fontSize: 10, fontWeight: 500 },
    markerEnd: { type: "arrowclosed", color: "#8b5cf6" },
  }));

  return { nodes: rfNodes, edges: rfEdges };
}

export async function getUserCases(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      cases: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return user?.cases || [];
}

export async function inviteCollaborator(caseId: string, email: string) {
  const userToInvite = await prisma.user.findUnique({
    where: { email },
  });

  if (!userToInvite) {
    throw new Error("User not found. They must sign up first.");
  }

  await prisma.case.update({
    where: { id: caseId },
    data: {
      users: {
        connect: { id: userToInvite.id },
      },
    },
  });

  return { success: true };
}

export async function inviteCollaboratorById(caseId: string, userId: string) {
  await prisma.case.update({
    where: { id: caseId },
    data: {
      users: { connect: { id: userId } },
    },
  });
  return { success: true };
}

export async function searchAgents(query: string, excludeUserId: string) {
  if (!query || query.length < 2) return [];
  return prisma.user.findMany({
    where: {
      AND: [
        { id: { not: excludeUserId } },
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 8,
  });
}

export async function createCase(title: string, userId: string) {
  const newCase = await prisma.case.create({
    data: {
      title,
      status: "ACTIVE",
      users: {
        connect: { id: userId },
      },
    },
  });

  return newCase;
}

export async function getCaseInvestigators(caseId: string) {
  if (!caseId) return [];
  const users = await prisma.user.findMany({
    where: { cases: { some: { id: caseId } } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function createInvitation(
  caseId: string,
  inviterId: string,
  inviteeId: string,
  role: string = "VIEWER",
) {
  // Check if user is already in case
  const existingCase = await prisma.case.findFirst({
    where: { id: caseId, users: { some: { id: inviteeId } } },
  });
  if (existingCase) throw new Error("Agent is already assigned to this case.");

  // Check for pending invite
  const existingInvite = await prisma.invitation.findFirst({
    where: { caseId, inviteeId, status: "PENDING" },
  });
  if (existingInvite)
    throw new Error("An invitation is already pending for this agent.");

  await prisma.invitation.create({
    data: {
      caseId,
      inviterId,
      inviteeId,
      role,
    },
  });

  return { success: true };
}

export async function getPendingInvitations(userId: string) {
  return prisma.invitation.findMany({
    where: { inviteeId: userId, status: "PENDING" },
    include: {
      case: { select: { title: true } },
      inviter: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function acceptInvitation(invitationId: string) {
  const invite = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });
  if (!invite) throw new Error("Invitation not found");

  // Add user to case
  await prisma.case.update({
    where: { id: invite.caseId },
    data: { users: { connect: { id: invite.inviteeId } } },
  });

  // Mark as accepted
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "ACCEPTED" },
  });

  return { success: true };
}

export async function rejectInvitation(invitationId: string) {
  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REJECTED" },
  });
  return { success: true };
}

export async function getCaseCollaborators(caseId: string) {
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    include: {
      users: true,
    },
  });

  return caseData?.users || [];
}

export async function getCaseTasks(caseId: string) {
  const tasks = await prisma.node.findMany({
    where: {
      caseId,
      type: "INVESTIGATION_TASK",
    },
    orderBy: { createdAt: "desc" },
  });

  return tasks.map((t) => {
    let content: any = {};
    try {
      if (t.content) content = JSON.parse(t.content);
    } catch {}

    return {
      id: t.id,
      title: t.label,
      priority: content.priority || "Medium",
      status: content.status || "To Do",
      assigneeId: content.assigneeId,
    };
  });
}

export async function getCaseAuditLogs(caseId: string) {
  const logs = await prisma.auditLog.findMany({
    where: { caseId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50, // Limit to recent 50
  });
  return logs.map((l) => ({
    id: l.id,
    user: l.user.name || l.user.email?.split("@")[0] || "Unknown Analyst",
    action: l.action,
    icon: l.icon,
    createdAt: l.createdAt,
  }));
}

export async function createAuditLog(
  caseId: string,
  userId: string,
  action: string,
  icon: string = "zap",
) {
  return prisma.auditLog.create({
    data: {
      caseId,
      userId,
      action,
      icon,
    },
  });
}

export async function saveCaseAnalysis(caseId: string, analysis: any) {
  try {
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: { aiAnalysis: analysis as any },
    });
    return { success: true, case: updatedCase };
  } catch (error) {
    console.error("Failed to save case analysis:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCase(caseId: string, userId: string) {
  try {
    // Verify user is part of the case
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: { users: true },
    });

    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    // Check if user is a collaborator
    const isCollaborator = caseRecord.users.some((u) => u.id === userId);
    if (!isCollaborator) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete the case - all related data (nodes, edges, logs, invitations, etc.) 
    // will now be deleted automatically via 'onDelete: Cascade' in the schema.
    await prisma.case.delete({ where: { id: caseId } });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete case:", error);
    return { success: false, error: String(error) };
  }
}

export async function renameCase(caseId: string, newTitle: string, userId: string) {
  try {
    // Verify user is part of the case
    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      include: { users: true },
    });

    if (!caseRecord) {
      return { success: false, error: "Case not found" };
    }

    const isCollaborator = caseRecord.users.some((u) => u.id === userId);
    if (!isCollaborator) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: { title: newTitle },
    });

    return { success: true, case: updatedCase };
  } catch (error) {
    console.error("Failed to rename case:", error);
    return { success: false, error: String(error) };
  }
}

export async function getCaseDocuments(caseId: string) {
  try {
    const docs = await prisma.document.findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
    });
    return docs;
  } catch (error) {
    console.error("Failed to fetch case documents:", error);
    return [];
  }
}

export async function getCaseNews(caseId: string) {
  try {
    const news = await prisma.news.findMany({
      where: { caseId },
      orderBy: { publishedAt: "desc" },
    });
    return news;
  } catch (error) {
    console.error("Failed to fetch case news:", error);
    return [];
  }
}

export async function createNewsItem(data: {
  caseId: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  imageUrl?: string;
  sentiment?: number;
  publishedAt?: Date;
}) {
  return prisma.news.create({
    data: {
      ...data,
      publishedAt: data.publishedAt || new Date(),
    },
  });
}
