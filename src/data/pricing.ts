import type { Campaign, CampaignDraft, Contact, FollowUp, PendingPrice, PriceChange } from '../types'
import { PRICE_LIST, devById, listPriceKey, priceFor, priceKey, type PriceList } from './config'
import { daysIn, firstName, usd } from '../lib/utils'

/* ───────── Precios dentro de los textos
 * Borradores y anuncios guardan una marca {{precio:desarrollo/tipología}} en lugar del número.
 * Se completa con la lista vigente al mostrarse o enviarse: un cambio de precio llega a todos.
 * Los mensajes ya enviados guardan el número, porque son historia. */
const TOKEN = /\{\{precio:([^}]+)\}\}/g

export const tokenForKey = (key: string) => `{{precio:${key}}}`

export const priceToken = (developmentId: string, typology: string) => tokenForKey(listPriceKey(developmentId, typology))

export const mentionsPrice = (text: string | undefined, key: string) => !!text?.includes(tokenForKey(key))

export const fillPrices = (text: string, prices: PriceList) =>
  text.replace(TOKEN, (m, key: string) => (key in prices ? usd(prices[key]) : m))

/** Vuelve a marcar los precios de un desarrollo en un texto editado a mano */
export function tokenizePrices(text: string, prices: PriceList, developmentId: string) {
  return devById(developmentId).typologies.reduce((t, ty) => {
    const key = priceKey(developmentId, ty.label)
    return t.split(usd(prices[key])).join(tokenForKey(key))
  }, text)
}

/* ───────── Impacto de un cambio */
export const LISTING_PORTALS = ['Zonaprop', 'Argenprop']

export function affectedBy(key: string, s: { campaigns: Campaign[]; drafts: CampaignDraft[]; contacts: Contact[] }) {
  return {
    ads: s.campaigns.filter((c) => c.status !== 'finalizada' && mentionsPrice(c.adText, key)),
    campaignDrafts: s.drafts.filter(
      (d) => (d.status === 'pendiente' || d.status === 'editado') && d.segments.some((x) => mentionsPrice(x.t, key)),
    ),
    replies: s.contacts.filter((c) => mentionsPrice(c.draft, key)),
  }
}

/* ───────── Radar de oportunidades: a quién le sirve una baja de precio */
export type RadarKind = 'presupuesto' | 'propuesta' | 'visita' | 'sin_novedades' | 'descartada' | 'conversando' | 'similar'

/** En orden de prioridad */
export const RADAR_KINDS: Record<RadarKind, string> = {
  presupuesto: 'Descartado por presupuesto',
  propuesta: 'Propuesta abierta',
  visita: 'Ya visitó',
  sin_novedades: 'Sin novedades',
  descartada: 'Descartado',
  conversando: 'Conversando',
  similar: 'Algo similar',
}

export interface RadarItem {
  contact: Contact
  reason: string
  kind: RadarKind
  /** Consultó por la misma tipología en otro desarrollo */
  similar: boolean
  checked: boolean
}

const BUDGET = 'Presupuesto no alcanza'

const plural = (typology: string) => (typology === 'Monoambiente' ? 'monoambientes' : typology)

const sameTypology = (contactTypology: string, typology: string) =>
  contactTypology === typology || contactTypology.startsWith(typology + ' ')

function reasonFor(c: Contact, isStale: (c: Contact) => boolean): { text: string; kind: RadarKind } {
  if (c.stage === 'descartada')
    return c.discardReason === BUDGET
      ? { text: 'Descartada: el presupuesto no le alcanzaba', kind: 'presupuesto' }
      : { text: `Descartada · ${c.discardReason ?? 'sin motivo'}`, kind: 'descartada' }
  if (c.stage === 'propuesta') return { text: 'Tiene una propuesta con el precio anterior', kind: 'propuesta' }
  if (c.stage === 'realizada') return { text: 'Ya visitó la unidad y está decidiendo', kind: 'visita' }
  if (isStale(c)) return { text: `Sin novedades hace ${daysIn(c.stageSince)} días`, kind: 'sin_novedades' }
  return { text: 'Está conversando por esta tipología', kind: 'conversando' }
}

const kindRank = (k: RadarKind) => Object.keys(RADAR_KINDS).indexOf(k)

export function radarFor(
  p: PendingPrice,
  from: number,
  contacts: Contact[],
  prices: PriceList,
  isStale: (c: Contact) => boolean,
): RadarItem[] {
  if (p.to >= from) return []
  const items: RadarItem[] = []
  for (const c of contacts) {
    if (c.analyzing || c.stage === 'pendiente' || c.stage === 'reserva' || !sameTypology(c.typology, p.typology)) continue
    if (c.developmentId === p.developmentId) {
      // Con reunión programada, el asesor se lo cuenta en la reunión
      if (c.stage === 'reunion') continue
      const r = reasonFor(c, isStale)
      items.push({ contact: c, reason: r.text, kind: r.kind, similar: false, checked: true })
      continue
    }
    if (!['respondida', 'conversacion', 'descartada'].includes(c.stage)) continue
    const theirs = priceFor(c.developmentId, c.typology, prices)
    const budget = c.stage === 'descartada' && c.discardReason === BUDGET
    if (budget ? p.to >= theirs : Math.abs(p.to - theirs) / theirs > 0.15) continue
    const where = devById(c.developmentId).neighborhood
    items.push({
      contact: c,
      reason: budget ? `Descartada en ${where}: no le alcanzaba ${usd(theirs)}` : `Miraba ${plural(c.typology)} en ${where} · ${usd(theirs)}`,
      kind: 'similar',
      similar: true,
      checked: false,
    })
  }
  return items.sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || a.contact.stageSince - b.contact.stageSince)
}

