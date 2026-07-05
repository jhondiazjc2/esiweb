"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _prev: { error: string } | null,
  formData: FormData,
) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Correo y contraseña son obligatorios." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase no está configurado. Revisa .env.local con la URL y la clave real de tu proyecto.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.",
      };
    }

    if (
      error.message.toLowerCase().includes("fetch failed") ||
      error.message.toLowerCase().includes("invalid api key")
    ) {
      return {
        error:
          "No se pudo conectar con Supabase. Revisa la URL del proyecto en .env.local.",
      };
    }

    return { error: "Credenciales incorrectas. Verifica e intenta de nuevo." };
  }

  redirect("/dashboard");
}
