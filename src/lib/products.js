import { supabase } from '../supabaseClient'
import { fetchOff } from './openfoodfacts'
import { shelfDaysToRemember } from './quickAdd'

const CACHE_TIMEOUT_MS = 4000

// Colonnes lues / écrites, de la plus complète à la plus ancienne : tant que le SQL d'une étape n'a
// pas été lancé, on retombe sur la version précédente (l'ajout n'est jamais bloqué).
const COLUMN_SETS = [
  'name, brand, category, image_url, last_shelf_days, ingredient_id, pack_quantity, pack_unit',
  'name, brand, category, image_url, last_shelf_days',
  'name, brand, category, image_url',
]

// Lecture du cache Supabase. Toute erreur (table absente, hors ligne, délai) est
// ignorée : on passe alors à Open Food Facts.
// Retourne { product, shelfDays, ingredientId } ou null.
async function readCache(code) {
  const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), CACHE_TIMEOUT_MS))
  try {
    let data = null
    for (const columns of COLUMN_SETS) {
      const res = await Promise.race([
        supabase.from('products_cache').select(columns).eq('barcode', code).maybeSingle(), timeout,
      ])
      if (!res.error) { data = res.data; break }
    }
    if (!data) return null
    const packOk = data.pack_quantity > 0 && ['g', 'ml', 'pièce'].includes(data.pack_unit)
    return {
      product: {
        name: data.name ?? '', brand: data.brand ?? '',
        category: data.category ?? 'autre', image_url: data.image_url ?? '',
        pack: packOk ? { quantity: Number(data.pack_quantity), unit: data.pack_unit } : null,
      },
      shelfDays: Number.isInteger(data.last_shelf_days) ? data.last_shelf_days : null,
      ingredientId: data.ingredient_id ?? null, // rattachement mémorisé pour ce code-barres
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
// Retourne { status: 'found' | 'notfound' | 'error', product?, source?, shelfDays?, ingredientId? }
// shelfDays = durée habituelle mémorisée pour ce produit (null si inconnue) ;
// ingredientId = ingrédient déjà associé à ce code-barres (null sinon).
export async function lookupProduct(code) {
  const cached = await readCache(code)
  if (cached) return { status: 'found', ...cached, source: 'cache' }
  const off = await fetchOff(code)
  return off.status === 'found' ? { ...off, source: 'off', shelfDays: null, ingredientId: null } : off
}

// Enregistre les valeurs finales validées, avec la durée choisie (jours entre
// aujourd'hui et expires_at, si positive), l'ingrédient associé et la contenance.
// Les valeurs absentes ne sont pas envoyées : elles n'effacent jamais ce qui est déjà mémorisé.
// Échec silencieux : le produit est déjà ajouté.
export async function saveToCache({ barcode, name, brand, category, image_url, expires_at, ingredient_id, pack }) {
  try {
    const base = { barcode, name, brand, category, image_url, updated_at: new Date().toISOString() }
    const days = shelfDaysToRemember(expires_at)
    const tiers = [
      { ...(days && { last_shelf_days: days }), ...(ingredient_id && { ingredient_id }),
        ...(pack && { pack_quantity: pack.quantity, pack_unit: pack.unit }) },
      days ? { last_shelf_days: days } : {},
      {},
    ]
    let error
    for (const extra of tiers) {
      ;({ error } = await supabase.from('products_cache').upsert({ ...base, ...extra }))
      if (!error) return
    }
    console.warn('products_cache :', error.message)
  } catch (e) {
    console.warn('products_cache :', e)
  }
}
