import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changements, decompte } from './cook.js'

let seq = 0
const produit = (ingredient_id, quantity, unit, expires_at = null, extra = {}) =>
  ({ id: `p${++seq}`, name: ingredient_id, ingredient_id, quantity, unit, expires_at, status: 'in_stock', ...extra })
const ligne = (ingredient_id, quantite, unite, basique = false) => ({ ingredient_id, nom: ingredient_id, quantite, unite, basique })
const recette = (lignes, portions = 4) => ({ id: 'r1', titre: 'Test', portions, lignes })
const entree = (personnes) => ({ id: 'e1', recipe_id: 'r1', personnes })

test('un produit suffisant : 3 œufs sur une boîte de 6 → reste 3', () => {
  const oeufs = produit('oeuf', 6, 'pièce', '2026-11-20')
  const { prelevements, absents } = decompte(entree(2), recette([ligne('oeuf', 6, 'pièce')]), [oeufs]) // 6 × 2/4 = 3
  assert.equal(absents.length, 0)
  assert.equal(prelevements.length, 1)
  assert.equal(prelevements[0].quantite, 3)
  assert.equal(prelevements[0].auto, true)
  assert.equal(prelevements[0].manque, null)
  const [c] = changements(prelevements, [oeufs])
  assert.equal(c.remaining, 3)
  assert.deepEqual(c.patch, { quantity: 3 })
})

test('deux produits : le plus proche de la péremption d\'abord', () => {
  const tard = produit('lait', 500, 'ml', '2026-12-01')
  const tot = produit('lait', 200, 'ml', '2026-11-16')
  const { prelevements } = decompte(entree(4), recette([ligne('lait', 500, 'ml')]), [tard, tot]) // 500 ml
  assert.deepEqual(prelevements.map((p) => [p.item_id, p.quantite]), [[tot.id, 200], [tard.id, 300]])
  const cs = changements(prelevements, [tard, tot])
  const fini = cs.find((c) => c.item.id === tot.id)
  assert.deepEqual(fini.patch, { quantity: 0, status: 'used' }) // à 0 : used
  assert.deepEqual(cs.find((c) => c.item.id === tard.id).patch, { quantity: 200 })
})

test('stock insuffisant : on prend tout, jamais plus, et on signale le manque', () => {
  const p = produit('farine', 100, 'g', '2026-11-30')
  const { prelevements } = decompte(entree(4), recette([ligne('farine', 250, 'g')]), [p])
  assert.equal(prelevements[0].quantite, 100)
  assert.deepEqual(prelevements[0].manque, { quantite: 150, unite: 'g' })
  // Même si on tape plus que le stock, le prélèvement est borné.
  const [c] = changements(prelevements, [p], { valeurs: { [prelevements[0].key]: '999' } })
  assert.equal(c.consumed, 100)
  assert.equal(c.remaining, 0)
})

test('unités différentes ou sans quantité : proposé sans quantité, jamais décompté seul', () => {
  const huile = produit('huile', 750, 'ml', '2026-12-01')
  const sel = produit('curry', 40, 'g', '2026-12-01')
  const r = recette([ligne('huile', 2, 'càs'), ligne('curry', null, null)])
  const { prelevements, absents } = decompte(entree(4), r, [huile, sel])
  assert.equal(absents.length, 0)
  assert.deepEqual(prelevements.map((p) => [p.item_id, p.quantite, p.auto]), [[huile.id, null, false], [sel.id, null, false]])
  assert.deepEqual(changements(prelevements, [huile, sel]), []) // rien tant que la quantité est vide
  const [c] = changements(prelevements, [huile, sel], { valeurs: { [prelevements[0].key]: '30' } })
  assert.equal(c.remaining, 720)
  // Décocher ignore même une quantité saisie.
  assert.deepEqual(changements(prelevements, [huile, sel], { valeurs: { [prelevements[0].key]: '30' }, decoches: new Set([prelevements[0].key]) }), [])
})

test('ingrédient basique ignoré ; ligne sans produit : « pas trouvé »', () => {
  const sel = produit('sel', 500, 'g')
  const r = recette([ligne('sel', 5, 'g', true), ligne('courgette', 400, 'g')])
  const { prelevements, absents } = decompte(entree(4), r, [sel])
  assert.deepEqual(prelevements, [])
  assert.deepEqual(absents, [{ ingredient_id: 'courgette', nom: 'courgette', quantite: 400, unite: 'g' }])
})

test('deux lignes du même ingrédient ne prennent pas deux fois le même stock', () => {
  const p = produit('beurre', 100, 'g', '2026-11-20')
  const r = recette([ligne('beurre', 60, 'g'), ligne('beurre', 60, 'g')])
  const { prelevements } = decompte(entree(4), r, [p])
  assert.deepEqual(prelevements.map((x) => x.quantite), [60, 40])
  assert.deepEqual(changements(prelevements, [p])[0].patch, { quantity: 0, status: 'used' })
})
