const PLACEHOLDER_MARKERS = ["tu-proyecto", "tu-anon-key"];

export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) return false;

  const combined = `${url} ${key}`.toLowerCase();
  if (PLACEHOLDER_MARKERS.some((marker) => combined.includes(marker))) {
    return false;
  }

  return (
    url.includes(".supabase.co") &&
    (key.startsWith("eyJ") || key.startsWith("sb_publishable_"))
  );
}
