import { Fragment, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BellRing, ChevronRight, Info } from 'lucide-react'
import { isStale, useStore } from '../store'
import type { DevStage } from '../types'
import { DEV_STAGES, devById } from '../data/config'
import { monthlyFee, priceAfterStage, radarForStage, stageWhen } from '../data/pricing'
import { DevImage } from '../components/attraction-ui'
import { cn, usd } from '../lib/utils'
import { DeltaBadge, Radar } from './Prices'

const ORDER: DevStage[] = ['pozo', 'obra', 'terminado']

/** Aviso de cambio de etapa: qué valores suben, cuándo y a quién avisarle antes */
export function StageModal({ devId }: { devId: string }) {
  const dev = devById(devId)
  const ns = dev.nextStage
  const prices = useStore((s) => s.prices)
  const contacts = useStore((s) => s.contacts)
  const cancel = useStore((s) => s.cancelStage)
  const confirm = useStore((s) => s.confirmStage)
  const radar = useMemo(() => radarForStage(dev, contacts, isStale), [dev, contacts])
  const [picked, setPicked] = useState(() => new Set(radar.filter((r) => r.checked).map((r) => r.contact.id)))
  if (!ns) return null
  const chosen = radar.filter((r) => picked.has(r.contact.id)).map((r) => r.contact.id)
  const toggle = (id: string) =>
    setPicked((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const days = Math.ceil((ns.at - Date.now()) / 86_400_000)

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
        <div className="shrink-0 px-7 pt-7">
          <div className="flex items-center gap-3.5">
            <DevImage id={dev.id} className="h-11 w-11 shrink-0 rounded-2xl" />
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold tracking-[0.12em] text-ink-3 uppercase">Cambio de etapa</p>
              <h3 className="mt-0.5 font-serif text-[24px] leading-tight text-ink">{dev.name}</h3>
            </div>
          </div>

          {/* Etapas: dónde está y a cuál pasa */}
          <div className="mt-5 rounded-2xl border border-line bg-surface-2/50 px-5 py-4">
            <div className="flex items-center gap-2">
              {ORDER.map((st, i) => {
                const now = st === dev.stage
                const next = st === ns.to
                return (
                  <Fragment key={st}>
                    {i > 0 && <ChevronRight size={14} className="shrink-0 text-ink-3" />}
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap',
                        now && 'bg-accent-soft text-accent',
                        next && 'bg-[#c0673f]/10 text-[#b0603c] ring-1 ring-[#c0673f]/25',
                        !now && !next && 'text-ink-3',
                      )}
                    >
                      {DEV_STAGES[st].label}
                      {now && ' · hoy'}
                    </span>
                  </Fragment>
                )
              })}
            </div>
            <p className="mt-3 font-serif text-[22px] leading-tight text-ink">
              Pasa a {DEV_STAGES[ns.to].short.toLowerCase()} {stageWhen(ns.at)}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-3">
              {days <= 60 ? `En ${days} días` : `En ${Math.round(days / 30)} meses`} · los valores suben un {Math.round(ns.increase * 100)}%
            </p>

            <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
              {dev.typologies.map((t) => {
                const price = prices[`${dev.id}/${t.label}`]
                const after = priceAfterStage(price, dev)
                return (
                  <div key={t.label} className="flex items-center gap-3 px-3.5 py-2">
                    <span className="w-[92px] shrink-0 text-[12.5px] text-ink-2">{t.label}</span>
                    <span className="text-[12.5px] whitespace-nowrap text-ink">
                      {usd(price)} <span className="text-ink-3">→</span> <b className="font-semibold">{usd(after)}</b>
                    </span>
                    <DeltaBadge from={price} to={after} />
                    {dev.anticipo && (
                      <span className="ml-auto text-[11px] whitespace-nowrap text-ink-3">
                        cuota {usd(monthlyFee(price, dev))} → {monthlyFee(after, dev).toLocaleString('es-AR')}/mes
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            {dev.anticipo && (
              <p className="mt-2 text-[11px] text-ink-3">
                Cuota mensual estimada con {Math.round(dev.anticipo * 100)}% de anticipo y el resto en cuotas hasta la entrega ({dev.delivery.toLowerCase()}).
              </p>
            )}
          </div>
        </div>

        <div className="scroll-soft min-h-0 flex-1 overflow-y-auto px-7 pb-5">
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-surface-2/50 p-3.5 text-[12px] leading-snug text-ink-2">
            <Info size={14} className="mt-px shrink-0 text-ink-3" />
            <span>
              A medida que avanza la obra baja el riesgo y sube el valor. Avisar antes le da a quien está dudando una razón concreta para decidir, y le explica por
              qué cambia el precio.
            </span>
          </div>
          <Radar
            items={radar}
            picked={picked}
            toggle={toggle}
            title="A quién avisarle"
            intro="Consultaron por este desarrollo y todavía no decidieron. Cada aviso se adapta a cómo compra: al inversor le mostramos la diferencia entre etapas y a quien paga en cuotas, cuánto cambia su cuota. Vos elegís a quién mandarle y"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-line px-7 py-4">
          <p className="text-[12px] text-ink-3">
            {chosen.length ? `Se ${chosen.length === 1 ? 'prepara 1 aviso' : `preparan ${chosen.length} avisos`} para aprobar` : 'No se prepara ningún aviso'}
          </p>
          <button onClick={cancel} className="ml-auto rounded-xl px-4 py-2.5 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2">
            Cancelar
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => confirm(chosen)}
            disabled={!chosen.length}
            className="flex items-center gap-1.5 rounded-xl bg-accent-strong px-4 py-2.5 text-[13px] font-medium text-accent-ink shadow-[0_6px_16px_-6px_rgba(58,71,48,0.55)] transition hover:opacity-90 disabled:opacity-30 dark:bg-accent"
          >
            <BellRing size={15} /> Preparar avisos
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
