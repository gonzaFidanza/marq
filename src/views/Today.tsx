import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlarmClock, ArrowRight, ArrowUpRight, ChevronDown, FileText, Inbox, Moon, Radar, ShieldCheck } from 'lucide-react'
import { isStale, needsReply, useStore, type TodayTab } from '../store'
import type { Contact } from '../types'
import { STAGES, TEAM, devById } from '../data/config'
import { CAMPAIGN_COLOR, cpm } from '../data/attraction'
import { radarOpportunities } from '../data/pricing'
import { Avatar, ClassChip, SparkleIcon, StagePill, TeamAvatar } from '../components/ui'
import { AnimatedNumber, DevImage } from '../components/attraction-ui'
import { ars, cn, daysIn, firstName, isOutOfHours } from '../lib/utils'

const card = 'rounded-[24px] border border-line bg-surface shadow-soft'
const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

/** Desde cuándo espera: el primero de los mensajes del contacto que siguen sin respuesta */
function waitingSince(c: Contact) {
  let i = c.messages.length - 1
  while (i > 0 && c.messages[i - 1].from === 'contact') i--
  return c.messages[i]?.at ?? 0
}

function ago(t: number) {
  const m = Math.max(1, Math.floor((Date.now() - t) / 60_000))
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`
}

const greeting = (h = new Date().getHours()) => (h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches')

function longDate(d = new Date()) {
  const s = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return s[0].toUpperCase() + s.slice(1)
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Pantalla fija: el inicio entra entero en la ventana y nunca scrollea.
 * Las listas que no entran scrollean dentro de su card.
 */
export function Today() {
  const contacts = useStore((s) => s.contacts)

  // Primero la que más tiempo lleva esperando
  const toReply = useMemo(() => contacts.filter(needsReply).sort((a, b) => waitingSince(a) - waitingSince(b)), [contacts])
  const followUps = useMemo(() => contacts.filter(isStale).sort((a, b) => a.stageSince - b.stageSince), [contacts])

  // Se recuerda al volver a Hoy; la primera vez abre el primer contador con casos
  const saved = useStore((s) => s.todayTab)
  const tab: TodayTab = saved ?? (toReply.length || !followUps.length ? 'responder' : 'seguimiento')
  const setTab = (todayTab: TodayTab) => useStore.setState({ todayTab })

  const outOfHours = toReply.filter((c) => isOutOfHours(waitingSince(c))).length
  const hot = followUps.filter((c) => daysIn(c.stageSince) >= 8).length
  const total = toReply.length + followUps.length

  const counters: { id: TodayTab; label: string; value: number; icon: typeof Inbox; color: string; hint: string; people: Contact[] }[] = [
    {
      id: 'responder',
      label: 'Consultas por responder',
      value: toReply.length,
      icon: Inbox,
      color: '#C08A3E',
      people: toReply,
      hint: toReply.length
        ? `La más antigua espera ${ago(waitingSince(toReply[0]))}${outOfHours ? ` · ${plural(outOfHours, 'llegó', 'llegaron')} fuera de horario` : ''}`
        : 'Todas las consultas tienen respuesta',
    },
    {
      id: 'seguimiento',
      label: 'Seguimientos pendientes',
      value: followUps.length,
      icon: AlarmClock,
      color: '#c0673f',
      people: followUps,
      hint: followUps.length
        ? hot
          ? `${plural(hot, 'contacto', 'contactos')} con riesgo alto de enfriarse`
          : 'Buen momento para retomar'
        : 'Nadie quedó sin novedades',
    },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto px-7 pt-5 pb-5 lg:overflow-hidden 2xl:px-10">
      <motion.div {...fade(0)} className="shrink-0">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{longDate()}</p>
        <h2 className="mt-1 font-serif text-[30px] leading-tight font-light text-ink 2xl:text-[34px]">
          {greeting()}, {firstName(TEAM.candelaria.name)}
        </h2>
        <p className="mt-0.5 text-[13px] text-ink-2">
          {total ? (
            <>
              El asistente ordenó tu día: <b className="font-semibold text-ink">{plural(total, 'cosa necesita', 'cosas necesitan')} tu atención</b>.
            </>
          ) : (
            'Todo al día. El asistente sigue trabajando detrás de escena.'
          )}{' '}
          Nada se envía ni se publica sin tu aprobación.
        </p>
      </motion.div>

      {/* Contadores y lo que dejó listo el asistente */}
      <div className="mt-4 grid shrink-0 grid-cols-3 gap-4">
        {counters.map((k, i) => {
          const on = tab === k.id
          return (
            <motion.button
              {...fade(1 + i)}
              key={k.id}
              onClick={() => setTab(k.id)}
              className={cn(
                card,
                'relative overflow-hidden p-4 text-left transition-[border-color,box-shadow]',
                on ? 'border-accent/40 ring-4 ring-accent/10' : 'hover:border-line-strong hover:shadow-card',
              )}
            >
              <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(135deg, transparent 55%, ${k.color}14)` }} />
              <div className="relative flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: k.color + '1c', color: k.color }}>
                  <k.icon size={16} />
                </span>
                <p className="text-[13px] font-medium text-ink-2">{k.label}</p>
                <span className={cn('ml-auto flex items-center gap-1 text-[11.5px] font-medium transition', on ? 'text-accent' : 'text-ink-3')}>
                  {on ? 'Viendo' : 'Ver casos'} <ArrowRight size={12} className={cn('transition', on && 'rotate-90')} />
                </span>
              </div>
              <div className="relative mt-3 flex items-end justify-between gap-4">
                <p className="font-serif text-[50px] leading-[0.9] font-light tracking-tight text-ink 2xl:text-[58px]">
                  <AnimatedNumber value={k.value} />
                </p>
                <Faces people={k.people} />
              </div>
              <p className="relative mt-2 truncate text-[12px] text-ink-3">{k.hint}</p>
            </motion.button>
          )
        })}
        <AssistantWork outOfHours={outOfHours} />
      </div>

      {/* Casos, agenda y negocio: ocupan el alto que queda */}
      <div className="mt-4 grid grid-cols-12 gap-4 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)]">
        <motion.div {...fade(4)} className={cn(card, 'col-span-12 flex min-h-[420px] flex-col p-5 lg:col-span-5 lg:min-h-0 2xl:col-span-6')}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {tab === 'responder' ? <ReplyCases items={toReply} /> : <FollowUpCases items={followUps} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <UpcomingMeetings />

        <div className="col-span-12 flex flex-col gap-4 lg:col-span-4 lg:min-h-0 2xl:col-span-3">
          <Pipeline />
          <ActiveCampaigns />
        </div>
      </div>
    </div>
  )
}

