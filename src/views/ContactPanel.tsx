import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Megaphone, Check, ChevronDown, Mail, Phone, AtSign, Loader2, Building2, CalendarDays, MessageSquare, KeyRound, FileText, Eye, Info } from 'lucide-react'
import { useStore } from '../store'
import type { Classification, Contact, HistoryItem } from '../types'
import { Avatar, ChannelPill, SparkleIcon, StagePill } from '../components/ui'
import { CLASSIFICATIONS, devById, priceFor, stageById } from '../data/config'
import { cn, dayLabel, stageAgeLabel, usd } from '../lib/utils'
import { MiniAd, OriginChip } from '../components/attraction-ui'
import { ORIGINS, originOf } from '../data/attraction'

const section = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i, duration: 0.35 } }),
}

export function ContactPanel({ c }: { c: Contact }) {
  const showOnBoard = useStore((s) => s.showOnBoard)
  const dev = devById(c.developmentId)
  const stage = stageById(c.stage)

  return (
    <aside className="scroll-soft w-[348px] shrink-0 overflow-y-auto border-l border-line bg-surface/40">
      <motion.div key={c.id} initial="hidden" animate="show" className="px-5 pt-6 pb-8">
        {/* Identity */}
        <motion.div custom={0} variants={section} className="flex flex-col items-center text-center">
          <Avatar name={c.name} hue={c.hue} size={76} channel={c.channel} />
          <h3 className="mt-3.5 font-serif text-[22px] leading-tight text-ink">{c.name}</h3>
          <div className="mt-2">
            <ChannelPill channel={c.channel} portal={c.portal} />
          </div>
          <div className="mt-4 w-full space-y-1.5 rounded-2xl border border-line bg-surface p-3 text-left text-[12.5px] shadow-soft">
            {c.phone && (
              <p className="flex items-center gap-2.5 text-ink-2">
                <Phone size={13} className="text-ink-3" /> {c.phone}
              </p>
            )}
            {c.email && (
              <p className="flex items-center gap-2.5 truncate text-ink-2">
                <Mail size={13} className="text-ink-3" /> {c.email}
              </p>
            )}
            {c.handle && (
              <p className="flex items-center gap-2.5 text-ink-2">
                <AtSign size={13} className="text-ink-3" /> {c.handle.replace('@', '')}
              </p>
            )}
          </div>
        </motion.div>

        {/* Classification */}
        <motion.div custom={1} variants={section} className="mt-6">
          <Label>Clasificación sugerida</Label>
          <AnimatePresence mode="wait">
            {c.analyzing ? <Analyzing key="an" /> : <ClassificationCard key={'cl' + c.classification} c={c} />}
          </AnimatePresence>
        </motion.div>

        {/* Tags */}
        <motion.div custom={2} variants={section} className="mt-6">
          <Label>Datos detectados</Label>
          {c.analyzing ? (
            <div className="flex gap-1.5">
              <div className="shimmer h-6 w-24 rounded-full" />
              <div className="shimmer h-6 w-20 rounded-full" />
              <div className="shimmer h-6 w-28 rounded-full" />
            </div>
          ) : c.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {c.tags.map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11.5px] font-medium',
                    t.toLowerCase().includes('recomendado')
                      ? 'border-[#b8963e]/30 bg-[#b8963e]/10 text-[#9a7a2c]'
                      : 'border-line bg-surface text-ink-2',
                  )}
                >
                  {t.toLowerCase().includes('recomendado') && '🤝 '}
                  {t}
                </motion.span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-ink-3">Todavía no hay datos. Se completan a medida que avanza la conversación.</p>
          )}
        </motion.div>

        {/* Origin */}
        <motion.div custom={3} variants={section} className="mt-6">
          <Label>Origen</Label>
          <OriginCard c={c} />
        </motion.div>

        {/* Development */}
        <motion.div custom={4} variants={section} className="mt-6">
          <Label>Desarrollo de interés</Label>
          <div className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition hover:shadow-card">
            <div className="relative h-[108px] overflow-hidden" style={{ background: dev.gradient }}>
              <img
                src={dev.image}
                alt=""
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[10.5px] font-semibold text-[#3a4730] backdrop-blur">
                {dev.status}
              </span>
              <div className="absolute right-3 bottom-2.5 left-3 text-white">
                <p className="font-serif text-[17px] leading-tight">{dev.name}</p>
                <p className="text-[11px] opacity-80">{dev.address} · {dev.delivery}</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-3.5 py-2.5 text-[12px]">
              <span className="flex items-center gap-1.5 text-ink-2">
                <Building2 size={13} className="text-ink-3" /> {c.typology}
              </span>
              <span className="font-medium text-ink">
                desde {usd(priceFor(c.developmentId, c.typology))}
              </span>
            </div>
            {dev.progress < 100 && (
              <div className="px-3.5 pb-3">
                <div className="flex justify-between text-[10.5px] text-ink-3">
                  <span>Avance de obra</span>
                  <span>{dev.progress}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${dev.progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stage */}
        <motion.div custom={5} variants={section} className="mt-6">
          <Label>Etapa en el tablero</Label>
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: stage.color + '1f', color: stage.color }}>
              <stage.icon size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink">{stage.label}</p>
              <p className="text-[11.5px] text-ink-3">{stageAgeLabel(c.stageSince)}</p>
            </div>
            <button
              onClick={() => showOnBoard(c.id)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-accent transition hover:bg-accent-soft"
            >
              Ver en tablero <ArrowUpRight size={13} />
            </button>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div custom={6} variants={section} className="mt-6">
          <Label>Historial</Label>
          <Timeline items={c.history} />
        </motion.div>
      </motion.div>
    </aside>
  )
}

