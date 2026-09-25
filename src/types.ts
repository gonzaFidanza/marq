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
  tone?: 'default' | 'success' | 'incoming' | 'celebrate' | 'muted'
  channel?: Channel
  action?: { label: string; contactId: string }
}
