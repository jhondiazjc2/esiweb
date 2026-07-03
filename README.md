# ESIWeb Colombia

Plataforma educativa de **Equipando Siervos Internacional** para Colombia.

## Stack

- [Next.js 16](https://nextjs.org/) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) — auth, base de datos y almacenamiento
- [Vercel](https://vercel.com/) — hosting gratuito recomendado

## Estructura

```
ESIWeb/
├── Primer modulo/          # PDFs del Módulo 1 (material local)
├── src/
│   ├── app/
│   │   ├── (public)/       # Inicio, misión, grupos, contacto
│   │   ├── login/          # Inicio de sesión
│   │   └── dashboard/      # Área privada (estudiante, facilitador, admin)
│   └── lib/                # Datos, Supabase, tipos
└── supabase/migrations/    # Esquema SQL
```

## Desarrollo local

```bash
cd C:\ESIWeb
npm install
cp .env.example .env.local   # configurar Supabase (opcional para demo)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Sin Supabase configurado:** la sección pública funciona y el dashboard abre en modo demo.

**Con Supabase:** copia `.env.example` a `.env.local`, ejecuta el SQL en `supabase/migrations/001_initial_schema.sql` y crea usuarios desde el panel de Supabase Auth.

## Material del Módulo 1

Los PDFs en `Primer modulo/` se sirven vía `/api/material/[id]`. Para producción, súbelos al bucket `materiales` de Supabase Storage.

## Roles

| Rol | Permisos |
|-----|----------|
| **Estudiante** | Ver y descargar material de su módulo |
| **Facilitador** | Crear estudiantes, registrar notas |
| **Admin** | Gestionar sedes, subir/editar material |

## Despliegue en Vercel (gratis)

1. Sube el repo a GitHub
2. Importa en [vercel.com/new](https://vercel.com/new)
3. Agrega las variables de entorno de `.env.example`
4. En Supabase → Authentication → URL Configuration, agrega tu dominio Vercel

## Próximos pasos

- [ ] Conectar formulario de contacto a correo o Supabase
- [ ] Subir PDFs a Supabase Storage
- [ ] CRUD de estudiantes y notas para facilitadores
- [ ] Panel admin para sedes y material
- [ ] Módulos 2–6
