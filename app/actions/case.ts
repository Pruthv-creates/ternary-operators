"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getCaseGraph(caseId: string) {
    const nodes = await prisma.node.findMany({
        where: { caseId },
        include: { document: true }
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
        } catch { /* use defaults */ }

        const isEntity = n.type.toLowerCase().includes('entity');
        const rfType = isEntity ? 'entity' : (n.type === 'DOCUMENT' ? 'evidence' : 'hypothesis');

        return {
            id: n.id,
            type: rfType,
            position: { x: n.positionX, y: n.positionY },
            data: {
                ...parsedContent,
                name: (parsedContent.name as string) || n.label,
                label: n.label,
                role: (parsedContent.role as string) || '',
                type: (parsedContent.type as string) || n.type.toLowerCase().replace('entity_', ''),
                status: (parsedContent.status as string) || 'Active',
                riskScore: (parsedContent.riskScore as number) ?? 0,
                credibilityScore: (parsedContent.credibilityScore as number) ?? 80,
                industry: (parsedContent.industry as string) || '',
                location: (parsedContent.location as string) || '',
                avatar: (parsedContent.type === 'person') ? `https://i.pravatar.cc/150?u=${n.id}` : undefined,
                text: (parsedContent.text as string) || n.label,
                prefix: (parsedContent.prefix as string) || '',
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
        style: e.relationshipType.includes('Money Flow')
            ? { stroke: '#10b981', strokeWidth: 2.5 }
            : { stroke: '#8b5cf6', strokeWidth: 1.5 },
        animated: e.relationshipType.includes('Money Flow'),
        labelStyle: { fill: '#60a5fa', fontSize: 10, fontWeight: 500 },
        markerEnd: { type: 'arrowclosed', color: '#8b5cf6' },
    }));

    return { nodes: rfNodes, edges: rfEdges };
}

export async function getUserCases(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            cases: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    return user?.cases || [];
}

export async function inviteCollaborator(caseId: string, email: string) {
    const userToInvite = await prisma.user.findUnique({
        where: { email }
    });

    if (!userToInvite) {
        throw new Error("User not found. They must sign up first.");
    }

    await prisma.case.update({
        where: { id: caseId },
        data: {
            users: {
                connect: { id: userToInvite.id }
            }
        }
    });

    return { success: true };
}

export async function inviteCollaboratorById(caseId: string, userId: string) {
    await prisma.case.update({
        where: { id: caseId },
        data: {
            users: { connect: { id: userId } }
        }
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
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                    ]
                }
            ]
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
                connect: { id: userId }
            }
        }
    });

    return newCase;
}

export async function createInvitation(caseId: string, inviterId: string, inviteeId: string, role: string = "VIEWER") {
    // Check if user is already in case
    const existingCase = await prisma.case.findFirst({
        where: { id: caseId, users: { some: { id: inviteeId } } }
    });
    if (existingCase) throw new Error("Agent is already assigned to this case.");

    // Check for pending invite
    const existingInvite = await prisma.invitation.findFirst({
        where: { caseId, inviteeId, status: "PENDING" }
    });
    if (existingInvite) throw new Error("An invitation is already pending for this agent.");

    await prisma.invitation.create({
        data: {
            caseId,
            inviterId,
            inviteeId,
            role,
        }
    });

    return { success: true };
}

export async function getPendingInvitations(userId: string) {
    return prisma.invitation.findMany({
        where: { inviteeId: userId, status: "PENDING" },
        include: {
            case: { select: { title: true } },
            inviter: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function acceptInvitation(invitationId: string) {
    const invite = await prisma.invitation.findUnique({ where: { id: invitationId } });
    if (!invite) throw new Error("Invitation not found");

    // Add user to case
    await prisma.case.update({
        where: { id: invite.caseId },
        data: { users: { connect: { id: invite.inviteeId } } }
    });

    // Mark as accepted
    await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" }
    });

    return { success: true };
}

export async function rejectInvitation(invitationId: string) {
    await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: "REJECTED" }
    });
    return { success: true };
}

export async function getCaseCollaborators(caseId: string) {
    const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
            users: true
        }
    });
    
    return caseData?.users || [];
}
