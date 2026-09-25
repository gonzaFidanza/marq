import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Inbox as InboxIcon } from 'lucide-react'
import { useStore, type Filter } from '../store'
import { Avatar, ClassChip } from '../components/ui'
import { cn, relTime } from '../lib/utils'
import type { Contact } from '../types'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'mail', label: 'Mail' },
  { id: 'portal', label: 'Portales' },
  { id: 'sin_responder', label: 'Sin responder' },
]

const lastAt = (c: Contact) => c.messages[c.messages.length - 1]?.at ?? 0
const needsReply = (c: Contact) => c.messages[c.messages.length - 1]?.from === 'contact' && c.stage !== 'descartada'

export function ConversationList() {
  const contacts = useStore((s) => s.contacts)
  const filter = useStore((s) => s.filter)
  const setFilter = useStore((s) => s.setFilter)
  const search = useStore((s) => s.search)
  const selectedId = useStore((s) => s.selectedId)
  const select = useStore((s) => s.select)

  const counts = useMemo(() => {
    const r: Record<string, number> = { todas: contacts.length, sin_responder: contacts.filter(needsReply).length }
    contacts.forEach((c) => (r[c.channel] = (r[c.channel] ?? 0) + 1))
    return r
  }, [contacts])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return contacts
      .filter((c) => (filter === 'todas' ? true : filter === 'sin_responder' ? needsReply(c) : c.channel === filter))
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q)),
      )
      .sort((a, b) => lastAt(b) - lastAt(a))
  }, [contacts, filter, search])

  const pending = counts.sin_responder

  return (
    <section className="flex w-[352px] shrink-0 flex-col border-r border-line bg-surface/40">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-[20px] text-ink">Conversaciones</h2>
          <span className="text-[12px] text-ink-3">{contacts.length} contactos</span>
        </div>
        <p className="mt-1 text-[12.5px] text-ink-2">
          Tenés <b className="font-semibold text-[#b0643f]">{pending} consultas</b> esperando respuesta
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'relative rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors',
                  active ? 'text-accent-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-accent-strong dark:bg-accent"
                    transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                  />
                )}
                <span className="relative">
                  {f.label}
                  <span className={cn('ml-1.5 text-[10.5px]', active ? 'opacity-70' : 'text-ink-3')}>
                    {f.id === 'portal' ? counts.portal ?? 0 : counts[f.id] ?? 0}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="scroll-soft flex-1 overflow-y-auto px-2.5 pb-4">
        <AnimatePresence initial={false}>
          {list.map((c) => (
            <Row key={c.id} c={c} active={c.id === selectedId} onClick={() => select(c.id)} />
          ))}
        </AnimatePresence>
        {list.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center text-ink-3">
            <InboxIcon size={28} strokeWidth={1.5} />
            <p className="mt-3 text-[13px]">No hay conversaciones acá</p>
            <p className="text-[12px]">Todo al día ✨</p>
          </div>
        )}
      </div>
    </section>
  )
}

function Row({ c, active, onClick }: { c: Contact; active: boolean; onClick: () => void }) {
  const last = c.messages[c.messages.length - 1]
  const preview = c.contactTyping ? 'Escribiendo…' : `${last?.from === 'agent' ? 'Vos: ' : ''}${last?.text ?? ''}`
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="overflow-hidden"
    >
      <button
        onClick={onClick}
        className={cn(
          'group relative my-0.5 flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200',
          active ? 'bg-surface shadow-card' : 'hover:bg-surface/70',
          c.fresh && 'glow-new',
        )}
      >
        {active && <motion.span layoutId="row-active" className="absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-accent" />}
        <Avatar name={c.name} hue={c.hue} size={42} channel={c.channel} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn('truncate text-[13.5px] text-ink', c.unread ? 'font-semibold' : 'font-medium')}>{c.name}</p>
            <span className={cn('ml-auto shrink-0 text-[11px]', c.unread ? 'font-semibold text-accent' : 'text-ink-3')}>
              {last ? relTime(last.at) : ''}
            </span>
          </div>
          <p
            className={cn(
              'mt-0.5 line-clamp-1 text-[12.5px]',
              c.contactTyping ? 'text-accent italic' : c.unread ? 'text-ink' : 'text-ink-3',
            )}
          >
            {preview}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <ClassChip value={c.classification} size="xs" analyzing={c.analyzing} />
            {c.draft && !c.analyzing && (
              <span className="inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-px text-[10.5px] font-medium text-ink-2">
                ✨ {c.draftKind === 'retomar' ? 'Para retomar' : 'Borrador listo'}
              </span>
            )}
            {c.meeting && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#8a74b0]/12 px-1.5 py-px text-[10.5px] font-medium text-[#8a74b0]">
                📅 Reunión
              </span>
            )}
            {c.unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink"
              >
                {c.unread}
              </motion.span>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  )
}
