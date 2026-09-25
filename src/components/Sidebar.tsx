import { Inbox, SquareKanban, ChartColumn, Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore, type View } from '../store'
import { cn } from '../lib/utils'
import { Logo, TeamAvatar } from './ui'

const NAV: { id: View; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Bandeja', icon: Inbox },
  { id: 'board', label: 'Tablero', icon: SquareKanban },
  { id: 'metrics', label: 'Métricas', icon: ChartColumn },
]

export function Sidebar() {
  const view = useStore((s) => s.view)
  const setView = useStore((s) => s.setView)
  const dark = useStore((s) => s.dark)
  const toggleDark = useStore((s) => s.toggleDark)
  const unread = useStore((s) => s.contacts.filter((c) => c.stage === 'pendiente').length)

  return (
    <aside className="relative z-20 flex w-[84px] shrink-0 flex-col items-center border-r border-line bg-surface/60 py-5 backdrop-blur-xl">
      <div className="flex flex-col items-center">
        <Logo compact width={52} />
        <span className="mt-1 h-px w-6 bg-line-strong" />
      </div>

      <nav className="mt-9 flex flex-col gap-2">
        {NAV.map((n) => {
          const active = view === n.id
          const Icon = n.icon
          return (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cn(
                'group relative flex w-[64px] flex-col items-center gap-1 rounded-2xl py-2.5 text-[10.5px] font-medium transition-colors',
                active ? 'text-accent' : 'text-ink-3 hover:text-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-2xl bg-accent-soft"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                <Icon size={20} strokeWidth={active ? 2.1 : 1.8} className="transition-transform group-hover:scale-110" />
                {n.id === 'inbox' && unread > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c0673f] px-1 text-[9.5px] font-semibold text-white ring-2 ring-surface">
                    {unread}
                  </span>
                )}
              </span>
              <span className="relative">{n.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-4">
        <button
          onClick={toggleDark}
          title={dark ? 'Modo claro' : 'Modo oscuro'}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-3 transition hover:bg-surface-2 hover:text-ink"
        >
          <motion.span key={dark ? 'sun' : 'moon'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </motion.span>
        </button>
        <div className="group relative" title="Candelaria Molina · Asesora comercial">
          <TeamAvatar id="candelaria" size={40} className="text-[13px]" />
          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-[#5a9a6e] ring-2 ring-surface" />
        </div>
      </div>
    </aside>
  )
}
