import type { Campaign, CampaignDraft, Contact, Development, FollowUp, PendingPrice, PriceChange } from '../types'
import { DEVELOPMENTS, DEV_STAGES, PRICE_LIST, devById, fitsTimeline, listPriceKey, listTypology, priceFor, priceKey, type PriceList } from './config'
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
  /** La entrega llega tarde para su plazo: se le sugiere esto en su lugar */
  alternative?: Alternative
}

const BUDGET = 'Presupuesto no alcanza'

/** "Lote 400 m²" → "lotes de 400 m²"; "3 ambientes" queda igual */
const plural = (typology: string) => {
  if (typology === 'Macrolote') return 'macrolotes'
  if (typology.startsWith('Lote con')) return typology.replace('Lote', 'lotes')
  if (typology.startsWith('Lote ')) return typology.replace('Lote ', 'lotes de ')
  return typology
}

const unitOf = (dev: Development) => (dev.kind === 'loteo' ? 'lote' : 'unidad')

const sameTypology = (contactTypology: string, typology: string) =>
  contactTypology === typology || contactTypology.startsWith(typology + ' ')

/* ───────── Plazos: no ofrecerle una entrega que llega tarde a quien no puede esperar */
export interface Alternative {
  developmentId: string
  typology: string
}

/** Lo más barato de la misma tipología en un desarrollo que se entrega antes del plazo del contacto */
export function alternativeFor(c: Contact, prices: PriceList): Alternative | null {
  const by = c.timeline?.by
  if (!by) return null
  const options = DEVELOPMENTS.filter((d) => d.id !== c.developmentId && d.deliveryAt <= by)
    .flatMap((d) => d.typologies.filter((t) => sameTypology(c.typology, t.label)).map((t) => ({ developmentId: d.id, typology: t.label })))
    .sort((a, b) => prices[priceKey(a.developmentId, a.typology)] - prices[priceKey(b.developmentId, b.typology)])
  return options[0] ?? null
}

export const arrivesLate = (c: Contact, dev: Development) => fitsTimeline(dev, c.timeline) === false

const deliveryWhen = (dev: Development) => {
  if (dev.stage === 'terminado') return dev.kind === 'loteo' ? 'ya está listo para escriturar' : 'ya está terminado'
  const when = new Date(dev.deliveryAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return dev.kind === 'loteo' ? `entrega los lotes en ${when}` : `se entrega en ${when}`
}

const lateReason = (c: Contact, alt: Alternative) => {
  const d = devById(alt.developmentId)
  return `Su plazo: ${c.timeline!.label.toLowerCase()} · le sugerimos ${d.neighborhood}, que ${deliveryWhen(d)}`
}

/** En vez del aviso, la sugerencia de algo que sí llega a tiempo */
export function timelineDraft(c: Contact, alt: Alternative) {
  const dev = devById(c.developmentId)
  const other = devById(alt.developmentId)
  return `Hola ${firstName(c.name)}, ¿cómo estás? Me quedé pensando en tu plazo (${c.timeline!.label.toLowerCase()}): ${dev.name} ${deliveryWhen(dev)} y no llegaría a tiempo. Por eso te quería sugerir los ${plural(alt.typology)} de ${other.name}, que ${deliveryWhen(other)}, desde ${priceToken(alt.developmentId, alt.typology)}. ¿Te paso la info y coordinamos una visita?`
}

function reasonFor(c: Contact, isStale: (c: Contact) => boolean): { text: string; kind: RadarKind } {
  if (c.stage === 'descartada')
    return c.discardReason === BUDGET
      ? { text: 'Descartada: el presupuesto no le alcanzaba', kind: 'presupuesto' }
      : { text: `Descartada · ${c.discardReason ?? 'sin motivo'}`, kind: 'descartada' }
  if (c.stage === 'propuesta') return { text: 'Tiene una propuesta con el precio anterior', kind: 'propuesta' }
  if (c.stage === 'realizada') return { text: 'Ya visitó y está decidiendo', kind: 'visita' }
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
      if (arrivesLate(c, devById(p.developmentId))) {
        // No puede esperar esa entrega: si hay algo que llega a tiempo, se le sugiere eso
        const alt = alternativeFor(c, prices)
        if (alt) items.push({ contact: c, reason: lateReason(c, alt), kind: r.kind, similar: false, checked: true, alternative: alt })
        continue
      }
      items.push({ contact: c, reason: r.text, kind: r.kind, similar: false, checked: true })
      continue
    }
    if (!['respondida', 'conversacion', 'descartada'].includes(c.stage) || arrivesLate(c, devById(p.developmentId))) continue
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
export function radarDraft(c: Contact, ch: PriceChange, prices: PriceList) {
  if (c.developmentId === ch.developmentId && arrivesLate(c, devById(ch.developmentId))) {
    const alt = alternativeFor(c, prices)
    if (alt) return timelineDraft(c, alt)
  }
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
    text: '¡Qué buena noticia! Con ese valor el crédito nos alcanza 🙌 ¿Podemos ir a ver la unidad el viernes a la mañana?',
    delay: 4600,
    meeting: { label: 'Viernes 10:30', detail: 'Visita a Torre Natalini' },
  },
}

export const radarReply = (c: Contact, ch: PriceChange) => (c.developmentId === ch.developmentId ? RADAR_REPLIES[c.id] : undefined)

/* ───────── Atajo P: cambios de precio que se van simulando en la presentación */
export const PRICE_DEMOS = [
  { developmentId: 'natalini', typology: '3 ambientes', pct: -0.06 },
  { developmentId: 'arboledas', typology: 'Lote 400 m²', pct: -0.05 },
]

export const roundPrice = (n: number) => Math.round(n / 1000) * 1000

