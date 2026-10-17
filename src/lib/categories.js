import { CATEGORIES } from './options'

// Correspondance simple categories_tags d'Open Food Facts -> nos catégories.
// Clés : tags OFF sans le préfixe de langue ("en:dairies" -> "dairies").
const TAG_TO_CATEGORY = {
  // laitier
  dairies: 'laitier', 'dairy-desserts': 'laitier', milks: 'laitier', yogurts: 'laitier',
  'fermented-milk-products': 'laitier', cheeses: 'laitier', butters: 'laitier',
  creams: 'laitier', 'fresh-cheeses': 'laitier', 'cow-s-milks': 'laitier',
  // légumes
  vegetables: 'légumes', 'fresh-vegetables': 'légumes', 'vegetables-based-foods': 'légumes',
  'canned-vegetables': 'légumes', salads: 'légumes', 'fresh-salads': 'légumes',
  // fruits
  fruits: 'fruits', 'fresh-fruits': 'fruits', 'fruits-based-foods': 'fruits',
  'canned-fruits': 'fruits', 'dried-fruits': 'fruits', compotes: 'fruits',
  // viande
  meats: 'viande', 'meats-and-their-products': 'viande', poultries: 'viande', chickens: 'viande',
  beef: 'viande', pork: 'viande', hams: 'viande', 'cooked-hams': 'viande', sausages: 'viande',
  charcuteries: 'viande', 'prepared-meats': 'viande', turkeys: 'viande',
  // poisson
  fishes: 'poisson', 'fishes-and-their-products': 'poisson', 'seafood': 'poisson',
  salmons: 'poisson', tunas: 'poisson',
  'smoked-fishes': 'poisson', 'canned-fishes': 'poisson',
  // plats préparés
  meals: 'plats préparés', 'prepared-meals': 'plats préparés', 'ready-meals': 'plats préparés',
  'frozen-ready-made-meals': 'plats préparés', pizzas: 'plats préparés',
  'pizzas-pies-and-quiches': 'plats préparés', quiches: 'plats préparés',
  sandwiches: 'plats préparés', soups: 'plats préparés', 'pasta-dishes': 'plats préparés',
  // épicerie
  groceries: 'épicerie', cereals: 'épicerie', pastas: 'épicerie', rices: 'épicerie',
  'breakfast-cereals': 'épicerie', biscuits: 'épicerie', chocolates: 'épicerie', snacks: 'épicerie',
  'sweet-snacks': 'épicerie', beverages: 'épicerie', 'sugary-snacks': 'épicerie',
  sauces: 'épicerie', condiments: 'épicerie', spreads: 'épicerie', breads: 'épicerie',
  'canned-foods': 'épicerie', oils: 'épicerie', 'plant-based-beverages': 'épicerie',
}

// Les tags OFF vont du plus général au plus précis : on parcourt à l'envers pour
// que le plus précis gagne (ex. ["en:groceries", "en:pizzas"] -> plats préparés).
// Retourne toujours une de nos catégories ("autre" si rien ne correspond).
export function mapCategory(tags) {
  if (Array.isArray(tags)) {
    for (let i = tags.length - 1; i >= 0; i--) {
      const key = String(tags[i]).replace(/^[a-z]{2}:/, '')
      const found = TAG_TO_CATEGORY[key]
      if (found && CATEGORIES.includes(found)) return found
    }
  }
  return 'autre'
}
