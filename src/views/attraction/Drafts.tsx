import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  Building2,
  Check,
  ChevronRight,
  ChevronUp,
  Ellipsis,
  Heart,
  Link2,
  Loader2,
  MessageCircle,
  Pencil,
  Send,
  Target,
  X,
} from 'lucide-react'
import { useStore } from '../../store'
import type { AdSegment, CampaignDraft, DraftStatus } from '../../types'
import { PROFILES, adText, resegment } from '../../data/attraction'
import { devById, priceFor } from '../../data/config'
import { SparkleIcon } from '../../components/ui'
import { AnimatedNumber, DevImage, MarqAvatar, ProfileChip } from '../../components/attraction-ui'
import { ars, cn, relTime, usd } from '../../lib/utils'

type Edit = { text: string; budget: number; days: number }

const STATUS: Record<DraftStatus, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: '#C08A3E' },
  aprobado: { label: 'Aprobado', color: '#4E8A5E' },
  editado: { label: 'Editado', color: '#5F83A6' },
  descartado: { label: 'Descartado', color: '#9A948A' },
}

const PROFILE_DESC: Record<string, string> = {
  primera: 'Personas de 25 a 40 años que buscan su primera vivienda en CABA y consultan por crédito hipotecario.',
  inversor: 'Inversores que buscan renta en pozo o en obra, atentos a rentabilidad y cesión de boleto.',
  conocido: 'Clientes MARQ y personas con un perfil parecido al de ellos.',
  recomendado: 'Personas parecidas a quienes llegaron recomendados por un cliente MARQ.',
  amplio: 'Sin segmentar por perfil: todo CABA y GBA norte, de 25 a 65 años.',
}

const GEN_STEPS = ['Leyendo conversaciones…', 'Analizando el tablero…', 'Detectando preguntas frecuentes…']

export function Drafts() {
  const drafts = useStore((s) => s.drafts)
  const selectedId = useStore((s) => s.selectedDraftId)
  const generating = useStore((s) => s.generating)
  const d = drafts.find((x) => x.id === selectedId) ?? drafts[0]
  const [edit, setEdit] = useState<Edit | null>(null)

  useEffect(() => setEdit(null), [d?.id])

  if (!d) return null
  return (
    <div className="flex h-full min-h-0 border-t border-line">
      <DraftList />
      {generating ? <GeneratingStage step={generating.step} /> : <DraftPreview key={"preview-" + d.id} d={d} edit={edit} setEdit={setEdit} />}
      <DraftSheet key={"sheet-" + d.id} d={d} edit={edit} setEdit={setEdit} dim={!!generating} />
    </div>
  )
}

/* ───────────────────────── Columna izquierda */

