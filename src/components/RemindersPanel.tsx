import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BellRing, Clock } from 'lucide-react'
import { isStale, useStore } from '../store'
import { stageById } from '../data/config'
import { daysIn, firstName } from '../lib/utils'
import { Avatar } from './ui'

export function RemindersPanel() {
  const contacts = useStore((s) => s.contacts)
  const openFromReminder = useStore((s) => s.openFromReminder)
  const setOpen = useStore((s) => s.setRemindersOpen)
  const ref = useRef<HTMLDivElement>(null)

  const items = useMemo(
    () => contacts.filter(isStale).sort((a, b) => a.stageSince - b.stageSince),
    [contacts],
  )

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [setOpen])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="absolute top-12 right-0 w-[420px] origin-top-right overflow-hidden rounded-2xl border border-line bg-[var(--glass)] shadow-float backdrop-blur-2xl"
    >
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <BellRing size={17} />
        </span>
        <div>
          <p className="text-[14px] font-semibold text-ink">Recordatorios de seguimiento</p>
          <p className="text-[12px] text-ink-3">
            Tenés {items.length} contactos que necesitan un empujón
          </p>
        </div>
      </div>
      <div className="scroll-soft max-h-[420px] overflow-y-auto p-2">
        {items.map((c, i) => {
          const d = daysIn(c.stageSince)
          const hot = d >= 8
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * i }}
              className="group flex gap-3 rounded-xl p-3 transition hover:bg-surface-2/80"
            >
              <Avatar name={c.name} hue={c.hue} size={38} channel={c.channel} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug text-ink-2">
                  <b className="font-semibold text-ink">{c.name}</b>{' '}
                  {c.stage === 'pendiente' ? (
                    <>
                      espera respuesta desde hace <b className="font-semibold text-ink">{d} días</b>
                    </>
                  ) : (
                    <>
                      lleva <b className="font-semibold text-ink">{d} días</b> en {stageById(c.stage).label} sin novedades
                    </>
                  )}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: hot ? '#c0573f' : '#b58434' }}>
                  <Clock size={11} />
                  {hot ? 'Riesgo alto de enfriarse' : 'Buen momento para retomar'}
                </div>
                <button
                  onClick={() => openFromReminder(c.id)}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-2.5 py-1.5 text-[12px] font-medium text-accent transition hover:bg-accent hover:text-accent-ink"
                >
                  ✨ {c.stage === 'pendiente' ? 'Ver borrador de respuesta' : `Ver borrador para retomar con ${firstName(c.name)}`}
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