/** Caras de los casos de un contador, para leerlo de un vistazo */
function Faces({ people }: { people: Contact[] }) {
  const shown = people.slice(0, 4)
  const rest = people.length - shown.length
  if (!shown.length) return null
  return (
    <div className="mb-0.5 flex shrink-0 items-center">
      {shown.map((c, i) => (
        <Avatar key={c.id} name={c.name} hue={c.hue} size={28} ring className={i ? '-ml-2' : ''} />
      ))}
      {rest > 0 && (
        <span className="-ml-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-surface-3 px-1.5 text-[10.5px] font-semibold text-ink-2 ring-2 ring-surface">
          +{rest}
        </span>
      )}
    </div>
  )
}

/** Lista que scrollea dentro de su card, con "Ver más" mientras quede contenido abajo */
function ScrollList({ children, className }: { children: React.ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const check = useCallback(() => {
    const el = box.current
    if (el) setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 6)
  }, [])

  useEffect(() => {
    check()
    const ro = new ResizeObserver(check)
    if (box.current) ro.observe(box.current)
    if (content.current) ro.observe(content.current)
    return () => ro.disconnect()
  }, [check])

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={box} onScroll={check} className="scroll-soft h-full overflow-y-auto">
        <div ref={content} className={className}>
          {children}
        </div>
      </div>
      <AnimatePresence>
        {more && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/80 to-transparent"
          >
            <button
              onClick={() => box.current?.scrollBy({ top: box.current.clientHeight * 0.7, behavior: 'smooth' })}
              className="pointer-events-auto flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1 text-[11.5px] font-medium text-ink-2 shadow-soft transition hover:border-line-strong hover:text-ink"
            >
              Ver más <ChevronDown size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────── Casos */
function CasesHeader({ title, sub, link }: { title: string; sub: string; link?: { label: string; onClick: () => void } }) {
  return (
    <div className="mb-2 flex shrink-0 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-serif text-[18px] text-ink">{title}</p>
        <p className="mt-0.5 truncate text-[12px] text-ink-3">{sub}</p>
      </div>
      {link && (
        <button
          onClick={link.onClick}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-accent transition hover:bg-accent-soft"
        >
          {link.label} <ArrowUpRight size={12} />
        </button>
      )}
    </div>
  )
}

function CaseRow({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-surface-2/60"
    >
      {children}
    </motion.div>
  )
}

function Action({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="group flex shrink-0 items-center gap-1 rounded-xl bg-accent-strong px-3 py-1.5 text-[12px] font-medium text-accent-ink shadow-soft transition hover:opacity-90 dark:bg-accent"
    >
      {children}
      <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
    </button>
  )
}

function Empty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center text-ink-3">
      <ShieldCheck size={26} strokeWidth={1.5} />
      <p className="mt-3 text-[13px]">No hay casos acá</p>
      <p className="text-[12px]">Todo al día ✨</p>
    </div>
  )
}

