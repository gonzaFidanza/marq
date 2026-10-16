import { useCallback } from 'react'
import { create } from 'zustand'
import type { Campaign, CampaignDraft, CampaignObjective, Channel, Classification, Contact, ConversionEvent, PendingPrice, PriceChange, RadarRetake, StageId, Toast } from './types'
import { INITIAL_CONTACTS } from './data/mock'
import { ATTRIBUTION, GEN_CYCLE, INITIAL_CAMPAIGNS, INITIAL_DRAFTS, adText, brandVariant, buildDraft, campaignNameForDraft, consultasVariant, objectiveOf, resegment } from './data/attraction'
import { SIMULATIONS } from './data/simulations'
import { CHANNELS, CLASSIFICATIONS, DEV_STAGES, INITIAL_PRICES, devById, listPriceKey, priceKey, stageById, type PriceList } from './data/config'
import { LISTING_PORTALS, PRICE_DEMOS, WEBSITE, affectedBy, alternativeFor, arrivesLate, fillPrices, radarDraft, radarReply, roundPrice, stageDraft, stageWhen, timelineDraft, tokenizePrices, upcomingStages } from './data/pricing'
import { celebrate, chime, firstName, usd } from './lib/utils'

export type View = 'hoy' | 'inbox' | 'board' | 'attraction' | 'metrics'
/** Contador elegido en Hoy en MARQ */
export type TodayTab = 'responder' | 'seguimiento'
export type AttractionTab = 'senales' | 'borradores' | 'campanas'
/** Filtro del tablero por origen: 'todos', 'pauta', un origen o 'camp:<id>' */
export type OriginFilter = string
export type Filter = 'todas' | Channel | 'sin_responder'

interface State {
  loggedIn: boolean
  view: View
  todayTab: TodayTab | null
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

  // ── Lista de precios
  prices: PriceList
  priceHistory: PriceChange[]
  pricesOpen: boolean
  priceFocus: string | null
  pendingPrice: PendingPrice | null
  priceDemoIndex: number
  radarLog: RadarRetake[]
  /** Desarrollo cuyo aviso de cambio de etapa se está revisando */
  pendingStage: string | null
  /** Avisos de cambio de etapa ya preparados, por desarrollo */
  stageAlerts: Record<string, { at: number; count: number }>

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
  setDraftObjective: (id: string, objective: CampaignObjective) => void
  requestDraftDiscard: (id: string) => void
  confirmDraftDiscard: (reason: string) => void
  cancelDraftDiscard: () => void
  openCampaign: (id: string | null) => void
  focusSignal: (id: string) => void
  reportConversion: (id: string, stage: StageId, from: StageId) => void
  removeBeam: (id: string) => void
  setBoardOrigin: (o: OriginFilter) => void

  openPrices: (focus?: string | null) => void
  closePrices: () => void
  previewPrice: (p: PendingPrice) => void
  cancelPrice: () => void
  confirmPrice: (radarIds: string[]) => void
  simulatePriceChange: () => void

  previewStage: (developmentId: string) => void
  cancelStage: () => void
  confirmStage: (contactIds: string[]) => void
  simulateStageChange: () => void
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
    view: 'hoy',
    todayTab: null,
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