/* ───────── Cambio de etapa: avisar antes de que suban los valores */
/** Plan de pago estimado: entrega inicial y el resto en cuotas fijas (si el desarrollo no lo define, 30% y 36 cuotas) */
export const planOf = (dev: Development) => ({ entrega: dev.financing?.entrega ?? 0.3, cuotas: dev.financing?.cuotas ?? 36 })

export type BuyerKind = 'inversor' | 'cuotas' | 'general'

/** Cómo conviene hablarle: al inversor, la diferencia entre etapas; a quien paga en cuotas, cuánto cambia la cuota */
export function buyerKind(c: Contact): BuyerKind {
  const said = [...c.tags, c.timeline?.label ?? ''].map((x) => x.toLowerCase())
  if (said.some((x) => x.includes('inversor') || x.includes('renta'))) return 'inversor'
  if (said.some((x) => x.includes('primera vivienda') || x.includes('cuota'))) return 'cuotas'
  return 'general'
}

export const BUYER_ANGLE: Record<BuyerKind, string> = {
  inversor: 'le mostramos la diferencia entre etapas',
  cuotas: 'le mostramos cuánto cambia su cuota',
  general: 'le explicamos por qué sube',
}

/** Cuota mensual estimada: lo que queda después de la entrega, en cuotas fijas */
export function monthlyFee(price: number, dev: Development) {
  const plan = planOf(dev)
  return Math.round((price * (1 - plan.entrega)) / plan.cuotas / 10) * 10
}

export const priceAfterStage = (price: number, dev: Development) => roundPrice(price * (1 + (dev.nextStage?.increase ?? 0)))

export const dayMonth = (t: number) => new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })

/** Próximos cambios de etapa, del más cercano al más lejano */
export const upcomingStages = (now = Date.now()) =>
  DEVELOPMENTS.filter((d) => d.nextStage && d.nextStage.at > now).sort((a, b) => a.nextStage!.at - b.nextStage!.at)

/** A quién avisarle: quien consultó por ese desarrollo y todavía no decidió */
export function radarForStage(dev: Development, contacts: Contact[], prices: PriceList, isStale: (c: Contact) => boolean): RadarItem[] {
  const items: RadarItem[] = []
  for (const c of contacts) {
    if (c.developmentId !== dev.id || c.analyzing || ['pendiente', 'reunion', 'reserva'].includes(c.stage)) continue
    // Si el precio sube, al que no le alcanzaba le queda más lejos
    if (c.stage === 'descartada' && c.discardReason === BUDGET) continue
    const r = reasonFor(c, isStale)
    if (arrivesLate(c, dev)) {
      // No puede esperar esa entrega: no se le avisa del pozo, se le sugiere algo que llegue a tiempo
      const alt = alternativeFor(c, prices)
      if (alt) items.push({ contact: c, reason: lateReason(c, alt), kind: r.kind, similar: false, checked: true, alternative: alt })
      continue
    }
    // Acá el precio todavía no cambió: la propuesta sigue vigente
    const why = r.kind === 'propuesta' ? 'Tiene una propuesta abierta' : r.text
    items.push({ contact: c, reason: `${why} · ${BUYER_ANGLE[buyerKind(c)]}`, kind: r.kind, similar: false, checked: r.kind !== 'descartada' })
  }
  return items.sort((a, b) => kindRank(a.kind) - kindRank(b.kind) || a.contact.stageSince - b.contact.stageSince)
}

/** Aviso del cambio de etapa, distinto según cómo compra cada uno */
export function stageDraft(c: Contact, dev: Development, prices: PriceList) {
  const ns = dev.nextStage!
  const name = firstName(c.name)
  const typology = listTypology(dev.id, c.typology)
  const price = priceFor(dev.id, typology, prices)
  const step = `${stageWhen(ns.at)} ${dev.name} pasa de ${DEV_STAGES[dev.stage].short.toLowerCase()} a ${DEV_STAGES[ns.to].short.toLowerCase()}`
  const pct = Math.round(ns.increase * 100)
  const plan = planOf(dev)
  const why = `Es lo habitual en cada etapa: a medida que avanza el proyecto baja el riesgo y sube el valor de cada ${unitOf(dev)}.`
  switch (buyerKind(c)) {
    case 'inversor':
      return `Hola ${name}, ¿cómo estás? Te aviso con tiempo: ${step} y los valores suben un ${pct}%. Hoy los ${plural(typology)} arrancan en ${priceToken(dev.id, typology)}; después del cambio, en ${usd(priceAfterStage(price, dev))}. Esa diferencia es la que se captura comprando en esta etapa. ¿Te armo los números de la inversión?`
    case 'cuotas':
      return `Hola ${name}, ¿cómo estás? Te quería avisar con tiempo: ${step} y los valores suben un ${pct}%. ${why} Si reservás antes, tu cuota estimada queda en ${usd(monthlyFee(price, dev))} por mes en lugar de ${usd(monthlyFee(priceAfterStage(price, dev), dev))} (${Math.round(plan.entrega * 100)}% de entrega y el resto en ${plan.cuotas} cuotas). ¿Querés que te arme la simulación?`
    default:
      return `Hola ${name}, ¿cómo va? Te escribo para avisarte con tiempo: ${step} y los valores se actualizan un ${pct}%. ${why} Hoy los ${plural(typology)} arrancan en ${priceToken(dev.id, typology)}. ¿Querés que lo veamos antes del cambio?`
  }
}

/** "el 5 de noviembre" si es pronto; "en marzo de 2027" si falta más */
export function stageWhen(t: number, now = Date.now()) {
  if (t - now <= 60 * 86_400_000) return `el ${dayMonth(t)}`
  return `en ${new Date(t).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}`
}
