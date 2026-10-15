import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlarmClock, ArrowRight, ArrowUpRight, CalendarClock, FileText, Inbox, Megaphone, Moon, Radar, ShieldCheck } from 'lucide-react'
import { isStale, needsReply, useStore, type TodayTab } from '../store'
import type { CampaignDraft, Contact, PriceChange } from '../types'
import { TEAM, devById } from '../data/config'
import { CAMPAIGN_COLOR, campaignNameFor } from '../data/attraction'
import { radarOpportunities } from '../data/pricing'
import { Avatar, ClassChip, SparkleIcon, StagePill, TeamAvatar } from '../components/ui'
import { AnimatedNumber } from '../components/attraction-ui'
import { ars, cn, daysIn, firstName, isOutOfHours, usd } from '../lib/utils'

const card = 'rounded-[24px] border border-line bg-surface p-5 shadow-soft'
const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

type Tab = TodayTab

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

type Approval =
  | { kind: 'reunion'; id: string; contact: Contact }
  | { kind: 'radar'; id: string; contact: Contact; change: PriceChange }
  | { kind: 'campana'; id: string; draft: CampaignDraft }

export function Today() {
  const contacts = useStore((s) => s.contacts)
  const drafts = useStore((s) => s.drafts)
  const radarLog = useStore((s) => s.radarLog)
  const priceHistory = useStore((s) => s.priceHistory)

  const toReply = useMemo(() => contacts.filter(needsReply).sort((a, b) => waitingSince(a) - waitingSince(b)), [contacts])
  const followUps = useMemo(() => contacts.filter(isStale).sort((a, b) => a.stageSince - b.stageSince), [contacts])
  const approvals = useMemo(() => {
    const out: Approval[] = []
    contacts
      .filter((c) => c.meeting && ['pendiente', 'respondida', 'conversacion'].includes(c.stage))
      .forEach((c) => out.push({ kind: 'reunion', id: 'm-' + c.id, contact: c }))
    // Borradores que preparó el radar a partir de un cambio de precio
    const seen = new Set<string>()
    radarLog.forEach((r) => {
      const c = contacts.find((x) => x.id === r.contactId)
      const change = priceHistory.find((p) => p.id === r.changeId)
      if (!c || !change || seen.has(c.id) || !c.draft || c.draftKind !== 'retomar') return
      seen.add(c.id)
      out.push({ kind: 'radar', id: 'r-' + c.id, contact: c, change })
    })
    drafts
      .filter((d) => d.status === 'pendiente' || d.status === 'editado')
      .forEach((d) => out.push({ kind: 'campana', id: 'c-' + d.id, draft: d }))
    return out
  }, [contacts, drafts, radarLog, priceHistory])

  // Se recuerda al volver a Hoy; la primera vez abre el primer contador con casos
  const saved = useStore((s) => s.todayTab)
  const tab: Tab = saved ?? (toReply.length ? 'responder' : followUps.length ? 'seguimiento' : 'confirmar')
  const setTab = (todayTab: Tab) => useStore.setState({ todayTab })

  const outOfHours = toReply.filter((c) => isOutOfHours(waitingSince(c))).length
  const hot = followUps.filter((c) => daysIn(c.stageSince) >= 8).length
  const byKind = (k: Approval['kind']) => approvals.filter((a) => a.kind === k).length
  const total = toReply.length + followUps.length + approvals.length

  const counters: { id: Tab; label: string; value: number; icon: typeof Inbox; color: string; hint: string }[] = [
    {
      id: 'responder',
      label: 'Consultas por responder',
      value: toReply.length,
      icon: Inbox,
      color: '#C08A3E',
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
      hint: followUps.length
        ? hot
          ? `${plural(hot, 'contacto', 'contactos')} con riesgo alto de enfriarse`
          : 'Buen momento para retomar'
        : 'Nadie quedó sin novedades',
    },
    {
      id: 'confirmar',
      label: 'Cambios por confirmar',
      value: approvals.length,
      icon: ShieldCheck,
      color: '#5d6d45',
      hint: approvals.length
        ? [
            byKind('reunion') && plural(byKind('reunion'), 'reunión detectada', 'reuniones detectadas'),
            byKind('radar') && plural(byKind('radar'), 'contacto para retomar', 'contactos para retomar'),
            byKind('campana') && plural(byKind('campana'), 'campaña', 'campañas'),
          ]
            .filter(Boolean)
            .join(' · ')
        : 'No hay nada esperando tu aprobación',
    },
  ]

  return (
    <div className="scroll-soft h-full overflow-y-auto">
      <div className="mx-auto max-w-[1320px] px-7 pt-6 pb-10">
        <motion.div {...fade(0)}>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{longDate()}</p>
          <h2 className="mt-1.5 font-serif text-[34px] leading-tight font-light text-ink">
            {greeting()}, {firstName(TEAM.candelaria.name)}
          </h2>
          <p className="mt-1 text-[13px] text-ink-2">
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

        {/* Contadores */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          {counters.map((k, i) => {
            const on = tab === k.id
            return (
              <motion.button
                {...fade(1 + i)}
                key={k.id}
                onClick={() => setTab(k.id)}
                className={cn(
                  card,
                  'relative overflow-hidden text-left transition-[border-color,box-shadow]',
                  on ? 'border-accent/40 ring-4 ring-accent/10' : 'hover:border-line-strong hover:shadow-card',
                )}
              >
                <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(135deg, transparent 55%, ${k.color}14)` }} />
                <div className="relative flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: k.color + '1c', color: k.color }}>
                    <k.icon size={17} />
                  </span>
                  <p className="text-[13px] font-medium text-ink-2">{k.label}</p>
                  <span className={cn('ml-auto flex items-center gap-1 text-[11.5px] font-medium transition', on ? 'text-accent' : 'text-ink-3')}>
                    {on ? 'Viendo' : 'Ver casos'} <ArrowRight size={12} className={cn('transition', on && 'rotate-90')} />
                  </span>
                </div>
                <p className="relative mt-4 font-serif text-[64px] leading-[0.9] font-light tracking-tight text-ink">
                  <AnimatedNumber value={k.value} />
                </p>
                <p className="relative mt-3 truncate text-[12px] text-ink-3">{k.hint}</p>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          {/* Casos del contador elegido */}
          <motion.div {...fade(4)} className={cn(card, 'col-span-12 flex flex-col xl:col-span-8')}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                {tab === 'responder' && <ReplyCases items={toReply} />}
                {tab === 'seguimiento' && <FollowUpCases items={followUps} />}
                {tab === 'confirmar' && <ApprovalCases items={approvals} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="col-span-12 space-y-4 xl:col-span-4">
            <UpcomingMeetings />
            <AssistantWork outOfHours={outOfHours} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────── Casos */
const MAX = 6

function CasesHeader({ title, sub, link }: { title: string; sub: string; link?: { label: string; onClick: () => void } }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <p className="font-serif text-[18px] text-ink">{title}</p>
        <p className="mt-0.5 text-[12px] text-ink-3">{sub}</p>
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
      className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition hover:bg-surface-2/60"
    >
      {children}
    </motion.div>
  )
}

function Action({ onClick, children, tone = 'accent' }: { onClick: () => void; children: React.ReactNode; tone?: 'accent' | 'meeting' | 'ghost' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-medium transition',
        tone === 'accent' && 'bg-accent-strong text-accent-ink shadow-soft hover:opacity-90 dark:bg-accent',
        tone === 'meeting' && 'bg-[#7a64a3] text-white shadow-soft hover:bg-[#6c5794]',
        tone === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
      )}
    >
      {children}
      {tone !== 'ghost' && <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />}
    </button>
  )
}

function More({ n }: { n: number }) {
  return n > 0 ? <p className="px-2.5 pt-2 text-[11.5px] text-ink-3">y {plural(n, 'caso más', 'casos más')}</p> : null
}

function Empty() {
  return (
    <div className="flex flex-col items-center py-10 text-center text-ink-3">
      <ShieldCheck size={26} strokeWidth={1.5} />
      <p className="mt-3 text-[13px]">No hay casos acá</p>
      <p className="text-[12px]">Todo al día ✨</p>
    </div>
  )
}

const DraftChip = ({ c }: { c: Contact }) =>
  c.draft && !c.analyzing ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-1.5 py-px text-[10.5px] font-medium whitespace-nowrap text-ink-2">
      ✨ {c.draftKind === 'retomar' ? 'Para retomar' : 'Borrador listo'}
    </span>
  ) : null

function ReplyCases({ items }: { items: Contact[] }) {
  const select = useStore((s) => s.select)
  const open = () => useStore.setState({ filter: 'sin_responder', view: 'inbox', drawerId: null, campaignDrawerId: null })
  return (
    <>
      <CasesHeader
        title="Consultas por responder"
        sub="Ordenadas por tiempo de espera. Las marcadas con ✨ ya tienen un borrador listo para revisar."
        link={{ label: 'Ver en la Bandeja', onClick: open }}
      />
      {items.length ? (
        <div>
          <AnimatePresence initial={false}>
            {items.slice(0, MAX).map((c, i) => {
              const since = waitingSince(c)
              const last = c.messages[c.messages.length - 1]
              return (
                <CaseRow key={c.id} delay={0.03 * i}>
                  <Avatar name={c.name} hue={c.hue} size={38} channel={c.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{c.name}</p>
                      <ClassChip value={c.classification} size="xs" analyzing={c.analyzing} />
                      <DraftChip c={c} />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-ink-3">{last?.text}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-[11.5px] font-medium text-ink-2">{ago(since)}</span>
                    {isOutOfHours(since) && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-3 px-1.5 py-px text-[9.5px] font-medium text-ink-2">
                        <Moon size={9} /> Fuera de horario
                      </span>
                    )}
                  </div>
                  <Action onClick={() => select(c.id)}>Responder</Action>
                </CaseRow>
              )
            })}
          </AnimatePresence>
          <More n={items.length - MAX} />
        </div>
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
        sub="Contactos que llevan días sin novedades. El asistente ya preparó cómo retomarlos."
        link={{ label: 'Ver en el tablero', onClick: () => setView('board') }}
      />
      {items.length ? (
        <div>
          <AnimatePresence initial={false}>
            {items.slice(0, MAX).map((c, i) => {
              const d = daysIn(c.stageSince)
              return (
                <CaseRow key={c.id} delay={0.03 * i}>
                  <Avatar name={c.name} hue={c.hue} size={38} channel={c.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-semibold text-ink">{c.name}</p>
                      <DraftChip c={c} />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: d >= 8 ? '#c0573f' : '#b27f2f' }}>
                      <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />
                      {c.stage === 'pendiente' ? `Sin responder hace ${d} días` : `Sin novedades hace ${d} días`}
                      <span className="font-normal text-ink-3">· {devById(c.developmentId).neighborhood}</span>
                    </p>
                  </div>
                  <StagePill stage={c.stage} />
                  <Action onClick={() => openFromReminder(c.id)}>Retomar</Action>
                </CaseRow>
              )
            })}
          </AnimatePresence>
          <More n={items.length - MAX} />
        </div>
      ) : (
        <Empty />
      )}
    </>
  )
}

function ApprovalCases({ items }: { items: Approval[] }) {
  const select = useStore((s) => s.select)
  const confirmMeeting = useStore((s) => s.confirmMeeting)
  const openDraft = (id: string) =>
    useStore.setState({ view: 'attraction', attractionTab: 'borradores', selectedDraftId: id, drawerId: null, campaignDrawerId: null, metaUnseen: 0 })

  return (
    <>
      <CasesHeader title="Cambios por confirmar" sub="Lo que el asistente preparó y espera tu decisión: reuniones, contactos para retomar y campañas." />
      {items.length ? (
        <div>
          <AnimatePresence initial={false}>
            {items.slice(0, MAX).map((a, i) => (
              <CaseRow key={a.id} delay={0.03 * i}>
                {a.kind === 'reunion' && a.contact.meeting && (
                  <>
                    <Tile color="#8a74b0">
                      <CalendarClock size={17} />
                    </Tile>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">
                        <b className="font-semibold">Reunión detectada</b> · {a.contact.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-3">
                        {a.contact.meeting.label} · {a.contact.meeting.detail} · ¿Mover a Reunión programada?
                      </p>
                    </div>
                    <Action tone="ghost" onClick={() => select(a.contact.id)}>
                      Ver chat
                    </Action>
                    <Action tone="meeting" onClick={() => confirmMeeting(a.contact.id)}>
                      Confirmar
                    </Action>
                  </>
                )}
                {a.kind === 'radar' && (
                  <>
                    <Avatar name={a.contact.name} hue={a.contact.hue} size={38} channel={a.contact.channel} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-[13px] text-ink">
                        <SparkleIcon size={12} /> <b className="font-semibold">Para retomar</b> · {a.contact.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-3">
                        Bajó {a.change.typology} en {devById(a.change.developmentId).neighborhood} · {usd(a.change.from)} → {usd(a.change.to)}
                      </p>
                    </div>
                    <Action onClick={() => select(a.contact.id)}>Revisar</Action>
                  </>
                )}
                {a.kind === 'campana' && (
                  <>
                    <Tile color={CAMPAIGN_COLOR}>
                      <Megaphone size={17} />
                    </Tile>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-ink">
                        <b className="font-semibold">Borrador de campaña</b> · {campaignNameFor(a.draft.template)}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-3">
                        {devById(a.draft.developmentId).neighborhood} · {a.draft.typology} · {ars(a.draft.budget)} por {a.draft.days} días
                        {a.draft.status === 'editado' && ' · editado'}
                      </p>
                    </div>
                    <Action onClick={() => openDraft(a.draft.id)}>Revisar</Action>
                  </>
                )}
              </CaseRow>
            ))}
          </AnimatePresence>
          <More n={items.length - MAX} />
        </div>
      ) : (
        <Empty />
      )}
    </>
  )
}

function Tile({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl" style={{ background: color + '1c', color }}>
      {children}
    </span>
  )
}

/* ───────── Columna derecha */
function UpcomingMeetings() {
  const contacts = useStore((s) => s.contacts)
  const select = useStore((s) => s.select)
  const items = contacts.flatMap((c) => {
    const h = c.stage === 'reunion' ? c.history.find((x) => x.kind === 'reunion') : undefined
    return h ? [{ c, h }] : []
  })

  return (
    <motion.div {...fade(5)} className={card}>
      <p className="font-serif text-[18px] text-ink">Próximas reuniones</p>
      <p className="mt-0.5 text-[12px] text-ink-3">Las que ya están en Reunión programada</p>
      {items.length ? (
        <div className="mt-3 space-y-1">
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
        </div>
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-line p-4 text-center text-[12px] text-ink-3">No hay reuniones agendadas.</p>
      )}
    </motion.div>
  )
}

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
    <motion.div {...fade(6)} className={card}>
      <div className="flex items-center gap-2">
        <SparkleIcon size={16} />
        <p className="ai-text text-[14px] font-semibold">Mientras no estabas</p>
      </div>
      <p className="mt-1 text-[12px] text-ink-3">Lo que el asistente dejó listo, detrás de escena</p>
      <div className="mt-3 space-y-1">
        <WorkRow icon={Moon} label="Consultas fuera de horario capturadas" value={outOfHours} />
        <WorkRow icon={FileText} label="Borradores listos para revisar" value={drafts} />
        <button onClick={() => focusSignal('sig-radar')} className="group w-full rounded-xl text-left transition hover:bg-surface-2/60">
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
    <div className="flex items-center gap-3 rounded-xl px-1 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
        <Icon size={15} />
      </span>
      <span className="flex-1 text-[12.5px] text-ink-2">{label}</span>
      <span className="font-serif text-[20px] text-ink">
        <AnimatedNumber value={value} />
      </span>
    </div>
  )
}
