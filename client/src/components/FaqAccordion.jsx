import { useState } from 'react'
import { ChevronDownIcon } from './Icons.jsx'

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">{question}</span>
        <ChevronDownIcon
          className={`h-4 w-4 flex-shrink-0 text-muted transition-transform ${
            open ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed text-muted whitespace-pre-line">
          {answer}
        </div>
      )}
    </div>
  )
}

export default function FaqAccordion({ items }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map(({ q, a }) => (
        <FaqItem key={q} question={q} answer={a} />
      ))}
    </div>
  )
}
