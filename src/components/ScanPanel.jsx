import { useRef, useState } from 'react'
import { cleanBarcode } from '../lib/barcode'
import { lookupProduct } from '../lib/products'
import CameraScanner from './CameraScanner'

const KEYBOARD_KEY = 'frigo.screenKeyboard'

// Réglage mémorisé "clavier à l'écran" (activé par défaut).
function loadKeyboardSetting() {
  try { return localStorage.getItem(KEYBOARD_KEY) !== 'off' } catch { return true }
}

// Champ de scan (douchette = clavier + Entrée), bouton caméra et identification.
// `onResult({ code, product, notice })` : product = null si inconnu / erreur.
export default function ScanPanel({ inputRef, onResult }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [camera, setCamera] = useState(false)
  const [keyboard, setKeyboard] = useState(loadKeyboardSetting)
  const inFlight = useRef(null) // code en cours de recherche
  const requestId = useRef(0) // seule la recherche la plus récente s'applique

  async function scan(raw) {
    const cleaned = cleanBarcode(raw)
    if (!cleaned.ok) return setError(cleaned.error)
    setError('')
    const { code } = cleaned
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
    onResult({ code, product: result.status === 'found' ? result.product : null, notice })
  }

  function handleSubmit(e) {
    e.preventDefault() // Entrée de la douchette
    const raw = value
    setValue('') // vide tout de suite : un second envoi ne se concatène pas au premier
    scan(raw)
  }

  function toggleKeyboard() {
    const next = !keyboard
    setKeyboard(next)
    try { localStorage.setItem(KEYBOARD_KEY, next ? 'on' : 'off') } catch { /* stockage indisponible */ }
    // Le mode du clavier est relu quand le champ reprend le focus.
    inputRef.current?.blur()
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleCamera(code) {
    setCamera(false)
    scan(code) // même chemin que la douchette
  }

  return (
    <section className="panel scan">
      <form onSubmit={handleSubmit}>
        <label htmlFor="scan-input">Scanner ou saisir un code-barres</label>
        <input id="scan-input" ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)}
          autoFocus autoComplete="off" autoCorrect="off" spellCheck="false"
          inputMode={keyboard ? 'numeric' : 'none'} enterKeyHint="search"
          placeholder="Code-barres" />
      </form>
      {searching && <p className="notice" role="status">Recherche du produit…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <button type="button" className="secondary" onClick={() => setCamera(true)}>
        Scanner avec la caméra
      </button>
      <label className="check">
        <input type="checkbox" checked={keyboard} onChange={toggleKeyboard} />
        Clavier à l'écran
      </label>
      {camera && <CameraScanner onCode={handleCamera} onClose={() => setCamera(false)} />}
    </section>
  )
}
