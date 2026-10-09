import { motion } from 'framer-motion'
import { ArrowDownRight, ShieldCheck } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store'
import { DRAFT_BASELINE, DRAFT_DISCARD_REASONS, ORIGINS, PROFILES, cpi, cpm } from '../data/attraction'
import { devById } from '../data/config'
import { SparkleIcon } from '../components/ui'
import { ars, cn } from '../lib/utils'
import type { Origin, Profile } from '../types'
import { ChartTitle, Counter, Kpi, card, fade } from './Metrics'

/** Proporción consulta → reunión por campaña y por perfil del contacto (mock) */
const HEAT: Record<string, Partial<Record<Profile, number>>> = {
  'c-col-1v': { primera: 31, inversor: 14, conocido: 40, recomendado: 33 },
  'c-urq-amp': { primera: 6, inversor: 3, conocido: 18, recomendado: 12 },
  'c-nun-inv': { primera: 20, inversor: 34, conocido: 38, recomendado: 25 },
  'c-bel-ult': { primera: 9, inversor: 7, conocido: 22, recomendado: 15 },
  'c-col-inv': { primera: 22, inversor: 11, conocido: 30, recomendado: 25 },
}
const HEAT_COLS: Profile[] = ['primera', 'inversor', 'conocido', 'recomendado']

const WEEKS = ['4 ago', '11 ago', '18 ago', '25 ago', '1 sep', '8 sep', '15 sep', '22 sep']
const ORIGIN_KEYS: Exclude<Origin, 'cliente'>[] = ['campana', 'recomendacion', 'organico', 'portal']
const BY_ORIGIN = WEEKS.map((w, i) => ({
  week: w,
  campana: [41, 44, 47, 45, 40, 37, 35, 34][i],
  recomendacion: [12, 11, 13, 14, 13, 15, 16, 17][i],
  organico: [24, 26, 25, 27, 29, 28, 31, 33][i],
  portal: [18, 16, 20, 19, 21, 18, 22, 20][i],
}))
const originLabel = (k: string) => (k === 'campana' ? 'Pauta' : k === 'portal' ? 'Portales' : ORIGINS[k as Origin].label)