function DraftList() {
  const drafts = useStore((s) => s.drafts)
  const selectedId = useStore((s) => s.selectedDraftId)
  const select = useStore((s) => s.selectDraft)
  const generating = useStore((s) => s.generating)
  const pending = drafts.filter((d) => d.status === 'pendiente' || d.status === 'editado').length

  return (
    <section className="flex w-[352px] shrink-0 flex-col border-r border-line bg-surface/40">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[20px] text-ink">Borradores de campaña</h2>
          <span className="text-[12px] text-ink-3">{drafts.length} en total</span>
        </div>
        <p className="mt-1 text-[12.5px] text-ink-2">
          Tenés <b className="font-semibold text-[#b0643f]">{pending} borradores</b> esperando tu aprobación
        </p>
      </div>
      <div className="scroll-soft flex-1 overflow-y-auto px-2.5 pb-4">
        <AnimatePresence initial={false}>
          {generating && <GeneratingCard key="gen" step={generating.step} />}
          {drafts.map((d) => (
            <DraftRow key={d.id} d={d} active={d.id === selectedId} onClick={() => select(d.id)} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}

function StatusChip({ status }: { status: DraftStatus }) {
  const s = STATUS[status]
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10.5px] font-medium" style={{ background: s.color + '1c', color: s.color }}>
      {status === 'aprobado' ? <Check size={10} strokeWidth={3} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />}
      {s.label}
    </span>
  )
}

function DraftRow({ d, active, onClick }: { d: CampaignDraft; active: boolean; onClick: () => void }) {
  const dev = devById(d.developmentId)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="overflow-hidden"
    >
      <button
        onClick={onClick}
        className={cn(
          'group relative my-0.5 flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200',
          active ? 'bg-surface shadow-card' : 'hover:bg-surface/70',
          d.fresh && 'glow-new',
          d.status === 'descartado' && !active && 'opacity-60',
        )}
      >
        {active && <motion.span layoutId="draft-active" className="absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-accent" />}
        <span className="relative">
          <DevImage id={d.developmentId} className="h-[42px] w-[42px] rounded-xl" />
          <span
            className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full ring-2 ring-surface"
            style={{ background: PROFILES[d.profile].color }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13.5px] font-semibold text-ink">MARQ · {dev.neighborhood}</p>
            <span className={cn('ml-auto shrink-0 text-[11px]', d.fresh ? 'font-semibold text-accent' : 'text-ink-3')}>{relTime(d.createdAt)}</span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-3">
            {d.typology} · <span style={{ color: PROFILES[d.profile].color }}>{PROFILES[d.profile].label}</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <StatusChip status={d.status} />
            <span className="text-[11px] text-ink-2">
              {ars(d.budget)} · {d.days} días
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  )
}

function Steps({ step, large }: { step: number; large?: boolean }) {
  return (
    <div className={cn('space-y-2', large && 'space-y-3')}>
      {GEN_STEPS.map((s, i) => (
        <div
          key={s}
          className={cn('flex items-center gap-2 transition-colors', large ? 'text-[14px]' : 'text-[12px]', i <= step ? 'text-ink-2' : 'text-ink-3/50')}
        >
          {i < step ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn('flex items-center justify-center rounded-full bg-accent text-accent-ink', large ? 'h-5 w-5' : 'h-4 w-4')}
            >
              <Check size={large ? 12 : 10} strokeWidth={3} />
            </motion.span>
          ) : i === step ? (
            <Loader2 size={large ? 20 : 16} className="animate-spin text-accent" />
          ) : (
            <span className={cn('rounded-full border border-line-strong', large ? 'h-5 w-5' : 'h-4 w-4')} />
          )}
          {s}
        </div>
      ))}
    </div>
  )
}

function GeneratingCard({ step }: { step: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0, scale: 0.95 }}
      animate={{ opacity: 1, height: 'auto', scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      className="px-1 pt-1 pb-2"
    >
      <div className="ai-border ai-glow isolate p-4">
        <div className="flex items-center gap-2">
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}>
            <SparkleIcon size={16} />
          </motion.span>
          <span className="ai-text text-[13px] font-semibold">Armando una propuesta…</span>
        </div>
        <div className="mt-3">
          <Steps step={step} />
        </div>
      </div>
    </motion.div>
  )
}

function GeneratingStage({ step }: { step: number }) {
  return (
    <section className="relative flex min-w-0 flex-1 flex-col items-center justify-center bg-bg">
      <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative flex items-center gap-10">
        <div className="w-[230px] rounded-[38px] border-[8px] border-[#1d1b17] bg-white p-3 shadow-lift">
          <div className="flex items-center gap-2">
            <div className="shimmer h-7 w-7 rounded-full" />
            <div className="space-y-1">
              <div className="shimmer h-2 w-24 rounded-full" />
              <div className="shimmer h-2 w-12 rounded-full" />
            </div>
          </div>
          <div className="shimmer mt-3 h-[220px] rounded-xl" />
          <div className="mt-3 space-y-1.5">
            <div className="shimmer h-2 w-[92%] rounded-full" />
            <div className="shimmer h-2 w-[78%] rounded-full" />
            <div className="shimmer h-2 w-[55%] rounded-full" />
          </div>
        </div>
        <div className="w-[320px]">
          <div className="flex items-center gap-2">
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}>
              <SparkleIcon size={22} />
            </motion.span>
            <span className="ai-text font-serif text-[24px] whitespace-nowrap">Armando una propuesta</span>
          </div>
          <p className="mt-1.5 mb-5 text-[12.5px] text-ink-3">El agente lee la Bandeja y el Tablero. Vos decidís si se publica.</p>
          <Steps step={step} large />
        </div>
      </motion.div>
    </section>
  )
}

