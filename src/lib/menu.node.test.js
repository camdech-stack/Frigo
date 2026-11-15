import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  besoins, couverture, cuisinerReste, evaluerSelection, planifier, produitsNonAssocies, produitsNonUtilises,
  retirerDuStock, urgenceJours,
} from './menu.js'

const TODAY = '2026-11-15'
// Date dans n jours, au format AAAA-MM-JJ.
const dans = (n) => new Date(Date.UTC(2026, 10, 15 + n)).toISOString().slice(0, 10)

let seq = 0
// Produit du stock.
const produit = (ingredient_id, quantity, unit, jours, extra = {}) =>
  ({ id: `p${++seq}`, name: ingredient_id, ingredient_id, quantity, unit, expires_at: jours == null ? null : dans(jours), ...extra })
// Ligne de recette ; `basique` posé sur la ligne (toRecette l'y met depuis le catalogue).
const ligne = (ingredient_id, quantite, unite, basique = false) => ({ ingredient_id, nom: ingredient_id, quantite, unite, basique })
const recette = (id, lignes, extra = {}) => ({ id, titre: id, portions: 2, temps_min: 30, tags: [], lignes, ...extra })
const opts = { today: TODAY }

test('besoins : facteur personnes / portions, lignes basiques exclues', () => {
  const r = recette('gratin', [ligne('courgette', 400, 'g'), ligne('sel', null, null, true), ligne('crème', null, null)], { portions: 4 })
  assert.deepEqual(besoins(r, 2).map((b) => [b.nom, b.quantite]), [['courgette', 200], ['crème', null]])
  assert.equal(besoins(r, 8)[0].quantite, 800)
})

test('stock vide : tout est absent, rien n\'est compté', () => {
  const r = recette('gratin', [ligne('courgette', 400, 'g'), ligne('crème', 20, 'ml')])
  const c = couverture(r, 2, [], opts)
  assert.deepEqual(c.lignes.map((l) => l.etat), ['absent', 'absent'])
  assert.equal(c.manque.length, 2)
  assert.equal(c.urgence, 0)
  assert.deepEqual(c.utilise, [])
  assert.deepEqual(cuisinerReste([r], [], { personnes: 2, ...opts }), []) // rien du frigo : pas de proposition
})

test('stock suffisant : couvert, urgence = celle du produit', () => {
  const r = recette('gratin', [ligne('courgette', 400, 'g'), ligne('crème', 20, 'ml')])
  const stock = [produit('courgette', 500, 'g', 1), produit('crème', 200, 'ml', 4)]
  const c = couverture(r, 2, stock, opts)
  assert.deepEqual(c.lignes.map((l) => l.etat), ['couvert', 'couvert'])
  assert.equal(c.manque.length, 0)
  assert.equal(c.urgence, 3 + 2) // 1 j -> 3, 4 j -> 2
  assert.equal(c.pourquoi, 'Finit : courgette (1 j), crème (4 j)')
  assert.equal(c.consommation.get(stock[0].id), 400)
})

test('quantités insuffisantes : partiel, on indique ce qui manque, pas d\'urgence comptée', () => {
  const r = recette('gratin', [ligne('courgette', 400, 'g')])
  const stock = [produit('courgette', 150, 'g', 0)]
  const c = couverture(r, 2, stock, opts)
  assert.equal(c.lignes[0].etat, 'partiel')
  assert.deepEqual(c.manque, [{ ingredient_id: 'courgette', nom: 'courgette', quantite: 250, unite: 'g', etat: 'partiel' }])
  assert.equal(c.urgence, 0)
  assert.equal(c.utilise[0].partiel, true)
})

test('plusieurs produits du même ingrédient : le plus pressé d\'abord', () => {
  const r = recette('gratin', [ligne('courgette', 300, 'g')])
  const tard = produit('courgette', 500, 'g', 9)
  const tot = produit('courgette', 200, 'g', 1)
  const c = couverture(r, 2, [tard, tot], opts)
  assert.deepEqual(c.utilise.map((u) => u.item_id), [tot.id, tard.id])
  assert.equal(c.consommation.get(tot.id), 200)
  assert.equal(c.consommation.get(tard.id), 100)
  assert.equal(c.urgence, 3 + 1)
})

test('unités différentes ou quantité absente : présence seulement', () => {
  const r = recette('soupe', [ligne('crème', 2, 'càs'), ligne('persil', null, null)])
  const stock = [produit('crème', 200, 'ml', 3), produit('persil', 1, 'pièce', 6)]
  const c = couverture(r, 2, stock, opts)
  assert.deepEqual(c.lignes.map((l) => l.etat), ['couvert', 'couvert'])
  assert.equal(c.manque.length, 0)
  assert.equal(c.consommation.size, 0) // présence : rien n'est retiré du stock
})

test('ingrédient basique : ignoré, jamais manquant', () => {
  const r = recette('œufs', [ligne('œuf', 4, 'pièce'), ligne('huile', 20, 'ml', true), ligne('sel', null, null, true)])
  const c = couverture(r, 2, [produit('œuf', 6, 'pièce', 3)], opts)
  assert.equal(c.lignes.length, 1)
  assert.equal(c.manque.length, 0)
})

test('urgence d\'un produit : 3 / 2 / 1', () => {
  assert.deepEqual([-3, 0, 2, 3, 5, 6, null].map(urgenceJours), [3, 3, 3, 2, 2, 1, 1])
})

