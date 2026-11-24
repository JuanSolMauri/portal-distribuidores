"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/config";

/** Cliente de Supabase en el navegador, con la sesión del usuario (RLS aplica igual). */
export const crearClienteNavegador = () => createBrowserClient(supabaseUrl, supabaseAnonKey);
