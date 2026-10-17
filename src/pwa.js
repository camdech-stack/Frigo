import { registerSW } from 'virtual:pwa-register'
import { isSafeToReload } from './lib/updateGate'

const CHECK_MS = 60 * 60 * 1000 // cherche une nouvelle version toutes les heures
const RETRY_MS = 30 * 1000 // si une saisie est en cours, on retente plus tard

// Mise à jour automatique SANS rechargement surprise : la nouvelle version est téléchargée
// en arrière-plan puis activée (page rechargée) seulement quand rien n'est en cours de saisie.
export function setupPwa() {
  let waiting = false
  let retry = null
  const applyWhenSafe = () => {
    clearTimeout(retry)
    if (!waiting) return
    if (isSafeToReload()) updateSW(true) // active la nouvelle version puis recharge
    else retry = setTimeout(applyWhenSafe, RETRY_MS)
  }
  const updateSW = registerSW({
    onNeedRefresh() { waiting = true; applyWhenSafe() },
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const check = () => reg.update().catch(() => {}) // hors ligne : ignoré
      setInterval(check, CHECK_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') { check(); applyWhenSafe() }
      })
    },
  })
}
