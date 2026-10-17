import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { applyChange, sortByExpiry } from './realtime'
import { loadSnapshot, saveSnapshot } from './offline'

const SAFETY_RELOAD_MS = 10 * 60 * 1000 // filet de sécurité : rechargement complet
const TICK_MS = 60 * 1000 // recalcul de l'affichage (jours restants, couleurs)

// Liste des produits en stock, synchronisée en direct entre appareils.
// Retourne { items, loading, loadError, connection, lastSync, reload, apply }.
//  - lastSync : heure (ms) de la dernière donnée reçue, pour le bandeau hors ligne
//  - connection : 'live' | 'reconnecting' | 'offline' (informatif, ne bloque jamais l'usage)
//  - apply(event) : fusionne un changement local (mise à jour optimiste) via la même logique que le temps réel
//  - `tick` change à chaque recalcul d'affichage, ce qui fait re-rendre le composant appelant
export function useItems() {
  // Dernière liste connue (localStorage) : l'app s'ouvre avec ses données, même hors ligne.
  const [snapshot] = useState(loadSnapshot)
  const [items, setItems] = useState(snapshot ? sortByExpiry(snapshot.items) : [])
  const [lastSync, setLastSync] = useState(snapshot?.at ?? null) // ms de la dernière donnée reçue
  const [loading, setLoading] = useState(!snapshot)
  const [loadError, setLoadError] = useState('')
  const [channelState, setChannelState] = useState('reconnecting')
  const [online, setOnline] = useState(() => navigator.onLine)
  const [, setTick] = useState(0)

  // Pour qu'un rechargement lancé AVANT un changement ne l'écrase pas : si quelque
  // chose a changé pendant la requête, on la relance une fois la réponse reçue.
  const changeCount = useRef(0)
  const loadingNow = useRef(false)
  const rerun = useRef(false)
  const haveData = useRef(Boolean(snapshot))

  const apply = useCallback((event) => {
    changeCount.current += 1
    setItems((current) => applyChange(current, event))
  }, [])

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (loadingNow.current) { rerun.current = true; return }
    loadingNow.current = true
    try {
      do {
        rerun.current = false
        const startedAt = changeCount.current
        const { data, error } = await supabase
          .from('items').select('*').eq('status', 'in_stock')
          .order('expires_at', { ascending: true })
        if (error) {
          // Un échec silencieux (filet de sécurité) garde la liste actuelle sans bruit.
          if (!silent && !haveData.current) setLoadError('Impossible de charger les produits : ' + error.message)
        } else if (changeCount.current !== startedAt) {
          rerun.current = true // des changements sont arrivés pendant la requête : on la refait
        } else {
          haveData.current = true
          setItems(sortByExpiry(data))
          setLastSync(Date.now())
          setLoadError('')
        }
      } while (rerun.current)
    } finally {
      loadingNow.current = false
      setLoading(false)
    }
  }, [])

  // Canal Realtime unique. Nom unique par montage : en StrictMode (monté, démonté,
  // remonté), l'ancien canal en cours de fermeture ne peut pas être confondu avec le nouveau.
  useEffect(() => {
    let cancelled = false
    const channel = supabase
      .channel('items-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (!cancelled) { apply(payload); setLastSync(Date.now()) }
      })
      .subscribe((status) => {
        if (cancelled) return
        if (status === 'SUBSCRIBED') {
          setChannelState('live')
          reload({ silent: true }) // (re)connexion : rattrape les événements manqués
        } else {
          setChannelState('reconnecting') // CHANNEL_ERROR, TIMED_OUT, CLOSED : la librairie retente seule
        }
      })
    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [apply, reload])

  // Chargement initial (n'attend pas le canal) + filet de sécurité toutes les 10 min.
  useEffect(() => {
    reload()
    const id = setInterval(() => reload({ silent: true }), SAFETY_RELOAD_MS)
    return () => clearInterval(id)
  }, [reload])

  // Retour de l'onglet au premier plan / retour du réseau : rechargement complet.
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    const onVisible = () => {
      if (document.visibilityState === 'visible') { bump(); reload({ silent: true }) }
    }
    const onOnline = () => { setOnline(true); reload({ silent: true }) }
    const onOffline = () => setOnline(false)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [reload])

  // Recalcul de l'affichage : toutes les minutes ET pile après minuit.
  useEffect(() => {
    const bump = () => setTick((t) => t + 1)
    const interval = setInterval(bump, TICK_MS)
    let midnight
    const scheduleMidnight = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
      midnight = setTimeout(() => { bump(); scheduleMidnight() }, next - now)
    }
    scheduleMidnight()
    return () => { clearInterval(interval); clearTimeout(midnight) }
  }, [])

  // Sauvegarde de la liste à chaque changement (après un premier chargement réussi ou un instantané).
  useEffect(() => {
    if (haveData.current && lastSync) saveSnapshot(items, lastSync)
  }, [items, lastSync])

  const connection = !online ? 'offline' : channelState === 'live' ? 'live' : 'reconnecting'
  return { items, loading, loadError, connection, lastSync, reload, apply }
}
