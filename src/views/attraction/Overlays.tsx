import { useState } from 'react'
import { motion } from 'framer-motion'
import { Archive } from 'lucide-react'
import { useStore } from '../../store'
import { DRAFT_DISCARD_REASONS } from '../../data/attraction'
import { devById } from '../../data/config'
import { cn } from '../../lib/utils'


export function DraftDiscardModal({ id }: { id: string }) {
  const d = useStore((s) => s.drafts.find((x) => x.id === id))
  const confirm = useStore((s) => s.confirmDraftDiscard)
  const cancel = useStore((s) => s.cancelDraftDiscard)
  const [reason, setReason] = useState<string | null>(null)
  const [other, setOther] = useState('')
  if (!d) return null
  const final = reason === 'Otro' ? other.trim() : reason

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1d1b17]/35 backdrop-blur-sm"
      onClick={cancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[500px] rounded-[28px] border border-line bg-surface p-7 shadow-lift"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-2">
          <Archive size={20} />
        </span>
        <h3 className="mt-4 font-serif text-[24px] leading-tight text-ink">¿Por qué descartamos esta campaña?</h3>
        <p className="mt-1.5 text-[13px] text-ink-2">
          MARQ · {devById(d.developmentId).neighborhood}, {d.typology}. Tu respuesta le enseña al agente qué campañas quiere publicar MARQ.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[...DRAFT_DISCARD_REASONS, 'Otro'].map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                'rounded-xl border px-3.5 py-3 text-left text-[13px] leading-snug font-medium transition',
                reason === r ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-2 hover:border-line-strong hover:bg-surface-2',
                r === 'Otro' && 'col-span-2',
              )}
            >
              {r}
            </button>
          ))}
        </div>
        {reason === 'Otro' && (
          <motion.input
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 44 }}
            autoFocus
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Contanos brevemente…"
            className="mt-2 w-full rounded-xl border border-line bg-surface-2/50 px-3.5 text-[13px] text-ink outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
          />
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={cancel} className="rounded-xl px-4 py-2.5 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2">
            Cancelar
          </button>
          <button
            disabled={!final}
            onClick={() => final && confirm(final)}
            className="rounded-xl bg-ink px-4 py-2.5 text-[13px] font-medium text-bg transition disabled:opacity-30"
          >
            Descartar borrador
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
