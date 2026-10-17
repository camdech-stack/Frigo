import { mapCategory } from './categories'

const FIELDS = 'product_name,brands,image_front_small_url,categories_tags'
export const OFF_TIMEOUT_MS = 6000

// Réponse Open Food Facts -> champs de notre formulaire, ou null si produit inconnu.
export function parseOffResponse(json) {
  if (!json || json.status !== 1 || !json.product) return null
  const p = json.product
  return {
    name: String(p.product_name ?? '').trim(),
    // "brands" est une liste séparée par des virgules : on garde la première.
    brand: String(p.brands ?? '').split(',')[0].trim(),
    category: mapCategory(p.categories_tags),
    image_url: typeof p.image_front_small_url === 'string' ? p.image_front_small_url : '',
  }
}

// Appelle Open Food Facts avec un délai maximal. Ne lève jamais d'exception :
//  { status: 'found', product } | { status: 'notfound' } | { status: 'error' }
// (erreur = hors ligne, erreur serveur, délai dépassé, réponse illisible).
export async function fetchOff(code, { fetchImpl = fetch, timeoutMs = OFF_TIMEOUT_MS } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`
    const res = await fetchImpl(url, { signal: controller.signal })
    // Produit inconnu : OFF répond souvent 404 avec { status: 0 }.
    if (res.status === 404) return { status: 'notfound' }
    if (!res.ok) return { status: 'error' }
    const product = parseOffResponse(await res.json())
    return product ? { status: 'found', product } : { status: 'notfound' }
  } catch {
    return { status: 'error' }
  } finally {
    clearTimeout(timer)
  }
}