/* ───────────────────────── Columna central */

function DraftPreview({ d, edit, setEdit }: { d: CampaignDraft; edit: Edit | null; setEdit: (e: Edit | null) => void }) {
  const text = adText(d.segments)
  const key = 'cd:' + d.id + text.length
  const typedAlready = useStore((s) => !!s.typedDrafts[key])
  const markTyped = useStore((s) => s.markTyped)
  const [format, setFormat] = useState<'post' | 'story'>('post')
  const [n, setN] = useState(typedAlready ? text.length : 0)
  const [phase, setPhase] = useState<'thinking' | 'typing' | 'done'>(typedAlready ? 'done' : 'thinking')
  const [hover, setHover] = useState<number | null>(null)
  const [approving, setApproving] = useState(false)
  const dev = devById(d.developmentId)

  useEffect(() => {
    if (phase !== 'thinking') return
    const t = setTimeout(() => setPhase('typing'), 650)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'typing') return
    let i = 0
    const iv = setInterval(() => {
      i += 2 + Math.floor(Math.random() * 2)
      setN(Math.min(i, text.length))
      if (i >= text.length) {
        clearInterval(iv)
        setPhase('done')
        markTyped(key)
      }
    }, 26)
    return () => clearInterval(iv)
  }, [phase, text, key, markTyped])

  const skip = () => {
    if (phase !== 'done') {
      setN(text.length)
      setPhase('done')
      markTyped(key)
    }
  }

  // Mientras se edita, el anuncio muestra el texto nuevo en vivo
  const segments: AdSegment[] = edit ? resegment(edit.text, d.segments) : d.segments
  const shown = edit ? edit.text.length : n
  const annotations = useMemo(() => {
    let off = 0
    return d.segments
      .map((s) => {
        const start = off
        off += s.t.length
        return { ...s, end: off, start }
      })
      .filter((s) => s.q)
  }, [d.segments])

  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-bg">
      {/* Header, igual que el del chat */}
      <div className="flex h-[76px] shrink-0 items-center gap-3.5 border-b border-line bg-surface/50 px-6 backdrop-blur-xl">
        <DevImage id={d.developmentId} className="h-[42px] w-[42px] shrink-0 rounded-xl" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-ink">MARQ · {dev.neighborhood}</p>
            <ProfileChip value={d.profile} />
          </div>
          <p className="mt-0.5 text-[12px] text-ink-3">
            Anuncio para Instagram y Facebook · {d.typology} · generado {relTime(d.createdAt)}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-xl border border-line bg-surface/70 p-1 shadow-soft">
          {(['post', 'story'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={cn('relative rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors', format === f ? 'text-ink' : 'text-ink-3 hover:text-ink')}
            >
              {format === f && <motion.span layoutId="ad-format" className="absolute inset-0 rounded-lg bg-surface-2 shadow-soft" />}
              <span className="relative">{f === 'post' ? 'Publicación' : 'Historia'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Anuncio + anotaciones */}
      <div className="scroll-soft relative flex-1 overflow-y-auto" onClick={skip}>
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto flex max-w-[640px] items-start justify-center gap-7 px-6 pt-7 pb-8">
          <Phone story={format === 'story'}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={format}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {format === 'post' ? (
                  <PostAd d={d} segments={segments} shown={shown} typing={phase !== 'done' && !edit} thinking={phase === 'thinking' && !edit} hover={hover} />
                ) : (
                  <StoryAd d={d} segments={segments} shown={shown} typing={phase !== 'done' && !edit} thinking={phase === 'thinking' && !edit} hover={hover} />
                )}
              </motion.div>
            </AnimatePresence>
          </Phone>

          <div className="sticky top-6 w-[214px] shrink-0 space-y-3 self-start pt-10">
            <Annotation
              icon={<BadgeCheck size={14} />}
              title="Firma MARQ"
              body="La empresa se ve detrás del desarrollo."
              color="#8a7f6c"
              show
              delay={0.2}
            />
            {annotations.map((a, i) => (
              <Annotation
                key={a.q}
                index={i + 1}
                title={`Responde: ${a.q}`}
                body={`${a.pct}% de las consultas de este perfil`}
                pct={a.pct}
                color={PROFILES[d.profile].color}
                show={!!edit || shown >= a.end}
                onHover={(h) => setHover(h ? i : null)}
                faded={!!edit && !(edit.text.includes(a.t))}
              />
            ))}
            {!edit && phase === 'done' && annotations.length === 0 && (
              <p className="rounded-xl border border-dashed border-line p-3 text-[11.5px] leading-snug text-ink-3">
                Este texto no responde ninguna de las preguntas frecuentes del perfil.
              </p>
            )}
          </div>
        </div>

        <AnimatePresence>
          {approving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-bg/60 backdrop-blur-[3px]"
            >
              <div className="relative flex flex-col items-center">
                {[0, 1].map((k) => (
                  <motion.span
                    key={k}
                    className="absolute top-0 h-24 w-24 rounded-full border-2 border-accent"
                    initial={{ scale: 0.6, opacity: 0.8 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{ duration: 1.1, delay: 0.15 + k * 0.25, ease: 'easeOut' }}
                  />
                ))}
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 16 }}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-strong text-accent-ink shadow-lift dark:bg-accent"
                >
                  <Check size={46} strokeWidth={2.6} />
                </motion.span>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5 font-serif text-[24px] text-ink">
                  Campaña aprobada
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-1 text-[12.5px] text-ink-3">
                  Se publicaría en Meta · simulado en el prototipo
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panel de aprobación, igual que el de la Bandeja */}
      <div className="shrink-0 border-t border-line bg-surface/40 px-6 pt-4 pb-4 backdrop-blur-xl">
        <div className="mx-auto max-w-[760px]">
          <ApprovalPanel
            d={d}
            phase={phase}
            edit={edit}
            setEdit={setEdit}
            onApprove={() => {
              setApproving(true)
              setTimeout(() => {
                useStore.getState().approveDraft(d.id)
                setApproving(false)
              }, 1250)
            }}
          />
        </div>
      </div>
    </section>
  )
}