/** Baja hipotética con la que el radar mide cada tipología en Señales */
export const OPPORTUNITY_DROP = -0.05

/**
 * Oportunidades por tipología: quiénes vuelven a estar en juego si baja ese precio.
 * Deja afuera a los que el radar ya retomó (`exclude`).
 */
export function radarOpportunities(contacts: Contact[], prices: PriceList, isStale: (c: Contact) => boolean, exclude: Set<string>) {
  return PRICE_LIST.map(({ developmentId, typology }) => {
    const from = prices[priceKey(developmentId, typology)]
    const to = roundPrice(from * (1 + OPPORTUNITY_DROP))
    const items = radarFor({ developmentId, typology, to }, from, contacts, prices, isStale).filter((r) => !r.similar && !exclude.has(r.contact.id))
    return { developmentId, typology, from, to, items }
  })
    .filter((o) => o.items.length)
    .sort((a, b) => b.items.length - a.items.length || kindRank(a.items[0].kind) - kindRank(b.items[0].kind))
}

/** Borrador para retomar el contacto con el precio nuevo. El precio queda marcado para que siga a la lista. */
export function radarDraft(c: Contact, ch: PriceChange) {
  const name = firstName(c.name)
  const what = `los ${plural(ch.typology)} de ${devById(ch.developmentId).name}`
  const now = priceToken(ch.developmentId, ch.typology)
  const before = usd(ch.from)
  if (c.developmentId !== ch.developmentId)
    return `Hola ${name}, ¿cómo estás? Sé que estabas mirando ${plural(c.typology)} en ${devById(c.developmentId).name}. Te cuento que bajamos el precio de ${what}: ahora arrancan en ${now}. Por si te sirve compararlos, ¿te paso la ficha?`
  if (c.stage === 'descartada' && c.discardReason === BUDGET) {
    const credit = c.tags.some((t) => t.toLowerCase().includes('crédito'))
    return `Hola ${name}, ¿cómo estás? Te escribo porque bajamos el precio de ${what}: ahora arrancan en ${now} (antes ${before}). Me acordé de que el presupuesto no alcanzaba por poco; con este valor quizás ${credit ? 'el crédito ya alcanza' : 'ahora cierra'}. ¿Querés que te arme una simulación de cuotas?`
  }
  if (c.stage === 'descartada')
    return `Hola ${name}, ¿cómo va? Hace un tiempo hablamos por ${what}. Te cuento que bajamos el precio: ahora arrancan en ${now}. Si seguís buscando, me encantaría mostrártelos. ¿Te mando la info actualizada?`
  if (c.stage === 'propuesta')
    return `Hola ${name}, ¡buenas noticias para tu propuesta! Bajamos el precio de ${what} a ${now} (antes ${before}). Te actualizo los números con el nuevo valor y te los mando hoy, ¿te parece?`
  if (c.stage === 'realizada')
    return `Hola ${name}, ¿cómo estás? Después de la visita te quería contar una novedad: ${what} bajaron a ${now} (antes ${before}). ¿Te mando los números actualizados para que lo pienses con este valor?`
  return `Hola ${name}, ¿cómo va todo? Te escribo con una novedad: bajamos el precio de ${what}, que ahora arrancan en ${now} (antes ${before}). ¿Querés que coordinemos una visita esta semana?`
}

/** Respuestas guionadas para la demo cuando el radar retoma a alguien */
const RADAR_REPLIES: Record<string, FollowUp> = {
  daniela: {
    text: '¡Qué buena noticia! Con ese valor el crédito nos alcanza 🙌 ¿Podemos ir a ver la unidad el sábado a la mañana?',
    delay: 4600,
    meeting: { label: 'Sábado 10:30', detail: 'Unidad terminada · MARQ Belgrano R' },
  },
}

export const radarReply = (c: Contact, ch: PriceChange) => (c.developmentId === ch.developmentId ? RADAR_REPLIES[c.id] : undefined)

/* ───────── Atajo P: cambios de precio que se van simulando en la presentación */
export const PRICE_DEMOS = [
  { developmentId: 'belgrano', typology: '3 ambientes', pct: -0.06 },
  { developmentId: 'colegiales', typology: '2 ambientes', pct: -0.05 },
]

export const roundPrice = (n: number) => Math.round(n / 1000) * 1000
