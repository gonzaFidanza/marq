import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarCheck, CalendarClock, ChevronRight, CircleCheck, Inbox, PartyPopper, Pause, SquareKanban, X } from 'lucide-react'
import { Area, ComposedChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../../store'
import type { Campaign, CampaignStatus, ConversionEvent } from '../../types'
import { cpi, cpm, dailySeries } from '../../data/attraction'
import { devById, stageById } from '../../data/config'
import { Avatar, ClassChip, StagePill } from '../../components/ui'
import { AnimatedNumber, DevImage, ProfileChip } from '../../components/attraction-ui'
import { ars, cn, relTime } from '../../lib/utils'

const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

const fmtArs = (n: number) => Math.round(n).toLocaleString('es-AR')
const recentDrop = (c: Campaign) => !!c.droppedAt && c.prevCpm != null && Date.now() - c.droppedAt < 90_000

export function Campaigns() {
  const campaigns = useStore((s) => s.campaigns)
  const order: Record<CampaignStatus, number> = { activa: 0, pausada: 1, finalizada: 2 }
  const list = [...campaigns].sort((a, b) => order[a.status] - order[b.status])
  const live = campaigns.filter((c) => c.status !== 'finalizada')
  const spent = live.reduce((a, c) => a + c.spent, 0)
  const meetings = live.reduce((a, c) => a + c.meetingsScheduled, 0)
  const sent = campaigns.reduce((a, c) => a + c.conversions.filter((x) => x.event !== 'Reserva').length, 0)

  return (
    <div className="scroll-soft h-full overflow-y-auto">
      <div className="mx-auto max-w-[1320px] px-7 pb-10">
        <div className="grid grid-cols-4 gap-4">
          <Stat i={0} label="Inversión en campañas vigentes" value={spent} prefix="ARS" />
          <Stat i={1} label="Reuniones programadas desde pauta" value={meetings} />
          <Stat i={2} label="Costo promedio por reunión" value={meetings ? spent / meetings : 0} prefix="ARS" accent />
          <Stat i={3} label="Conversiones enviadas a Meta" value={sent} badge="Simulado" />
        </div>

        <motion.div {...fade(4)} className="mt-7 mb-3 flex items-end justify-between">
          <div>
            <p className="font-serif text-[18px] text-ink">Campañas</p>
            <p className="mt-0.5 text-[12px] text-ink-3">El número grande es lo que cuesta cada reunión programada, no cada consulta</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <AnimatePresence initial={false}>
            {list.map((c, i) => (
              <CampaignCard key={c.id} c={c} i={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Stat({ i, label, value, prefix, accent, badge }: { i: number; label: string; value: number; prefix?: string; accent?: boolean; badge?: string }) {
  return (
    <motion.div {...fade(i)} className={cn('relative overflow-hidden rounded-[24px] border border-line bg-surface p-5 shadow-soft')}>
      {accent && <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent-soft" />}
      <p className="relative flex items-center gap-2 text-[12px] font-medium text-ink-2">
        {label}
        {badge && <span className="rounded-full bg-surface-3 px-1.5 py-px text-[9.5px] font-semibold tracking-wide text-ink-3 uppercase">{badge}</span>}
      </p>
      <p className="relative mt-3 font-serif text-[34px] leading-none font-light tracking-tight text-ink">
        {prefix && <span className="mr-1.5 text-[16px] text-ink-3">{prefix}</span>}
        <AnimatedNumber value={value} format={fmtArs} />
      </p>
    </motion.div>
  )
}

export function StatusBadge({ status, className }: { status: CampaignStatus; className?: string }) {
  if (status === 'activa')
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-[#2f6b45] backdrop-blur', className)}>
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#4caf6e] text-[#4caf6e]" /> Activa
      </span>
    )
  if (status === 'pausada')
    return (
      <span className={cn('inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold text-[#9a6a22] backdrop-blur', className)}>
        <Pause size={10} strokeWidth={3} /> Pausada
      </span>
    )
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10.5px] font-semibold text-[#635e56] backdrop-blur', className)}>
      <CircleCheck size={10} strokeWidth={2.6} /> Finalizada
    </span>
  )
}

const FUNNEL_STEPS = [
  { key: 'inquiries', label: 'Consultas', color: stageById('pendiente').color },
  { key: 'meetingsScheduled', label: 'Reun. prog.', color: stageById('reunion').color },
  { key: 'meetingsDone', label: 'Realizadas', color: stageById('realizada').color },
  { key: 'reservations', label: 'Reservas', color: stageById('reserva').color },
] as const

function MiniFunnel({ c }: { c: Campaign }) {
  const base = Math.max(c.inquiries, 1)
  return (
    <div className="flex items-stretch gap-1">
      {FUNNEL_STEPS.map((s, i) => (
        <div key={s.key} className="flex flex-1 items-center gap-1">
          <div className="min-w-0 flex-1 rounded-xl bg-surface-2/70 px-2 py-1.5">
            <p className="text-[14px] leading-none font-semibold text-ink tabular-nums">
              <AnimatedNumber value={c[s.key]} />
            </p>
            <p className="mt-1 truncate text-[9.5px] text-ink-3">{s.label}</p>
            <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className="h-full rounded-full"
                style={{ background: s.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, (c[s.key] / base) * 100)}%` }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.08 }}
              />
            </div>
          </div>
          {i < FUNNEL_STEPS.length - 1 && <ChevronRight size={12} className="shrink-0 text-ink-3/60" />}
        </div>
      ))}
    </div>
  )
}

function CampaignCard({ c, i }: { c: Campaign; i: number }) {
  const open = useStore((s) => s.openCampaign)
  const dev = devById(c.developmentId)
  const value = cpm(c)
  const drop = recentDrop(c)
  const elapsed = Math.min(c.days, Math.max(0, Math.round((Date.now() - c.startedAt) / 86_400_000)))

  return (
    <motion.button
      layout
      {...fade(5 + i)}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => open(c.id)}
      className={cn(
        'group overflow-hidden rounded-[24px] border border-line bg-surface text-left shadow-soft transition-shadow duration-300 hover:shadow-card',
        c.fresh && 'glow-new',
        c.status === 'finalizada' && 'opacity-80',
      )}
    >
      <DevImage id={c.developmentId} className="h-[118px]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent transition duration-500 group-hover:from-black/55" />
        <StatusBadge status={c.status} className="absolute top-3 left-3" />
        {c.fresh && (
          <span className="absolute top-3 right-3 rounded-full bg-accent px-2 py-0.5 text-[10.5px] font-semibold text-accent-ink">Nueva</span>
        )}
        <div className="absolute right-4 bottom-3 left-4 text-white">
          <p className="font-serif text-[20px] leading-tight">MARQ · {dev.neighborhood}</p>
          <p className="text-[11.5px] opacity-85">Camp. {c.name}</p>
        </div>
      </DevImage>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <ProfileChip value={c.profile} size="xs" />
          <span className="text-[11.5px] text-ink-3">{c.typology}</span>
          <span className="ml-auto text-[11.5px] text-ink-2">
            Invertido <b className="font-semibold text-ink">{ars(c.spent)}</b>
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium text-ink-3">Costo por reunión programada</p>
            <p className="mt-1 font-serif text-[36px] leading-none font-light tracking-tight text-ink">
              {value ? (
                <>
                  <span className="mr-1 text-[16px] text-ink-3">ARS</span>
                  <AnimatedNumber value={value} from={drop ? c.prevCpm : 0} format={fmtArs} duration={drop ? 2.2 : 1.3} />
                </>
              ) : (
                <span className="text-[22px] text-ink-3">Aún sin reuniones</span>
              )}
            </p>
          </div>
          <div className="text-right">
            {drop && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-1 inline-flex items-center gap-0.5 rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent"
              >
                <ArrowDownRight size={11} /> bajó {ars((c.prevCpm ?? 0) - value)}
              </motion.span>
            )}
            <p className="text-[11px] text-ink-3">{c.inquiries ? `${ars(cpi(c))} por consulta` : 'Recién publicada'}</p>
          </div>
        </div>

        <div className="mt-4">
          <MiniFunnel c={c} />
        </div>

        <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-accent/70"
              initial={{ width: 0 }}
              animate={{ width: `${(c.spent / c.budget) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
          <span className="text-[11px] text-ink-3">
            {c.status === 'finalizada' ? `${c.days} días` : `Día ${elapsed} de ${c.days}`} · {Math.round((c.spent / c.budget) * 100)}% del presupuesto
          </span>
        </div>
      </div>
    </motion.button>
  )
}

/* ───────────────────────── Drawer */

const EVENT_STYLE: Record<ConversionEvent, { color: string; icon: typeof Inbox }> = {
  'Reunión programada': { color: stageById('reunion').color, icon: CalendarClock },
  'Reunión realizada': { color: stageById('realizada').color, icon: CalendarCheck },
  Reserva: { color: stageById('reserva').color, icon: PartyPopper },
}

export function CampaignDrawer({ id }: { id: string }) {
  const c = useStore((s) => s.campaigns.find((x) => x.id === id))
  const contacts = useStore((s) => s.contacts)
  const dark = useStore((s) => s.dark)
  const close = () => useStore.getState().openCampaign(null)
  const showOnBoard = useStore((s) => s.showOnBoard)
  if (!c) return null
  const dev = devById(c.developmentId)
  const attributed = contacts.filter((x) => x.campaignId === c.id)
  const series = dailySeries(c)
  const axis = dark ? '#736d63' : '#9a948a'
  const grid = dark ? '#2d2a25' : '#ece7df'
  const value = cpm(c)
  const drop = recentDrop(c)

  const filterBoard = () => {
    useStore.setState({ boardOrigin: 'camp:' + c.id, view: 'board', campaignDrawerId: null })
  }

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
        className="fixed top-3 right-3 bottom-3 z-[61] flex w-[540px] flex-col overflow-hidden rounded-[28px] border border-line bg-[var(--glass)] shadow-lift backdrop-blur-2xl"
      >
        <DevImage id={c.developmentId} className="h-[150px] shrink-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/20" />
          <button onClick={close} className="absolute top-3.5 right-3.5 rounded-full bg-black/30 p-1.5 text-white backdrop-blur transition hover:bg-black/50">
            <X size={16} />
          </button>
          <StatusBadge status={c.status} className="absolute top-4 left-5" />
          <div className="absolute right-6 bottom-4 left-6 text-white">
            <p className="font-serif text-[26px] leading-tight">MARQ · {dev.neighborhood}</p>
            <p className="text-[12px] opacity-85">
              Camp. {c.name} · {c.typology}
            </p>
          </div>
        </DevImage>

        <div className="scroll-soft flex-1 overflow-y-auto px-6 pt-5 pb-6">
          <div className="flex items-center gap-2">
            <ProfileChip value={c.profile} />
            <span className="text-[12px] text-ink-3">
              {ars(c.spent)} de {ars(c.budget)} · {c.days} días
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <div className="col-span-1 rounded-2xl border border-line bg-surface p-3.5 shadow-soft">
              <p className="text-[11px] text-ink-3">Costo por reunión</p>
              <p className="mt-1.5 font-serif text-[22px] leading-none whitespace-nowrap text-ink">
                {value ? <AnimatedNumber value={value} from={drop ? c.prevCpm : 0} format={(n) => ars(n)} duration={drop ? 2.2 : 1.2} /> : '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-soft">
              <p className="text-[11px] text-ink-3">Reuniones</p>
              <p className="mt-1.5 font-serif text-[24px] leading-none text-ink">
                <AnimatedNumber value={c.meetingsScheduled} />
                <span className="ml-1 font-sans text-[11px] text-ink-3">· {c.meetingsDone} realizadas</span>
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-soft">
              <p className="text-[11px] text-ink-3">Consulta → reunión</p>
              <p className="mt-1.5 font-serif text-[24px] leading-none text-ink">
                {c.inquiries ? Math.round((c.meetingsScheduled / c.inquiries) * 100) : 0}%
              </p>
            </div>
          </div>

          <Section title="Evolución diaria">
            <div className="flex gap-4 text-[11px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-line-strong" /> Consultas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px]" style={{ background: stageById('reunion').color }} /> Reuniones programadas
              </span>
            </div>
            <div className="mt-2 h-[170px] rounded-2xl border border-line bg-surface p-2 pt-3 shadow-soft">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={axis} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={axis} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={grid} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: axis }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis yAxisId="i" tick={{ fontSize: 10, fill: axis }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="m" orientation="right" hide domain={[0, 'dataMax + 2']} />
                  <Tooltip
                    cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-float">
                          <p className="text-ink-3">{label}</p>
                          {payload.map((p) => (
                            <p key={String(p.dataKey)} className="text-ink-2">
                              {p.dataKey === 'consultas' ? 'Consultas' : 'Reuniones'}: <b className="text-ink">{p.value}</b>
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  <Area yAxisId="i" type="monotone" dataKey="consultas" stroke={axis} strokeWidth={1.5} fill="url(#cFill)" animationDuration={1000} />
                  <Bar yAxisId="m" dataKey="reuniones" fill={stageById('reunion').color} radius={[3, 3, 0, 0]} barSize={8} animationDuration={1000} animationBegin={300} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section
            title="Contactos atribuidos"
            right={
              <button onClick={filterBoard} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium text-accent transition hover:bg-accent-soft">
                <SquareKanban size={12} /> Ver en el tablero
              </button>
            }
          >
            {attributed.length ? (
              <div className="space-y-1.5">
                {attributed.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => showOnBoard(x.id)}
                    className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-left shadow-soft transition hover:border-line-strong hover:shadow-card"
                  >
                    <Avatar name={x.name} hue={x.hue} size={34} channel={x.channel} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{x.name}</p>
                      <div className="mt-0.5">
                        <ClassChip value={x.classification} size="xs" />
                      </div>
                    </div>
                    <StagePill stage={x.stage} />
                    <ArrowRight size={14} className="text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-line p-4 text-center text-[12px] text-ink-3">Todavía no llegaron consultas desde esta campaña.</p>
            )}
            {c.inquiries > attributed.length && (
              <p className="mt-2 text-[11.5px] text-ink-3">
                + {c.inquiries - attributed.length} consultas anteriores atribuidas a esta campaña
              </p>
            )}
          </Section>

          <Section
            title="Registro de conversiones enviadas a Meta"
            right={<span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-3 uppercase">Simulado</span>}
          >
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
              <AnimatePresence initial={false}>
                {c.conversions.map((v) => {
                  const st = EVENT_STYLE[v.event]
                  return (
                    <motion.div
                      key={v.id}
                      layout
                      initial={{ opacity: 0, height: 0, backgroundColor: 'rgba(138,116,176,0.18)' }}
                      animate={{ opacity: 1, height: 'auto', backgroundColor: 'rgba(138,116,176,0)' }}
                      transition={{ duration: 0.6, backgroundColor: { duration: 2.5 } }}
                      className="border-b border-line last:border-b-0"
                    >
                      <div className="flex items-center gap-3 px-3.5 py-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: st.color + '1c', color: st.color }}>
                          <st.icon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] text-ink">
                            <b className="font-semibold">{v.event}</b> · {v.name}
                          </p>
                          <p className="text-[11px] text-ink-3">{relTime(v.at)}</p>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-medium text-accent">
                          <ArrowUpRight size={12} /> Enviada
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {c.conversions.length === 0 && <p className="p-4 text-center text-[12px] text-ink-3">Sin conversiones todavía.</p>}
            </div>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">
              Al informar reuniones (y no solo mensajes), la plataforma aprende a buscar gente que avanza. Integración real vía Conversions API de Meta, a confirmar en etapa posterior.
            </p>
          </Section>
        </div>
      </motion.aside>
    </>
  )
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{title}</p>
        {right}
      </div>
      {children}
    </div>
  )
}