function Phone({ children, story }: { children: React.ReactNode; story?: boolean }) {
  const ink = story ? 'bg-white' : 'bg-[#111]'
  return (
    <div className="relative w-[300px] shrink-0 rounded-[46px] border-[9px] border-[#1d1b17] bg-[#1d1b17] shadow-lift">
      <div className="relative overflow-hidden rounded-[37px] bg-white">
        <div
          className={cn(
            'absolute inset-x-0 top-0 z-20 flex h-8 items-center justify-between px-6 pt-1 text-[11px] font-semibold transition-colors',
            story ? 'text-white' : 'text-[#111]',
          )}
        >
          <span>9:41</span>
          <span className="absolute top-2 left-1/2 h-[18px] w-[78px] -translate-x-1/2 rounded-full bg-[#1d1b17]" />
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-[1.5px]">
              {[4, 6, 8, 10].map((h) => (
                <span key={h} className={cn('w-[2.5px] rounded-[1px]', ink)} style={{ height: h }} />
              ))}
            </span>
            <span className={cn('ml-1 h-[9px] w-[18px] rounded-[3px] border p-[1px]', story ? 'border-white' : 'border-[#111]')}>
              <span className={cn('block h-full w-[70%] rounded-[1px]', ink)} />
            </span>
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Texto del anuncio con los tramos que responden preguntas resaltados */
function AdText({
  segments,
  shown,
  typing,
  hover,
  light,
}: {
  segments: AdSegment[]
  shown: number
  typing: boolean
  hover: number | null
  light?: boolean
}) {
  let off = 0
  let qi = -1
  return (
    <span className={cn(typing && 'caret')}>
      {segments.map((s, i) => {
        const start = off
        off += s.t.length
        const visible = s.t.slice(0, Math.max(0, shown - start))
        if (!visible) return null
        if (!s.q) return <span key={i}>{visible}</span>
        qi++
        const on = hover === qi
        return (
          <mark
            key={i}
            className="rounded-[3px] px-[1px] transition-all duration-200"
            style={{
              color: 'inherit',
              background: light
                ? on
                  ? 'rgba(233,200,120,0.55)'
                  : 'rgba(233,200,120,0.3)'
                : on
                  ? 'rgba(214,170,70,0.42)'
                  : 'linear-gradient(transparent 52%, rgba(214,170,70,0.33) 52%)',
            }}
          >
            {visible}
            {visible.length === s.t.length && <sup className="ml-[1px] text-[8px] font-bold opacity-70">{qi + 1}</sup>}
          </mark>
        )
      })}
    </span>
  )
}

type AdProps = { d: CampaignDraft; segments: AdSegment[]; shown: number; typing: boolean; thinking: boolean; hover: number | null }

function PostAd({ d, segments, shown, typing, thinking, hover }: AdProps) {
  const dev = devById(d.developmentId)
  return (
    <div className="pt-8 text-[#111]">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <MarqAvatar size={30} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[12.5px] font-semibold">MARQ · {dev.neighborhood}</p>
          <p className="text-[10.5px] text-[#737373]">Publicidad</p>
        </div>
        <Ellipsis size={16} />
      </div>
      <DevImage id={d.developmentId} className="aspect-square">
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute right-3 bottom-3 left-3 text-white">
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-80">MARQ</p>
          <p className="font-serif text-[24px] leading-none">{dev.neighborhood}</p>
          <p className="mt-1 text-[11px] opacity-85">
            {d.typology} · desde {usd(priceFor(d.developmentId, d.typology))}
          </p>
        </div>
      </DevImage>
      <div className="flex items-center justify-between bg-[#3a4730] px-3 py-2.5 text-[12.5px] font-semibold text-white">
        {d.cta}
        <ChevronRight size={16} />
      </div>
      <div className="flex items-center gap-3.5 px-3 pt-2.5 pb-1.5">
        <Heart size={20} strokeWidth={1.8} />
        <MessageCircle size={20} strokeWidth={1.8} />
        <Send size={19} strokeWidth={1.8} />
        <Bookmark size={19} strokeWidth={1.8} className="ml-auto" />
      </div>
      <div className="min-h-[96px] px-3 pb-4 text-[12px] leading-[1.45]">
        {thinking ? (
          <div className="space-y-1.5 pt-1">
            <div className="shimmer h-2.5 w-[92%] rounded-full" />
            <div className="shimmer h-2.5 w-[80%] rounded-full" />
            <div className="shimmer h-2.5 w-[50%] rounded-full" />
          </div>
        ) : (
          <p>
            <b className="font-semibold">marq.desarrollos</b> <AdText segments={segments} shown={shown} typing={typing} hover={hover} />
          </p>
        )}
      </div>
    </div>
  )
}

function StoryAd({ d, segments, shown, typing, thinking, hover }: AdProps) {
  const dev = devById(d.developmentId)
  return (
    <DevImage id={d.developmentId} className="aspect-[9/16]">
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/80" />
      <div className="absolute top-9 right-3 left-3 flex gap-1">
        <span className="h-[2.5px] flex-1 overflow-hidden rounded-full bg-white/35">
          <motion.span className="block h-full bg-white" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 6, ease: 'linear', repeat: Infinity }} />
        </span>
        <span className="h-[2.5px] flex-1 rounded-full bg-white/35" />
      </div>
      <div className="absolute top-12 right-3 left-3 flex items-center gap-2 text-white">
        <MarqAvatar size={28} />
        <div className="leading-tight">
          <p className="text-[12px] font-semibold">MARQ · {dev.neighborhood}</p>
          <p className="text-[10px] opacity-80">Publicidad</p>
        </div>
        <X size={18} className="ml-auto opacity-90" />
      </div>
      <div className="absolute right-4 bottom-24 left-4 text-white">
        <p className="font-serif text-[30px] leading-none">{dev.neighborhood}</p>
        <div className="mt-3 text-[13.5px] leading-[1.45] font-medium [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]">
          {thinking ? (
            <div className="space-y-2">
              <div className="h-2.5 w-[90%] animate-pulse rounded-full bg-white/40" />
              <div className="h-2.5 w-[70%] animate-pulse rounded-full bg-white/40" />
            </div>
          ) : (
            <AdText segments={segments} shown={shown} typing={typing} hover={hover} light />
          )}
        </div>
      </div>
      <div className="absolute right-0 bottom-6 left-0 flex flex-col items-center text-white">
        <ChevronUp size={18} />
        <span className="mt-1 rounded-full bg-white px-5 py-2 text-[12.5px] font-semibold text-[#111] shadow-float">{d.cta}</span>
      </div>
    </DevImage>
  )
}

