// Values pasted into a hosting dashboard often carry spaces, quotes or a trailing slash.
const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "") || undefined;

function required(name: string, value: string | undefined): string {
  const v = clean(value);
  if (!v) throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local or set it in Vercel → Settings → Environment Variables.`);
  return v;
}

// NEXT_PUBLIC_* must be referenced literally so Next can inline them.
export const env = {
  get supabaseUrl() { return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL); },
  get supabaseAnonKey() { return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); },
  get siteUrl() { return clean(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000"; },
};
