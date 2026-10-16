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
  /** Para cuándo necesita la unidad */
  timeline?: Timeline
}

export type Origin = 'campana' | 'recomendacion' | 'organico' | 'portal' | 'cliente'
export type Profile = 'primera' | 'inversor' | 'conocido' | 'recomendado' | 'amplio'
export type CampaignStatus = 'activa' | 'pausada' | 'finalizada'
/** Qué busca la campaña: consultas que avancen, o que se conozca a MARQ */
export type CampaignObjective = 'consultas' | 'marca'
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
  objective?: CampaignObjective
  /** Solo marca: personas distintas alcanzadas e impresiones totales */
  reach?: number
  impressions?: number
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

/** Lo que cambia en un borrador al cambiar de objetivo */
export interface DraftVariant {
  segments: AdSegment[]
  cta: 'Enviar mensaje' | 'Más información'
  reasoning: string
  profile: Profile
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
  objective?: CampaignObjective
  /** Versión del otro objetivo, para volver sin perder lo que había */
  stash?: Partial<Record<CampaignObjective, DraftVariant>>
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
  /** Etapa comercial: el precio sube en cada paso */
  stage: DevStage
  /** Fecha de entrega (posesión) */
  deliveryAt: number
  /** Próximo cambio de etapa y cuánto suben los valores */
  nextStage?: { to: DevStage; at: number; increase: number }
  /** Edificio de departamentos o loteo: cambia cómo se nombra la unidad */
  kind: 'edificio' | 'loteo' | 'casas'
  /** Entrega inicial, cuotas y descuento por pago contado, si lo hay */
  financing?: { entrega: number; cuotas: number; contado?: number }
  /** Qué parte de la foto mostrar cuando se recorta (CSS object-position) */
  imagePos?: string
}

export type DevStage = 'pozo' | 'obra' | 'terminado'

/** Para cuándo necesita la unidad el contacto, detectado en la conversación */
export interface Timeline {
  label: string
  /** Fecha límite; sin fecha si depende de otra cosa o no tiene apuro */
  by?: number
}

/** Un cambio confirmado en la lista de precios */
export interface PriceChange {
  id: string
  key: string
  developmentId: string
  typology: string
  from: number
  to: number
  at: number
}

/** Un contacto que el radar retomó a partir de un cambio de precio */
export interface RadarRetake {
  id: string
  contactId: string
  /** Qué lo disparó, para mostrarlo en Señales: una baja de precio o un cambio de etapa */
  label: string
  at: number
}

/** Cambio de precio en revisión, antes de confirmarlo */
export interface PendingPrice {
  developmentId: string
  typology: string
  to: number
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
