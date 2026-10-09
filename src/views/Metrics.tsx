import { useEffect, useState } from 'react'
import { animate, motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, CalendarRange, ShieldCheck, Moon, FileText, BellRing, Inbox, ChartColumn, Megaphone } from 'lucide-react'
import { AttractionMetrics } from './AttractionMetrics'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHANNELS } from '../data/config'
import { useStore } from '../store'
import { SparkleIcon } from '../components/ui'
import { cn } from '../lib/utils'
import type { Channel } from '../types'

export function Counter({ to, decimals = 0, duration = 1.4, suffix = '' }: { to: number; decimals?: number; duration?: number; suffix?: string }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const ctrl = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setV })
    return () => ctrl.stop()
  }, [to, duration])
  return (
    <>
      {v.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  )
}

export const card = 'rounded-[24px] border border-line bg-surface p-5 shadow-soft'
export const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.06 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

const FUNNEL = [
  { label: 'Consultas recibidas', value: 412 },
  { label: 'Respondidas', value: 404 },
  { label: 'En conversación', value: 236 },
  { label: 'Reunión programada', value: 140 },
  { label: 'Reunión realizada', value: 118 },
  { label: 'Propuesta enviada', value: 61 },
  { label: 'Reserva / cierre', value: 26 },
]

const WEEKS = ['4 ago', '11 ago', '18 ago', '25 ago', '1 sep', '8 sep', '15 sep', '22 sep']
const BY_CHANNEL = WEEKS.map((w, i) => ({
  week: w,
  whatsapp: [38, 41, 44, 40, 47, 52, 49, 55][i],
  instagram: [22, 25, 24, 29, 31, 30, 34, 37][i],
  portal: [18, 16, 20, 19, 21, 18, 22, 20][i],
  mail: [11, 12, 10, 13, 12, 14, 11, 13][i],
}))

const RESPONSE = [
  { w: 'S1', h: 13.5 },
  { w: 'S2', h: 14.2 },
  { w: 'S3', h: 15.1 },
  { w: 'S4', h: 13.8 },
  { w: 'S5', h: 14.4 },
  { w: 'S6', h: 3.2 },
  { w: 'S7', h: 1.4 },
  { w: 'S8', h: 0.9 },
  { w: 'S9', h: 0.75 },
  { w: 'S10', h: 0.68 },
  { w: 'S11', h: 0.64 },
  { w: 'S12', h: 0.63 },
]
const fmtH = (h: number) => (h >= 1 ? `${h.toLocaleString('es-AR', { maximumFractionDigits: 1 })} h` : `${Math.round(h * 60)} min`)

const CH_ORDER: Channel[] = ['whatsapp', 'instagram', 'portal', 'mail']

export function Metrics() {
  const [tab, setTab] = useState<'general' | 'atraccion'>('general')

  return (
    <div className="scroll-soft h-full overflow-y-auto">
      <div className="mx-auto max-w-[1320px] px-7 pt-6 pb-10">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface/70 p-1 shadow-soft">
            {(['general', 'atraccion'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn('relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors', tab === t ? 'text-ink' : 'text-ink-3 hover:text-ink')}
              >
                {tab === t && <motion.span layoutId="metrics-tab" className="absolute inset-0 rounded-lg bg-surface-2 shadow-soft" />}
                <span className="relative flex items-center gap-1.5">
                  {t === 'general' ? <ChartColumn size={14} /> : <Megaphone size={14} />}
                  {t === 'general' ? 'Equipo comercial' : 'Atracción'}
                </span>
              </button>
            ))}
          </div>
          <span className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-[12.5px] font-medium text-ink shadow-soft">
            <CalendarRange size={14} className="text-ink-3" /> Últimos 30 días
          </span>
          <span className="text-[12.5px] text-ink-3">
            {tab === 'general' ? 'Comparado con los 30 días previos a activar el asistente' : 'Cada campaña, medida por las reuniones que consigue'}
          </span>
        </div>
        {tab === 'general' ? <GeneralMetrics /> : <AttractionMetrics />}
      </div>
    </div>
  )
}

