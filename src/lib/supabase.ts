import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Limpia el valor de una variable de entorno: quita un BOM inicial (U+FEFF),
 * marcas de orden y espacios. Evita el error "String contains non ISO-8859-1
 * code point" que ocurre si la clave llega con un BOM invisible (p. ej. por la
 * codificación al guardarla en el hosting), ya que va en cabeceras HTTP.
 */
const cleanEnv = (v: string | undefined): string =>
  (v ?? '').replace(/[​-‍﻿]/g, '').trim();

const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const anonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * `isSupabaseConfigured` permite que la app arranque y muestre un estado
 * guiado de configuración en lugar de romperse con pantalla en blanco cuando
 * faltan las variables de entorno (DX importante).
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'urbanix-files';

/**
 * Cliente Supabase tipado. Usamos placeholders válidos cuando no está
 * configurado para no lanzar en el import; cualquier llamada real fallará
 * de forma controlada y la UI lo gestiona con `isSupabaseConfigured`.
 */
export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'public-anon-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'urbanix.auth',
    },
  },
);

/** Mensaje de error legible a partir de un error de Supabase/desconocido. */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return translateAuthError(error.message);
  if (typeof error === 'object' && 'message' in error) {
    return translateAuthError(String((error as { message: unknown }).message));
  }
  return 'Ocurrió un error inesperado.';
}

/** Traduce los errores comunes de Supabase Auth a español amigable. */
function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Debes confirmar tu correo antes de iniciar sesión.';
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese correo.';
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (m.includes('password should be at least'))
    return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('network')) return 'Error de conexión. Revisa tu internet.';
  return msg;
}
