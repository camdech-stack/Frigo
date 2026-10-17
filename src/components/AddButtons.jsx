import { useNavigate } from 'react-router-dom'

const svg = (children, size) => (
  <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
)
export const ScanIcon = ({ size = 26 }) => svg(<><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M8 9v6M12 9v6M16 9v6" /></>, size)
export const PlusIcon = ({ size = 26 }) => svg(<path d="M12 5v14M5 12h14" />, size)

// Les deux actions d'ajout, partout au même endroit logique : « + » (à la main) et « Scanner » (caméra).
// Elles ouvrent le panneau Ajouter (AddView) ; `state` lui dit quoi faire à l'ouverture.
//  variant 'bar'  : barre du bas (téléphone, tablette portrait) ;
//  variant 'rail' : rail latéral (iPad paysage) ;
//  variant 'solo' : bouton Scanner seul (état vide).
export default function AddButtons({ variant = 'bar' }) {
  const navigate = useNavigate()
  const go = (state) => navigate('/ajouter', { state })
  const scan = (
    <button type="button" className="btn btn-primary" onClick={() => go({ camera: true })}>
      <ScanIcon size="var(--icon-btn)" />Scanner
    </button>
  )
  if (variant === 'solo') return scan
  return variant === 'rail' ? (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => go({ manual: true })}>
        <PlusIcon size="var(--icon-btn-sm)" />Ajouter à la main
      </button>
      {scan}
    </>
  ) : (
    <>
      <button type="button" className="icon-btn icon-btn-ink" aria-label="Ajouter à la main" onClick={() => go({ manual: true })}>
        <PlusIcon />
      </button>
      {scan}
    </>
  )
}