function Annotation({
  icon,
  index,
  title,
  body,
  pct,
  color,
  show,
  delay = 0,
  faded,
  onHover,
}: {
  icon?: React.ReactNode
  index?: number
  title: string
  body: string
  pct?: number
  color: string
  show: boolean
  delay?: number
  faded?: boolean
  onHover?: (h: boolean) => void
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -14, scale: 0.96 }}
          animate={{ opacity: faded ? 0.4 : 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28, delay }}
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
          className="relative cursor-default rounded-2xl border border-line bg-surface/90 p-3 shadow-soft backdrop-blur transition hover:shadow-card"
        >
          <span className="absolute top-4 -left-[22px] flex items-center">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
            <span className="h-px w-4 border-t border-dashed" style={{ borderColor: color + '80' }} />
          </span>
          <div className="flex items-start gap-2">
            <span
              className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: color + '1c', color }}
            >
              {icon ?? index}
            </span>
            <div className="min-w-0">
              <p className="text-[12px] leading-snug font-semibold text-ink">{title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-3">{body}</p>
            </div>
          </div>
          {pct != null && (
            <div className="mt-2 ml-7 h-1 overflow-hidden rounded-full bg-surface-3">
              <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.15 }} />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ApprovalPanel({
  d,
  phase,
  edit,
  setEdit,
  onApprove,
}: {
  d: CampaignDraft
  phase: 'thinking' | 'typing' | 'done'
  edit: Edit | null
  setEdit: (e: Edit | null) => void
  onApprove: () => void
}) {
  const requestDiscard = useStore((s) => s.requestDraftDiscard)
  const saveDraftEdit = useStore((s) => s.saveDraftEdit)
  const markTyped = useStore((s) => s.markTyped)
  const setTab = useStore((s) => s.setAttractionTab)
  const openCampaign = useStore((s) => s.openCampaign)
  const ready = phase === 'done'
  const closed = d.status === 'aprobado' || d.status === 'descartado'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className={cn('isolate p-4', closed ? 'rounded-[20px] border border-line bg-surface' : 'ai-border ai-glow')}
    >
      <div className="flex items-center gap-2">
        <motion.span animate={{ rotate: ready ? 0 : [0, 15, -10, 0] }} transition={{ duration: 1.4, repeat: ready ? 0 : Infinity }}>
          <SparkleIcon size={17} />
        </motion.span>
        <span className="ai-text text-[12.5px] font-semibold">Borrador IA de campaña</span>
        <span className="text-[12px] text-ink-3">· requiere tu aprobación</span>
        <span className="ml-auto text-[11px] text-ink-3">
          {d.status === 'aprobado'
            ? 'Aprobado'
            : d.status === 'descartado'
              ? 'Descartado'
              : edit
                ? 'Editando…'
                : phase === 'thinking'
                  ? 'Leyendo señales…'
                  : phase === 'typing'
                    ? 'Redactando el anuncio…'
                    : d.status === 'editado'
                      ? 'Editado · listo para aprobar'
                      : 'Listo para revisar'}
        </span>
      </div>

      {edit && (
        <motion.textarea
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          autoFocus
          value={edit.text}
          onChange={(e) => setEdit({ ...edit, text: e.target.value })}
          rows={3}
          className="mt-3 w-full resize-none rounded-xl border border-line bg-surface-2/60 p-3 text-[13px] leading-relaxed text-ink outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
        />
      )}

      {d.status === 'aprobado' ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Check size={16} strokeWidth={2.6} />
          </span>
          <p className="flex-1 text-[12.5px] text-ink-2">
            Aprobada{d.edited ? ' con cambios' : ''}. Se publicaría en Meta <span className="text-ink-3">(simulado en el prototipo)</span>.
          </p>
          <button
            onClick={() => {
              setTab('campanas')
              if (d.campaignId) setTimeout(() => openCampaign(d.campaignId!), 350)
            }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-accent transition hover:bg-accent-soft"
          >
            Ver campaña <ArrowUpRight size={13} />
          </button>
        </div>
      ) : d.status === 'descartado' ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-3 text-ink-3">
            <Archive size={15} />
          </span>
          <p className="text-[12.5px] text-ink-2">
            Descartado · <span className="text-ink-3">Motivo: {d.discardReason}</span>
          </p>
        </div>
      ) : (
        <div className={cn('mt-3.5 flex items-center gap-2 transition-opacity', !ready && 'pointer-events-none opacity-40')}>
          {edit ? (
            <>
              <button
                onClick={() => {
                  saveDraftEdit(d.id, edit)
                  markTyped('cd:' + d.id + edit.text.trim().length)
                  setEdit(null)
                }}
                disabled={!edit.text.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-accent-strong px-4 py-2 text-[13px] font-medium text-accent-ink shadow-soft transition hover:opacity-90 disabled:opacity-40 dark:bg-accent"
              >
                <Check size={14} /> Guardar cambios
              </button>
              <button onClick={() => setEdit(null)} className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2">
                <X size={14} /> Cancelar
              </button>
              <span className="ml-auto text-[11px] text-ink-3">Presupuesto y duración se editan en la ficha →</span>
            </>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onApprove}
                className="flex items-center gap-1.5 rounded-xl bg-accent-strong px-4 py-2 text-[13px] font-medium text-accent-ink shadow-[0_6px_16px_-6px_rgba(58,71,48,0.55)] transition hover:opacity-90 dark:bg-accent"
              >
                <Check size={15} strokeWidth={2.4} /> Aprobar y publicar
              </motion.button>
              <button
                onClick={() => setEdit({ text: adText(d.segments), budget: d.budget, days: d.days })}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition hover:border-line-strong hover:bg-surface-2"
              >
                <Pencil size={14} /> Editar
              </button>
              <button
                onClick={() => requestDiscard(d.id)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink"
              >
                <Archive size={14} /> Descartar
              </button>
              <span className="ml-auto hidden text-[11px] text-ink-3 xl:inline">
                Se publicaría como MARQ · {ars(d.budget)} en {d.days} días
              </span>
            </>
          )}
        </div>
      )}
    </motion.div>
  )
}

