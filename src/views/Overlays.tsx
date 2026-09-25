import { useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, ArrowRight, X } from 'lucide-react'
import { useStore } from '../store'
import { DISCARD_REASONS, devById } from '../data/config'
import { Avatar, ChannelPill, ClassChip, SparkleIcon, StagePill } from '../components/ui'
import { cn, firstName, hhmm, relTime } from '../lib/utils'

export function CardDrawer({ id }: { id: string }) {
  const c = useStore((s) => s.contacts.find((x) => x.id === id))
  const close = () => useStore.getState().openDrawer(null)
  const select = useStore((s) => s.select)
  if (!c) return null
  const dev = devById(c.developmentId)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
        className="fixed inset-0 z-[60] bg-[#1d1b17]/25 backdrop-blur-[2px]"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="fixed top-3 right-3 bottom-3 z-[61] flex w-[460px] flex-col overflow-hidden rounded-[28px] border border-line bg-[var(--glass)] shadow-lift backdrop-blur-2xl"
      >
        <div className="relative h-[120px] shrink-0" style={{ background: dev.gradient }}>
          <img src={dev.image} alt="" className="h-full w-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-black/10 to-black/20" />
          <button onClick={close} className="absolute top-3.5 right-3.5 rounded-full bg-black/30 p-1.5 text-white backdrop-blur transition hover:bg-black/50">
            <X size={16} />
          </button>
        </div>
        <div className="-mt-10 flex items-end gap-3.5 px-6">
          <Avatar name={c.name} hue={c.hue} size={64} channel={c.channel} ring />
          <div className="pb-1">
            <h3 className="font-serif text-[22px] leading-tight text-ink">{c.name}</h3>
            <div className="mt-1 flex items-center gap-1.5">
              <ChannelPill channel={c.channel} portal={c.portal} />
              <ClassChip value={c.classification} />
            </div>
          </div>
        </div>

        <div className="scroll-soft flex-1 overflow-y-auto px-6 pt-5 pb-6">
          <div className="flex items-center gap-2">
            <StagePill stage={c.stage} />
            <span className="text-[12px] text-ink-3">{dev.name} · {c.typology}</span>
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-soft">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
              <SparkleIcon size={13} /> <span className="ai-text">Resumen del asistente</span>
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{c.summary}</p>
            {c.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-2">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <p className="mt-6 mb-2.5 text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Conversación</p>
          <div className="space-y-2">
            {c.messages.slice(-5).map((m) => (
              <div key={m.id} className={cn('flex', m.from === 'agent' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed',
                    m.from === 'agent'
                      ? 'rounded-br-md bg-accent-strong text-accent-ink dark:bg-accent'
                      : 'rounded-bl-md border border-line bg-surface text-ink',
                  )}
                >
                  {m.text}
                  <span className="mt-0.5 block text-right text-[10px] opacity-60">{relTime(m.at)} · {hhmm(m.at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-line p-4">
          <button
            onClick={() => select(c.id)}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent-strong py-3 text-[13.5px] font-medium text-accent-ink transition hover:opacity-90 dark:bg-accent"
          >
            Abrir conversación con {firstName(c.name)}
            <ArrowRight size={15} className="transition group-hover:translate-x-1" />
          </button>
        </div>
      </motion.aside>
    </>
  )
}

export function DiscardModal({ id }: { id: string }) {
  const c = useStore((s) => s.contacts.find((x) => x.id === id))
  const confirm = useStore((s) => s.confirmDiscard)
  const cancel = useStore((s) => s.cancelDiscard)
  const [reason, setReason] = useState<string | null>(null)
  const [other, setOther] = useState('')
  if (!c) return null
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
        className="w-[460px] rounded-[28px] border border-line bg-surface p-7 shadow-lift"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-2">
          <Archive size={20} />
        </span>
        <h3 className="mt-4 font-serif text-[24px] leading-tight text-ink">¿Por qué descartamos a {firstName(c.name)}?</h3>
        <p className="mt-1.5 text-[13px] text-ink-2">
          Nos ayuda a entender qué pasa con las consultas que no avanzan. Podés recuperar el contacto cuando quieras.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[...DISCARD_REASONS, 'Otro'].map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={cn(
                'rounded-xl border px-3.5 py-3 text-left text-[13px] font-medium transition',
                reason === r
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-line text-ink-2 hover:border-line-strong hover:bg-surface-2',
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
            Mover a Descartada
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
