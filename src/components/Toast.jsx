import { useEffect, useRef } from 'react'

// Message temporaire en bas d'écran, avec un bouton d'action facultatif (ex. « Annuler »).
// toast = { id, message, actionLabel?, onAction?, duration }. Un nouveau toast (id différent)
// remplace l'ancien et relance le compte à rebours.
export default function Toast({ toast, onClose }) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => close.current(), toast.duration)
    return () => clearTimeout(timer)
  }, [toast])

  if (!toast) return null
  return (
    <div className="toast" role="status">
      <span>{toast.message}</span>
      {toast.actionLabel && (
        <button type="button" onClick={() => { toast.onAction(); close.current() }}>{toast.actionLabel}</button>
      )}
    </div>
  )
}
