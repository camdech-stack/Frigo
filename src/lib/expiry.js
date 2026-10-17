// Logique de péremption : jours restants, couleur, libellés.
// Tout est calculé à partir de la DATE seule (AAAA-MM-JJ), en UTC, pour éviter
// tout décalage de fuseau horaire : un produit qui expire aujourd'hui = 0 jour.

const DAY_MS = 86400000

// 'AAAA-MM-JJ' -> nombre de jours depuis 1970 (entier, sans heure).
function toDayNumber(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / DAY_MS
}

// Date du jour dans le fuseau LOCAL de l'utilisateur, au format 'AAAA-MM-JJ'.
export function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Jours restants (négatif si expiré). `today` est injectable pour les tests.
export function daysLeft(expiresAt, today = todayIso()) {
  return toDayNumber(expiresAt) - toDayNumber(today)
}

// Règle métier : rouge si expiré ou <= 2 j, orange si <= 5 j, vert sinon.
export function urgency(days) {
  if (days <= 2) return 'red'
  if (days <= 5) return 'orange'
  return 'green'
}

// Texte des jours restants (toujours affiché : la couleur ne suffit pas).
export function remainingLabel(days) {
  if (days < 0) return `expiré depuis ${-days} j`
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'demain'
  return `dans ${days} j`
}

// 'AAAA-MM-JJ' -> « mar. 21 oct. » (timeZone UTC pour ne pas décaler d'un jour).
export function formatDateFr(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

// Pastille de péremption (DESIGN.md §4.2) : deux lignes, chiffre puis unité.
//  expiré : « Expiré » + « hier » (si -1) ou « N j » ; 0 -> « 0 jour » ; 1 -> « 1 jour » ; 2+ -> « N jours » ; 100+ -> « 99+ ».
// `text` est la version lue à voix haute (lecteur d'écran) : la couleur seule ne porte jamais l'information.
export function badgeParts(days) {
  if (days < 0) return { num: 'Expiré', unit: days === -1 ? 'hier' : `${-days} j`, expired: true }
  if (days >= 100) return { num: '99+', unit: 'jours', expired: false }
  return { num: String(days), unit: days > 1 ? 'jours' : 'jour', expired: false }
}

// Pour les boutons de durée : « 3 jours », « 7 jours »… (toujours positif).
export function daysTag(days) {
  return `${days} jour${days > 1 ? 's' : ''}`
}
