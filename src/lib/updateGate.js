// Évite qu'une mise à jour de l'app recharge la page au mauvais moment.
// Le provider déclare « occupé » quand une saisie est en cours (carte de saisie rapide, file de rangement).
let busy = false
export const setUpdateBusy = (v) => { busy = Boolean(v) }

// Sûr = aucun champ en cours de saisie et aucune saisie ouverte dans l'app.
export function isSafeToReload() {
  const el = document.activeElement
  const typing = el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
  return !busy && !typing
}
