// Découpage d'une ligne d'ingrédient (« 200 g de crème fraîche épaisse ») en
// { quantite, unite, nom }. Fonction pure, sans IA : uniquement des règles écrites ici.
// Sortie : unite ∈ 'g' | 'ml' | 'pièce' | 'càs' | 'càc' | null ; quantite nombre ou null
// (null = « à votre goût » : pincée, filet, quelques…).

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 }
const FRAC_CHARS = '½¼¾⅓⅔⅛'
// Du plus précis au plus simple : « 1 1/2 », « 1½ », « 1/2 », « ½ », « 1,5 », « 2 ».
const NUMBER = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\s*[${FRAC_CHARS}]|\\d+\\/\\d+|[${FRAC_CHARS}]|\\d+(?:[.,]\\d+)?)`

function parseNumber(str) {
  const s = str.trim()
  let m
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return Number(m[1]) + Number(m[2]) / Number(m[3])
  if ((m = s.match(new RegExp(`^(\\d+)\\s*([${FRAC_CHARS}])$`)))) return Number(m[1]) + FRACTIONS[m[2]]
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return Number(m[1]) / Number(m[2])
  if (FRACTIONS[s]) return FRACTIONS[s]
  return Number(s.replace(',', '.'))
}

// Évite 1,2 × 1000 = 1200.0000000000002.
const round = (n) => Math.round(n * 1e6) / 1e6

// Une unité est reconnue seulement si aucune lettre ne suit (« g » oui, « gousse » non).
const END = '(?![\\p{L}\\d])'
const unitRe = (src) => new RegExp(`^\\s*(?:${src})${END}\\.?`, 'iu')

// kind : 'conv' = conversion vers g/ml/càs/càc ; 'piece' ; 'vague' = pas de quantité.
const UNITS = [
  { re: unitRe('kilogrammes?|kilos?|kg'), kind: 'conv', unite: 'g', factor: 1000 },
  { re: unitRe('grammes?|gr|g'), kind: 'conv', unite: 'g', factor: 1 },
  { re: unitRe('litres?|l'), kind: 'conv', unite: 'ml', factor: 1000 },
  { re: unitRe('centilitres?|cl'), kind: 'conv', unite: 'ml', factor: 10 },
  { re: unitRe('d[ée]cilitres?|dl'), kind: 'conv', unite: 'ml', factor: 100 },
  { re: unitRe('millilitres?|ml'), kind: 'conv', unite: 'ml', factor: 1 },
  { re: unitRe('cuill?[èe]res?\\s+[àa]\\s+soupe|cuill?[èe]res?\\s+[àa]\\s+s|c\\s*\\.?\\s*[àa]\\s*\\.?\\s*(?:soupe|s)|c[àa]s'),
    kind: 'conv', unite: 'càs', factor: 1 },
  { re: unitRe('cuill?[èe]res?\\s+[àa]\\s+caf[ée]|cuill?[èe]res?\\s+[àa]\\s+c|c\\s*\\.?\\s*[àa]\\s*\\.?\\s*(?:caf[ée]|c)|c[àa]c'),
    kind: 'conv', unite: 'càc', factor: 1 },
  // Un verre = 150 ml.
  { re: unitRe('verres?'), kind: 'conv', unite: 'ml', factor: 150 },
  { re: unitRe('gousses?|tranches?|branches?|bottes?|bo[iî]tes?|tiges?|sachets?|pi[èe]ces?|pots?|brins?|feuilles?|paquets?'),
    kind: 'piece' },
  // « filet » est un filet d'huile (sans quantité) sauf si on en compte plusieurs (« 2 filets de poulet »).
  { re: unitRe('filets?'), kind: 'vague', filet: true },
  { re: unitRe('pinc[ée]es?|tours?\\s+de\\s+moulin|poign[ée]es?|quelques|un\\s+peu'), kind: 'vague' },
]

function matchUnit(text) {
  for (const u of UNITS) {
    const m = text.match(u.re)
    if (m) return { ...u, rest: text.slice(m[0].length) }
  }
  return null
}

// Applique l'unité trouvée à la quantité n (peut être null).
function applyUnit(u, n) {
  if (u.kind === 'vague') {
    if (u.filet && n !== null && n > 1) return { quantite: n, unite: 'pièce' }
    return { quantite: null, unite: null }
  }
  if (u.kind === 'piece') return { quantite: n, unite: 'pièce' }
  return { quantite: n === null ? null : round(n * u.factor), unite: u.unite }
}

// « de », « d' », « du », « des » (et « de la », « de l' ») au début du nom.
const PARTICLE = /^(?:de\s+la\s+|de\s+l['’]\s*|de\s+|d['’]\s*|du\s+|des\s+|l['’]\s*|la\s+|le\s+|les\s+)/i

function cleanName(name, hasQuantity) {
  let n = name.replace(/\s+/g, ' ').trim()
  n = n.replace(PARTICLE, '')
  // « 1 oignon, émincé » : la précision après la virgule n'est pas le nom.
  if (hasQuantity) n = n.split(/\s*[,;]\s*/)[0]
  return n.replace(/[\s.,;:]+$/, '').trim()
}

// Sans quantité, « sel et poivre » ou « sel, poivre » sont plusieurs ingrédients.
function splitNames(name) {
  const parts = name.split(/\s+et\s+|\s*[,;]\s*/i).map((p) => p.trim()).filter(Boolean)
  const short = parts.every((p) => p.split(' ').length <= 3)
  return parts.length > 1 && short ? parts : [name]
}

// Une ligne -> 1 ou 2 lignes structurées [{ original, quantite, unite, nom }].
export function parseIngredientLine(line) {
  const original = String(line ?? '').trim()
  // Puces, espaces insécables, précisions entre parenthèses (« (environ 10 g) »).
  let text = original.replace(/^[-•*·–]+\s*/, '').replace(/[  ]/g, ' ')
    .replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return []

  let n = null
  let unit = null
  let rest = text
  const num = text.match(new RegExp(`^(${NUMBER})\\s*(.*)$`, 'u'))
  if (num) {
    n = parseNumber(num[1])
    rest = num[2]
    unit = matchUnit(rest)
  } else {
    unit = matchUnit(text) // « quelques », « un peu de », « pincée de sel » sans chiffre
    if (!unit) {
      const one = text.match(/^(?:un|une)\s+(.*)$/i) // « une gousse d'ail », « un oignon »
      if (one) { n = 1; rest = one[1]; unit = matchUnit(rest) }
    }
  }

  let result
  if (unit) {
    result = applyUnit(unit, n)
    rest = unit.rest
    // « quelques brins de ciboulette » : le contenant qui suit n'est pas le nom.
    if (unit.kind === 'vague') {
      const next = matchUnit(rest)
      if (next?.kind === 'piece') rest = next.rest
    }
  }
  else if (n !== null) result = { quantite: round(n), unite: 'pièce' } // « 3 oeufs »
  else result = { quantite: null, unite: null }

  const nom = cleanName(rest, result.quantite !== null)
  if (!nom) return []
  const names = result.quantite === null ? splitNames(nom) : [nom]
  return names.map((name) => ({ original, quantite: result.quantite, unite: result.unite, nom: name }))
}

// Zone de texte collée (une ligne = un ingrédient) -> tableau de lignes structurées.
export function parseIngredientLines(text) {
  return String(text ?? '').split(/\r?\n/).flatMap(parseIngredientLine)
}

// Lignes d'origine non vides, telles que collées (pour recipes.ingredients).
export function originalLines(text) {
  return String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
}
