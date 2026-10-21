// Évite qu'une mise à jour de l'app recharge la page au mauvais moment.
// Le provider déclare « occupé » quand une saisie est en cours (carte de saisie rapide, file de rangement) ;
// d'autres écrans (formulaire de recette) le font avec leur propre clé, sans s'écraser mutuellement.
const busyKeys = new Set()
export const setUpdateBusy = (v, key = 'inventory') => { if (v) busyKeys.add(key); else busyKeys.delete(key) }

// Sûr = aucun champ en cours de saisie et aucune saisie ouverte dans l'app.
export function isSafeToReload() {
  const el = document.activeElement
  const typing = el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
  return busyKeys.size === 0 && !typing
}