export function AttractionMetrics() {
  const dark = useStore((s) => s.dark)
  const campaigns = useStore((s) => s.campaigns)
  const ds = useStore((s) => s.draftStats)
  const axis = dark ? '#736d63' : '#9a948a'
  const grid = dark ? '#2d2a25' : '#ece7df'

  const measured = campaigns.filter((c) => c.meetingsScheduled > 0 && c.inquiries > 0)
  const spent = measured.reduce((a, c) => a + c.spent, 0)
  const meetings = measured.reduce((a, c) => a + c.meetingsScheduled, 0)
  const inquiries = measured.reduce((a, c) => a + c.inquiries, 0)
  const sent = campaigns.reduce((a, c) => a + c.conversions.filter((x) => x.event !== 'Reserva').length, 0)
  const byCpm = [...measured].sort((a, b) => cpm(a) - cpm(b))
  const maxCpm = Math.max(...measured.map(cpm))
  const maxCpi = Math.max(...measured.map(cpi))
  const cheapestInquiry = [...measured].sort((a, b) => cpi(a) - cpi(b))[0]
  const best = byCpm[0]

  const approved = DRAFT_BASELINE.approved + ds.approved
  const edited = DRAFT_BASELINE.edited + ds.edited
  const discarded = DRAFT_BASELINE.discarded + ds.discarded
  const totalDrafts = approved + edited + discarded
  const reasons = [...DRAFT_DISCARD_REASONS, ...Object.keys(ds.reasons).filter((r) => !DRAFT_DISCARD_REASONS.includes(r))]
    .map((r) => ({ r, n: (DRAFT_BASELINE.reasons[r] ?? 0) + (ds.reasons[r] ?? 0) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
  const maxReason = Math.max(1, ...reasons.map((x) => x.n))

  const originTotals = ORIGIN_KEYS.map((k) => ({ k, v: BY_ORIGIN.reduce((a, w) => a + w[k], 0) }))
  const originSum = originTotals.reduce((a, o) => a + o.v, 0)

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-12 gap-4">
        <motion.div {...fade(0)} className={cn(card, 'relative col-span-4 overflow-hidden')}>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent-soft" />
          <span className="pointer-events-none absolute -right-2 -bottom-12 font-serif text-[150px] leading-none font-light text-accent opacity-[0.06]">$</span>
          <p className="relative text-[12.5px] font-medium text-ink-2">Costo promedio por reunión programada</p>
          <p className="relative mt-4 font-serif text-[58px] leading-[0.9] font-light tracking-tight text-ink">
            <span className="mr-2 text-[22px] text-ink-3">ARS</span>
            <Counter to={meetings ? spent / meetings : 0} />
          </p>
          <p className="relative mt-4 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent">
            <ArrowDownRight size={13} /> Mejor campaña: {best?.name} · {best ? ars(cpm(best)) : ''}
          </p>
        </motion.div>
        <Kpi i={1} label="Consultas de pauta que llegan a reunión" value={inquiries ? Math.round((meetings / inquiries) * 100) : 0} suffix="%" note="Antes se medía por clics" />
        <Kpi i={2} label="Reuniones programadas desde pauta" value={meetings} note={`${measured.length} campañas medidas`} />
        <Kpi i={3} label="Conversiones informadas a Meta" value={sent} note="Simulado en el prototipo" />
        <Kpi i={4} label="Borradores de campaña aprobados" value={Math.round(((approved + edited) / totalDrafts) * 100)} suffix="%" note={`${approved + edited} de ${totalDrafts}`} />
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Costo por reunión vs costo por consulta */}
        <motion.div {...fade(5)} className={cn(card, 'col-span-7')}>
          <ChartTitle title="Costo por reunión programada, por campaña" sub="Ordenado de la más eficiente a la menos eficiente · al lado, el costo por consulta" />
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_150px] gap-x-6 border-b border-line pb-2 text-[10.5px] font-semibold tracking-[0.1em] text-ink-3 uppercase">
            <span className="pl-[188px]">Por reunión</span>
            <span>Por consulta</span>
          </div>
          <div className="mt-2 space-y-1">
            {byCpm.map((c, i) => {
              const v = cpm(c)
              const q = cpi(c)
              const isBest = c.id === best.id
              const isCheapInq = c.id === cheapestInquiry.id
              return (
                <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_150px] items-center gap-x-6 rounded-xl py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-[176px] shrink-0">
                      <p className="truncate text-[12.5px] font-semibold text-ink">{c.name}</p>
                      <p className="text-[11px] text-ink-3">
                        {devById(c.developmentId).neighborhood} · <span style={{ color: PROFILES[c.profile].color }}>{PROFILES[c.profile].label}</span>
                      </p>
                    </div>
                    <div className="relative h-8 flex-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(v / maxCpm) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className={cn('absolute inset-y-0 left-0 rounded-r-[5px]', isBest ? 'bg-accent' : 'bg-accent/45')}
                      />
                      <span className={cn('absolute inset-y-0 left-2.5 flex items-center text-[12px] font-semibold', isBest ? 'text-accent-ink' : 'text-ink')}>
                        {ars(v)}
                      </span>
                      {isBest && (
                        <span className="absolute inset-y-0 right-0 flex items-center">
                          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent">La más barata por reunión</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className={cn('font-medium', isCheapInq ? 'text-[#b0603c]' : 'text-ink-2')}>{ars(q)}</span>
                      {isCheapInq && <span className="text-[10px] font-semibold text-[#b0603c]">la más barata</span>}
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: isCheapInq ? '#c0673f' : 'var(--line-strong)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(q / maxCpi) * 100}%` }}
                        transition={{ duration: 0.9, delay: 0.5 + i * 0.08 }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2/60 p-3.5">
            <SparkleIcon size={15} className="mt-px shrink-0" />
            <p className="text-[12.5px] leading-snug text-ink-2">
              <b className="font-semibold text-ink">{cheapestInquiry.name}</b> es la más barata por consulta ({ars(cpi(cheapestInquiry))}) pero la más cara por reunión (
              {ars(cpm(cheapestInquiry))}). Medida por consultas parecía la mejor campaña.
            </p>
          </div>
        </motion.div>

        {/* Heatmap */}
        <motion.div {...fade(6)} className={cn(card, 'col-span-5')}>
          <ChartTitle title="Consultas que llegan a reunión" sub="Por campaña y por perfil del contacto" />
          <div className="mt-5">
            <div className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] gap-1.5 text-[10.5px] text-ink-3">
              <span />
              {HEAT_COLS.map((p) => (
                <span key={p} className="truncate text-center font-medium" style={{ color: PROFILES[p].color }}>
                  {p === 'primera' ? '1ª vivienda' : p === 'recomendado' ? 'Recomend.' : p === 'conocido' ? 'Cliente' : PROFILES[p].label}
                </span>
              ))}
              <span className="text-center font-semibold text-ink-2">Total</span>
            </div>
            <div className="mt-1.5 space-y-1.5">
              {campaigns
                .filter((c) => c.inquiries > 0)
                .map((c, i) => {
                  const total = Math.round((c.meetingsScheduled / c.inquiries) * 100)
                  return (
                    <div key={c.id} className="grid grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))] items-center gap-1.5">
                      <span className="truncate pr-1 text-[11.5px] text-ink-2">{c.name}</span>
                      {HEAT_COLS.map((p, k) => (
                        <HeatCell key={p} v={HEAT[c.id]?.[p]} target={c.profile === p} delay={0.3 + i * 0.06 + k * 0.03} />
                      ))}
                      <HeatCell v={total} strong delay={0.45 + i * 0.06} />
                    </div>
                  )
                })}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-3">
              <span className="h-2.5 w-2.5 rounded-[3px] ring-2 ring-accent ring-offset-1 ring-offset-surface" /> Perfil al que apuntaba la campaña
            </p>
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2/60 p-3.5">
              <SparkleIcon size={15} className="mt-px shrink-0" />
              <p className="text-[12.5px] leading-snug text-ink-2">
                Las campañas enfocadas convierten mejor en su perfil. La de <b className="font-semibold text-ink">público amplio</b> no supera el 18% con ninguno.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Origen de las consultas */}
        <motion.div {...fade(7)} className={cn(card, 'col-span-7 flex flex-col')}>
          <ChartTitle title="Consultas atribuidas a pauta vs. recomendación" sub="Origen de cada consulta, por semana" />
          <div className="mt-3 flex min-h-[240px] flex-1 gap-5">
            <div className="flex w-[168px] shrink-0 flex-col items-center justify-center">
              <div className="relative h-[140px] w-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={originTotals} dataKey="v" innerRadius={46} outerRadius={68} paddingAngle={2} stroke="none" animationDuration={1000}>
                      {originTotals.map((o) => (
                        <Cell key={o.k} fill={ORIGINS[o.k].color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-serif text-[24px] leading-none text-ink">
                    <Counter to={originSum} />
                  </span>
                  <span className="text-[10px] text-ink-3">consultas</span>
                </div>
              </div>
              <div className="mt-3 w-full space-y-1">
                {originTotals.map((o) => (
                  <p key={o.k} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: ORIGINS[o.k].color }} />
                    {originLabel(o.k)}
                    <span className="ml-auto font-semibold text-ink">{Math.round((o.v / originSum) * 100)}%</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BY_ORIGIN} margin={{ top: 10, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke={grid} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="min-w-[160px] rounded-xl border border-line bg-surface px-3 py-2.5 text-[12px] shadow-float">
                          <p className="mb-1.5 text-ink-3">Semana del {label}</p>
                          {[...payload].reverse().map((p) => (
                            <p key={String(p.dataKey)} className="flex items-center gap-2 py-0.5 text-ink-2">
                              <span className="h-2 w-2 rounded-[2px]" style={{ background: ORIGINS[p.dataKey as Origin].color }} />
                              {originLabel(String(p.dataKey))}
                              <span className="ml-auto font-semibold text-ink">{p.value}</span>
                            </p>
                          ))}
                        </div>
                      ) : null
                    }
                  />
                  {ORIGIN_KEYS.map((k, i) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      stackId="o"
                      fill={ORIGINS[k].color}
                      stroke="var(--surface)"
                      strokeWidth={2}
                      radius={i === ORIGIN_KEYS.length - 1 ? [4, 4, 0, 0] : 0}
                      animationDuration={900}
                      animationBegin={200 + i * 120}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Borradores de campaña */}
        <motion.div {...fade(8)} className={cn(card, 'relative col-span-5 overflow-hidden')}>
          <div className="flex items-center gap-2">
            <SparkleIcon size={16} />
            <p className="ai-text text-[14px] font-semibold">Borradores de campaña</p>
          </div>
          <p className="mt-1 text-[12px] leading-snug text-ink-3">
            Mide si el agente propone campañas que MARQ realmente quiere publicar. Muchas descartadas = el agente no entiende el negocio.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { l: 'Aprobados', v: approved, c: '#4E8A5E' },
              { l: 'Editados', v: edited, c: '#5F83A6' },
              { l: 'Descartados', v: discarded, c: '#9A948A' },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-surface-2/70 p-3">
                <p className="font-serif text-[30px] leading-none text-ink">
                  <Counter to={x.v} />
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: x.c }} /> {x.l}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-3">
            {[
              { v: approved, c: '#4E8A5E' },
              { v: edited, c: '#5F83A6' },
              { v: discarded, c: '#9A948A' },
            ].map((x, i) => (
              <motion.div
                key={i}
                className="h-full"
                style={{ background: x.c }}
                initial={{ width: 0 }}
                animate={{ width: `${(x.v / totalDrafts) * 100}%` }}
                transition={{ duration: 0.9, delay: 0.3 + i * 0.15 }}
              />
            ))}
          </div>
          <p className="mt-5 mb-2 text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Motivos de descarte</p>
          <div className="space-y-2">
            {reasons.map((x, i) => (
              <div key={x.r} className="flex items-center gap-3">
                <span className="w-[240px] shrink-0 truncate text-[12px] text-ink-2">{x.r}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full rounded-full bg-ink-3"
                    initial={{ width: 0 }}
                    animate={{ width: `${(x.n / maxReason) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.07 }}
                  />
                </div>
                <span className="w-5 text-right text-[12px] font-semibold text-ink">{x.n}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent-soft p-3">
            <ShieldCheck size={20} className="shrink-0 text-accent" />
            <p className="text-[12px] text-ink-2">
              <b className="font-serif text-[18px] font-normal text-ink">0</b> pesos invertidos sin aprobación de una persona
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}

function HeatCell({ v, target, strong, delay }: { v?: number; target?: boolean; strong?: boolean; delay: number }) {
  if (v == null) return <span className="flex h-10 items-center justify-center rounded-lg bg-surface-2 text-[11px] text-ink-3">—</span>
  const a = Math.min(1, v / 42)
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.35 }}
      className={cn(
        'flex h-10 items-center justify-center rounded-lg text-[11.5px] tabular-nums',
        strong ? 'font-semibold' : 'font-medium',
        target && 'ring-2 ring-accent ring-offset-1 ring-offset-surface',
      )}
      style={{
        background: `color-mix(in srgb, var(--accent) ${Math.round(8 + a * 80)}%, var(--surface-2))`,
        color: a > 0.5 ? 'var(--accent-ink)' : 'var(--ink)',
      }}
    >
      {v}%
    </motion.span>
  )
}

