import {
  Inbox,
  MessageCircleReply,
  MessagesSquare,
  CalendarClock,
  CalendarCheck,
  FileText,
  PartyPopper,
  Archive,
} from 'lucide-react'
import type { Channel, Classification, DevStage, Development, StageId, Timeline } from '../types'

export const STAGES: { id: StageId; label: string; short: string; icon: typeof Inbox; color: string }[] = [
  { id: 'pendiente', label: 'Consulta pendiente', short: 'Pendiente', icon: Inbox, color: '#C08A3E' },
  { id: 'respondida', label: 'Respondida', short: 'Respondida', icon: MessageCircleReply, color: '#7E8F63' },
  { id: 'conversacion', label: 'En conversación', short: 'En conversación', icon: MessagesSquare, color: '#5F83A6' },
  { id: 'reunion', label: 'Reunión programada', short: 'Reunión prog.', icon: CalendarClock, color: '#8A74B0' },
  { id: 'realizada', label: 'Reunión realizada', short: 'Reunión realizada', icon: CalendarCheck, color: '#6E7FB8' },
  { id: 'propuesta', label: 'Propuesta enviada', short: 'Propuesta', icon: FileText, color: '#B7775A' },
  { id: 'reserva', label: 'Reserva / cierre', short: 'Reserva', icon: PartyPopper, color: '#B8963E' },
  { id: 'descartada', label: 'Descartada', short: 'Descartada', icon: Archive, color: '#9A948A' },
]

export const stageById = (id: StageId) => STAGES.find((s) => s.id === id)!

export const CLASSIFICATIONS: Record<
  Classification,
  { label: string; color: string; soft: string; description: string }
> = {
  conocido: {
    label: 'Cliente conocido',
    color: '#4E8A5E',
    soft: 'rgba(78,138,94,0.12)',
    description: 'Ya compró en un desarrollo MARQ',
  },
  previo: {
    label: 'Contacto previo',
    color: '#4E78A8',
    soft: 'rgba(78,120,168,0.12)',
    description: 'Consultó antes pero no compró',
  },
  nuevo: {
    label: 'Nuevo con datos',
    color: '#8466AE',
    soft: 'rgba(132,102,174,0.12)',
    description: 'Primera consulta, se presentó con información útil',
  },
  sin: {
    label: 'Sin clasificar',
    color: '#9A948A',
    soft: 'rgba(154,148,138,0.14)',
    description: 'No tengo información suficiente para clasificarlo',
  },
}

export const CHANNELS: Record<Channel, { label: string; color: string; soft: string; chart: string }> = {
  whatsapp: { label: 'WhatsApp', color: '#4F9A72', soft: 'rgba(79,154,114,0.12)', chart: '#3F9A6B' },
  instagram: { label: 'Instagram', color: '#B8668F', soft: 'rgba(184,102,143,0.12)', chart: '#C0588F' },
  mail: { label: 'Mail', color: '#4E78A8', soft: 'rgba(78,120,168,0.12)', chart: '#3F72B8' },
  portal: { label: 'Portal', color: '#BE8A3A', soft: 'rgba(190,138,58,0.14)', chart: '#C77A2E' },
}

export const TEAM: Record<string, { name: string; initials: string; hue: number; role: string }> = {
  candelaria: { name: 'Candelaria Molina', initials: 'CM', hue: 28, role: 'Asesora comercial' },
  tomas: { name: 'Tomás Ferreyra', initials: 'TF', hue: 200, role: 'Asesor comercial' },
  julieta: { name: 'Julieta Paz', initials: 'JP', hue: 320, role: 'Jefa comercial' },
}