function GeneralMetrics() {
  const dark = useStore((s) => s.dark)
  const stats = useStore((s) => s.stats)
  const axis = dark ? '#736d63' : '#9a948a'
  const grid = dark ? '#2d2a25' : '#ece7df'

  return (
    <>

        {/* KPI row */}
        <div className="grid grid-cols-12 gap-4">
          <motion.div {...fade(0)} className={cn(card, 'relative col-span-4 overflow-hidden')}>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent-soft" />
            <span className="pointer-events-none absolute -right-3 -bottom-10 font-serif text-[160px] leading-none font-light text-accent opacity-[0.06]">38′</span>
            <p className="relative text-[12.5px] font-medium text-ink-2">Tiempo promedio a primera respuesta</p>
            <div className="relative mt-4 flex items-end gap-4">
              <div>
                <p className="text-[11px] text-ink-3">Antes</p>
                <p className="font-serif text-[30px] leading-none text-ink-3 line-through decoration-[#c0673f]/60 decoration-2">14 h</p>
              </div>
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="mb-2 text-ink-3">
                →
              </motion.span>
              <div>
                <p className="text-[11px] text-accent">Ahora</p>
                <p className="font-serif text-[64px] leading-[0.9] font-light tracking-tight text-ink">
                  <Counter to={38} />
                  <span className="ml-1 text-[26px]">min</span>
                </p>
              </div>
            </div>
            <p className="relative mt-4 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent">
              <ArrowDownRight size={13} /> 95% más rápido
            </p>
          </motion.div>

          <Kpi i={1} label="Consultas sin seguimiento" value={6} suffix="%" before="41%" good="down" />
          <Kpi i={2} label="Borradores enviados sin cambios" value={72} suffix="%" note={`+${stats.sentUnchanged} hoy`} />
          <Kpi i={3} label="Conversión consulta → reunión" value={34} suffix="%" before="19%" good="up" />
          <Kpi i={4} label="Conversión reunión → reserva" value={22} suffix="%" before="15%" good="up" />
        </div>

        {/* Charts */}
        <div className="mt-4 grid grid-cols-12 gap-4">
          <motion.div {...fade(5)} className={cn(card, 'col-span-7')}>
            <ChartTitle title="Embudo comercial" sub="Contactos que llegaron a cada etapa · últimos 30 días" />
            <div className="mt-5 space-y-2">
              {FUNNEL.map((f, i) => {
                const pct = (f.value / FUNNEL[0].value) * 100
                const prev = FUNNEL[i - 1]
                return (
                  <div key={f.label} className="group flex items-center gap-4" title={`${f.label}: ${f.value}`}>
                    <span className="w-[140px] shrink-0 text-right text-[12px] text-ink-2">{f.label}</span>
                    <div className="relative h-8 flex-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-y-0 left-0 rounded-r-[4px] bg-accent transition-opacity group-hover:opacity-85"
                        style={{ opacity: 1 - i * 0.09 }}
                      />
                      <span className="absolute inset-y-0 flex items-center pl-2.5 text-[12px] font-semibold text-accent-ink" style={{ left: 0 }}>
                        <Counter to={f.value} duration={1.2} />
                      </span>
                    </div>
                    <span className="w-[54px] shrink-0 text-[11.5px] text-ink-3">
                      {prev ? `${Math.round((f.value / prev.value) * 100)}%` : ''}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-right text-[11px] text-ink-3">% = paso desde la etapa anterior</p>
          </motion.div>

          <motion.div {...fade(6)} className={cn(card, 'col-span-5 flex flex-col')}>
            <ChartTitle title="Consultas por canal" sub="Por semana" />
            <div className="mt-3 flex flex-wrap gap-3">
              {CH_ORDER.map((k) => (
                <span key={k} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHANNELS[k].chart }} />
                  {k === 'portal' ? 'Portales' : CHANNELS[k].label}
                </span>
              ))}
            </div>
            <div className="mt-2 min-h-[240px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BY_CHANNEL} margin={{ top: 10, right: 4, left: -18, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke={grid} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }} content={<ChannelTip />} />
                  {CH_ORDER.map((k, i) => (
                    <Bar
                      key={k}
                      dataKey={k}
                      stackId="a"
                      fill={CHANNELS[k].chart}
                      stroke="var(--surface)"
                      strokeWidth={2}
                      radius={i === CH_ORDER.length - 1 ? [4, 4, 0, 0] : 0}
                      animationDuration={900}
                      animationBegin={200 + i * 120}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div {...fade(7)} className={cn(card, 'col-span-7 flex flex-col')}>
            <ChartTitle title="Tiempo a primera respuesta" sub="Promedio semanal, en horas" />
            <div className="mt-4 min-h-[230px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={RESPONSE} margin={{ top: 20, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="respFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={grid} />
                  <XAxis dataKey="w" tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: axis }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} h`} />
                  <ReferenceLine
                    x="S6"
                    stroke="var(--accent)"
                    strokeDasharray="4 4"
                    label={{ value: '✨ Asistente activado', position: 'top', fill: 'var(--accent)', fontSize: 11, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ stroke: axis, strokeDasharray: '3 3' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-float">
                          <p className="text-ink-3">Semana {String(label).slice(1)}</p>
                          <p className="font-semibold text-ink">{fmtH(Number(payload[0].value))}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="h"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#respFill)"
                    dot={false}
                    activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 2 }}
                    animationDuration={1400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div {...fade(8)} className={cn(card, 'relative col-span-5 overflow-hidden')}>
            <div className="flex items-center gap-2">
              <SparkleIcon size={16} />
              <p className="ai-text text-[14px] font-semibold">Lo que hizo el asistente este mes</p>
            </div>
            <p className="mt-1 text-[12px] text-ink-3">Siempre detrás de escena</p>
            <div className="mt-4 space-y-1">
              <WorkRow icon={Inbox} label="Consultas registradas y clasificadas" value={412} />
              <WorkRow icon={Moon} label="Consultas fuera de horario capturadas" value={131} />
              <WorkRow icon={FileText} label="Borradores redactados" value={398} />
              <WorkRow icon={BellRing} label="Recordatorios de seguimiento" value={87} />
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent-soft p-3.5">
              <ShieldCheck size={22} className="shrink-0 text-accent" />
              <div>
                <p className="font-serif text-[26px] leading-none text-ink">0</p>
                <p className="mt-1 text-[12px] text-ink-2">mensajes enviados sin aprobación de una persona</p>
              </div>
            </div>
          </motion.div>
        </div>
    </>
  )
}

export function Kpi({
  i,
  label,
  value,
  suffix,
  before,
  good,
  note,
}: {
  i: number
  label: string
  value: number
  suffix?: string
  before?: string
  good?: 'up' | 'down'
  note?: string
}) {
  return (
    <motion.div {...fade(i)} className={cn(card, 'col-span-2 flex flex-col')}>
      <p className="min-h-[34px] text-[12px] leading-snug font-medium text-ink-2">{label}</p>
      <p className="mt-3 font-serif text-[44px] leading-none font-light tracking-tight text-ink">
        <Counter to={value} />
        <span className="text-[24px]">{suffix}</span>
      </p>
      <div className="mt-auto pt-3">
        {before ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
            {good === 'down' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />} antes {before}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
            {note}
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function ChartTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <p className="font-serif text-[18px] text-ink">{title}</p>
      <p className="mt-0.5 text-[12px] text-ink-3">{sub}</p>
    </div>
  )
}

function WorkRow({ icon: Icon, label, value }: { icon: typeof Inbox; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-1 py-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
        <Icon size={15} />
      </span>
      <span className="flex-1 text-[12.5px] text-ink-2">{label}</span>
      <span className="font-serif text-[20px] text-ink">
        <Counter to={value} />
      </span>
    </div>
  )
}

function ChannelTip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((a, p) => a + Number(p.value), 0)
  return (
    <div className="min-w-[160px] rounded-xl border border-line bg-surface px-3 py-2.5 text-[12px] shadow-float">
      <p className="mb-1.5 text-ink-3">Semana del {label}</p>
      {[...payload].reverse().map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 py-0.5 text-ink-2">
          <span className="h-2 w-2 rounded-[2px]" style={{ background: CHANNELS[p.dataKey as Channel].chart }} />
          {p.dataKey === 'portal' ? 'Portales' : CHANNELS[p.dataKey as Channel].label}
          <span className="ml-auto font-semibold text-ink">{p.value}</span>
        </p>
      ))}
      <p className="mt-1.5 flex border-t border-line pt-1.5 text-ink-2">
        Total <span className="ml-auto font-semibold text-ink">{total}</span>
      </p>
    </div>
  )
}
