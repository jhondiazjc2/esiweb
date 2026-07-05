import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export async function requireAdmin(): Promise<Profile> {
  const profile = await getSessionProfile();

  if (profile.role !== "admin" || profile.id === "demo") {
    redirect("/dashboard");
  }

  return profile;
}
