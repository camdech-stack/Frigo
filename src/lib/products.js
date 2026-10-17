import { supabase } from '../supabaseClient'
import { fetchOff } from './openfoodfacts'

const CACHE_TIMEOUT_MS = 4000

// Lecture du cache Supabase. Toute erreur (table absente, hors ligne, délai) est
// ignorée : on passe alors à Open Food Facts, l'ajout n'est jamais bloqué.
async function readCache(code) {
  try {
    const query = supabase.from('products_cache')
      .select('name, brand, category, image_url').eq('barcode', code).maybeSingle()
    const timeout = new Promise((resolve) => setTimeout(() => resolve({ data: null }), CACHE_TIMEOUT_MS))
    const { data } = await Promise.race([query, timeout])
    if (!data) return null
    return {
      name: data.name ?? '', brand: data.brand ?? '',
      category: data.category ?? 'autre', image_url: data.image_url ?? '',
    }
  } catch {
    return null
  }
}

// Identifie un code-barres : cache d'abord (mes corrections priment), puis Open Food Facts.
// Retourne { status: 'found' | 'notfound' | 'error', product?, source? }
export async function lookupProduct(code) {
  const cached = await readCache(code)
  if (cached) return { status: 'found', product: cached, source: 'cache' }
  const off = await fetchOff(code)
  return off.status === 'found' ? { ...off, source: 'off' } : off
}

// Enregistre les valeurs finales validées. Échec silencieux : le produit est déjà ajouté.
export async function saveToCache({ barcode, name, brand, category, image_url }) {
  try {
    const { error } = await supabase.from('products_cache').upsert({
      barcode, name, brand, category, image_url, updated_at: new Date().toISOString(),
    })
    if (error) console.warn('products_cache :', error.message)
  } catch (e) {
    console.warn('products_cache :', e)
  }
}
