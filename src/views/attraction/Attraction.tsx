import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Lightbulb, Megaphone, Radar, ShieldCheck } from 'lucide-react'
import { useStore, type AttractionTab } from '../../store'
import { Kbd } from '../../components/ui'
import { cn } from '../../lib/utils'
import { Signals } from './Signals'
import { Drafts } from './Drafts'
import { Campaigns } from './Campaigns'

const TABS: { id: AttractionTab; label: string; icon: typeof Radar }[] = [
  { id: 'senales', label: 'Señales', icon: Radar },
  { id: 'borradores', label: 'Borradores', icon: FileText },
  { id: 'campanas', label: 'Campañas activas', icon: Megaphone },
]

export function Attraction() {
  const tab = useStore((s) => s.attractionTab)
  const setTab = useStore((s) => s.setAttractionTab)
  const pending = useStore((s) => s.drafts.filter((d) => d.status === 'pendiente' || d.status === 'editado').length)
  const active = useStore((s) => s.campaigns.filter((c) => c.status === 'activa').length)
  const generate = useStore((s) => s.generateCampaign)
  const generating = useStore((s) => !!s.generating)
  const setWhyOpen = useStore((s) => s.setWhyOpen)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 px-7 pt-4 pb-4">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface/70 p-1 shadow-soft">
          {TABS.map((t) => {
            const on = tab === t.id
            const count = t.id === 'borradores' ? pending : t.id === 'campanas' ? active : 0
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                  on ? 'text-ink' : 'text-ink-3 hover:text-ink',
                )}
              >
                {on && (
                  <motion.span
                    layoutId="attraction-tab"
                    className="absolute inset-0 rounded-lg bg-surface-2 shadow-soft"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <t.icon size={14} className={on ? 'text-accent' : ''} />
                  {t.label}
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                        t.id === 'borradores' ? 'bg-[#c0673f] text-white' : 'bg-surface-3 text-ink-2',
                      )}
                    >
                      {count}
                    </motion.span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        <span className="hidden items-center gap-1.5 rounded-full border border-accent/25 bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-accent lg:flex">
          <ShieldCheck size={14} /> Nada se publica ni se gasta sin tu aprobación
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setWhyOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink"
          >
            <Lightbulb size={14} /> ¿Por qué este módulo?
          </button>
          <motion.button
            onClick={() => generate()}
            disabled={generating}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex h-10 items-center gap-2 overflow-hidden rounded-xl border border-accent/30 bg-surface pr-2.5 pl-3.5 text-[13px] font-medium text-accent shadow-soft transition disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative">✨</span>
            <span className="relative">{generating ? 'Generando propuesta…' : 'Generar propuesta de campaña'}</span>
            <Kbd className="relative ml-1 border-line! bg-surface-2! text-ink-2">C</Kbd>
          </motion.button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            {tab === 'senales' && <Signals />}
            {tab === 'borradores' && <Drafts />}
            {tab === 'campanas' && <Campaigns />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
