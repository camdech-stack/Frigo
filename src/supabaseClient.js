import { createClient } from '@supabase/supabase-js'

// Seules l'URL et la clé "anon" (publique) sont dans le front.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vrai si la configuration est complète ; l'UI affiche une erreur sinon.
export const isConfigured = Boolean(url && anonKey)

// createClient lève une exception si l'URL est vide : on évite de le créer.
export const supabase = isConfigured ? createClient(url, anonKey, {
  // Session conservée dans localStorage (survit à la fermeture de l'app installée) et
  // jeton renouvelé tout seul. Valeurs par défaut, écrites ici pour que ce soit explicite.
  auth: { persistSession: true, autoRefreshToken: true },
}) : null
