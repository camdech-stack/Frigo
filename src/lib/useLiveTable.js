import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { applyRowChange } from './liveTable'

const PAGE = 1000 // PostgREST renvoie au plus 1000 lignes par requête : on lit par pages
const SAFETY_RELOAD_MS = 10 * 60 * 1000 // filet de sécurité : rechargement complet

// Table Supabase entière gardée en mémoire et synchronisée en direct (même principe que useItems,
// en plus simple : pas de copie hors ligne). Retourne { rows, loading, loadError, reload, apply }.
// apply(event) fusionne un changement local (écriture que l'on vient de faire) comme un événement temps réel.
export function useLiveTable(table, orderBy = 'id') {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  // Un rechargement lancé AVANT un changement ne doit pas l'écraser : on le refait si besoin.
  const changeCount = useRef(0)
  const loadingNow = useRef(false)
  const rerun = useRef(false)
  const haveData = useRef(false)

  const apply = useCallback((event) => {
    changeCount.current += 1
    setRows((current) => applyRowChange(current, event))
  }, [])

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (loadingNow.current) { rerun.current = true; return }
    loadingNow.current = true
    try {
      do {
        rerun.current = false
        const startedAt = changeCount.current
        const all = []
        let failure = null
        for (let from = 0; ; from += PAGE) {
          const { data, error } = await supabase.from(table).select('*').order(orderBy).order('id').range(from, from + PAGE - 1)
          if (error) { failure = error; break }
          all.push(...data)
          if (data.length < PAGE) break
        }
        if (failure) {
          if (!silent && !haveData.current) setLoadError(`Impossible de charger « ${table} » : ${failure.message}`)
        } else if (changeCount.current !== startedAt) {
          rerun.current = true
        } else {
          haveData.current = true
          setRows(all)
          setLoadError('')
        }
      } while (rerun.current)
    } finally {
      loadingNow.current = false
      setLoading(false)
    }
  }, [table, orderBy])

  useEffect(() => {
    let cancelled = false
    const channel = supabase
      .channel(`${table}-${Math.random().toString(36).slice(2)}`) // nom unique par montage (StrictMode)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => { if (!cancelled) apply(payload) })
      .subscribe((status) => {
        if (!cancelled && status === 'SUBSCRIBED') reload({ silent: true }) // (re)connexion : rattrape les manqués
      })
    return () => { cancelled = true; supabase.removeChannel(channel) }
  }, [table, apply, reload])

  useEffect(() => {
    reload()
    const id = setInterval(() => reload({ silent: true }), SAFETY_RELOAD_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') reload({ silent: true }) }
    const onOnline = () => reload({ silent: true })
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [reload])

  return { rows, loading, loadError, reload, apply }
}
