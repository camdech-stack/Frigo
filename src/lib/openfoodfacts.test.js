import { describe, expect, it } from 'vitest'
import { fetchOff, parseOffResponse } from './openfoodfacts'

const FOUND = {
  status: 1,
  product: {
    product_name: ' Nutella ', brands: 'Ferrero, Nutella',
    image_front_small_url: 'https://img/x.jpg', categories_tags: ['en:spreads'],
  },
}
const resp = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body })

describe('parseOffResponse', () => {
  it('convertit un produit trouvé', () => {
    expect(parseOffResponse(FOUND)).toEqual({
      name: 'Nutella', brand: 'Ferrero', category: 'épicerie', image_url: 'https://img/x.jpg',
    })
  })
  it('gère les champs manquants', () => {
    expect(parseOffResponse({ status: 1, product: {} }))
      .toEqual({ name: '', brand: '', category: 'autre', image_url: '' })
  })
  it('retourne null pour un produit inconnu ou une réponse invalide', () => {
    expect(parseOffResponse({ status: 0 })).toBeNull()
    expect(parseOffResponse(null)).toBeNull()
  })
})

describe('fetchOff', () => {
  it('trouve un produit', async () => {
    const r = await fetchOff('3017620422003', { fetchImpl: async () => resp(200, FOUND) })
    expect(r.status).toBe('found')
    expect(r.product.name).toBe('Nutella')
  })
  it('appelle l\'URL attendue avec les champs demandés', async () => {
    let url = ''
    await fetchOff('123', { fetchImpl: async (u) => { url = u; return resp(404, { status: 0 }) } })
    expect(url).toBe('https://world.openfoodfacts.org/api/v2/product/123.json?fields=product_name,brands,image_front_small_url,categories_tags')
  })
  it('404 ou status 0 = produit inconnu', async () => {
    expect((await fetchOff('1', { fetchImpl: async () => resp(404, { status: 0 }) })).status).toBe('notfound')
    expect((await fetchOff('1', { fetchImpl: async () => resp(200, { status: 0 }) })).status).toBe('notfound')
  })
  it('erreur serveur ou réseau = error, sans exception', async () => {
    expect((await fetchOff('1', { fetchImpl: async () => resp(500, {}) })).status).toBe('error')
    expect((await fetchOff('1', { fetchImpl: async () => { throw new TypeError('offline') } })).status).toBe('error')
  })
  it('abandonne après le délai', async () => {
    const hang = (_url, { signal }) => new Promise((_, reject) =>
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
    const r = await fetchOff('1', { fetchImpl: hang, timeoutMs: 20 })
    expect(r.status).toBe('error')
  })
})