export const DISCARD_REASONS = [
  'Presupuesto no alcanza',
  'Compró en otro lado',
  'No responde',
  'Solo curioseaba',
]

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`

/** Primer día del mes */
const on = (year: number, month: number) => new Date(year, month - 1, 1).getTime()

/** Medianoche de dentro de n días */
const inDays = (n: number) => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime() + n * 86_400_000
}

/** Si la entrega llega a tiempo para el plazo del contacto; null si el plazo no tiene fecha */
export const fitsTimeline = (dev: Development, t?: Timeline) => (t?.by ? dev.deliveryAt <= t.by : null)

export const DEV_STAGES: Record<DevStage, { label: string; short: string }> = {
  pozo: { label: 'Pozo (preventa)', short: 'Pozo' },
  obra: { label: 'En obra', short: 'Obra' },
  terminado: { label: 'Terminado', short: 'Terminado' },
}

export const DEVELOPMENTS: Development[] = [
  {
    id: 'colegiales',
    name: 'MARQ Colegiales',
    neighborhood: 'Colegiales',
    address: 'Conesa 1250',
    status: 'En obra',
    delivery: 'Entrega dic. 2027',
    progress: 46,
    stage: 'obra',
    deliveryAt: on(2027, 12),
    nextStage: { to: 'terminado', at: on(2027, 12), increase: 0.1 },
    anticipo: 0.3,
    image: u('photo-1545324418-cc1a3fa10c00'),
    gradient: 'linear-gradient(135deg,#c9b79c 0%,#8f9a78 55%,#4a5a3a 100%)',
    typologies: [
      { label: 'Monoambiente', from: 98000 },
      { label: '2 ambientes', from: 142000 },
      { label: '3 ambientes', from: 215000 },
    ],
  },
  {
    id: 'urquiza',
    name: 'MARQ Villa Urquiza',
    neighborhood: 'Villa Urquiza',
    address: 'Av. Triunvirato 4450',
    status: 'En pozo',
    delivery: 'Entrega 2028',
    progress: 12,
    stage: 'pozo',
    deliveryAt: on(2028, 6),
    // Para la demo, el paso a obra siempre queda a tres semanas
    nextStage: { to: 'obra', at: inDays(21), increase: 0.08 },
    anticipo: 0.25,
    image: u('photo-1486406146926-c627a92ad1ab'),
    gradient: 'linear-gradient(135deg,#d8c7b0 0%,#b88f73 55%,#6d4d3d 100%)',
    typologies: [
      { label: '2 ambientes', from: 128000 },
      { label: '3 ambientes', from: 189000 },
    ],
  },
  {
    id: 'belgrano',
    name: 'MARQ Belgrano R',
    neighborhood: 'Belgrano R',
    address: 'Zapiola 2230',
    status: 'Últimas unidades',
    delivery: 'Entregado 2024',
    progress: 100,
    stage: 'terminado',
    deliveryAt: on(2024, 6),
    image: u('photo-1600585154340-be6161a56a0c'),
    gradient: 'linear-gradient(135deg,#d6d3c9 0%,#8d98a3 55%,#3f4b58 100%)',
    typologies: [
      { label: '3 ambientes', from: 265000 },
      { label: '4 ambientes', from: 340000 },
    ],
  },
  {
    id: 'nunez',
    name: 'MARQ Núñez',
    neighborhood: 'Núñez',
    address: 'Manuela Pedraza 2140',
    status: 'En obra',
    delivery: 'Entrega mar. 2027',
    progress: 71,
    stage: 'obra',
    deliveryAt: on(2027, 3),
    nextStage: { to: 'terminado', at: on(2027, 3), increase: 0.07 },
    anticipo: 0.3,
    image: u('photo-1502672260266-1c1ef2d93688'),
    gradient: 'linear-gradient(135deg,#e2d6c2 0%,#a9a07f 55%,#5b5a3c 100%)',
    typologies: [
      { label: 'Monoambiente', from: 105000 },
      { label: '2 ambientes', from: 158000 },
    ],
  },
]

export const devById = (id: string) => DEVELOPMENTS.find((d) => d.id === id) ?? DEVELOPMENTS[0]

/**
 * Lista de precios única del asistente. Sale de DEVELOPMENTS: la usan los borradores
 * de respuesta de la Bandeja, la ficha del contacto y los borradores de campaña.
 * Los valores vigentes viven en el store (`prices`); estos son los iniciales.
 */
export const PRICE_LIST = DEVELOPMENTS.flatMap((d) => d.typologies.map((t) => ({ developmentId: d.id, typology: t.label, from: t.from })))

export type PriceList = Record<string, number>

export const priceKey = (developmentId: string, typology: string) => `${developmentId}/${typology}`

export const INITIAL_PRICES: PriceList = Object.fromEntries(PRICE_LIST.map((p) => [priceKey(p.developmentId, p.typology), p.from]))

/** Tipología de la lista que corresponde a lo que busca un contacto ("Monoambiente ×2" → "Monoambiente") */
export const listTypology = (developmentId: string, typology: string) => {
  const dev = devById(developmentId)
  return (dev.typologies.find((t) => t.label === typology) ?? dev.typologies.find((t) => typology.startsWith(t.label.split(' ')[0])) ?? dev.typologies[0]).label
}

/** Clave en la lista de precios para lo que busca un contacto o anuncia una campaña */
export const listPriceKey = (developmentId: string, typology: string) => priceKey(developmentId, listTypology(developmentId, typology))

export const priceFor = (developmentId: string, typology: string, prices: PriceList = INITIAL_PRICES) =>
  prices[listPriceKey(developmentId, typology)]
