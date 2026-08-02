import type { Profile, UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

const ROLE_RANK: Record<UserRole, number> = {
  estudiante: 1,
  facilitador: 2,
  admin: 3,
};

function higherRole(a: UserRole, b: UserRole): UserRole {
  return ROLE_RANK[a] >= ROLE_RANK[b] ? a : b;
}

const demoProfile: Profile = {
  id: "demo",
  full_name: "Estudiante Demo",
  email: "demo@esi.co",
  role: "estudiante",
  sede_id: "1",
  grupo_id: null,
  persona_id: null,
  modulo_actual: 1,
};

function asRole(value: unknown): UserRole | null {
  if (value === "admin" || value === "facilitador" || value === "estudiante") {
    return value;
  }
  return null;
}

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

  if (!profile) {
    return {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? "Usuario",
      email: user.email ?? "",
      role: asRole(user.user_metadata?.role) ?? "estudiante",
      sede_id: null,
      grupo_id: null,
      persona_id: null,
      modulo_actual: 1,
    };
  }

  let role = asRole(profile.role) ?? "estudiante";
  let personaId = profile.persona_id ? String(profile.persona_id) : null;
  let moduloActual = Number(profile.modulo_actual ?? 1);

  // Elevar rol según personas.app_role (Sebastián / Jhon Jairo → admin)
  if (personaId) {
    const { data: persona } = await supabase
      .from("personas")
      .select("app_role")
      .eq("id", personaId)
      .maybeSingle();
    const personaRole = asRole(persona?.app_role);
    if (personaRole) role = higherRole(role, personaRole);
  }

  // Perfil activo (006): si inactivo, se trata como sin acceso privilegiado
  if (profile.activo === false) {
    role = "estudiante";
  }

  return {
    id: String(profile.id),
    full_name: String(profile.full_name),
    email: String(profile.email),
    role,
    sede_id: profile.sede_id ? String(profile.sede_id) : null,
    grupo_id: profile.grupo_id ? String(profile.grupo_id) : null,
    persona_id: personaId,
    modulo_actual: moduloActual,
  };
}
