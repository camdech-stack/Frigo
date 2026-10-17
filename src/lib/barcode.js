// Nettoyage et validation des codes-barres (EAN-8 à GTIN-14 : 8 à 14 chiffres).

const MIN = 8
const MAX = 14

// Valeur saisie / envoyée par la douchette -> { ok: true, code } ou { ok: false, error }.
// On retire tout ce qui n'est pas un chiffre (espaces, retours chariot, préfixes
// ou suffixes parasites ajoutés par certaines douchettes).
export function cleanBarcode(raw) {
  const code = String(raw ?? '').replace(/\D/g, '')
  if (code.length === 0) {
    return { ok: false, error: 'Code-barres vide : scanne un produit ou tape son code.' }
  }
  if (code.length < MIN || code.length > MAX) {
    return {
      ok: false,
      error: `Code-barres invalide : ${MIN} à ${MAX} chiffres attendus (reçu : ${code.length}).`,
    }
  }
  return { ok: true, code }
}

// Version stricte pour la caméra : le texte lu doit déjà être uniquement des
// chiffres. Évite d'accepter un QR code (URL...) dont on aurait extrait des chiffres.
export function isStrictBarcode(text) {
  return /^\d{8,14}$/.test(String(text ?? '').trim())
}
