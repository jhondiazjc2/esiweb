import type { Profile, UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const demoProfile: Profile = {
  id: "demo",
  full_name: "Estudiante Demo",
  email: "demo@esi.co",
  role: "estudiante",
  sede_id: "1",
  grupo_id: null,
  modulo_actual: 1,
};

export async function getSessionProfile(): Promise<Profile> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return demoProfile;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return demoProfile;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) {
    return profile as Profile;
  }

  return {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email ?? "Usuario",
    email: user.email ?? "",
    role: (user.user_metadata?.role as UserRole) ?? "estudiante",
    sede_id: null,
    grupo_id: null,
    modulo_actual: 1,
  };
}