/** En pantallas medianas queda solo el ✨ para que el nombre no se corte */
const DraftChip = ({ c }: { c: Contact }) => {
  if (!c.draft || c.analyzing) return null
  const label = c.draftKind === 'retomar' ? 'Para retomar' : 'Borrador listo'
  return (
    <span
      title={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-1.5 py-px text-[10.5px] font-medium whitespace-nowrap text-ink-2"
    >
      ✨<span className="hidden 2xl:inline">{label}</span>
    </span>
  )
}

function ReplyCases({ items }: { items: Contact[] }) {
  const select = useStore((s) => s.select)
  const open = () => useStore.setState({ filter: 'sin_responder', view: 'inbox', drawerId: null, campaignDrawerId: null })
  return (
    <>
      <CasesHeader
        title="Consultas por responder"
        sub="Primero la que más tiempo lleva esperando. Las marcadas con ✨ ya tienen borrador."
        link={{ label: 'Ver en la Bandeja', onClick: open }}
      />
      {items.length ? (
        <ScrollList>
          <AnimatePresence initial={false}>
            {items.map((c, i) => {
              const since = waitingSince(c)
              const last = c.messages[c.messages.length - 1]
              return (
                <CaseRow key={c.id} delay={0.03 * Math.min(i, 8)}>
                  <Avatar name={c.name} hue={c.hue} size={36} channel={c.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-[13px] font-semibold text-ink">{c.name}</p>
                      <span className="hidden shrink-0 2xl:inline-flex">
                        <ClassChip value={c.classification} size="xs" analyzing={c.analyzing} />
                      </span>
                      <DraftChip c={c} />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-ink-3">{last?.text}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-[11.5px] font-medium whitespace-nowrap text-ink-2">{ago(since)}</span>
                    {isOutOfHours(since) && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-3 px-1.5 py-px text-[9.5px] font-medium whitespace-nowrap text-ink-2">
                        <Moon size={9} /> Fuera de horario
                      </span>
                    )}
                  </div>
                  <Action onClick={() => select(c.id)}>Responder</Action>
                </CaseRow>
              )
            })}
          </AnimatePresence>
        </ScrollList>
      ) : (
        <Empty />
      )}
    </>
  )
}

function FollowUpCases({ items }: { items: Contact[] }) {
  const openFromReminder = useStore((s) => s.openFromReminder)
  const setView = useStore((s) => s.setView)
  return (
    <>
      <CasesHeader
        title="Seguimientos pendientes"
        sub="Primero el que más días lleva sin novedades. El asistente ya preparó cómo retomarlos."
        link={{ label: 'Ver en el tablero', onClick: () => setView('board') }}
      />
      {items.length ? (
        <ScrollList>
          <AnimatePresence initial={false}>
            {items.map((c, i) => {
              const d = daysIn(c.stageSince)
              return (
                <CaseRow key={c.id} delay={0.03 * Math.min(i, 8)}>
                  <Avatar name={c.name} hue={c.hue} size={36} channel={c.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-[13px] font-semibold text-ink">{c.name}</p>
                      <DraftChip c={c} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] font-medium" style={{ color: d >= 8 ? '#c0573f' : '#b27f2f' }}>
                      <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'currentColor' }} />
                      {c.stage === 'pendiente' ? `Sin responder hace ${d} días` : `Sin novedades hace ${d} días`}
                      <span className="font-normal text-ink-3">· {devById(c.developmentId).neighborhood}</span>
                    </p>
                  </div>
                  <span className="hidden shrink-0 2xl:inline-flex">
                    <StagePill stage={c.stage} />
                  </span>
                  <Action onClick={() => openFromReminder(c.id)}>Retomar</Action>
                </CaseRow>
              )
            })}
          </AnimatePresence>
        </ScrollList>
      ) : (
        <Empty />
      )}
    </>
  )
}

