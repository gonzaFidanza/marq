import { AnimatePresence, motion } from 'framer-motion'
import { Check, PartyPopper, X, Archive, Info } from 'lucide-react'
import { useStore } from '../store'
import { ChannelBadge } from './ui'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  const dismiss = useStore((s) => s.dismissToast)
  const select = useStore((s) => s.select)

  return (
    <div className="pointer-events-none fixed top-[84px] right-6 z-[80] flex w-[380px] flex-col items-end gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            layout
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="pointer-events-auto relative w-full overflow-hidden rounded-2xl border border-line bg-[var(--glass)] p-3.5 pr-10 shadow-float backdrop-blur-2xl"
          >
            <div className="flex gap-3">
              <div className="pt-0.5">
                {t.tone === 'incoming' && t.channel ? (
                  <motion.span
                    className="block"
                    initial={{ scale: 0.4, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.1 }}
                  >
                    <ChannelBadge channel={t.channel} size={32} className="ring-0" />
                  </motion.span>
                ) : (
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{
                      background:
                        t.tone === 'celebrate' ? 'rgba(184,150,62,.16)' : t.tone === 'muted' ? 'var(--surface-3)' : 'var(--accent-soft)',
                      color: t.tone === 'celebrate' ? '#b8963e' : t.tone === 'muted' ? 'var(--ink-3)' : 'var(--accent)',
                    }}
                  >
                    {t.tone === 'celebrate' ? (
                      <PartyPopper size={15} />
                    ) : t.tone === 'muted' ? (
                      <Archive size={15} />
                    ) : t.tone === 'success' ? (
                      <Check size={16} strokeWidth={2.5} />
                    ) : (
                      <Info size={15} />
                    )}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-ink">{t.title}</p>
                {t.body && <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-ink-2">{t.body}</p>}
                {t.action && (
                  <button
                    onClick={() => {
                      select(t.action!.contactId)
                      dismiss(t.id)
                    }}
                    className="mt-2 rounded-lg bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-ink transition hover:opacity-90"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="absolute top-3 right-3 rounded-md p-1 text-ink-3 transition hover:bg-surface-2 hover:text-ink"
            >
              <X size={14} />
            </button>
            <motion.span
              className="absolute bottom-0 left-0 h-[2px] bg-accent/50"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: t.tone === 'incoming' ? 6 : 4.8, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
