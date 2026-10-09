import { create } from 'zustand'
import type { Campaign, CampaignDraft, Channel, Classification, Contact, ConversionEvent, StageId, Toast } from './types'
import { INITIAL_CONTACTS } from './data/mock'
import { ATTRIBUTION, GEN_CYCLE, INITIAL_CAMPAIGNS, INITIAL_DRAFTS, adText, buildDraft, campaignNameFor, resegment } from './data/attraction'
import { SIMULATIONS } from './data/simulations'
import { CHANNELS, CLASSIFICATIONS, stageById } from './data/config'
import { celebrate, chime, firstName } from './lib/utils'

export type View = 'inbox' | 'board' | 'attraction' | 'metrics'
export type AttractionTab = 'senales' | 'borradores' | 'campanas'
/** Filtro del tablero por origen: 'todos', 'pauta', un origen o 'camp:<id>' */
export type OriginFilter = string
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

  // ── Módulo de Atracción
  campaigns: Campaign[]
  drafts: CampaignDraft[]
  attractionTab: AttractionTab
  selectedDraftId: string
  campaignDrawerId: string | null
  generating: { step: number } | null
  genIndex: number
  signalFocus: string | null
  metaUnseen: number
  navBounce: number
  beams: { id: string; x: number; y: number }[]
  pendingDraftDiscard: string | null
  draftStats: { approved: number; edited: number; discarded: number; reasons: Record<string, number> }
  boardOrigin: OriginFilter

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

  setAttractionTab: (t: AttractionTab) => void
  selectDraft: (id: string) => void
  generateCampaign: (template?: string) => void
  approveDraft: (id: string) => void
  saveDraftEdit: (id: string, v: { text: string; budget: number; days: number }) => void
  requestDraftDiscard: (id: string) => void
  confirmDraftDiscard: (reason: string) => void
  cancelDraftDiscard: () => void
  openCampaign: (id: string | null) => void
  focusSignal: (id: string) => void
  reportConversion: (id: string, stage: StageId, from: StageId) => void
  removeBeam: (id: string) => void
  setBoardOrigin: (o: OriginFilter) => void
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
    contacts: INITIAL_CONTACTS.map((c) => ({ ...c, ...ATTRIBUTION[c.id] })),
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

    campaigns: INITIAL_CAMPAIGNS,
    drafts: INITIAL_DRAFTS,
    attractionTab: 'borradores',
    selectedDraftId: INITIAL_DRAFTS[0].id,
    campaignDrawerId: null,
    generating: null,
    genIndex: 0,
    signalFocus: null,
    metaUnseen: 0,
    navBounce: 0,
    beams: [],
    pendingDraftDiscard: null,
    draftStats: { approved: 0, edited: 0, discarded: 0, reasons: {} },
    boardOrigin: 'todos',

    login: () => set({ loggedIn: true }),
    setView: (view) => set({ view, drawerId: null, campaignDrawerId: null, ...(view === 'attraction' ? { metaUnseen: 0 } : {}) }),
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
      if (c.campaignId && ['reunion', 'realizada', 'reserva'].includes(stage)) get().reportConversion(id, stage, c.stage)
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
          campaignId: t.campaignId,
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
      set({ view: 'board', highlightId: id, drawerId: null, campaignDrawerId: null })
      setTimeout(() => {
        if (get().highlightId === id) set({ highlightId: null })
      }, 4000)
    },

    /* ───────── Módulo de Atracción */
    setAttractionTab: (attractionTab) => set({ attractionTab }),
    selectDraft: (selectedDraftId) => set({ selectedDraftId }),

    generateCampaign: (template) => {
      if (get().generating) return
      const i = get().genIndex
      const key = template ?? GEN_CYCLE[i % GEN_CYCLE.length]
      set({
        view: 'attraction',
        attractionTab: 'borradores',
        generating: { step: 0 },
        metaUnseen: 0,
        drawerId: null,
        campaignDrawerId: null,
            ...(template ? {} : { genIndex: i + 1 }),
      })
      ;[1, 2, 3].forEach((step) => setTimeout(() => set({ generating: { step } }), step * 950))
      setTimeout(() => {
        const d = buildDraft(key, Date.now(), { fresh: true })
        set((s) => ({ drafts: [d, ...s.drafts], selectedDraftId: d.id, generating: null }))
        if (get().sound) chime()
        setTimeout(() => set((s) => ({ drafts: s.drafts.map((x) => (x.id === d.id ? { ...x, fresh: false } : x)) })), 6000)
      }, 3 * 950 + 650)
    },

    approveDraft: (id) => {
      const d = get().drafts.find((x) => x.id === id)
      if (!d || d.status === 'aprobado' || d.status === 'descartado') return
      const campaign: Campaign = {
        id: `c-${d.id}`,
        name: campaignNameFor(d.template),
        developmentId: d.developmentId,
        typology: d.typology,
        profile: d.profile,
        status: 'activa',
        startedAt: Date.now(),
        days: d.days,
        budget: d.budget,
        spent: 0,
        inquiries: 0,
        meetingsScheduled: 0,
        meetingsDone: 0,
        reservations: 0,
        conversions: [],
        adText: adText(d.segments),
        fresh: true,
      }
      set((s) => ({
        drafts: s.drafts.map((x) => (x.id === id ? { ...x, status: 'aprobado', campaignId: campaign.id } : x)),
        campaigns: [campaign, ...s.campaigns],
        draftStats: d.edited ? { ...s.draftStats, edited: s.draftStats.edited + 1 } : { ...s.draftStats, approved: s.draftStats.approved + 1 },
      }))
      get().toast({
        title: 'Campaña aprobada · se publicaría en Meta',
        body: 'En el prototipo la publicación es simulada. Ya la ves en Campañas activas.',
        tone: 'success',
      })
      setTimeout(() => {
        if (get().view === 'attraction') set({ attractionTab: 'campanas' })
      }, 1600)
      setTimeout(() => set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === campaign.id ? { ...c, fresh: false } : c)) })), 8000)
    },

    saveDraftEdit: (id, v) => {
      set((s) => ({
        drafts: s.drafts.map((d) =>
          d.id === id
            ? { ...d, segments: resegment(v.text.trim(), d.segments), budget: v.budget, days: v.days, status: 'editado', edited: true }
            : d,
        ),
      }))
      get().toast({ title: 'Borrador editado', body: 'Guardamos tus cambios. Todavía falta aprobarlo para publicarlo.', tone: 'default' })
    },

    requestDraftDiscard: (id) => set({ pendingDraftDiscard: id }),
    confirmDraftDiscard: (reason) => {
      const id = get().pendingDraftDiscard
      set((s) => ({
        pendingDraftDiscard: null,
        drafts: s.drafts.map((d) => (d.id === id ? { ...d, status: 'descartado', discardReason: reason } : d)),
        draftStats: {
          ...s.draftStats,
          discarded: s.draftStats.discarded + 1,
          reasons: { ...s.draftStats.reasons, [reason]: (s.draftStats.reasons[reason] ?? 0) + 1 },
        },
      }))
      get().toast({ title: 'Borrador descartado', body: `Motivo: ${reason}. El agente aprende de este feedback.`, tone: 'muted' })
    },
    cancelDraftDiscard: () => set({ pendingDraftDiscard: null }),

    openCampaign: (campaignDrawerId) => set({ campaignDrawerId }),
    focusSignal: (id) => {
      set({ view: 'attraction', attractionTab: 'senales', signalFocus: id })
      setTimeout(() => {
        if (get().signalFocus === id) set({ signalFocus: null })
      }, 3800)
    },

    reportConversion: (id, stage, from) => {
      const c = byId(id)
      const camp = get().campaigns.find((x) => x.id === c?.campaignId)
      if (!c || !camp) return
      const event: ConversionEvent = stage === 'reunion' ? 'Reunión programada' : stage === 'realizada' ? 'Reunión realizada' : 'Reserva'
      const before = ['pendiente', 'respondida', 'conversacion', 'descartada'].includes(from)
      set((s) => ({
        campaigns: s.campaigns.map((x) =>
          x.id !== camp.id
            ? x
            : {
                ...x,
                ...(stage === 'reunion' || (stage === 'realizada' && before)
                  ? { prevCpm: x.meetingsScheduled ? x.spent / x.meetingsScheduled : undefined, droppedAt: Date.now() }
                  : {}),
                meetingsScheduled: x.meetingsScheduled + (stage === 'reunion' || (stage === 'realizada' && before) ? 1 : 0),
                meetingsDone: x.meetingsDone + (stage === 'realizada' ? 1 : 0),
                reservations: x.reservations + (stage === 'reserva' ? 1 : 0),
                conversions: [{ id: uid('cv'), contactId: id, name: c.name, event, at: Date.now() }, ...x.conversions],
              },
        ),
      }))
      if (stage === 'reserva') return

      // Partícula que viaja desde la tarjeta (o el chat) hasta Atracción en la sidebar
      const el = document.getElementById('card-' + id) ?? document.getElementById('chat-header')
      const r = el?.getBoundingClientRect()
      const beam = { id: uid('b'), x: r ? r.left + r.width / 2 : window.innerWidth / 2, y: r ? r.top + r.height / 2 : window.innerHeight / 2 }
      setTimeout(() => set((s) => ({ beams: [...s.beams, beam] })), 250)
      setTimeout(() => set((s) => ({ navBounce: s.navBounce + 1, metaUnseen: s.view === 'attraction' ? 0 : s.metaUnseen + 1 })), 1450)
      setTimeout(
        () => get().toast({ title: '↗ Conversión enviada a Meta', body: `${event} · Camp. ${camp.name}`, tone: 'meta', campaignId: camp.id }, 6000),
        700,
      )
    },
    removeBeam: (id) => set((s) => ({ beams: s.beams.filter((b) => b.id !== id) })),
    setBoardOrigin: (boardOrigin) => set({ boardOrigin }),
  }
})

/** Contacts that need a nudge */
export const staleThreshold = (stage: StageId) =>
  stage === 'pendiente' ? 1 : ['respondida', 'conversacion', 'realizada', 'propuesta'].includes(stage) ? 5 : Infinity

export const isStale = (c: Contact) => (Date.now() - c.stageSince) / 86_400_000 >= staleThreshold(c.stage)
