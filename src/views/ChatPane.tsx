import { Fragment, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarCheck, Check, CheckCheck, MoreHorizontal, Moon, Paperclip, Pencil, Phone, SendHorizontal, Smile, X, Eraser } from 'lucide-react'
import { useStore } from '../store'
import type { Contact } from '../types'
import { Avatar, ChannelPill, SparkleIcon, StagePill, TeamAvatar } from '../components/ui'
import { CLASSIFICATIONS, TEAM, devById } from '../data/config'
import { cn, dayLabel, firstName, hhmm, isOutOfHours } from '../lib/utils'

export function ChatPane({ c }: { c: Contact }) {
  const showOnBoard = useStore((s) => s.showOnBoard)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')
  const sendMessage = useStore((s) => s.sendMessage)

  useEffect(() => setText(''), [c.id])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const t = setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }), 60)
    return () => clearTimeout(t)
  }, [c.id, c.messages.length, c.contactTyping, c.meeting, c.draft])

  const sendManual = () => {
    if (!text.trim()) return
    sendMessage(c.id, text)
    setText('')
  }

  const showMeeting = c.meeting && ['pendiente', 'respondida', 'conversacion'].includes(c.stage)

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-bg">
      {/* Header */}
      <div className="flex h-[76px] shrink-0 items-center gap-3.5 border-b border-line bg-surface/50 px-6 backdrop-blur-xl">
        <Avatar name={c.name} hue={c.hue} size={42} channel={c.channel} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-ink">{c.name}</p>
            <ChannelPill channel={c.channel} portal={c.portal} />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-3">
            {c.contactTyping ? (
              <span className="text-accent">escribiendo…</span>
            ) : (
              <>
                {c.handle ?? c.phone ?? c.email} · Asignado a
                <TeamAvatar id={c.assignee} size={16} className="ring-0" /> {firstName(TEAM[c.assignee].name)}
              </>
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StagePill stage={c.stage} onClick={() => showOnBoard(c.id)} />
          <button className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-3 transition hover:bg-surface-2 hover:text-ink">
            <Phone size={17} />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-3 transition hover:bg-surface-2 hover:text-ink">
            <MoreHorizontal size={17} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="scroll-soft relative flex-1 overflow-y-auto">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative mx-auto flex max-w-[760px] flex-col gap-1.5 px-8 pt-6 pb-6"
        >
          <AnimatePresence initial={false}>
            {c.messages.map((m, i) => {
              const prev = c.messages[i - 1]
              const newDay = !prev || dayLabel(prev.at) !== dayLabel(m.at)
              const mine = m.from === 'agent'
              const grouped = prev && prev.from === m.from && !newDay
              return (
                <Fragment key={m.id}>
                  {newDay && (
                    <div className="my-4 flex items-center justify-center">
                      <span className="rounded-full border border-line bg-surface/90 px-3 py-1 text-[11px] font-medium text-ink-3 shadow-soft">
                        {dayLabel(m.at)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    layout="position"
                    initial={{ opacity: 0, y: 16, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className={cn('flex flex-col', mine ? 'items-end' : 'items-start', !grouped && 'mt-2')}
                    style={{ transformOrigin: mine ? 'bottom right' : 'bottom left' }}
                  >
                    <div
                      className={cn(
                        'max-w-[78%] rounded-[20px] px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-line',
                        mine
                          ? 'rounded-br-md bg-accent-strong text-accent-ink shadow-[0_4px_14px_-6px_rgba(58,71,48,0.5)] dark:bg-accent'
                          : 'rounded-bl-md border border-line bg-surface text-ink shadow-soft',
                      )}
                    >
                      {m.text}
                      <span className={cn('mt-1 flex items-center justify-end gap-1 text-[10.5px]', mine ? 'opacity-70' : 'text-ink-3')}>
                        {!mine && isOutOfHours(m.at) && (
                          <span className="mr-1 inline-flex items-center gap-0.5 rounded-full bg-surface-3 px-1.5 py-px text-[9.5px] font-medium text-ink-2">
                            <Moon size={9} /> Fuera de horario
                          </span>
                        )}
                        {hhmm(m.at)}
                        {mine && <CheckCheck size={13} />}
                      </span>
                    </div>
                    {mine && m.viaDraft && (
                      <span className="mt-1 mr-1 flex items-center gap-1 text-[10.5px] text-ink-3">
                        <SparkleIcon size={11} /> Borrador IA {m.edited ? 'editado y ' : ''}aprobado por{' '}
                        {firstName(TEAM[m.by ?? 'candelaria'].name)}
                      </span>
                    )}
                  </motion.div>
                </Fragment>
              )
            })}
          </AnimatePresence>

          <AnimatePresence>
            {c.contactTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-2 flex w-fit items-center gap-1 rounded-[20px] rounded-bl-md border border-line bg-surface px-4 py-3.5 shadow-soft"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-ink-3"
                    animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>{showMeeting && <MeetingBanner c={c} />}</AnimatePresence>
        </motion.div>
      </div>

      {/* Draft + composer */}
      <div className="shrink-0 border-t border-line bg-surface/40 px-6 pt-4 pb-4 backdrop-blur-xl">
        <div className="mx-auto max-w-[760px]">
          <AnimatePresence mode="popLayout">
            {(c.draft || c.analyzing) && (
              <DraftPanel
                key={c.id + (c.draft ?? '')}
                c={c}
                onDiscard={() => setTimeout(() => inputRef.current?.focus(), 250)}
              />
            )}
          </AnimatePresence>

          <motion.div layout className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-1.5 pl-2 shadow-soft focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/10">
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-3 hover:bg-surface-2 hover:text-ink">
              <Smile size={18} />
            </button>
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-3 hover:bg-surface-2 hover:text-ink">
              <Paperclip size={17} />
            </button>
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendManual()
                }
              }}
              placeholder={`Escribile a ${firstName(c.name)}…`}
              className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-[13.5px] text-ink outline-none placeholder:text-ink-3"
            />
            <button
              onClick={sendManual}
              disabled={!text.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink transition disabled:bg-surface-3 disabled:text-ink-3"
            >
              <SendHorizontal size={16} />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MeetingBanner({ c }: { c: Contact }) {
  const confirm = useStore((s) => s.confirmMeeting)
  const ignore = useStore((s) => s.ignoreMeeting)
  if (!c.meeting) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.35 }}
      className="mt-5 self-center overflow-hidden"
    >
      <div className="flex items-center gap-4 rounded-2xl border border-[#8a74b0]/25 bg-gradient-to-r from-[#8a74b0]/10 via-surface to-surface py-3 pr-3 pl-4 shadow-card backdrop-blur-xl">
        <motion.span
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8a74b0]/15 text-[20px]"
        >
          📅
        </motion.span>
        <div>
          <p className="text-[13px] text-ink">
            <b className="font-semibold">Detectamos una reunión:</b> {c.meeting.label}
          </p>
          <p className="text-[12px] text-ink-3">{c.meeting.detail} · ¿Mover a Reunión programada?</p>
        </div>
        <div className="ml-3 flex gap-1.5">
          <button
            onClick={() => ignore(c.id)}
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-ink-2 transition hover:bg-surface-2"
          >
            Ignorar
          </button>
          <button
            onClick={() => confirm(c.id)}
            className="flex items-center gap-1.5 rounded-lg bg-[#7a64a3] px-3 py-1.5 text-[12.5px] font-medium text-white shadow-soft transition hover:bg-[#6c5794]"
          >
            <CalendarCheck size={14} /> Confirmar
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function DraftPanel({ c, onDiscard }: { c: Contact; onDiscard: () => void }) {
  const draft = c.draft ?? ''
  const typedAlready = useStore((s) => !!s.typedDrafts[c.id + draft.length])
  const markTyped = useStore((s) => s.markTyped)
  const sendMessage = useStore((s) => s.sendMessage)
  const discardDraft = useStore((s) => s.discardDraft)
  const [n, setN] = useState(typedAlready ? draft.length : 0)
  const [phase, setPhase] = useState<'thinking' | 'typing' | 'done'>(typedAlready ? 'done' : 'thinking')
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(draft)

  useEffect(() => {
    if (c.analyzing || phase !== 'thinking') return
    const t = setTimeout(() => setPhase('typing'), 700)
    return () => clearTimeout(t)
  }, [c.analyzing, phase])

  useEffect(() => {
    if (phase !== 'typing') return
    let i = 0
    const iv = setInterval(() => {
      i += 2 + Math.floor(Math.random() * 3)
      setN(Math.min(i, draft.length))
      if (i >= draft.length) {
        clearInterval(iv)
        setPhase('done')
        markTyped(c.id + draft.length)
      }
    }, 24)
    return () => clearInterval(iv)
  }, [phase, draft, c.id, markTyped])

  const skip = () => {
    if (phase === 'typing') {
      setN(draft.length)
      setPhase('done')
      markTyped(c.id + draft.length)
    }
  }

  const cls = CLASSIFICATIONS[c.classification]
  const dev = devById(c.developmentId)
  const basis = [c.classification !== 'sin' ? cls.label : null, ...c.tags.slice(0, 2), dev.name].filter(Boolean) as string[]
  const ready = phase === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="ai-border ai-glow isolate mb-3 p-4"
    >
      <div className="flex items-center gap-2">
        <motion.span animate={{ rotate: phase === 'done' ? 0 : [0, 15, -10, 0] }} transition={{ duration: 1.4, repeat: phase === 'done' ? 0 : Infinity }}>
          <SparkleIcon size={17} />
        </motion.span>
        <span className="ai-text text-[12.5px] font-semibold">
          {c.draftKind === 'retomar' ? 'Borrador para retomar' : 'Borrador sugerido'}
        </span>
        <span className="text-[12px] text-ink-3">· requiere tu aprobación</span>
        <span className="ml-auto text-[11px] text-ink-3">
          {phase === 'thinking' ? (c.analyzing ? 'Esperando clasificación…' : 'Leyendo el contexto…') : phase === 'typing' ? 'Redactando…' : 'Listo para revisar'}
        </span>
      </div>

      <div className="mt-3 min-h-[64px]" onClick={skip}>
        {phase === 'thinking' ? (
          <div className="space-y-2 pt-1">
            <div className="shimmer h-3 w-[92%] rounded-full" />
            <div className="shimmer h-3 w-[80%] rounded-full" />
            <div className="shimmer h-3 w-[55%] rounded-full" />
          </div>
        ) : editing ? (
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-line bg-surface-2/60 p-3 text-[13.5px] leading-relaxed text-ink outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
          />
        ) : (
          <p className={cn('text-[13.5px] leading-relaxed text-ink', phase === 'typing' && 'caret')}>{draft.slice(0, n)}</p>
        )}
      </div>

      <AnimatePresence>
        {ready && !editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-ink-3">Basado en:</span>
            {basis.map((b) => (
              <span key={b} className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] text-ink-2">
                {b}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn('mt-3.5 flex items-center gap-2 transition-opacity', !ready && 'pointer-events-none opacity-40')}>
        {editing ? (
          <>
            <button
              onClick={() => sendMessage(c.id, value, { viaDraft: true, edited: value !== draft })}
              className="flex items-center gap-1.5 rounded-xl bg-accent-strong px-4 py-2 text-[13px] font-medium text-accent-ink shadow-soft transition hover:opacity-90 dark:bg-accent"
            >
              <SendHorizontal size={14} /> Enviar
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setValue(draft)
              }}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2"
            >
              <X size={14} /> Cancelar
            </button>
          </>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => sendMessage(c.id, draft, { viaDraft: true })}
              className="flex items-center gap-1.5 rounded-xl bg-accent-strong px-4 py-2 text-[13px] font-medium text-accent-ink shadow-[0_6px_16px_-6px_rgba(58,71,48,0.55)] transition hover:opacity-90 dark:bg-accent"
            >
              <Check size={15} strokeWidth={2.4} /> Enviar tal cual
            </motion.button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-[13px] font-medium text-ink transition hover:border-line-strong hover:bg-surface-2"
            >
              <Pencil size={14} /> Editar
            </button>
            <button
              onClick={() => {
                discardDraft(c.id)
                onDiscard()
              }}
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink"
            >
              <Eraser size={14} /> Descartar y escribir
            </button>
          </>
        )}
        <span className="ml-auto hidden text-[11px] text-ink-3 lg:inline">Se envía por {c.portal ?? (c.channel === 'mail' ? 'mail' : c.channel === 'instagram' ? 'Instagram' : 'WhatsApp')} como vos</span>
      </div>
    </motion.div>
  )
}
