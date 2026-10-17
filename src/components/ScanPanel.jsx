import { useEffect, useRef, useState } from 'react'
import { cleanBarcode } from '../lib/barcode'
import { lookupProduct } from '../lib/products'
import CameraScanner from './CameraScanner'

// Champ de scan (douchette = clavier + Entrée), bouton caméra et identification.
// `onResult({ code, product, shelfDays, notice })` : product = null si inconnu / erreur.
// Props de l'étape 4 :
//  - active : la vue Ajouter est affichée (sinon la caméra est coupée) ;
//  - keyboard : réglage « clavier à l'écran » (vient des Réglages) ;
//  - blocked : une carte de saisie est ouverte, les nouveaux scans sont ignorés ;
//  - rangement + onQueueScan(code) : en mode rangement le code part directement dans la file
//    (l'identification se fait là-bas, scan par scan, sans jamais en annuler un autre) ;
//  - onEmptyEnter() : Entrée sur un champ vide (valide la date suggérée), retourne true si traité.
export default function ScanPanel({ inputRef, onResult, active, keyboard, blocked, rangement, onQueueScan, onEmptyEnter }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')
  const [searching, setSearching] = useState(false)
  const [camera, setCamera] = useState(false)
  const inFlight = useRef(null) // code en cours de recherche
  const requestId = useRef(0) // seule la recherche la plus récente s'applique

  const lastKeyboard = useRef({ code: '', at: 0 })
  const hintTimer = useRef(null)

  // Message discret qui disparaît seul.
  function showHint(text) {
    setHint(text)
    clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(''), 3000)
  }
  async function scan(raw, source = 'keyboard') {
    const cleaned = cleanBarcode(raw)
    if (!cleaned.ok) return setError(cleaned.error)
    setError('')
    const { code } = cleaned
    if (rangement) {
      // La douchette peut envoyer un code deux fois d'affilée : on ignore ce doublon rapproché.
      // (Un vrai second scan prend plus d'une demi-seconde ; la caméra a sa propre pause.)
      const now = Date.now()
      if (source === 'keyboard' && lastKeyboard.current.code === code && now - lastKeyboard.current.at < 600) return
      if (source === 'keyboard') lastKeyboard.current = { code, at: now }
      onQueueScan(code)
      return
    }
    if (blocked) return showHint('Valide ou annule le produit en cours')
    if (inFlight.current === code) return // doublon envoyé par la douchette
    const id = ++requestId.current
    inFlight.current = code
    setSearching(true)
    const result = await lookupProduct(code)
    if (id !== requestId.current) return // un autre scan a pris le relais
    inFlight.current = null
    setSearching(false)
    const notice = result.status === 'found'
      ? (result.product.name ? '' : 'Produit trouvé sans nom, saisis le nom.')
      : result.status === 'error'
        ? 'Produit non trouvé (recherche impossible), saisis le nom.'
        : 'Produit non trouvé, saisis le nom.'
    onResult({
      code, product: result.status === 'found' ? result.product : null,
      shelfDays: result.shelfDays ?? null, notice,
    })
  }

  function handleSubmit(e) {
    e.preventDefault() // Entrée de la douchette
    const raw = value
    // Champ vide + carte ouverte : Entrée valide la date suggérée.
    if (!raw.trim() && onEmptyEnter?.()) return
    setValue('') // vide tout de suite : un second envoi ne se concatène pas au premier
    scan(raw)
  }

  // On quitte la vue Ajouter : la caméra se ferme (le flux est arrêté au démontage).
  useEffect(() => { if (!active) setCamera(false) }, [active])

  function handleCamera(code) {
    if (!rangement) setCamera(false) // en rangement le panneau reste ouvert
    scan(code, 'camera') // même chemin que la douchette
  }

  return (
    <section className="panel scan">
      <form onSubmit={handleSubmit}>
        <label htmlFor="scan-input">Scanner ou saisir un code-barres</label>
        <input id="scan-input" ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
          autoComplete="off" autoCorrect="off" spellCheck="false"
          inputMode={keyboard ? 'numeric' : 'none'} enterKeyHint="search"
          placeholder="Code-barres" />
        <button type="submit" className="big">Ajouter</button>
      </form>
      {searching && <p className="notice" role="status">Recherche du produit…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {hint && <p className="notice" role="status">{hint}</p>}
      <button type="button" className="secondary" onClick={() => setCamera(true)}>
        Scanner avec la caméra
      </button>
      {camera && <CameraScanner continuous={rangement} onCode={handleCamera} onClose={() => setCamera(false)} />}
    </section>
  )
}
