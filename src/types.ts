export type Channel = 'whatsapp' | 'instagram' | 'mail' | 'portal'
export type Classification = 'conocido' | 'previo' | 'nuevo' | 'sin'
export type StageId =
  | 'pendiente'
  | 'respondida'
  | 'conversacion'
  | 'reunion'
  | 'realizada'
  | 'propuesta'
  | 'reserva'
  | 'descartada'

export interface Message {
  id: string
  from: 'contact' | 'agent'
  text: string
  at: number
  by?: string
  viaDraft?: boolean
  edited?: boolean
}

export interface HistoryItem {
  id: string
  date: string
  title: string
  detail?: string
  kind: 'consulta' | 'visita' | 'compra' | 'mensaje' | 'reunion' | 'propuesta' | 'sistema'
}

export interface MeetingSuggestion {
  label: string
  detail: string
}

export interface FollowUp {
  text: string
  delay: number
  meeting?: MeetingSuggestion
}

export interface Contact {
  id: string
  name: string
  channel: Channel
  portal?: string
  handle?: string
  phone?: string
  email?: string
  classification: Classification
  confidence: number
  tags: string[]
  developmentId: string
  typology: string
  stage: StageId
  stageSince: number
  assignee: string
  messages: Message[]
  unread: number
  history: HistoryItem[]
  summary: string
  hue: number
  draft?: string
  draftKind?: 'respuesta' | 'retomar'
  meeting?: MeetingSuggestion | null
  discardReason?: string
  analyzing?: boolean
  fresh?: boolean
  followUp?: FollowUp
  contactTyping?: boolean
  /** Atribución: campaña de pauta que lo trajo */
  campaignId?: string
  /** Origen cuando no viene de pauta */
  origin?: Origin
  originDate?: string
}

export type Origin = 'campana' | 'recomendacion' | 'organico' | 'portal' | 'cliente'
export type Profile = 'primera' | 'inversor' | 'conocido' | 'recomendado' | 'amplio'
export type CampaignStatus = 'activa' | 'pausada' | 'finalizada'
export type ConversionEvent = 'Reunión programada' | 'Reunión realizada' | 'Reserva'

export interface Conversion {
  id: string
  contactId?: string
  name: string
  event: ConversionEvent
  at: number
}

export interface Campaign {
  id: string
  name: string
  developmentId: string
  typology: string
  profile: Profile
  status: CampaignStatus
  startedAt: number
  days: number
  budget: number
  spent: number
  inquiries: number
  meetingsScheduled: number
  meetingsDone: number
  reservations: number
  conversions: Conversion[]
  adText: string
  fresh?: boolean
  /** Costo por reunión antes de la última conversión, para animar la baja */
  prevCpm?: number
  droppedAt?: number
}

/** Tramo del texto de un anuncio. Si tiene `q`, responde una pregunta frecuente. */
export interface AdSegment {
  t: string
  q?: string
  pct?: number
}

export type DraftStatus = 'pendiente' | 'aprobado' | 'editado' | 'descartado'

export interface CampaignDraft {
  id: string
  template: string
  developmentId: string
  typology: string
  profile: Profile
  budget: number
  days: number
  status: DraftStatus
  edited?: boolean
  createdAt: number
  segments: AdSegment[]
  cta: 'Enviar mensaje' | 'Más información'
  reasoning: string
  signals: { id: string; label: string }[]
  discardReason?: string
  campaignId?: string
  fresh?: boolean
}

export interface Development {
  id: string
  name: string
  neighborhood: string
  address: string
  status: string
  delivery: string
  progress: number
  image: string
  gradient: string
  typologies: { label: string; from: number }[]
}

export interface Toast {
  id: string
  title: string
  body?: string
  tone?: 'default' | 'success' | 'incoming' | 'celebrate' | 'muted' | 'meta'
  channel?: Channel
  campaignId?: string
  action?: { label: string; contactId: string }
}
