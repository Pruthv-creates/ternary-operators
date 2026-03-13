"use server";

import { prisma } from "@/lib/prisma";

export async function syncUser(supabaseUser: { id: string; email?: string; user_metadata?: { full_name?: string; avatar_url?: string } }) {
  if (!supabaseUser.id || !supabaseUser.email) return null;

  try {
    const user = await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: {
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split("@")[0],
        avatar: supabaseUser.user_metadata?.avatar_url,
      },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.email.split("@")[0],
        avatar: supabaseUser.user_metadata?.avatar_url,
      },
    });
    return user;
  } catch (error) {
    console.error("Error syncing user:", error);
    return null;
  }
}

export async function updateUserProfile(userId: string, data: { name?: string; avatar?: string }) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatar: data.avatar,
      },
    });
    return { success: true, user };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: String(error) };
  }
}
