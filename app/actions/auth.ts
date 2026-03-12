"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function syncUser(supabaseUser: { id: string; email?: string; user_metadata?: { full_name?: string } }) {
  if (!supabaseUser.id || !supabaseUser.email) return null;

  try {
    const user = await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split("@")[0],
      },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split("@")[0],
      },
    });
    return user;
  } catch (error) {
    console.error("Error syncing user:", error);
    return null;
  }
}