/* ───────── Agenda */
function UpcomingMeetings() {
  const contacts = useStore((s) => s.contacts)
  const select = useStore((s) => s.select)
  const items = contacts.flatMap((c) => {
    const h = c.stage === 'reunion' ? c.history.find((x) => x.kind === 'reunion') : undefined
    return h ? [{ c, h }] : []
  })

  return (
    <motion.div {...fade(5)} className={cn(card, 'col-span-12 flex min-h-[300px] flex-col p-5 lg:col-span-3 lg:min-h-0')}>
      <div className="shrink-0">
        <p className="font-serif text-[18px] text-ink">Próximas reuniones</p>
        <p className="mt-0.5 text-[12px] text-ink-3">
          {items.length ? plural(items.length, 'reunión programada', 'reuniones programadas') : 'Las que pasan a Reunión programada'}
        </p>
      </div>
      {items.length ? (
        <ScrollList className="mt-3 space-y-1">
          {items.map(({ c, h }) => {
            const [day, ...rest] = h.date.split(' ')
            return (
              <button
                key={c.id}
                onClick={() => select(c.id)}
                className="group flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-surface-2/60"
              >
                <span className="flex w-[54px] shrink-0 flex-col items-center rounded-xl bg-[#8a74b0]/12 py-1.5 text-[#8a74b0]">
                  <span className="text-[10.5px] font-semibold">{day}</span>
                  <span className="font-serif text-[15px] leading-tight">{rest.join(' ')}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{c.name}</p>
                  <p className="truncate text-[11.5px] text-ink-3">{[h.title, h.detail].filter(Boolean).join(' · ')}</p>
                </div>
                <TeamAvatar id={c.assignee} size={22} />
              </button>
            )
          })}
        </ScrollList>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-line p-4 text-center text-[12px] text-ink-3">No hay reuniones agendadas.</p>
      )}
    </motion.div>
  )
}

/** Lo que el asistente dejó listo: va en la fila de los contadores */
function AssistantWork({ outOfHours }: { outOfHours: number }) {
  const contacts = useStore((s) => s.contacts)
  const prices = useStore((s) => s.prices)
  const radarLog = useStore((s) => s.radarLog)
  const focusSignal = useStore((s) => s.focusSignal)
  const drafts = contacts.filter((c) => c.draft && !c.analyzing).length
  const opportunities = useMemo(
    () => radarOpportunities(contacts, prices, isStale, new Set(radarLog.map((r) => r.contactId))).reduce((a, o) => a + o.items.length, 0),
    [contacts, prices, radarLog],
  )

  return (
    <motion.div {...fade(3)} className={cn(card, 'flex flex-col justify-between p-4')}>
      <div className="flex items-center gap-2">
        <SparkleIcon size={15} />
        <p className="ai-text text-[13px] font-semibold">Mientras no estabas</p>
        <span className="ml-auto text-[11px] text-ink-3">Detrás de escena</span>
      </div>
      <div className="mt-1.5">
        <WorkRow icon={Moon} label="Consultas fuera de horario capturadas" value={outOfHours} />
        <WorkRow icon={FileText} label="Borradores listos para revisar" value={drafts} />
        <button onClick={() => focusSignal('sig-radar')} className="group w-full rounded-lg text-left transition hover:bg-surface-2/60">
          <WorkRow
            icon={Radar}
            label={
              <span className="flex items-center gap-1">
                Oportunidades en el radar <ArrowUpRight size={12} className="text-ink-3 transition group-hover:text-accent" />
              </span>
            }
            value={opportunities}
          />
        </button>
      </div>
    </motion.div>
  )
}

