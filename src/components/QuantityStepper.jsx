import { stepQuantity } from '../lib/quickAdd'

// Boutons − / + autour de la quantité (jamais sous 1).
export default function QuantityStepper({ value, onChange, label = 'Quantité' }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="secondary" aria-label="Moins" disabled={value <= 1}
        onClick={() => onChange(stepQuantity(value, -1))}>−</button>
      <span className="stepper-value" aria-live="polite">{value}</span>
      <button type="button" className="secondary" aria-label="Plus"
        onClick={() => onChange(stepQuantity(value, 1))}>+</button>
    </div>
  )
}