const ORIGIN_DESC: Record<string, string> = {
  recomendacion: 'Llegó por la recomendación de alguien que conoce a MARQ.',
  organico: 'Llegó por su cuenta: redes, web o pasando por la obra.',
  portal: 'Llegó desde un aviso en un portal inmobiliario.',
  cliente: 'Ya es cliente MARQ: volvió por su cuenta.',
}

function OriginCard({ c }: { c: Contact }) {
  const campaign = useStore((s) => s.campaigns.find((x) => x.id === c.campaignId))
  const o = originOf(c)
  if (o !== 'campana' || !campaign) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-soft">
        <OriginChip c={c} size="sm" />
        <p className="text-[11.5px] leading-snug text-ink-3">{ORIGIN_DESC[o]}</p>
      </div>
    )
  }
  const dl = dayLabel(c.messages[0]?.at ?? Date.now())
  const when = dl === 'Hoy' ? 'hoy' : dl === 'Ayer' ? 'ayer' : `el ${dl.toLowerCase()}`
  const open = () => useStore.setState({ view: 'attraction', attractionTab: 'campanas', campaignDrawerId: campaign.id, drawerId: null, metaUnseen: 0 })
  return (
    <div className="flex gap-3 rounded-2xl border bg-surface p-3 shadow-soft" style={{ borderColor: ORIGINS.campana.color + '40' }}>
      <MiniAd developmentId={campaign.developmentId} text={campaign.adText} />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="flex items-start gap-1.5 text-[12.5px] leading-snug font-semibold" style={{ color: ORIGINS.campana.color }}>
          <Megaphone size={13} className="mt-0.5 shrink-0" /> Camp. {campaign.name}
        </p>
        <p className="mt-2 text-[12px] leading-snug text-ink-2">
          Vio este anuncio y escribió <b className="font-semibold text-ink">{when}</b>.
        </p>
        <p className="mt-1 text-[11px] text-ink-3">Pauta en Instagram y Facebook</p>
        <button
          onClick={open}
          className="mt-auto flex w-fit items-center gap-1 rounded-lg px-1.5 py-1 text-[12px] font-medium text-accent transition hover:bg-accent-soft"
        >
          Ver campaña <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{children}</p>
}

const STEPS = ['Leyendo el mensaje', 'Buscando en el historial de contactos', 'Detectando intención y datos']