    prices: INITIAL_PRICES,
    priceHistory: [],
    pricesOpen: false,
    priceFocus: null,
    pendingPrice: null,
    priceDemoIndex: 0,
    radarLog: [],
    pendingStage: null,
    stageAlerts: {},

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
      if (c.stage === 'pendiente' || (c.stage === 'descartada' && c.draftKind === 'retomar' && opts.viaDraft)) {
        // Una consulta respondida, o un contacto descartado que se retoma (por ejemplo, desde el radar de precios)
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
        name: campaignNameForDraft(d),
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
        objective: objectiveOf(d),
        ...(d.objective === 'marca' ? { reach: 0, impressions: 0 } : {}),
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

    setDraftObjective: (id, objective) => {
      set((s) => ({
        drafts: s.drafts.map((d) => {
          if (d.id !== id || objectiveOf(d) === objective) return d
          const from = objectiveOf(d)
          const leaving = { segments: d.segments, cta: d.cta, reasoning: d.reasoning, profile: d.profile }
          const next =
            d.stash?.[objective] ?? (objective === 'marca' ? brandVariant(d.developmentId, d.budget, d.days) : consultasVariant(d.developmentId, d.typology, d.budget, d.days))
          return { ...d, ...next, objective, stash: { ...d.stash, [from]: leaving } }
        }),
      }))
    },

    saveDraftEdit: (id, v) => {
      set((s) => ({
        drafts: s.drafts.map((d) =>
          d.id === id
            ? {
                ...d,
                segments: resegment(tokenizePrices(v.text.trim(), s.prices, d.developmentId), d.segments),
                budget: v.budget,
                days: v.days,
                status: 'editado',
                edited: true,
              }
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
      // Cada contacto suma una sola vez por evento: ir y volver entre etapas no vuelve a contar
      const sent = new Set(camp.conversions.filter((x) => x.contactId === id).map((x) => x.event))
      const pastMeeting = ['reunion', 'realizada', 'propuesta', 'reserva'].includes(from)
      const pastDone = ['propuesta', 'reserva'].includes(from)
      const addScheduled =
        (stage === 'reunion' || stage === 'realizada') && !pastMeeting && !sent.has('Reunión programada') && !sent.has('Reunión realizada')
      const addDone = stage === 'realizada' && !pastDone && !sent.has('Reunión realizada')
      const addReservation = stage === 'reserva' && !sent.has('Reserva')
      if (!addScheduled && !addDone && !addReservation) return
      set((s) => ({
        campaigns: s.campaigns.map((x) =>
          x.id !== camp.id
            ? x
            : {
                ...x,
                ...(addScheduled
                  ? { prevCpm: x.meetingsScheduled ? x.spent / x.meetingsScheduled : undefined, droppedAt: Date.now() }
                  : {}),
                meetingsScheduled: x.meetingsScheduled + (addScheduled ? 1 : 0),
                meetingsDone: x.meetingsDone + (addDone ? 1 : 0),
                reservations: x.reservations + (addReservation ? 1 : 0),
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

    /* ───────── Lista de precios */
    openPrices: (focus = null) => set({ pricesOpen: true, priceFocus: focus, drawerId: null, campaignDrawerId: null, remindersOpen: false }),
    closePrices: () => set({ pricesOpen: false, priceFocus: null }),
    previewPrice: (pendingPrice) => set({ pendingPrice }),
    cancelPrice: () => set({ pendingPrice: null }),

    confirmPrice: (radarIds) => {
      const p = get().pendingPrice
      if (!p) return
      const key = priceKey(p.developmentId, p.typology)
      const from = get().prices[key]
      set({ pendingPrice: null })
      if (!p.to || p.to === from) return
      const change: PriceChange = { id: uid('pc'), key, developmentId: p.developmentId, typology: p.typology, from, to: p.to, at: Date.now() }
      const hit = affectedBy(key, get())
      // Los borradores y anuncios guardan una marca de precio: al cambiar la lista, se actualizan solos
      set((s) => ({
        prices: { ...s.prices, [key]: p.to },
        priceHistory: [change, ...s.priceHistory],
        priceFocus: key,
        radarLog: [
          ...radarIds.map((contactId) => ({
            id: uid('rr'),
            contactId,
            at: change.at,
            label: `Bajó ${p.typology} en ${devById(p.developmentId).neighborhood} · ${usd(from)} → ${usd(p.to)}`,
          })),
          ...s.radarLog,
        ],
      }))

      radarIds.forEach((id) =>
        patch(id, (c) => {
          const reply = radarReply(c, change)
          return {
            draft: radarDraft(c, change, get().prices),
            draftKind: 'retomar',
            fresh: true,
            ...(reply ? { followUp: reply } : {}),
            history: [
              { id: uid('h'), date: 'Ahora', title: `Bajó el precio · ${p.typology}`, kind: 'sistema', detail: `${usd(from)} → ${usd(p.to)} · sugerido por el radar` },
              ...c.history,
            ],
          }
        }),
      )
      if (radarIds.length)
        setTimeout(() => set((s) => ({ contacts: s.contacts.map((c) => (radarIds.includes(c.id) ? { ...c, fresh: false } : c)) })), 6500)

      const updated = hit.replies.length + hit.campaignDrafts.length
      get().toast({
        title: `Nuevo precio · ${devById(p.developmentId).name}, ${p.typology}`,
        body: `${usd(from)} → ${usd(p.to)}. ${updated ? `Actualizamos ${updated} ${updated === 1 ? 'borrador pendiente' : 'borradores pendientes'}.` : 'La lista de precios ya está al día.'}`,
        tone: 'success',
      })
      const ads = hit.ads.length ? [`${hit.ads.length} ${hit.ads.length === 1 ? 'anuncio' : 'anuncios'} en Meta`] : []
      setTimeout(() => get().toast({ title: '↗ Avisos actualizados', body: [...ads, `avisos en ${LISTING_PORTALS.join(' y ')}`].join(' · '), tone: 'meta' }, 6000), 450)
      setTimeout(
        () =>
          get().toast(
            {
              title: '↗ Sitio web actualizado',
              body: `${devById(p.developmentId).name}, ${p.typology}: ${usd(p.to)} en ${WEBSITE.host}`,
              tone: 'meta',
            },
            6000,
          ),
        850,
      )
      if (radarIds.length)
        setTimeout(
          () =>
            get().toast(
              {
                title: radarIds.length === 1 ? '1 borrador para retomar' : `${radarIds.length} borradores para retomar`,
                body: 'Los preparó el radar y ya están en la Bandeja. Nada se envía sin tu aprobación.',
                action: { label: 'Revisar', contactId: radarIds[0] },
              },
              7000,
            ),
          1250,
        )
    },

    simulatePriceChange: () => {
      if (get().pendingPrice) return
      const i = get().priceDemoIndex
      const demo = PRICE_DEMOS[i % PRICE_DEMOS.length]
      const from = get().prices[priceKey(demo.developmentId, demo.typology)]
      set({
        priceDemoIndex: i + 1,
        drawerId: null,
        campaignDrawerId: null,
        remindersOpen: false,
        pendingPrice: { developmentId: demo.developmentId, typology: demo.typology, to: roundPrice(from * (1 + demo.pct)) },
      })
    },

    /* ───────── Cambio de etapa */
    previewStage: (pendingStage) => set({ pendingStage, drawerId: null, campaignDrawerId: null, remindersOpen: false }),
    cancelStage: () => set({ pendingStage: null }),

    confirmStage: (contactIds) => {
      const id = get().pendingStage
      set({ pendingStage: null })
      const dev = id ? devById(id) : null
      const ns = dev?.nextStage
      if (!dev || !ns) return
      const now = Date.now()
      const when = `${dev.neighborhood} pasa a ${DEV_STAGES[ns.to].short.toLowerCase()} ${stageWhen(ns.at)}`
      contactIds.forEach((cid) =>
        patch(cid, (c) => {
          // Si no puede esperar esa entrega, en vez del aviso va una sugerencia que llegue a tiempo
          const alt = arrivesLate(c, dev) ? alternativeFor(c, get().prices) : null
          return {
            draft: alt ? timelineDraft(c, alt) : stageDraft(c, dev, get().prices),
            draftKind: 'retomar',
            fresh: true,
            history: [
              {
                id: uid('h'),
                date: 'Ahora',
                title: alt ? 'Sugerencia por plazo de entrega' : 'Aviso de cambio de etapa',
                kind: 'sistema',
                detail: `${when} · +${Math.round(ns.increase * 100)}%`,
              },
              ...c.history,
            ],
          }
        }),
      )
      set((s) => ({
        stageAlerts: { ...s.stageAlerts, [dev.id]: { at: now, count: contactIds.length } },
        radarLog: [
          ...contactIds.map((contactId) => ({ id: uid('rr'), contactId, at: now, label: `${when} · +${Math.round(ns.increase * 100)}%` })),
          ...s.radarLog,
        ],
      }))
      if (contactIds.length)
        setTimeout(() => set((s) => ({ contacts: s.contacts.map((c) => (contactIds.includes(c.id) ? { ...c, fresh: false } : c)) })), 6500)
      get().toast(
        {
          title: contactIds.length === 1 ? '1 aviso de cambio de etapa' : `${contactIds.length} avisos de cambio de etapa`,
          body: `${dev.name} pasa a ${DEV_STAGES[ns.to].short.toLowerCase()} ${stageWhen(ns.at)}. Los borradores están en la Bandeja: nada se envía sin tu aprobación.`,
          tone: 'success',
          action: contactIds.length ? { label: 'Revisar', contactId: contactIds[0] } : undefined,
        },
        7000,
      )
    },

    simulateStageChange: () => {
      if (get().pendingStage || get().pendingPrice) return
      const next = upcomingStages()[0]
      if (next) get().previewStage(next.id)
    },
  }
})

/** Completa las marcas de precio de un texto con la lista vigente */
export function useFillPrices() {
  const prices = useStore((s) => s.prices)
  return useCallback((text: string) => fillPrices(text, prices), [prices])
}

/** Precio vigente de una tipología */
export const usePrice = (developmentId: string, typology: string) => useStore((s) => s.prices[listPriceKey(developmentId, typology)])

/** Último cambio confirmado de una tipología, si lo hubo */
export const useLastPriceChange = (developmentId: string, typology: string) =>
  useStore((s) => s.priceHistory.find((p) => p.key === listPriceKey(developmentId, typology)))

/** Contacts that need a nudge */
export const staleThreshold = (stage: StageId) =>
  stage === 'pendiente' ? 1 : ['respondida', 'conversacion', 'realizada', 'propuesta'].includes(stage) ? 5 : Infinity

export const isStale = (c: Contact) => (Date.now() - c.stageSince) / 86_400_000 >= staleThreshold(c.stage)

/** El último mensaje es del contacto: la consulta espera respuesta */
export const needsReply = (c: Contact) => c.messages[c.messages.length - 1]?.from === 'contact' && c.stage !== 'descartada'