test('deux recettes qui se disputent le même produit : jamais compté deux fois', () => {
  const courgette = produit('courgette', 250, 'g', 1)
  const A = recette('A', [ligne('courgette', 200, 'g')]) // pour 2 personnes : 200 g
  const B = recette('B', [ligne('courgette', 200, 'g')])
  const [a, b] = evaluerSelection([{ recette: A, personnes: 2 }, { recette: B, personnes: 2 }], [courgette], opts)
  assert.equal(a.urgence, 3)
  assert.equal(a.manque.length, 0)
  // Il reste 50 g : B ne peut plus compter le produit et doit en racheter 150 g.
  assert.equal(b.urgence, 0)
  assert.deepEqual(b.manque.map((m) => [m.quantite, m.etat]), [[150, 'partiel']])
  // Même chose en planifiant : la 2e recette n'est jamais créditée du même produit.
  const menu = planifier([A, B], [courgette], { personnes: 2, repas: 3, ...opts })
  assert.equal(menu.length, 2)
  assert.equal(menu[0].urgence + menu[1].urgence, 3)
  assert.equal(menu.flatMap((m) => m.utilise.filter((u) => u.compte)).length, 1)
})

test('même produit en présence seulement dans deux recettes : urgence comptée une fois', () => {
  const persil = produit('persil', 1, 'pièce', 0)
  const A = recette('A', [ligne('persil', null, null)])
  const B = recette('B', [ligne('persil', null, null)])
  const [a, b] = evaluerSelection([{ recette: A, personnes: 2 }, { recette: B, personnes: 2 }], [persil], opts)
  assert.equal(a.urgence + b.urgence, 3)
})

test('retirerDuStock : quantités réduites, produits vides retirés', () => {
  const x = produit('x', 100, 'g', 1)
  const y = produit('y', 50, 'g', 1)
  const apres = retirerDuStock([x, y], new Map([[x.id, 100], [y.id, 20]]))
  assert.deepEqual(apres.map((i) => [i.id, i.quantity]), [[y.id, 30]])
})

test('mode reste : 2 manquants au plus, urgentes d\'abord', () => {
  const stock = [produit('courgette', 500, 'g', 1), produit('poulet', 400, 'g', 8)]
  const urgente = recette('urgente', [ligne('courgette', 200, 'g'), ligne('crème', 20, 'ml'), ligne('ail', 1, 'pièce')])
  const calme = recette('calme', [ligne('poulet', 300, 'g')])
  const trop = recette('trop', [ligne('courgette', 100, 'g'), ligne('a', 1, 'pièce'), ligne('b', 1, 'pièce'), ligne('c', 1, 'pièce')])
  const res = cuisinerReste([calme, trop, urgente], stock, { personnes: 2, ...opts })
  assert.deepEqual(res.map((r) => r.recette.id), ['urgente', 'calme'])
  assert.ok(res.every((r) => r.manque.length <= 2))
})

test('mode reste sans résultat : rien de faisable', () => {
  const stock = [produit('courgette', 500, 'g', 1)]
  const r = recette('r', [ligne('a', 1, 'pièce'), ligne('b', 1, 'pièce'), ligne('c', 1, 'pièce')])
  assert.deepEqual(cuisinerReste([r], stock, { personnes: 2, ...opts }), [])
  assert.deepEqual(cuisinerReste([], stock, { personnes: 2, ...opts }), [])
})

test('mode planifier : varié (étiquette principale déjà prise pénalisée)', () => {
  const stock = [produit('pâtes', 1000, 'g', 1), produit('courgette', 500, 'g', 2), produit('riz', 1000, 'g', 2)]
  const p1 = recette('p1', [ligne('pâtes', 200, 'g')], { tags: ['Pâtes'] })
  const p2 = recette('p2', [ligne('pâtes', 200, 'g'), ligne('courgette', 200, 'g')], { tags: ['pâtes'] })
  const r1 = recette('r1', [ligne('riz', 200, 'g')], { tags: ['riz'] })
  const menu = planifier([p1, p2, r1], stock, { personnes: 2, repas: 3, ...opts })
  assert.equal(new Set(menu.map((m) => m.recette.id)).size, menu.length) // jamais deux fois la même
  assert.equal(menu.length, 3)
  // p2 (pâtes + courgette) d'abord ; r1 passe avant p1 car p1 reprendrait l'étiquette « pâtes ».
  assert.deepEqual(menu.map((m) => m.recette.id), ['p2', 'r1', 'p1'])
})

test('mode planifier : nombre de repas borné entre 3 et 7', () => {
  const rs = Array.from({ length: 10 }, (_, i) => recette('r' + i, [ligne('x' + i, 1, 'pièce')]))
  assert.equal(planifier(rs, [], { repas: 1, ...opts }).length, 3)
  assert.equal(planifier(rs, [], { repas: 20, ...opts }).length, 7)
  assert.equal(planifier(rs.slice(0, 2), [], { repas: 5, ...opts }).length, 2) // pas assez de recettes
})

test('pas utilisé : rouges et orange hors menu ; produits sans ingrédient à part', () => {
  const rouge = produit('courgette', 500, 'g', 1)
  const orange = produit('yaourt', 4, 'pièce', 4)
  const vert = produit('riz', 500, 'g', 30)
  const utilise = produit('poulet', 400, 'g', 0)
  const sansIng = { id: 'z', name: 'Mystère', ingredient_id: null, quantity: 1, unit: 'pièce', expires_at: dans(0) }
  const stock = [rouge, orange, vert, utilise, sansIng]
  const menu = [recette('r', [ligne('poulet', 200, 'g')])]
  const non = produitsNonUtilises(stock, menu, opts)
  assert.deepEqual(non.map((p) => p.item.id), [rouge.id, orange.id])
  assert.deepEqual(produitsNonAssocies(stock).map((i) => i.id), ['z'])
})
