import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, Building2, Check, FileText, Globe, Info, Megaphone, Pencil, ShieldCheck, Tag, X } from 'lucide-react'
import { isStale, useLastPriceChange, usePrice, useStore } from '../store'
import type { Development, PendingPrice } from '../types'
import { CHANNELS, DEVELOPMENTS, devById, listPriceKey, priceKey } from '../data/config'
import { LISTING_PORTALS, WEBSITE, affectedBy, radarFor, type RadarItem } from '../data/pricing'
import { CAMPAIGN_COLOR, campaignNameFor } from '../data/attraction'
import { Avatar, Kbd, SparkleIcon, StagePill } from '../components/ui'
import { AnimatedNumber, DevImage } from '../components/attraction-ui'
import { cn, usd } from '../lib/utils'

/** Variación porcentual entre dos precios: verde si baja, cálido si sube */
export function DeltaBadge({ from, to, className }: { from: number; to: number; className?: string }) {
  const down = to < from
  const pct = Math.abs(((to - from) / from) * 100)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[10.5px] font-semibold whitespace-nowrap',
        down ? 'bg-accent-soft text-accent' : 'bg-[#c0673f]/10 text-[#b0603c]',
        className,
      )}
    >
      {down ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
      {pct.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%
    </span>
  )
}

/** Precio "desde" de la ficha: lleva a la lista de precios */
export function ListPrice({ developmentId, typology }: { developmentId: string; typology: string }) {
  const price = usePrice(developmentId, typology)
  const change = useLastPriceChange(developmentId, typology)
  const openPrices = useStore((s) => s.openPrices)
  return (
    <button
      onClick={() => openPrices(listPriceKey(developmentId, typology))}
      title="Ver en la lista de precios"
      className="group/price -mr-1.5 flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition hover:bg-surface-2"
    >
      {change && <DeltaBadge from={change.from} to={change.to} />}
      <span className="font-medium text-ink">desde {usd(price)}</span>
      <Pencil size={11} className="text-ink-3 opacity-0 transition group-hover/price:opacity-100" />
    </button>
  )
}

