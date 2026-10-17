import { supabase } from '../supabaseClient'
import { fetchOff } from './openfoodfacts'
import { shelfDaysToRemember } from './quickAdd'

const CACHE_TIMEOUT_MS = 4000

// Lecture du cache Supabase. Toute erreur (table absente, hors ligne, délai) est
// ignorée : on passe alors à Open Food Facts, l'ajout n'est jamais bloqué.
// Retourne { product, shelfDays } ou null. last_shelf_days (étape 4) peut ne pas
// exister encore si le SQL n'a pas été lancé : on relit alors sans cette colonne.
async function readCache(code) {
  const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), CACHE_TIMEOUT_MS))
  const read = (columns) => Promise.race([
    supabase.from('products_cache').select(columns).eq('barcode', code).maybeSingle(), timeout,
  ])
  try {
    let { data, error } = await read('name, brand, category, image_url, last_shelf_days')
    if (error) ({ data } = await read('name, brand, category, image_url'))
    if (!data) return null
    return {
      product: {
        name: data.name ?? '', brand: data.brand ?? '',
        category: data.category ?? 'autre', image_url: data.image_url ?? '',
      },
      shelfDays: Number.isInteger(data.last_shelf_days) ? data.last_shelf_days : null,
    }
  } catch {
    return null
  }
}

// Durée habituelle seule (relecture rapide du cache), ou null.
export async function lookupShelfDays(code) {
  return (await readCache(code))?.shelfDays ?? null
}

// Identifie un code-barres : cache d'abord (mes corrections priment), puis Open Food Facts.
// Retourne { status: 'found' | 'notfound' | 'error', product?, source?, shelfDays? }
// shelfDays = durée habituelle mémorisée pour ce produit (null si inconnue).
export async function lookupProduct(code) {
  const cached = await readCache(code)
  if (cached) return { status: 'found', ...cached, source: 'cache' }
  const off = await fetchOff(code)
  return off.status === 'found' ? { ...off, source: 'off', shelfDays: null } : off
}

// Enregistre les valeurs finales validées, avec la durée choisie (jours entre
// aujourd'hui et expires_at, si positive). Échec silencieux : le produit est déjà ajouté.
export async function saveToCache({ barcode, name, brand, category, image_url, expires_at }) {
  try {
    const base = { barcode, name, brand, category, image_url, updated_at: new Date().toISOString() }
    const days = shelfDaysToRemember(expires_at)
    let { error } = await supabase.from('products_cache').upsert(days ? { ...base, last_shelf_days: days } : base)
    // Colonne pas encore créée : on enregistre au moins le reste.
    if (error && days) ({ error } = await supabase.from('products_cache').upsert(base))
    if (error) console.warn('products_cache :', error.message)
  } catch (e) {
    console.warn('products_cache :', e)
  }
}
