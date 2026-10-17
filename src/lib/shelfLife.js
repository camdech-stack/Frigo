// Durées de conservation proposées, en jours. À MODIFIER ICI : tout le reste
// de l'app lit ces valeurs. Ce sont des estimations, jamais une date d'emballage.

// Par catégorie (celles de options.js).
export const CATEGORY_SHELF_DAYS = {
  laitier: 10,
  légumes: 5,
  fruits: 7,
  viande: 2,
  poisson: 2,
  'plats préparés': 3,
  épicerie: 180,
  autre: 7,
}

// Par emplacement : prime sur la catégorie. Le frigo n'a pas de valeur propre
// (c'est la catégorie qui décide).
export const LOCATION_SHELF_DAYS = {
  congélo: 90,
  placard: 180,
}

// Catégories pour lesquelles on rappelle de vérifier l'emballage.
export const CHECK_PACKAGING_CATEGORIES = ['viande', 'poisson', 'plats préparés']

const FALLBACK_DAYS = CATEGORY_SHELF_DAYS.autre

// Choisit la durée : habituelle pour ce produit (cache) > emplacement > catégorie.
// Retourne { days, source } avec source = 'habituel' (cache) ou 'estimation'.
export function chooseShelfDays({ cachedDays, location, category } = {}) {
  if (Number.isInteger(cachedDays) && cachedDays > 0) return { days: cachedDays, source: 'habituel' }
  if (LOCATION_SHELF_DAYS[location]) return { days: LOCATION_SHELF_DAYS[location], source: 'estimation' }
  return { days: CATEGORY_SHELF_DAYS[category] ?? FALLBACK_DAYS, source: 'estimation' }
}

export function needsPackagingCheck(category) {
  return CHECK_PACKAGING_CATEGORIES.includes(category)
}

// Libellé de l'étiquette de transparence.
export function sourceLabel(source) {
  return source === 'habituel' ? 'habituel pour ce produit' : 'estimation'
}
