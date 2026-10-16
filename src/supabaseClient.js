import { createClient } from '@supabase/supabase-js'

// Seules l'URL et la clé "anon" (publique) sont dans le front.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vrai si la configuration est complète ; l'UI affiche une erreur sinon.
export const isConfigured = Boolean(url && anonKey)

// createClient lève une exception si l'URL est vide : on évite de le créer.
export const supabase = isConfigured ? createClient(url, anonKey) : null
