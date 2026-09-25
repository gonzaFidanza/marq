import { create } from 'zustand'
import type { Channel, Classification, Contact, StageId, Toast } from './types'
import { INITIAL_CONTACTS } from './data/mock'
import { SIMULATIONS } from './data/simulations'
import { CHANNELS, CLASSIFICATIONS, stageById } from './data/config'
import { celebrate, chime, firstName } from './lib/utils'

export type View = 'inbox' | 'board' | 'metrics'
export type Filter = 'todas' | Channel | 'sin_responder'

interface State {
  loggedIn: boolean
  view: View
  dark: boolean
  sound: boolean
  contacts: Contact[]
  selectedId: string
  filter: Filter
  search: string
  toasts: Toast[]
  remindersOpen: boolean
  drawerId: string | null
  highlightId: string | null
  simIndex: number
  typedDrafts: Record<string, boolean>
  pendingDiscard: string | null
  stats: { sentUnchanged: number; sentEdited: number }

  login: () => void
  setView: (v: View) => void
  toggleDark: () => void
  toggleSound: () => void
  select: (id: string) => void
  setFilter: (f: Filter) => void
  setSearch: (s: string) => void
  toast: (t: Omit<Toast, 'id'>, ms?: number) => void
  dismissToast: (id: string) => void
  markTyped: (id: string) => void
  sendMessage: (id: string, text: string, opts?: { viaDraft?: boolean; edited?: boolean }) => void
  discardDraft: (id: string) => void
  moveStage: (id: string, stage: StageId, opts?: { reason?: string; silent?: boolean }) => void
  requestDiscard: (id: string) => void
  confirmDiscard: (reason: string) => void
  cancelDiscard: () => void
  confirmMeeting: (id: string) => void
  ignoreMeeting: (id: string) => void
  setClassification: (id: string, c: Classification) => void
  simulateIncoming: () => void
  setRemindersOpen: (o: boolean) => void
  openFromReminder: (id: string) => void
  openDrawer: (id: string | null) => void
  showOnBoard: (id: string) => void
}

