import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterRecipes, formatQuantity, formatTime, groupLines, parseTags, safeUrl, slugify, sourceFromUrl } from './recipes.js'

test('lien source : http/https seulement', () => {
  assert.equal(safeUrl('https://www.marmiton.org/recettes/x'), 'https://www.marmiton.org/recettes/x')
  assert.equal(safeUrl('http://exemple.fr'), 'http://exemple.fr/')
  assert.equal(safeUrl('marmiton.org/recettes/x'), 'https://marmiton.org/recettes/x')
  assert.equal(safeUrl('javascript:alert(1)'), null)
  assert.equal(safeUrl('JaVaScRiPt:alert(1)'), null)
  assert.equal(safeUrl(' javascript://%0Aalert(1)'), null)
  assert.equal(safeUrl('data:text/html,<script>1</script>'), null)
  assert.equal(safeUrl('ftp://x.fr/a'), null)
  assert.equal(safeUrl('pas un lien'), null)
  assert.equal(safeUrl(''), null)
})
test('source : nom du site sans www', () => {
  assert.equal(sourceFromUrl('https://www.marmiton.org/a'), 'marmiton.org')
  assert.equal(sourceFromUrl('javascript:1'), null)
})
test('slug unique', () => {
  assert.equal(slugify('Gratin de courgettes'), 'gratin-de-courgettes')
  assert.equal(slugify('Œufs à la crème !'), 'oeufs-a-la-creme')
  assert.equal(slugify('Gratin', new Set(['gratin', 'gratin-2'])), 'gratin-3')
  assert.equal(slugify('???'), 'recette')
})
test('étiquettes', () => {
  assert.deepEqual(parseTags('Rapide, dessert ,rapide,,'), ['rapide', 'dessert'])
})
test('filtres : texte, étiquettes, ingrédient', () => {
  const recipes = [
    { id: 'r1', titre: 'Gratin de courgettes', tags: ['four', 'légumes'], ingredients: ['1,2 kg de courgettes'] },
    { id: 'r2', titre: 'Pâtes carbonara', tags: ['rapide'], ingredients: ['200 g de lardons'] },
    { id: 'r3', titre: 'Tarte', tags: ['four'], ingredients: ['2 courgettes'] },
  ]
  const ingredients = new Map([['i1', { nom: 'courgette' }], ['i2', { nom: 'lardon' }]])
  const lines = groupLines([
    { recipe_id: 'r1', position: 1, ingredient_id: 'i1' },
    { recipe_id: 'r2', position: 0, ingredient_id: 'i2' },
    { recipe_id: 'r3', position: 0, ingredient_id: 'i1' },
  ])
  const ids = (f) => filterRecipes(recipes, f, lines, ingredients).map((r) => r.id)
  assert.deepEqual(ids({}), ['r1', 'r2', 'r3'])
  assert.deepEqual(ids({ query: 'carbonara' }), ['r2'])
  assert.deepEqual(ids({ query: 'Courgette' }), ['r1', 'r3']) // titre ou ingrédient
  assert.deepEqual(ids({ query: 'lardons' }), ['r2'])
  assert.deepEqual(ids({ tags: ['four'] }), ['r1', 'r3'])
  assert.deepEqual(ids({ tags: ['four', 'légumes'] }), ['r1'])
  assert.deepEqual(ids({ ingredientId: 'i1' }), ['r1', 'r3'])
  assert.deepEqual(ids({ ingredientId: 'i1', query: 'tarte' }), ['r3'])
})
test('affichage', () => {
  assert.equal(formatTime(45), '45 min')
  assert.equal(formatTime(90), '1 h 30')
  assert.equal(formatTime(null), null)
  assert.equal(formatQuantity(1200, 'g'), '1200 g')
  assert.equal(formatQuantity(1.5, 'càs'), '1,5 càs')
  assert.equal(formatQuantity(3, 'pièce'), '3')
  assert.equal(formatQuantity(null, null), 'à votre goût')
})