/* ───────── Lista de precios */
export function PricesDrawer() {
  const focus = useStore((s) => s.priceFocus)
  const close = () => useStore.getState().closePrices()

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
        <div className="flex shrink-0 items-start gap-3.5 border-b border-line px-6 pt-6 pb-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Tag size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[24px] leading-tight text-ink">Lista de precios</h3>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-2">
              La que usan los borradores de la Bandeja, los anuncios y la ficha de cada contacto.
            </p>
          </div>
          <button onClick={close} className="rounded-full p-1.5 text-ink-3 transition hover:bg-surface-2 hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <div className="scroll-soft flex-1 space-y-4 overflow-y-auto px-6 pt-5 pb-6">
          {DEVELOPMENTS.map((dev, i) => (
            <DevPrices key={dev.id} dev={dev} index={i} focus={focus} />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-line px-6 py-3.5 text-[11.5px] text-ink-3">
          <ShieldCheck size={14} className="shrink-0 text-accent" />
          Ningún cambio se aplica sin ver antes su impacto.
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            Simular una baja <Kbd className="border-line! bg-surface-2! text-ink-2">P</Kbd>
          </span>
        </div>
      </motion.aside>
    </>
  )
}

function DevPrices({ dev, index, focus }: { dev: Development; index: number; focus: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft"
    >
      <DevImage id={dev.id} className="h-[84px]">
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
      <div className="divide-y divide-line">
        {dev.typologies.map((t) => (
          <PriceRow key={t.label} developmentId={dev.id} typology={t.label} focused={focus === priceKey(dev.id, t.label)} />
        ))}
      </div>
    </motion.div>
  )
}

function PriceRow({ developmentId, typology, focused }: { developmentId: string; typology: string; focused: boolean }) {
  const price = usePrice(developmentId, typology)
  const change = useLastPriceChange(developmentId, typology)
  const preview = useStore((s) => s.previewPrice)
  const [value, setValue] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const editing = value !== null

  useEffect(() => {
    if (focused) setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
  }, [focused])

  // Al abrir el editor, el precio actual queda seleccionado: escribir lo reemplaza
  useEffect(() => {
    if (!editing) return
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [editing])

  // Al confirmarse el cambio, la fila vuelve a mostrar el precio
  useEffect(() => setValue(null), [price])

  const n = Math.round(Number(value))
  const valid = value !== null && n > 0 && n !== price
  const submit = () => valid && preview({ developmentId, typology, to: n })

  return (
    <div ref={ref} className={cn('px-3.5 py-3 transition-colors duration-700', focused && 'bg-accent-soft')}>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
          <Building2 size={13} className="text-ink-3" /> {typology}
        </span>
        <div className="ml-auto text-right">
          <p className="font-serif text-[19px] leading-none whitespace-nowrap text-ink">
            <AnimatedNumber value={price} from={price} format={(x) => usd(Math.round(x))} duration={1.6} />
          </p>
          {change && (
            <p className="mt-1 flex items-center justify-end gap-1.5 text-[10.5px]">
              <span className="text-ink-3 line-through decoration-[#c0673f]/60">{usd(change.from)}</span>
              <DeltaBadge from={change.from} to={change.to} />
            </p>
          )}
        </div>
        <button
          onClick={() => setValue(value === null ? String(price) : null)}
          title="Cambiar precio"
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition',
            value === null ? 'text-ink-3 hover:bg-surface-2 hover:text-ink' : 'bg-surface-2 text-ink',
          )}
        >
          <Pencil size={14} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {value !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex items-center gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[11.5px] font-medium text-ink-3">USD</span>
                <input
                  ref={inputRef}
                  type="number"
                  min={0}
                  step={1000}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit()
                    if (e.key === 'Escape') setValue(null)
                  }}
                  className="h-10 w-full rounded-xl border border-line bg-surface-2/60 pr-3 pl-11 font-serif text-[17px] text-ink outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                />
              </label>
              <button
                disabled={!valid}
                onClick={submit}
                className="rounded-xl bg-accent-strong px-3.5 py-2.5 text-[12.5px] font-medium text-accent-ink shadow-soft transition hover:opacity-90 disabled:opacity-30 dark:bg-accent"
              >
                Ver impacto
              </button>
            </div>
            <p className="mt-1.5 flex h-4 items-center gap-1.5 text-[11px] text-ink-3">
              {valid ? (
                <>
                  <DeltaBadge from={price} to={n} /> respecto del precio vigente
                </>
              ) : (
                'Escribí el nuevo precio "desde" de esta tipología'
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────── Impacto de un cambio de precio */
const STATUS_LABEL = { activa: 'Activa', pausada: 'Pausada', finalizada: 'Finalizada' }

export function PriceImpactModal({ p }: { p: PendingPrice }) {
  const prices = useStore((s) => s.prices)
  const contacts = useStore((s) => s.contacts)
  const campaigns = useStore((s) => s.campaigns)
  const drafts = useStore((s) => s.drafts)
  const cancel = useStore((s) => s.cancelPrice)
  const confirm = useStore((s) => s.confirmPrice)
  const key = priceKey(p.developmentId, p.typology)
  const from = prices[key]
  const dev = devById(p.developmentId)
  const down = p.to < from

  const hit = useMemo(() => affectedBy(key, { campaigns, drafts, contacts }), [key, campaigns, drafts, contacts])
  const radar = useMemo(() => radarFor(p, from, contacts, prices, isStale), [p, from, contacts, prices])
  const [picked, setPicked] = useState(() => new Set(radar.filter((r) => r.checked).map((r) => r.contact.id)))
  const chosen = radar.filter((r) => picked.has(r.contact.id)).map((r) => r.contact.id)
  const toggle = (id: string) =>
    setPicked((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const total = hit.ads.length + hit.campaignDrafts.length + hit.replies.length + 2

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
        className="flex max-h-[calc(100vh-48px)] w-[620px] flex-col overflow-hidden rounded-[28px] border border-line bg-surface shadow-lift"
      >
        {/* Antes → nuevo */}
        <div className="shrink-0 px-7 pt-7">
          <div className="flex items-center gap-3.5">
            <DevImage id={p.developmentId} className="h-11 w-11 shrink-0 rounded-2xl" />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Cambio de precio</p>
              <h3 className="mt-0.5 font-serif text-[24px] leading-tight text-ink">
                {dev.name} · {p.typology}
              </h3>
            </div>
          </div>
          <div className="mt-5 flex items-end gap-4 rounded-2xl border border-line bg-surface-2/50 px-5 py-4">
            <div>
              <p className="text-[11px] text-ink-3">Antes</p>
              <p className="mt-1 font-serif text-[26px] leading-none whitespace-nowrap text-ink-3 line-through decoration-[#c0673f]/60 decoration-2">
                {usd(from)}
              </p>
            </div>
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="mb-1 text-ink-3">
              →
            </motion.span>
            <div>
              <p className={cn('text-[11px]', down ? 'text-accent' : 'text-[#b0603c]')}>Nuevo</p>
              <p className="mt-1 font-serif text-[40px] leading-[0.9] font-light tracking-tight whitespace-nowrap text-ink">{usd(p.to)}</p>
            </div>
            <DeltaBadge from={from} to={p.to} className="mb-1 ml-auto px-2 py-0.5 text-[12px]" />
          </div>
        </div>

        <div className="scroll-soft min-h-0 flex-1 overflow-y-auto px-7 pb-5">
          {/* Publicaciones afectadas */}
          <div className="mt-6">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Publicaciones afectadas</p>
              <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10.5px] font-semibold text-ink-2">{total}</span>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
              {hit.ads.map((c) => (
                <Affected
                  key={c.id}
                  icon={<Megaphone size={14} />}
                  color={CAMPAIGN_COLOR}
                  title={`Anuncio · Camp. ${c.name}`}
                  sub={`Instagram y Facebook · ${STATUS_LABEL[c.status]}`}
                />
              ))}
              <Affected
                icon={<Building2 size={14} />}
                color={CHANNELS.portal.color}
                title={`Avisos en ${LISTING_PORTALS.join(' y ')}`}
                sub={`${p.typology} · ${dev.name}`}
              />
              <Affected
                icon={<Globe size={14} />}
                color="#4E78A8"
                title={WEBSITE.name}
                sub={`${WEBSITE.host} · ${p.typology} · ${dev.name}`}
              />
              {hit.campaignDrafts.map((d) => (
                <Affected
                  key={d.id}
                  icon={<FileText size={14} />}
                  color="#8a7f6c"
                  title={`Borrador de campaña · ${campaignNameFor(d.template)}`}
                  sub={d.status === 'editado' ? 'Editado · falta aprobarlo' : 'Pendiente de aprobación'}
                />
              ))}
              {hit.replies.map((c) => (
                <Affected
                  key={c.id}
                  icon={<Avatar name={c.name} hue={c.hue} size={28} />}
                  title={`Borrador de respuesta · ${c.name}`}
                  sub={c.draftKind === 'retomar' ? 'Para retomar · todavía no se envió' : 'Bandeja · todavía no se envió'}
                />
              ))}
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
              Los mensajes ya enviados no cambian: quedan con el precio con el que salieron. La publicación en Meta, portales y el sitio web es simulada en el prototipo.
            </p>
          </div>

          {/* Radar */}
          {down ? (
            <Radar items={radar} picked={picked} toggle={toggle} />
          ) : (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2/50 p-3.5 text-[12px] leading-snug text-ink-2">
              <Info size={14} className="mt-px shrink-0 text-ink-3" />
              El radar busca oportunidades cuando un precio baja. Con una suba, los borradores y avisos toman el nuevo valor.
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-line px-7 py-4">
          <p className="text-[12px] text-ink-3">
            {chosen.length
              ? `Se ${chosen.length === 1 ? 'prepara 1 borrador' : `preparan ${chosen.length} borradores`} para retomar`
              : 'Solo se actualiza la lista de precios'}
          </p>
          <button onClick={cancel} className="ml-auto rounded-xl px-4 py-2.5 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2">
            Cancelar
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => confirm(chosen)}
            className="flex items-center gap-1.5 rounded-xl bg-accent-strong px-4 py-2.5 text-[13px] font-medium text-accent-ink shadow-[0_6px_16px_-6px_rgba(58,71,48,0.55)] transition hover:opacity-90 dark:bg-accent"
          >
            <Check size={15} strokeWidth={2.4} /> Confirmar cambio
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Affected({ icon, color, title, sub }: { icon: React.ReactNode; color?: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0">
      {color ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: color + '1c', color }}>
          {icon}
        </span>
      ) : (
        icon
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-medium text-ink">{title}</p>
        <p className="text-[11px] text-ink-3">{sub}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-accent">
        <Check size={12} strokeWidth={2.6} /> Se actualiza
      </span>
    </div>
  )
}

/** Lista del radar para elegir a quién retomar; la usan el cambio de precio y el de etapa */
export function Radar({
  items,
  picked,
  toggle,
  title = 'Radar de oportunidades',
  intro = 'Consultaron por esto y no compraron. Vos decidís a quién retomar: el asistente prepara un borrador para cada uno y',
}: {
  items: RadarItem[]
  picked: Set<string>
  toggle: (id: string) => void
  title?: string
  intro?: string
}) {
  const firstSimilar = items.findIndex((r) => r.similar)
  return (
    <div className="mt-6">
      <p className="flex items-center gap-1.5 text-[12.5px] font-semibold">
        <SparkleIcon size={14} /> <span className="ai-text">{title}</span>
      </p>
      <p className="mt-1 mb-3 text-[12px] leading-snug text-ink-2">
        {intro} <b className="font-semibold text-ink">nada se envía sin tu aprobación.</b>
      </p>
      {items.length ? (
        <div className="space-y-1.5">
          {items.map((r, i) => {
            const on = picked.has(r.contact.id)
            return (
              <div key={r.contact.id}>
                {i === firstSimilar && (
                  <p className="mt-3.5 mb-2 text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Algo similar, en otro desarrollo</p>
                )}
                <div
                  role="checkbox"
                  aria-checked={on}
                  tabIndex={0}
                  onClick={() => toggle(r.contact.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      toggle(r.contact.id)
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border bg-surface p-2.5 shadow-soft transition outline-none focus-visible:ring-4 focus-visible:ring-accent/15',
                    on ? 'border-accent/40' : 'border-line hover:border-line-strong',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition',
                      on ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong',
                    )}
                  >
                    {on && <Check size={12} strokeWidth={3} />}
                  </span>
                  <Avatar name={r.contact.name} hue={r.contact.hue} size={34} channel={r.contact.channel} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{r.contact.name}</p>
                    <p className={cn('truncate text-[11.5px]', r.alternative ? 'text-[#b0603c]' : 'text-ink-3')} title={r.reason}>
                      {r.reason}
                      {r.contact.draft && ' · reemplaza su borrador pendiente'}
                    </p>
                  </div>
                  <StagePill stage={r.contact.stage} />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-4 text-center text-[12px] text-ink-3">
          No encontramos contactos para retomar con este cambio.
        </p>
      )}
    </div>
  )
}