/* ───────────────────────── Columna derecha */

const section = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i, duration: 0.35 } }),
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{children}</p>
}

function DraftSheet({ d, edit, setEdit, dim }: { d: CampaignDraft; edit: Edit | null; setEdit: (e: Edit | null) => void; dim: boolean }) {
  const focusSignal = useStore((s) => s.focusSignal)
  const dev = devById(d.developmentId)
  const price = priceFor(d.developmentId, d.typology)
  const budget = edit?.budget ?? d.budget
  const days = edit?.days ?? d.days

  return (
    <aside className={cn('scroll-soft w-[348px] shrink-0 overflow-y-auto border-l border-line bg-surface/40 transition-opacity', dim && 'opacity-40')}>
      <motion.div key={d.id} initial="hidden" animate="show" className="px-5 pt-6 pb-8">
        <motion.div custom={0} variants={section}>
          <Label>Desarrollo a destacar</Label>
          <div className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-soft transition hover:shadow-card">
            <DevImage id={d.developmentId} className="h-[108px]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-white/85 px-2 py-0.5 text-[10.5px] font-semibold text-[#3a4730] backdrop-blur">
                {dev.status}
              </span>
              <div className="absolute right-3 bottom-2.5 left-3 text-white">
                <p className="font-serif text-[17px] leading-tight">{dev.name}</p>
                <p className="text-[11px] opacity-80">
                  {dev.address} · {dev.delivery}
                </p>
              </div>
            </DevImage>
            <div className="flex items-center justify-between px-3.5 py-2.5 text-[12px]">
              <span className="flex items-center gap-1.5 text-ink-2">
                <Building2 size={13} className="text-ink-3" /> {d.typology}
              </span>
              <span className="text-ink-3">{dev.typologies.length} tipologías en lista</span>
            </div>
          </div>
        </motion.div>

        <motion.div custom={1} variants={section} className="mt-6">
          <Label>Perfil objetivo</Label>
          <div className="rounded-2xl border bg-surface p-3.5 shadow-soft" style={{ borderColor: PROFILES[d.profile].color + '40' }}>
            <ProfileChip value={d.profile} />
            <p className="mt-2 text-[12px] leading-snug text-ink-2">{PROFILE_DESC[d.profile]}</p>
          </div>
        </motion.div>

        <motion.div custom={2} variants={section} className="mt-6">
          <Label>Precio vigente</Label>
          <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-soft">
            <span className="text-[11.5px] text-ink-3">{d.typology} · desde</span>
            <p className="mt-1 font-serif text-[28px] leading-none whitespace-nowrap text-ink">{usd(price)}</p>
            <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-surface-2 px-2.5 py-2 text-[11px] leading-snug text-ink-2">
              <Link2 size={12} className="mt-px shrink-0 text-accent" />
              <span>
                <b className="font-semibold text-ink">Precio vigente · tomado de la lista de precios del asistente.</b> La misma que usan los borradores de la Bandeja.
              </span>
            </p>
          </div>
        </motion.div>

        <motion.div custom={3} variants={section} className="mt-6">
          <Label>Presupuesto sugerido</Label>
          <div className={cn('rounded-2xl border bg-surface p-4 shadow-soft', edit ? 'border-accent/40 ring-4 ring-accent/10' : 'border-line')}>
            {edit ? (
              <div className="space-y-2.5">
                <label className="block">
                  <span className="text-[11px] text-ink-3">Presupuesto total (ARS)</span>
                  <input
                    type="number"
                    step={10000}
                    value={edit.budget}
                    onChange={(e) => setEdit({ ...edit, budget: Math.max(0, Number(e.target.value)) })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface-2/60 px-3 py-2 font-serif text-[22px] text-ink outline-none focus:border-accent/40"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-ink-3">Duración (días)</span>
                  <input
                    type="number"
                    min={1}
                    value={edit.days}
                    onChange={(e) => setEdit({ ...edit, days: Math.max(1, Number(e.target.value)) })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface-2/60 px-3 py-2 text-[14px] text-ink outline-none focus:border-accent/40"
                  />
                </label>
              </div>
            ) : (
              <>
                <p className="font-serif text-[40px] leading-none font-light tracking-tight text-ink">
                  <span className="mr-1.5 text-[18px] text-ink-3">ARS</span>
                  <AnimatedNumber value={budget} />
                </p>
                <p className="mt-2 text-[12px] text-ink-2">
                  {days} días · {ars(budget / days)} por día
                </p>
              </>
            )}
            <div className="mt-3.5 rounded-xl bg-surface-2/70 p-3">
              <p className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                <SparkleIcon size={12} /> <span className="ai-text">Por qué este presupuesto</span>
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">{d.reasoning}</p>
            </div>
          </div>
        </motion.div>

        <motion.div custom={4} variants={section} className="mt-6">
          <Label>Señales que usamos</Label>
          <div className="flex flex-wrap gap-1.5">
            {d.signals.map((s) => (
              <button
                key={s.id + s.label}
                onClick={() => focusSignal(s.id)}
                className="group inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-2 transition hover:border-accent/40 hover:text-accent"
              >
                {s.label}
                <ArrowUpRight size={11} className="text-ink-3 transition group-hover:text-accent" />
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div custom={5} variants={section} className="mt-6">
          <Label>Cómo se mide</Label>
          <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-surface p-3.5 text-[12px] leading-snug text-ink-2 shadow-soft">
            <Target size={15} className="mt-px shrink-0 text-accent" />
            <span>
              Por las <b className="font-semibold text-ink">reuniones programadas</b> que consigue, no por clics ni consultas. Cada reunión se informa a Meta para que aprenda a buscar gente que avanza.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </aside>
  )
}
