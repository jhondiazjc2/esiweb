"use client";

import Link from "next/link";
import { useActionState } from "react";
import { EsiLogo } from "@/components/brand/esi-logo";
import { login } from "@/app/login/actions";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);
  const configured = isSupabaseConfigured();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 px-4">
      <div className="mb-6">
        <EsiLogo size="md" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ingresar a ESIWeb</CardTitle>
          <CardDescription>
            Accede al material de estudio de tu módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Supabase aún no está configurado. Copia{" "}
                <code className="rounded bg-muted px-1">.env.example</code> a{" "}
                <code className="rounded bg-muted px-1">.env.local</code> y
                agrega tus credenciales.
              </p>
              <ButtonLink href="/dashboard" variant="outline" className="w-full">
                Ver demo del dashboard
              </ButtonLink>
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground hover:underline">
              ← Volver al inicio
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
