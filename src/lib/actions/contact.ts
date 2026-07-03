"use server";

export async function submitContact(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
) {
  const nombre = formData.get("nombre")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const mensaje = formData.get("mensaje")?.toString().trim();

  if (!nombre || !email || !mensaje) {
    return { ok: false, message: "Completa todos los campos." };
  }

  // TODO: conectar con servicio de correo o tabla contactos en Supabase
  console.log("Contacto ESIWeb:", { nombre, email, mensaje });

  return {
    ok: true,
    message: "Mensaje recibido. Te contactaremos pronto.",
  };
}
