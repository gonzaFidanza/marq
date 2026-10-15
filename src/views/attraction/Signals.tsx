import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, MessageSquareQuote, ShieldCheck, Tag, TrendingDown } from 'lucide-react'
import { isStale, useStore } from '../../store'
import type { Contact } from '../../types'
import { DEV_SIGNALS, PROFILES, PROFILE_SIGNALS, QUESTION_SIGNALS } from '../../data/attraction'
import { devById, stageById } from '../../data/config'
import { OPPORTUNITY_DROP, RADAR_KINDS, radarOpportunities, type RadarKind } from '../../data/pricing'
import { Avatar, Kbd, SparkleIcon } from '../../components/ui'
import { AnimatedNumber, DevImage, ProfileChip } from '../../components/attraction-ui'
import { cn, usd } from '../../lib/utils'

const card = 'rounded-[24px] border border-line bg-surface p-5 shadow-soft'
const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

export function Signals() {
  const focus = useStore((s) => s.signalFocus)

  useEffect(() => {
    if (focus) setTimeout(() => document.getElementById(focus)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 280)
  }, [focus])

  const devRows = [...DEV_SIGNALS].sort((a, b) => b.meetings - a.meetings)
  const maxInq = Math.max(...DEV_SIGNALS.map((d) => d.inquiries))
  const profiles = [...PROFILE_SIGNALS].sort((a, b) => b.meetings / b.inquiries - a.meetings / a.inquiries)

  return (
    <div className="scroll-soft h-full overflow-y-auto">
      <div className="mx-auto max-w-[1320px] px-7 pb-10">
        <motion.p {...fade(0)} className="flex items-center gap-1.5 text-[12px] text-ink-3">
          <SparkleIcon size={13} /> Analizado a partir de <b className="font-semibold text-ink-2">186 conversaciones</b> y{' '}
          <b className="font-semibold text-ink-2">64 tarjetas del tablero</b> · actualizado hace 12 min
        </motion.p>

        <motion.div {...fade(1)} className="relative mt-3 overflow-hidden rounded-[24px] border border-line bg-surface px-7 py-6 shadow-soft">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-accent-soft" />
          <div className="dot-grid pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-60" />
          <p className="relative max-w-[1000px] font-serif text-[26px] leading-snug font-light text-ink-3">
            Hasta ahora la pauta buscaba gente que <span className="text-ink-2">escriba</span>.{' '}
            <span className="text-ink">
              Ahora busca gente que <em className="text-accent">avanza</em>.
            </span>
          </p>
          <p className="relative mt-2 max-w-[760px] text-[13px] leading-relaxed text-ink-2">
            El agente lee la Bandeja y el Tablero para encontrar qué desarrollos, perfiles y mensajes terminan en una reunión. Con eso propone campañas. Vos decidís cuáles se publican.
          </p>
        </motion.div>

        <div className="mt-4 grid grid-cols-12 gap-4">
          {/* Desarrollos que llegan a reunión */}
          <motion.div
            {...fade(2)}
            id="sig-dev"
            key={focus === 'sig-dev' ? 'f' : 'n'}
            className={cn(card, 'col-span-12 xl:col-span-7', focus === 'sig-dev' && 'glow-new')}
          >
            <Title title="Desarrollos y tipologías que llegan a reunión" sub="Ordenado por reuniones conseguidas, no por cantidad de consultas" />
            <div className="mt-3 flex gap-4 text-[11.5px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-line-strong" /> Consultas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-accent" /> Llegan a reunión
              </span>
            </div>
            <div className="mt-3 space-y-1">
              {devRows.map((r, i) => {
                const dev = devById(r.developmentId)
                const rate = Math.round((r.meetings / r.inquiries) * 100)
                const warn = rate < 10
                return (
                  <div key={r.developmentId + r.typology} className={cn('group flex items-center gap-3.5 rounded-2xl px-2 py-2 transition', warn ? 'bg-[#c0673f]/[0.06]' : 'hover:bg-surface-2/60')}>
                    <span className="w-4 text-center font-serif text-[15px] text-ink-3">{i + 1}</span>
                    <DevImage id={r.developmentId} className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="w-[200px] shrink-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{dev.neighborhood}</p>
                      <p className="text-[11.5px] text-ink-3">{r.typology}</p>
                      {warn && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium text-[#b0603c]">
                          <AlertTriangle size={10} /> Muchas consultas, pocas reuniones
                        </p>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Bar pct={(r.inquiries / maxInq) * 100} value={r.inquiries} delay={0.25 + i * 0.07} muted />
                      <Bar pct={(r.meetings / maxInq) * 100} value={r.meetings} delay={0.35 + i * 0.07} />
                    </div>
                    <div className="w-[86px] shrink-0 text-right">
                      <p className={cn('font-serif text-[22px] leading-none', warn ? 'text-[#b0603c]' : 'text-ink')}>
                        <AnimatedNumber value={rate} />%
                      </p>
                      <p className="mt-0.5 text-[10px] whitespace-nowrap text-ink-3">llega a reunión</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <Insight template="urq-primera">
              <b className="font-semibold text-ink">Villa Urquiza 2 ambientes</b> es la 2ª en consultas pero la última en reuniones: solo 8 de cada 100 llegan a sentarse con el equipo.
            </Insight>
          </motion.div>

          {/* Perfiles que más avanzan */}
          <motion.div
            {...fade(3)}
            id="sig-profiles"
            key={focus === 'sig-profiles' ? 'pf' : 'pn'}
            className={cn(card, 'col-span-12 flex flex-col xl:col-span-5', focus === 'sig-profiles' && 'glow-new')}
          >
            <Title title="Perfiles que más avanzan" sub="Tasa de avance consulta → reunión" />
            <div className="mt-5 space-y-4">
              {profiles.map((p, i) => {
                const rate = Math.round((p.meetings / p.inquiries) * 100)
                const pr = PROFILES[p.profile]
                return (
                  <div key={p.profile}>
                    <div className="flex items-end justify-between">
                      <div>
                        <ProfileChip value={p.profile} />
                        <p className="mt-1 text-[11.5px] text-ink-3">
                          {p.meetings} de {p.inquiries} consultas llegaron a reunión
                        </p>
                      </div>
                      <p className="font-serif text-[30px] leading-none font-light text-ink">
                        <AnimatedNumber value={rate} />
                        <span className="text-[16px]">%</span>
                      </p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${pr.color}88, ${pr.color})` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${rate}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-auto">
              <Insight template="bel-conocido">
                Clientes conocidos y recomendados avanzan más que nadie, y hoy <b className="font-semibold text-ink">casi no reciben pauta</b>.
              </Insight>
            </div>
          </motion.div>
        </div>

        {/* Preguntas por perfil */}
        <motion.div {...fade(4)} className="mt-7 mb-3 flex items-end justify-between">
          <Title title="Preguntas que más se repiten por perfil" sub="Si el anuncio las responde de entrada, la primera conversación arranca más adelante" />
          <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
            <MessageSquareQuote size={13} /> % de las consultas de ese perfil que la incluyen
          </span>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {QUESTION_SIGNALS.map((s, i) => {
            const pr = PROFILES[s.profile]
            return (
              <motion.div
                {...fade(5 + i)}
                key={s.id + (focus === s.id ? 'f' : '')}
                id={s.id}
                className={cn(card, 'flex flex-col', focus === s.id && 'glow-new')}
              >
                <div>
                  <ProfileChip value={s.profile} />
                </div>
                <div className="mt-4 space-y-3.5">
                  {s.questions.map((q, k) => (
                    <div key={q.q}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[12.5px] leading-snug text-ink">“{q.q}”</p>
                        <span className="font-serif text-[18px] leading-none text-ink">
                          <AnimatedNumber value={q.pct} />
                          <span className="text-[11px]">%</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: pr.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${q.pct}%` }}
                          transition={{ duration: 0.9, delay: 0.4 + i * 0.08 + k * 0.06 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-5">
                  <ProposeButton template={s.template} full />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Radar de oportunidades */}
        <motion.div {...fade(9)} id="sig-radar" className="mt-7 mb-3 flex items-end justify-between">
          <Title title="Radar de oportunidades" sub="Contactos que vuelven a estar en juego si baja el precio de lo que consultaron" />
          <span className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
            <Tag size={13} /> Medido con una baja de {Math.abs(OPPORTUNITY_DROP * 100)}% sobre la lista de precios vigente
          </span>
        </motion.div>
        <div className="grid grid-cols-12 gap-4">
          <RadarOpportunities />
          <RadarRetakes />
        </div>
      </div>
    </div>
  )
}

function RadarOpportunities() {
  const contacts = useStore((s) => s.contacts)
  const prices = useStore((s) => s.prices)
  const radarLog = useStore((s) => s.radarLog)
  const preview = useStore((s) => s.previewPrice)
  const rows = useMemo(
    () => radarOpportunities(contacts, prices, isStale, new Set(radarLog.map((r) => r.contactId))),
    [contacts, prices, radarLog],
  )
  const total = rows.reduce((a, r) => a + r.items.length, 0)

  return (
    <motion.div {...fade(10)} className={cn(card, 'col-span-12 flex flex-col xl:col-span-7')}>
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold">
          <SparkleIcon size={14} /> <span className="ai-text">Oportunidades por tipología</span>
        </p>
        <span className="text-[11.5px] text-ink-3">
          {total} {total === 1 ? 'contacto' : 'contactos'} en {rows.length} {rows.length === 1 ? 'tipología' : 'tipologías'}
        </span>
      </div>
      {rows.length ? (
        <div className="mt-3 space-y-1">
          {rows.map((o) => {
            const dev = devById(o.developmentId)
            const kinds = Object.entries(
              o.items.reduce<Record<string, number>>((a, r) => ({ ...a, [r.kind]: (a[r.kind] ?? 0) + 1 }), {}),
            ) as [RadarKind, number][]
            return (
              <div key={o.developmentId + o.typology} className="flex items-center gap-3.5 rounded-2xl px-2 py-2 transition hover:bg-surface-2/60">
                <DevImage id={o.developmentId} className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="w-[176px] shrink-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{dev.neighborhood}</p>
                  <p className="text-[11.5px] whitespace-nowrap text-ink-3">
                    {o.typology} · {usd(o.from)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    {o.items.slice(0, 4).map((r, k) => (
                      <Avatar key={r.contact.id} name={r.contact.name} hue={r.contact.hue} size={24} ring className={k ? '-ml-1.5' : ''} />
                    ))}
                    <span className="ml-2 text-[12px] font-medium text-ink">
                      {o.items.length} {o.items.length === 1 ? 'contacto' : 'contactos'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {kinds.map(([k, n]) => (
                      <span
                        key={k}
                        className={cn(
                          'rounded-full px-1.5 py-px text-[10.5px] font-medium whitespace-nowrap',
                          k === 'presupuesto' ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-ink-2',
                        )}
                      >
                        {RADAR_KINDS[k]}
                        {n > 1 && ` · ${n}`}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => preview({ developmentId: o.developmentId, typology: o.typology, to: o.to })}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink shadow-soft transition hover:border-line-strong hover:bg-surface-2"
                >
                  <TrendingDown size={13} className="text-accent" /> Simular baja
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-line p-4 text-center text-[12px] text-ink-3">
          No hay contactos en juego por ahora.
        </p>
      )}
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 p-3.5 pl-4 text-[12.5px] leading-snug text-ink-2">
          <ShieldCheck size={16} className="shrink-0 text-accent" />
          <p>
            El radar no envía nada: al simular una baja ves el impacto y <b className="font-semibold text-ink">elegís a quién retomar</b>.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/** En qué quedó cada contacto que retomó el radar */
function retakeStatus(c: Contact, at: number): { step: number; label: string; color?: string; className?: string } {
  if (['reunion', 'realizada', 'propuesta', 'reserva'].includes(c.stage) && c.stageSince > at) {
    const s = stageById(c.stage)
    return { step: 3, label: s.short, color: s.color }
  }
  if (c.messages.some((m) => m.from === 'contact' && m.at > at)) return { step: 2, label: 'Respondió', className: 'bg-accent-soft text-accent' }
  if (c.messages.some((m) => m.from === 'agent' && m.at > at)) return { step: 1, label: 'Mensaje enviado', className: 'bg-surface-3 text-ink-2' }
  if (c.draft) return { step: 0, label: 'Borrador para aprobar', color: stageById('pendiente').color }
  return { step: 0, label: 'Sin enviar', className: 'bg-surface-3 text-ink-3' }
}

function RadarRetakes() {
  const log = useStore((s) => s.radarLog)
  const contacts = useStore((s) => s.contacts)
  const history = useStore((s) => s.priceHistory)
  const select = useStore((s) => s.select)
  const rows = log.flatMap((r) => {
    const c = contacts.find((x) => x.id === r.contactId)
    const ch = history.find((h) => h.id === r.changeId)
    return c && ch ? [{ r, c, ch, st: retakeStatus(c, r.at) }] : []
  })
  const replied = rows.filter((x) => x.st.step >= 2).length
  const meetings = rows.filter((x) => x.st.step >= 3).length

  return (
    <motion.div {...fade(11)} className={cn(card, 'col-span-12 flex flex-col xl:col-span-5')}>
      <Title title="Retomados por el radar" sub="Qué pasó con cada contacto después del cambio de precio" />
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          { label: 'Retomados', value: rows.length },
          { label: 'Respondieron', value: replied },
          { label: 'Reuniones', value: meetings },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-surface-2/60 p-3">
            <p className="text-[11px] text-ink-3">{k.label}</p>
            <p className="mt-1.5 font-serif text-[24px] leading-none text-ink">
              <AnimatedNumber value={k.value} />
            </p>
          </div>
        ))}
      </div>
      {rows.length ? (
        <div className="mt-4 space-y-1.5">
          {rows.map(({ r, c, ch, st }) => (
            <button
              key={r.id}
              onClick={() => select(c.id)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-2.5 text-left shadow-soft transition hover:border-line-strong hover:shadow-card"
            >
              <Avatar name={c.name} hue={c.hue} size={34} channel={c.channel} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{c.name}</p>
                <p className="truncate text-[11px] text-ink-3">
                  {devById(ch.developmentId).neighborhood} · {ch.typology} · {usd(ch.from)} → {usd(ch.to)}
                </p>
              </div>
              <span
                className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', st.className)}
                style={st.color ? { background: st.color + '1c', color: st.color } : undefined}
              >
                {st.label}
              </span>
              <ArrowRight size={14} className="shrink-0 text-ink-3 transition group-hover:translate-x-0.5 group-hover:text-ink" />
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-[12.5px] text-ink-2">Todavía no retomaste a nadie con el radar.</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
            Simulá una baja con <Kbd className="border-line! bg-surface-2! text-ink-2">P</Kbd> o desde una tipología.
          </p>
        </div>
      )}
    </motion.div>
  )
}

function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <p className="font-serif text-[18px] text-ink">{title}</p>
      <p className="mt-0.5 text-[12px] text-ink-3">{sub}</p>
    </div>
  )
}

function Bar({ pct, value, delay, muted }: { pct: number; value: number; delay: number; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-[9px] flex-1">
        <motion.div
          className={cn('absolute inset-y-0 left-0 rounded-r-[3px] rounded-l-[2px]', muted ? 'bg-line-strong' : 'bg-accent')}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 1.5)}%` }}
          transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className={cn('w-7 text-right text-[11.5px] tabular-nums', muted ? 'text-ink-3' : 'font-semibold text-ink')}>{value}</span>
    </div>
  )
}

function Insight({ children, template }: { children: React.ReactNode; template: string }) {
  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-surface-2/60 p-3.5 pl-4">
      <SparkleIcon size={16} className="shrink-0" />
      <p className="flex-1 text-[12.5px] leading-snug text-ink-2">{children}</p>
      <ProposeButton template={template} />
    </div>
  )
}

function ProposeButton({ template, full }: { template: string; full?: boolean }) {
  const generate = useStore((s) => s.generateCampaign)
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => generate(template)}
      className={cn(
        'flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent-strong px-3.5 py-2 text-[12.5px] font-medium text-accent-ink shadow-[0_6px_16px_-6px_rgba(58,71,48,0.55)] transition hover:opacity-90 dark:bg-accent',
        full && 'w-full',
      )}
    >
      ✨ Proponer campaña con esta señal
    </motion.button>
  )
}