let tid = 0
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${tid++}`

const initialDark = (() => {
  try {
    return localStorage.getItem('marq-dark') === '1'
  } catch {
    return false
  }
})()
if (initialDark) document.documentElement.classList.add('dark')

export const useStore = create<State>((set, get) => {
  const patch = (id: string, fn: (c: Contact) => Partial<Contact>) =>
    set((s) => ({ contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...fn(c) } : c)) }))
  const byId = (id: string) => get().contacts.find((c) => c.id === id)

  return {
    loggedIn: false,
    view: 'inbox',
    dark: initialDark,
    sound: true,
    contacts: INITIAL_CONTACTS,
    selectedId: 'lucia',
    filter: 'todas',
    search: '',
    toasts: [],
    remindersOpen: false,
    drawerId: null,
    highlightId: null,
    simIndex: 0,
    typedDrafts: {},
    pendingDiscard: null,
    stats: { sentUnchanged: 0, sentEdited: 0 },

    login: () => set({ loggedIn: true }),
    setView: (view) => set({ view, drawerId: null }),
    toggleDark: () => {
      const dark = !get().dark
      document.documentElement.classList.toggle('dark', dark)
      try {
        localStorage.setItem('marq-dark', dark ? '1' : '0')
      } catch {
        /* ignore */
      }
      set({ dark })
    },
    toggleSound: () => set((s) => ({ sound: !s.sound })),
    select: (id) => {
      patch(id, () => ({ unread: 0 }))
      set({ selectedId: id, view: 'inbox', drawerId: null })
    },
    setFilter: (filter) => set({ filter }),
    setSearch: (search) => set({ search }),

    toast: (t, ms = 4800) => {
      const id = uid('t')
      set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }))
      setTimeout(() => get().dismissToast(id), ms)
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    markTyped: (id) => set((s) => ({ typedDrafts: { ...s.typedDrafts, [id]: true } })),

    sendMessage: (id, text, opts = {}) => {
      const c = byId(id)
      if (!c || !text.trim()) return
      patch(id, (c) => ({
        messages: [
          ...c.messages,
          { id: uid('m'), from: 'agent', text: text.trim(), at: Date.now(), by: 'candelaria', viaDraft: opts.viaDraft, edited: opts.edited },
        ],
        draft: undefined,
      }))
      if (opts.viaDraft) {
        set((s) => ({
          stats: opts.edited
            ? { ...s.stats, sentEdited: s.stats.sentEdited + 1 }
            : { ...s.stats, sentUnchanged: s.stats.sentUnchanged + 1 },
        }))
      }
      if (c.stage === 'pendiente') {
        setTimeout(() => get().moveStage(id, 'respondida'), 650)
      } else if (c.draftKind === 'retomar' && opts.viaDraft) {
        patch(id, () => ({ stageSince: Date.now() }))
        get().toast({ title: `Retomaste el contacto con ${firstName(c.name)}`, body: 'Reiniciamos el contador de seguimiento.', tone: 'success' })
      }
      // Scripted reply for the demo
      const fu = c.followUp
      if (fu) {
        patch(id, () => ({ followUp: undefined }))
        setTimeout(() => patch(id, () => ({ contactTyping: true })), Math.max(900, fu.delay - 2200))
        setTimeout(() => {
          const selected = get().selectedId === id && get().view === 'inbox'
          patch(id, (c) => ({
            contactTyping: false,
            messages: [...c.messages, { id: uid('m'), from: 'contact', text: fu.text, at: Date.now() }],
            meeting: fu.meeting ?? null,
            unread: selected ? 0 : c.unread + 1,
          }))
          if (get().sound) chime()
          if (!selected) {
            get().toast({
              title: `${firstName(c.name)} respondió`,
              body: fu.text,
              tone: 'incoming',
              channel: c.channel,
              action: { label: 'Abrir', contactId: id },
            })
          }
        }, fu.delay)
      }
    },

    discardDraft: (id) => patch(id, () => ({ draft: undefined })),

    moveStage: (id, stage, opts = {}) => {
      const c = byId(id)
      if (!c || c.stage === stage) return
      const label = stageById(stage).label
      patch(id, (c) => ({
        stage,
        stageSince: Date.now(),
        meeting: null,
        discardReason: opts.reason ?? (stage === 'descartada' ? c.discardReason : undefined),
        history: [
          { id: uid('h'), date: 'Ahora', title: `Movido a ${label}`, kind: stage === 'reserva' ? 'compra' : 'sistema', detail: opts.reason },
          ...c.history,
        ],
      }))
      if (opts.silent) return
      if (stage === 'reserva') {
        celebrate()
        get().toast({ title: `¡Reserva de ${firstName(c.name)}! 🎉`, body: 'Excelente trabajo. Lo sumamos a las métricas del mes.', tone: 'celebrate' })
      } else if (stage === 'descartada') {
        get().toast({ title: `${firstName(c.name)} pasó a Descartada`, body: `Motivo: ${opts.reason}`, tone: 'muted' })
      } else {
        get().toast({ title: `Movimos a ${firstName(c.name)} a ${label}`, tone: 'success' })
      }
    },

    requestDiscard: (id) => set({ pendingDiscard: id }),
    confirmDiscard: (reason) => {
      const id = get().pendingDiscard
      set({ pendingDiscard: null })
      if (id) get().moveStage(id, 'descartada', { reason })
    },
    cancelDiscard: () => set({ pendingDiscard: null }),

    confirmMeeting: (id) => {
      const c = byId(id)
      if (!c?.meeting) return
      const m = c.meeting
      get().moveStage(id, 'reunion')
      patch(id, (c) => ({
        history: [{ id: uid('h'), date: m.label, title: 'Reunión agendada', kind: 'reunion', detail: m.detail }, ...c.history],
      }))
    },
    ignoreMeeting: (id) => patch(id, () => ({ meeting: null })),

    setClassification: (id, classification) => {
      patch(id, () => ({ classification, confidence: 1 }))
      get().toast({
        title: `Clasificación actualizada: ${CLASSIFICATIONS[classification].label}`,
        body: 'El asistente aprende de tus correcciones.',
        tone: 'default',
      })
    },

    simulateIncoming: () => {
      const i = get().simIndex
      const t = SIMULATIONS[i % SIMULATIONS.length]
      const id = `sim-${i}`
      const now = Date.now()
      const { incoming, ...rest } = t
      const contact: Contact = {
        ...rest,
        id,
        messages: incoming.map((text, k) => ({ id: uid('m'), from: 'contact', text, at: now - (incoming.length - k) * 1000 })),
        stage: 'pendiente',
        stageSince: now,
        unread: 1,
        assignee: 'candelaria',
        analyzing: true,
        fresh: true,
      }
      const inInbox = get().view === 'inbox'
      set((s) => ({
        simIndex: i + 1,
        contacts: [contact, ...s.contacts],
        ...(inInbox ? { selectedId: id } : {}),
      }))
      if (get().sound) chime()
      get().toast(
        {
          title: `Nueva consulta por ${t.portal ?? CHANNELS[t.channel].label}`,
          body: `${t.name}: “${incoming[0].length > 70 ? incoming[0].slice(0, 70) + '…' : incoming[0]}”`,
          tone: 'incoming',
          channel: t.channel,
          action: inInbox ? undefined : { label: 'Ver conversación', contactId: id },
        },
        6000,
      )
      if (inInbox) setTimeout(() => patch(id, () => ({ unread: 0 })), 1200)
      setTimeout(() => patch(id, () => ({ analyzing: false })), 2600)
      setTimeout(() => patch(id, () => ({ fresh: false })), 6500)
    },

    setRemindersOpen: (remindersOpen) => set({ remindersOpen }),
    openFromReminder: (id) => {
      set({ remindersOpen: false })
      get().select(id)
    },
    openDrawer: (drawerId) => set({ drawerId }),
    showOnBoard: (id) => {
      set({ view: 'board', highlightId: id, drawerId: null })
      setTimeout(() => {
        if (get().highlightId === id) set({ highlightId: null })
      }, 4000)
    },
  }
})

/** Contacts that need a nudge */
export const staleThreshold = (stage: StageId) =>
  stage === 'pendiente' ? 1 : ['respondida', 'conversacion', 'realizada', 'propuesta'].includes(stage) ? 5 : Infinity

export const isStale = (c: Contact) => (Date.now() - c.stageSince) / 86_400_000 >= staleThreshold(c.stage)
