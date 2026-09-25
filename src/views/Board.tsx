import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Hand, AlarmClock } from 'lucide-react'
import { isStale, useStore } from '../store'
import { STAGES, TEAM, devById } from '../data/config'
import type { Contact, StageId } from '../types'
import { Avatar, ChannelIcon, ClassChip, TeamAvatar } from '../components/ui'
import { cn, daysIn, stageAgeLabel } from '../lib/utils'

export function Board() {
  const contacts = useStore((s) => s.contacts)
  const moveStage = useStore((s) => s.moveStage)
  const requestDiscard = useStore((s) => s.requestDiscard)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [assignee, setAssignee] = useState<string>('todos')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const byStage = useMemo(() => {
    const r = Object.fromEntries(STAGES.map((s) => [s.id, [] as Contact[]])) as Record<StageId, Contact[]>
    contacts
      .filter((c) => assignee === 'todos' || c.assignee === assignee)
      .forEach((c) => r[c.stage].push(c))
    Object.values(r).forEach((l) => l.sort((a, b) => b.stageSince - a.stageSince))
    return r
  }, [contacts, assignee])

  const active = activeId ? contacts.find((c) => c.id === activeId) : null

  const onStart = (e: DragStartEvent) => setActiveId(String(e.active.id))
  const onEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const id = String(e.active.id)
    const to = e.over?.id as StageId | undefined
    const c = contacts.find((x) => x.id === id)
    if (!to || !c || c.stage === to) return
    if (to === 'descartada') requestDiscard(id)
    else moveStage(id, to)
  }

  const staleTotal = contacts.filter(isStale).length

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-3 px-7 pt-5 pb-4">
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface/70 p-1 shadow-soft">
          {['todos', ...Object.keys(TEAM)].map((id) => (
            <button
              key={id}
              onClick={() => setAssignee(id)}
              className={cn(
                'relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                assignee === id ? 'text-ink' : 'text-ink-3 hover:text-ink',
              )}
            >
              {assignee === id && (
                <motion.span layoutId="assignee-pill" className="absolute inset-0 rounded-lg bg-surface-2 shadow-soft" />
              )}
              <span className="relative flex items-center gap-1.5">
                {id === 'todos' ? 'Todo el equipo' : (
                  <>
                    <TeamAvatar id={id} size={18} className="ring-0" />
                    {TEAM[id].name.split(' ')[0]}
                  </>
                )}
              </span>
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#c0673f]/10 px-3 py-1.5 text-[12px] font-medium text-[#b0603c]">
          <AlarmClock size={13} /> {staleTotal} contactos sin novedades
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-ink-3">
          <Hand size={13} /> Arrastrá las tarjetas para cambiarlas de etapa
        </span>
      </div>

      <DndContext sensors={sensors} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActiveId(null)}>
        <div className="scroll-soft flex min-h-0 flex-1 gap-3.5 overflow-x-auto px-7 pb-6">
          {STAGES.map((s, i) => (
            <Column key={s.id} stage={s.id} items={byStage[s.id]} index={i} activeFrom={active?.stage ?? null} />
          ))}
          <div className="w-2 shrink-0" />
        </div>
        {createPortal(
        <DragOverlay dropAnimation={null} zIndex={90}>
          {active ? (
            <motion.div initial={{ rotate: 0, scale: 1 }} animate={{ rotate: 3, scale: 1.04 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <CardBody c={active} overlay />
            </motion.div>
          ) : null}
        </DragOverlay>,
        document.body,
        )}
      </DndContext>
    </div>
  )
}

function Column({ stage, items, index, activeFrom }: { stage: StageId; items: Contact[]; index: number; activeFrom: StageId | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const s = STAGES.find((x) => x.id === stage)!
  const Icon = s.icon
  const showPlaceholder = isOver && activeFrom && activeFrom !== stage
  const special = stage === 'reserva' ? 'reserva' : stage === 'descartada' ? 'descartada' : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      ref={setNodeRef}
      className={cn(
        'flex w-[292px] shrink-0 flex-col rounded-[26px] border transition-all duration-200',
        isOver && activeFrom !== stage ? 'scale-[1.01]' : 'border-line',
        special === 'reserva' && !isOver && 'bg-gradient-to-b from-[#b8963e]/[0.07] to-surface-2/40',
        special === 'descartada' && !isOver && 'bg-surface-2/30 opacity-90',
        !special && !isOver && 'bg-surface-2/50',
      )}
      style={
        isOver && activeFrom !== stage
          ? { background: s.color + '14', borderColor: s.color + '66', boxShadow: `0 0 0 4px ${s.color}14, 0 20px 40px -20px ${s.color}55` }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: s.color + '1c', color: s.color }}>
          <Icon size={14} />
        </span>
        <p className="text-[13px] font-semibold text-ink">{s.label}</p>
        <motion.span
          key={items.length}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          className="ml-auto flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-surface px-1.5 text-[11px] font-semibold text-ink-2 shadow-soft"
        >
          {items.length}
        </motion.span>
      </div>
      <div className="scroll-soft flex min-h-[120px] flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3">
        <AnimatePresence>
          {showPlaceholder && (
            <motion.div
              key="ph"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 132 }}
              exit={{ opacity: 0, height: 0 }}
              className="shrink-0 rounded-2xl border-2 border-dashed"
              style={{ borderColor: s.color + '66', background: s.color + '0d' }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {items.map((c) => (
            <DraggableCard key={c.id} c={c} />
          ))}
        </AnimatePresence>
        {items.length === 0 && !showPlaceholder && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line py-8 text-[12px] text-ink-3">
            Soltá una tarjeta acá
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DraggableCard({ c }: { c: Contact }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: c.id })
  const openDrawer = useStore((s) => s.openDrawer)
  const highlight = useStore((s) => s.highlightId === c.id)

  useEffect(() => {
    if (highlight) document.getElementById('card-' + c.id)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }, [highlight, c.id])

  return (
    <motion.div
      layout
      id={'card-' + c.id}
      initial={c.fresh ? { opacity: 0, y: -60, scale: 0.8, rotate: -4 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: -10 }}
      transition={{ type: 'spring', stiffness: 360, damping: c.fresh ? 18 : 30 }}
      className="shrink-0"
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={() => openDrawer(c.id)}
        className={cn('cursor-grab rounded-2xl outline-none active:cursor-grabbing', (c.fresh || highlight) && 'glow-new')}
      >
        <CardBody c={c} ghost={isDragging} />
      </div>
    </motion.div>
  )
}

function CardBody({ c, overlay, ghost }: { c: Contact; overlay?: boolean; ghost?: boolean }) {
  const dev = devById(c.developmentId)
  const d = daysIn(c.stageSince)
  const stale = isStale(c)
  const hot = d >= 8
  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-surface p-3.5 transition-all duration-200',
        overlay ? 'border-line-strong shadow-lift' : 'border-line shadow-soft hover:-translate-y-0.5 hover:shadow-card',
        ghost && 'border-dashed opacity-30 shadow-none',
        c.stage === 'descartada' && !overlay && 'opacity-75',
      )}
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={c.name} hue={c.hue} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{c.name}</p>
          <p className="flex items-center gap-1 text-[11px] text-ink-3">
            <ChannelIcon channel={c.channel} size={11} />
            {c.portal ?? (c.channel === 'whatsapp' ? 'WhatsApp' : c.channel === 'instagram' ? 'Instagram' : 'Mail')}
          </p>
        </div>
        <TeamAvatar id={c.assignee} size={22} />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <ClassChip value={c.classification} size="xs" analyzing={c.analyzing} />
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-ink-2">
        <Building2 size={12} className="text-ink-3" />
        <span className="truncate">
          {dev.name} · {c.typology}
        </span>
      </p>
      {c.discardReason && c.stage === 'descartada' && (
        <p className="mt-2 inline-flex rounded-md bg-surface-3 px-1.5 py-0.5 text-[10.5px] text-ink-2">Motivo: {c.discardReason}</p>
      )}
      <div className="mt-3 flex items-center border-t border-line pt-2.5">
        {stale ? (
          <span
            className="flex items-center gap-1.5 text-[11px] font-medium"
            style={{ color: hot ? '#c0573f' : '#b27f2f' }}
          >
            <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: 'currentColor' }} />⏰{' '}
            {c.stage === 'pendiente' ? `Sin responder hace ${d} días` : `Sin novedades hace ${d} días`}
          </span>
        ) : (
          <span className="text-[11px] text-ink-3">{stageAgeLabel(c.stageSince)}</span>
        )}
        {c.draft && !c.analyzing && <span className="ml-auto text-[11px]" title="Borrador listo">✨</span>}
      </div>
    </div>
  )
}