function Analyzing() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length)), 750)
    return () => clearInterval(iv)
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="ai-border p-4"
    >
      <div className="flex items-center gap-2">
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}>
          <SparkleIcon size={16} />
        </motion.span>
        <span className="ai-text text-[13px] font-semibold">Analizando…</span>
      </div>
      <div className="mt-3 space-y-2">
        {STEPS.map((s, i) => (
          <div key={s} className={cn('flex items-center gap-2 text-[12px] transition-colors', i <= step ? 'text-ink-2' : 'text-ink-3/50')}>
            {i < step ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-ink">
                <Check size={10} strokeWidth={3} />
              </motion.span>
            ) : i === step ? (
              <Loader2 size={16} className="animate-spin text-accent" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-line-strong" />
            )}
            {s}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function ClassificationCard({ c }: { c: Contact }) {
  const setClassification = useStore((s) => s.setClassification)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cls = CLASSIFICATIONS[c.classification]
  const pct = Math.round(c.confidence * 100)
  const manual = c.confidence === 1

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [open])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="relative rounded-2xl border bg-surface p-4 shadow-soft"
      style={{ borderColor: cls.color + '40' }}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: cls.soft }}>
          <span className="h-3 w-3 rounded-full" style={{ background: cls.color, boxShadow: `0 0 0 4px ${cls.color}22` }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold" style={{ color: cls.color }}>
            {cls.label}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-2">{c.classification === 'sin' ? 'No tengo información suficiente para clasificarlo' : cls.description}</p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-0.5 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-ink-2 transition hover:border-line-strong hover:text-ink"
        >
          Corregir <ChevronDown size={12} className={cn('transition', open && 'rotate-180')} />
        </button>
      </div>

      {c.classification !== 'sin' ? (
        <div className="mt-3.5">
          <div className="flex justify-between text-[11px] text-ink-3">
            <span>{manual ? 'Confirmada por vos' : 'Confianza'}</span>
            <span className="font-semibold text-ink-2">{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${cls.color}99, ${cls.color})` }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2 p-2.5 text-[11.5px] leading-snug text-ink-2">
          <Info size={13} className="mt-px shrink-0 text-ink-3" />
          El borrador incluye una pregunta para conocer mejor qué busca.
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute top-14 right-3 z-20 w-60 rounded-xl border border-line bg-[var(--glass)] p-1.5 shadow-float backdrop-blur-2xl"
          >
            {(Object.keys(CLASSIFICATIONS) as Classification[]).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setOpen(false)
                  if (k !== c.classification) setClassification(c.id, k)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-ink transition hover:bg-surface-2"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: CLASSIFICATIONS[k].color }} />
                {CLASSIFICATIONS[k].label}
                {k === c.classification && <Check size={14} className="ml-auto text-accent" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const KIND_ICON: Record<HistoryItem['kind'], typeof Eye> = {
  consulta: MessageSquare,
  visita: Eye,
  compra: KeyRound,
  mensaje: Mail,
  reunion: CalendarDays,
  propuesta: FileText,
  sistema: Check,
}

function Timeline({ items }: { items: HistoryItem[] }) {
  return (
    <div className="relative pl-1">
      <span className="absolute top-2 bottom-2 left-[15px] w-px bg-gradient-to-b from-line-strong via-line to-transparent" />
      <AnimatePresence initial={false}>
        {items.map((h, i) => {
          const Icon = KIND_ICON[h.kind]
          const buy = h.kind === 'compra'
          return (
            <motion.div
              key={h.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
              className="relative flex gap-3 pb-4"
            >
              <span
                className={cn(
                  'relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border',
                  buy ? 'border-[#b8963e]/40 bg-[#f6efdf] text-[#9a7a2c] dark:bg-[#3a3222]' : 'border-line bg-surface text-ink-3',
                )}
              >
                <Icon size={13} />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[12.5px] leading-snug font-medium text-ink">{h.title}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-3">
                  {h.date}
                  {h.detail && <> · {h.detail}</>}
                </p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export { StagePill }
