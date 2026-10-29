// Tests node:test (sans dépendance) : `node --test src/lib/*.node.test.js`
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { originalLines, parseIngredientLine, parseIngredientLines } from './ingredientParser.js'

// Raccourci : une seule ligne structurée attendue.
function one(line) {
  const rows = parseIngredientLine(line)
  assert.equal(rows.length, 1, `une seule ligne attendue pour « ${line} »`)
  const { quantite, unite, nom } = rows[0]
  return { quantite, unite, nom }
}

test('200 g de crème fraîche épaisse', () => {
  assert.deepEqual(one('200 g de crème fraîche épaisse'), { quantite: 200, unite: 'g', nom: 'crème fraîche épaisse' })
})
test('1,2 kg de courgettes (kg -> g)', () => {
  assert.deepEqual(one('1,2 kg de courgettes'), { quantite: 1200, unite: 'g', nom: 'courgettes' })
})
test('3 oeufs : nombre seul -> pièce', () => {
  assert.deepEqual(one('3 oeufs'), { quantite: 3, unite: 'pièce', nom: 'oeufs' })
})
test("2 gousses d'ail", () => {
  assert.deepEqual(one("2 gousses d'ail"), { quantite: 2, unite: 'pièce', nom: 'ail' })
})
test('4 cuillères à soupe de sauce soja', () => {
  assert.deepEqual(one('4 cuillères à soupe de sauce soja'), { quantite: 4, unite: 'càs', nom: 'sauce soja' })
})
test('20 cl de crème liquide (cl -> ml)', () => {
  assert.deepEqual(one('20 cl de crème liquide'), { quantite: 200, unite: 'ml', nom: 'crème liquide' })
})
test('Sel et poivre : deux ingrédients sans quantité', () => {
  const rows = parseIngredientLine('Sel et poivre')
  assert.equal(rows.length, 2)
  assert.deepEqual(rows.map((r) => [r.quantite, r.unite, r.nom]), [[null, null, 'Sel'], [null, null, 'poivre']])
  assert.ok(rows.every((r) => r.original === 'Sel et poivre'))
})
test('1 pincée de sel : quantité vide', () => {
  assert.deepEqual(one('1 pincée de sel'), { quantite: null, unite: null, nom: 'sel' })
})

test('fractions : 1/2, ½, 1 1/2, 1½', () => {
  assert.equal(one('1/2 citron').quantite, 0.5)
  assert.equal(one('½ citron').quantite, 0.5)
  assert.equal(one('1 1/2 l de lait').quantite, 1500)
  assert.equal(one('1½ cuillère à café de miel').quantite, 1.5)
})
test('décimale avec point, unité collée au nombre', () => {
  assert.deepEqual(one('1.5 l de bouillon'), { quantite: 1500, unite: 'ml', nom: 'bouillon' })
  assert.deepEqual(one('250g de farine'), { quantite: 250, unite: 'g', nom: 'farine' })
})
test('abréviations de cuillères', () => {
  assert.equal(one('2 c. à s. d\'huile d\'olive').unite, 'càs')
  assert.equal(one('2 càs de miel').unite, 'càs')
  assert.equal(one('1 c. à c. de cumin').unite, 'càc')
  assert.equal(one('1 cuillère à café de sel').unite, 'càc')
  assert.equal(one('3 c à soupe de sucre').unite, 'càs')
})
test('verre = 150 ml, dl, ml', () => {
  assert.deepEqual(one('2 verres de lait'), { quantite: 300, unite: 'ml', nom: 'lait' })
  assert.deepEqual(one('1 dl de vin'), { quantite: 100, unite: 'ml', nom: 'vin' })
  assert.deepEqual(one('50 ml de rhum'), { quantite: 50, unite: 'ml', nom: 'rhum' })
})
test('unités de pièce', () => {
  for (const [line, nom] of [['1 botte de persil', 'persil'], ['2 tranches de jambon', 'jambon'], ['1 boîte de maïs', 'maïs'],
    ['2 branches de céleri', 'céleri'], ['3 tiges de ciboulette', 'ciboulette'], ['1 sachet de levure', 'levure']]) {
    const r = one(line)
    assert.equal(r.unite, 'pièce', line)
    assert.equal(r.nom, nom, line)
  }
})
test('quantité vide : filet, tour de moulin, poignée, quelques, un peu', () => {
  assert.deepEqual(one("1 filet d'huile d'olive"), { quantite: null, unite: null, nom: "huile d'olive" })
  assert.deepEqual(one('3 tours de moulin de poivre'), { quantite: null, unite: null, nom: 'poivre' })
  assert.deepEqual(one('1 poignée de noix'), { quantite: null, unite: null, nom: 'noix' })
  assert.deepEqual(one('quelques brins de ciboulette'), { quantite: null, unite: null, nom: 'ciboulette' })
  assert.deepEqual(one('un peu de piment'), { quantite: null, unite: null, nom: 'piment' })
})
test('plusieurs filets : une quantité en pièces', () => {
  assert.deepEqual(one('2 filets de poulet'), { quantite: 2, unite: 'pièce', nom: 'poulet' })
})
test('précisions entre parenthèses et après la virgule ignorées', () => {
  assert.equal(one('200 g de lardons (fumés)').nom, 'lardons')
  assert.equal(one('1 oignon, émincé').nom, 'oignon')
})
test('« un/une » compte pour 1', () => {
  assert.deepEqual(one('une gousse d\'ail'), { quantite: 1, unite: 'pièce', nom: 'ail' })
  assert.deepEqual(one('un oignon'), { quantite: 1, unite: 'pièce', nom: 'oignon' })
})
test('« des » et apostrophe typographique', () => {
  assert.equal(one('200 g des épinards').nom, 'épinards')
  assert.equal(one('2 gousses d’ail').nom, 'ail')
})
test('lignes vides et puces ignorées, lignes collées en bloc', () => {
  const rows = parseIngredientLines('- 200 g de riz\n\n  \n• 2 oeufs\r\nSel, poivre')
  assert.deepEqual(rows.map((r) => r.nom), ['riz', 'oeufs', 'Sel', 'poivre'])
  assert.deepEqual(originalLines('- 200 g de riz\n\n 2 oeufs '), ['- 200 g de riz', '2 oeufs'])
})
test('« 3 pommes de terre » garde « pommes de terre »', () => {
  assert.deepEqual(one('3 pommes de terre'), { quantite: 3, unite: 'pièce', nom: 'pommes de terre' })
})
