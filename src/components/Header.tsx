import { Bell, Search, ShieldCheck, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { isStale, useStore } from '../store'
import { Kbd } from './ui'
import { RemindersPanel } from './RemindersPanel'
import { cn } from '../lib/utils'

const TITLES = {
  inbox: { title: 'Bandeja', sub: 'Todas tus consultas, en un solo lugar' },
  board: { title: 'Tablero de seguimiento', sub: 'Cada contacto, en su etapa' },
  metrics: { title: 'Métricas', sub: 'Cómo viene el equipo comercial' },
}

export function Header() {
  const view = useStore((s) => s.view)
  const search = useStore((s) => s.search)
  const setSearch = useStore((s) => s.setSearch)
  const sound = useStore((s) => s.sound)
  const toggleSound = useStore((s) => s.toggleSound)
  const simulate = useStore((s) => s.simulateIncoming)
  const open = useStore((s) => s.remindersOpen)
  const setOpen = useStore((s) => s.setRemindersOpen)
  const staleCount = useStore((s) => s.contacts.filter((c) => isStale(c)).length)
  const t = TITLES[view]

  return (
    <header className="relative z-30 flex h-[72px] shrink-0 items-center gap-6 border-b border-line bg-bg/70 px-7 backdrop-blur-xl">
      <div className="min-w-[230px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <h1 className="font-serif text-[23px] leading-none font-normal tracking-tight text-ink">{t.title}</h1>
            <p className="mt-1.5 text-[12px] text-ink-3">{t.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative w-full max-w-[380px]">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contactos, desarrollos, mensajes…"
          className="h-10 w-full rounded-xl border border-line bg-surface/80 pr-12 pl-10 text-[13px] text-ink shadow-soft transition outline-none placeholder:text-ink-3 focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
        />
        <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 text-[10px] font-medium text-ink-3">
          ⌘K
        </span>
      </div>

      <div className="group relative hidden items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-[11.5px] font-medium text-ink-2 xl:flex">
        <ShieldCheck size={14} className="text-accent" />
        Nada se envía sin tu aprobación
        <div className="pointer-events-none absolute top-full left-1/2 mt-2 w-64 -translate-x-1/2 rounded-xl border border-line bg-surface p-3 text-[11.5px] leading-relaxed font-normal text-ink-2 opacity-0 shadow-float transition group-hover:opacity-100">
          El asistente trabaja detrás de escena: registra, clasifica, redacta borradores y te recuerda seguimientos.{' '}
          <b className="text-ink">Vos decidís qué se envía.</b>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleSound}
          title={sound ? 'Silenciar notificaciones' : 'Activar sonido'}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-3 transition hover:bg-surface-2 hover:text-ink"
        >
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-xl transition',
              open ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:bg-surface-2 hover:text-ink',
            )}
          >
            <motion.span
              animate={staleCount > 0 ? { rotate: [0, -14, 12, -8, 6, 0] } : {}}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 6 }}
            >
              <Bell size={18} />
            </motion.span>
            {staleCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#c0673f] px-1 text-[10px] font-semibold text-white ring-2 ring-bg">
                {staleCount}
              </span>
            )}
          </button>
          <AnimatePresence>{open && <RemindersPanel />}</AnimatePresence>
        </div>

        <motion.button
          onClick={simulate}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="group relative ml-2 flex h-10 items-center gap-2 overflow-hidden rounded-xl bg-accent-strong pr-2.5 pl-4 text-[13px] font-medium text-accent-ink shadow-[0_6px_20px_-6px_rgba(58,71,48,0.6)] dark:bg-accent"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <span className="relative">✨</span>
          <span className="relative">Simular consulta entrante</span>
          <Kbd className="relative ml-1 dark:border-black/20 dark:bg-black/10">N</Kbd>
        </motion.button>
      </div>
    </header>
  )
}


