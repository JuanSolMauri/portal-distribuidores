/** Sin credenciales de Supabase el portal funciona en modo demo con datos de ejemplo. */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const modoDemo = !supabaseUrl || !supabaseAnonKey;
