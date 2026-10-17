import { useEffect, useRef, useState } from 'react'
import { isStrictBarcode } from '../lib/barcode'

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']
const REPEAT_PAUSE_MS = 1500 // mode continu : pause après chaque lecture, pour ne pas relire le même code
const CONSTRAINTS = { audio: false, video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } }

// Message lisible selon l'erreur renvoyée par getUserMedia.
function cameraMessage(err) {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return "Accès à la caméra refusé. Autorise la caméra pour ce site : sur iPhone, Réglages > Safari > Caméra ; sur Android, touche le cadenas à côté de l'adresse > Autorisations > Caméra. Puis rouvre le scanner."
    case 'NotFoundError':
    case 'OverconstrainedError':
      return "Aucune caméra trouvée sur cet appareil. Utilise la douchette ou saisis le code à la main."
    case 'NotReadableError':
    case 'AbortError':
      return "La caméra est utilisée par une autre application. Ferme-la puis réessaie."
    default:
      return "Impossible de démarrer la caméra. Saisis le code à la main."
  }
}

function stopStream(stream) {
  stream?.getTracks().forEach((t) => t.stop())
}

// Panneau plein écran de scan par caméra. Par défaut, appelle onCode(code) une seule fois,
// puis l'appelant le ferme. Avec `continuous` (mode rangement), le panneau reste ouvert :
// vibration, pause de 1,5 s après chaque lecture et compteur, jusqu'à la fermeture.
// Le flux vidéo est toujours arrêté au démontage.
export default function CameraScanner({ onCode, onClose, continuous = false }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(true)
  const [scanned, setScanned] = useState(0)
  // Toujours la dernière version des callbacks, sans relancer la caméra à chaque rendu.
  const callbacks = useRef({ onCode, onClose, continuous })
  callbacks.current = { onCode, onClose, continuous }

  useEffect(() => {
    let cancelled = false // vrai dès le démontage ou après la première détection
    let stream = null // flux ouvert par nous (chemin BarcodeDetector)
    let controls = null // contrôles ZXing
    let timer = null
    let pausedUntil = 0 // mode continu : lectures ignorées jusqu'à cet instant
    const video = videoRef.current

    // Arrêt complet et idempotent : boucle de lecture, flux, caméra.
    function stopAll() {
      cancelled = true
      clearInterval(timer)
      try { controls?.stop() } catch { /* déjà arrêté */ }
      controls = null
      stopStream(stream)
      stopStream(video?.srcObject) // flux ouvert par ZXing
      stream = null
      if (video) video.srcObject = null
    }

    function handleCode(text) {
      if (cancelled || !isStrictBarcode(text)) return // ignore QR codes et lectures douteuses
      if (callbacks.current.continuous) {
        const now = Date.now()
        if (now < pausedUntil) return
        pausedUntil = now + REPEAT_PAUSE_MS
        try { navigator.vibrate?.(100) } catch { /* non supporté */ }
        setScanned((n) => n + 1)
        callbacks.current.onCode(String(text).trim())
        return
      }
      stopAll()
      try { navigator.vibrate?.(100) } catch { /* non supporté */ }
      callbacks.current.onCode(String(text).trim())
    }

    async function startWithBarcodeDetector() {
      const supported = await window.BarcodeDetector.getSupportedFormats()
      const formats = FORMATS.filter((f) => supported.includes(f))
      if (formats.length === 0) return false
      const detector = new window.BarcodeDetector({ formats })
      stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
      if (cancelled) { stopStream(stream); return true }
      video.srcObject = stream
      await video.play().catch(() => {}) // lecture interrompue si on ferme vite : sans gravité
      let busy = false
      timer = setInterval(async () => {
        if (busy || cancelled || video.readyState < 2) return
        busy = true
        try {
          const found = await detector.detect(video)
          if (found.length > 0) handleCode(found[0].rawValue)
        } catch { /* image non lisible : on réessaie au prochain tour */ }
        busy = false
      }, 200)
      return true
    }

    async function startWithZxing() {
      // Import dynamique : la librairie n'est téléchargée qu'à l'ouverture du scanner.
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      if (cancelled) return
      const reader = new BrowserMultiFormatReader()
      const c = await reader.decodeFromConstraints(CONSTRAINTS, video, (result) => {
        if (result) handleCode(result.getText())
      })
      if (cancelled) { c.stop(); return } // fermé pendant le démarrage : stop() libère aussi la caméra
      controls = c
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("La caméra n'est pas disponible (il faut une connexion sécurisée https et un navigateur récent).")
        setStarting(false)
        return
      }
      try {
        let done = false
        if ('BarcodeDetector' in window) {
          try { done = await startWithBarcodeDetector() } catch (e) {
            // Refus / absence de caméra : inutile d'essayer ZXing. Autre cause : repli.
            if (['NotAllowedError', 'SecurityError', 'NotFoundError', 'NotReadableError'].includes(e?.name)) throw e
          }
        }
        if (!done && !cancelled) await startWithZxing()
        if (!cancelled) setStarting(false)
      } catch (e) {
        if (!cancelled) { setError(cameraMessage(e)); setStarting(false) }
        stopAll()
      }
    }

    start()
    return stopAll
  }, [])

  return (
    <div className="scanner" role="dialog" aria-modal="true" aria-label="Scanner un code-barres">
      <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
      <div className="scanner-overlay">
        {error ? (
          <p className="scanner-msg" role="alert">{error}</p>
        ) : (
          <p className="scanner-msg">{starting ? 'Démarrage de la caméra…'
            : continuous ? `${scanned} scanné${scanned > 1 ? 's' : ''} · place le code suivant dans le cadre`
              : 'Place le code-barres dans le cadre'}</p>
        )}
        <button className="scanner-close" onClick={() => callbacks.current.onClose()}>Fermer</button>
      </div>
    </div>
  )
}
