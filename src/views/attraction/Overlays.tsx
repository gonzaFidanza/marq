import { useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, BadgeCheck, LayoutPanelLeft, MessageSquareQuote, Scale, Target, X } from 'lucide-react'
import { useStore } from '../../store'
import { DRAFT_DISCARD_REASONS } from '../../data/attraction'
import { devById } from '../../data/config'
import { Logo } from '../../components/ui'
import { cn } from '../../lib/utils'


const ROWS = [
  {
    said: 'La pauta podría ser más eficiente',
    gives: 'Cada campaña se mide por las reuniones que consigue; por primera vez se puede comparar una con otra.',
    icon: Scale,
  },
  {
    said: 'Llegan muchas consultas y cuesta calificarlas',
    gives: 'La pauta se orienta a los perfiles que avanzan, así llega menos ruido a la bandeja.',
    icon: Target,
  },
  {
    said: 'La empresa no se ve detrás de los desarrollos',
    gives: 'Cada anuncio firma como MARQ junto al desarrollo.',
    icon: BadgeCheck,
  },
  {
    said: 'Se repiten siempre las mismas preguntas',
    gives: 'El anuncio las responde antes de la primera consulta.',
    icon: MessageSquareQuote,
  },
  {
    said: 'Cuesta adoptar sistemas nuevos',
    gives: 'Vive dentro del asistente, con la misma pantalla de aprobación.',
    icon: LayoutPanelLeft,
  },
]

export function WhyModal() {
  const close = () => useStore.getState().setWhyOpen(false)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1d1b17]/45 p-8 backdrop-blur-md"
      onClick={close}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="scroll-soft relative max-h-full w-full max-w-[1040px] overflow-x-hidden overflow-y-auto rounded-[32px] border border-line bg-surface shadow-lift"
      >
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent-soft blur-3xl" />
        <button onClick={close} className="absolute top-5 right-5 z-10 rounded-full p-2 text-ink-3 transition hover:bg-surface-2 hover:text-ink">
          <X size={18} />
        </button>

        <div className="relative px-12 pt-11 pb-10">
          <div className="flex items-center gap-3">
            <Logo compact width={64} />
            <span className="h-4 w-px bg-line-strong" />
            <span className="text-[11px] font-semibold tracking-[0.16em] text-ink-3 uppercase">Módulo de Atracción</span>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-[720px] font-serif text-[38px] leading-[1.1] font-light text-ink"
          >
            ¿Por qué este módulo?
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-2 text-[14px] text-ink-2">
            Hasta ahora la pauta buscaba gente que escriba. <span className="text-accent">Ahora busca gente que avanza.</span>
          </motion.p>

          <div className="mt-8 grid grid-cols-[1fr_1.25fr] gap-x-10 border-b border-line pb-3 text-[10.5px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
            <span>Lo que dijo MARQ</span>
            <span>Lo que aporta el módulo</span>
          </div>
          <div>
            {ROWS.map((r, i) => (
              <motion.div
                key={r.said}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[1fr_1.25fr] items-center gap-x-10 border-b border-line py-4 last:border-b-0"
              >
                <p className="relative pl-6 font-serif text-[18px] leading-snug text-ink-3 italic">
                  <span className="absolute top-[-6px] left-0 font-serif text-[34px] leading-none text-ink-3/50">“</span>
                  {r.said}”
                </p>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.22, duration: 0.45 }}
                  className="flex items-center gap-3.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <r.icon size={18} />
                  </span>
                  <p className="text-[14px] leading-snug text-ink">{r.gives}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

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