function WorkRow({ icon: Icon, label, value }: { icon: typeof Inbox; label: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-2.5 px-1 py-[3px]">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-2 text-ink-2">
        <Icon size={13} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{label}</span>
      <span className="font-serif text-[17px] leading-none text-ink">
        <AnimatedNumber value={value} />
      </span>
    </div>
  )
}

/* ───────── Negocio */
function Pipeline() {
  const contacts = useStore((s) => s.contacts)
  const setView = useStore((s) => s.setView)
  const rows = STAGES.map((s) => ({ s, n: contacts.filter((c) => c.stage === s.id).length }))
  const live = rows.filter((r) => r.s.id !== 'descartada')
  const total = live.reduce((a, r) => a + r.n, 0)

  return (
    <motion.div {...fade(6)} className={cn(card, 'shrink-0 p-4')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-[16px] text-ink">Tu embudo hoy</p>
          <p className="text-[11.5px] text-ink-3">{plural(total, 'contacto activo', 'contactos activos')} en el tablero</p>
        </div>
        <button
          onClick={() => setView('board')}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-accent transition hover:bg-accent-soft"
        >
          Ver tablero <ArrowUpRight size={12} />
        </button>
      </div>
      <div className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-surface-3">
        {live.map((r, i) =>
          r.n ? (
            <motion.span
              key={r.s.id}
              title={`${r.s.label}: ${r.n}`}
              className="h-full border-r-2 border-surface last:border-r-0"
              style={{ background: r.s.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(r.n / Math.max(1, total)) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-1">
        {rows.map((r) => (
          <button key={r.s.id} onClick={() => setView('board')} className="flex items-center gap-2 text-left text-[11.5px] text-ink-2 transition hover:text-ink">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.s.color }} />
            <span className="truncate">{r.s.short}</span>
            <span className="ml-auto font-serif text-[14px] text-ink">
              <AnimatedNumber value={r.n} />
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function ActiveCampaigns() {
  const campaigns = useStore((s) => s.campaigns)
  const openCampaign = useStore((s) => s.openCampaign)
  const active = useMemo(() => campaigns.filter((c) => c.status === 'activa'), [campaigns])
  const open = () => useStore.setState({ view: 'attraction', attractionTab: 'campanas', metaUnseen: 0 })

  return (
    <motion.div {...fade(7)} className={cn(card, 'flex min-h-[220px] flex-col p-4 lg:min-h-0 lg:flex-1')}>
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <p className="font-serif text-[16px] text-ink">Campañas activas</p>
          <p className="text-[11.5px] text-ink-3">Lo que cuesta cada reunión programada</p>
        </div>
        <button
          onClick={open}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-accent transition hover:bg-accent-soft"
        >
          Ver Atracción <ArrowUpRight size={12} />
        </button>
      </div>
      {active.length ? (
        <ScrollList className="mt-2">
          {active.map((c, i) => {
            const value = cpm(c)
            const spent = Math.min(100, Math.round((c.spent / c.budget) * 100))
            return (
              <button
                key={c.id}
                onClick={() => openCampaign(c.id)}
                className="group flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition hover:bg-surface-2/60"
              >
                <DevImage id={c.developmentId} className="h-9 w-9 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{c.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: CAMPAIGN_COLOR }}
                        initial={{ width: 0 }}
                        animate={{ width: `${spent}%` }}
                        transition={{ duration: 0.9, delay: 0.3 + i * 0.06 }}
                      />
                    </div>
                    <span className="shrink-0 text-[10.5px] text-ink-3">{spent}% invertido</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-serif text-[15px] leading-none whitespace-nowrap text-ink">{value ? ars(value) : '—'}</p>
                  <p className="mt-1 text-[10px] text-ink-3">{value ? 'por reunión' : 'sin reuniones aún'}</p>
                </div>
              </button>
            )
          })}
        </ScrollList>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-line p-4 text-center text-[12px] text-ink-3">No hay campañas activas.</p>
      )}
    </motion.div>
  )
}
