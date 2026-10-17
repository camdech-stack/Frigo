import { useCallback, useEffect, useRef, useState } from 'react'

export const WAKE_LOCK_MAX_MS = 60 * 60 * 1000 // libération automatique après 60 minutes

// Mode « Je cuisine » : garde l'écran allumé via la Wake Lock API, seulement quand on le demande.
// Le navigateur relâche le verrou quand l'onglet passe en arrière-plan : on le redemande au retour.
// Retourne { supported, active, error, start, stop }. Rien ne casse si l'API est absente ou refusée.
export function useWakeLock() {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [active, setActive] = useState(false)
  const [error, setError] = useState('')
  const sentinel = useRef(null)
  const wanted = useRef(false) // l'utilisateur veut l'écran allumé
  const timer = useRef(null)

  const request = useCallback(async () => {
    try {
      const s = await navigator.wakeLock.request('screen')
      if (!wanted.current) { s.release().catch(() => {}); return } // arrêté pendant la demande
      sentinel.current = s
      s.addEventListener('release', () => { if (sentinel.current === s) sentinel.current = null })
      setError('')
    } catch {
      // Refusé (économie d'énergie, onglet masqué…) : on le dit sans bloquer.
      setError("Impossible de garder l'écran allumé pour le moment.")
    }
  }, [])

  const stop = useCallback(() => {
    wanted.current = false
    clearTimeout(timer.current)
    const s = sentinel.current
    sentinel.current = null
    if (s) s.release().catch(() => {})
    setActive(false)
    setError('')
  }, [])

  const start = useCallback(async () => {
    if (!supported) return
    wanted.current = true
    setActive(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(stop, WAKE_LOCK_MAX_MS)
    await request()
  }, [supported, request, stop])

  // Retour au premier plan : le verrou a été relâché par le navigateur, on le redemande.
  useEffect(() => {
    if (!supported) return
    const onVisible = () => {
      if (document.visibilityState === 'visible' && wanted.current && !sentinel.current) request()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [supported, request])

  useEffect(() => stop, [stop]) // démontage : on libère tout

  return { supported, active, error, start, stop }
}
