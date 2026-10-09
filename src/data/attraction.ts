import type { AdSegment, Campaign, CampaignDraft, Contact, Conversion, Origin, Profile } from '../types'
import { CLASSIFICATIONS, CHANNELS, devById, priceFor } from './config'
import { D, H, MIN, NOW } from './mock'
import { usd } from '../lib/utils'

/* ───────── Perfiles (mismos colores que la clasificación) */
export const PROFILES: Record<Profile, { label: string; color: string; soft: string }> = {
  primera: { label: 'Primera vivienda', color: CLASSIFICATIONS.nuevo.color, soft: CLASSIFICATIONS.nuevo.soft },
  inversor: { label: 'Inversor', color: CLASSIFICATIONS.previo.color, soft: CLASSIFICATIONS.previo.soft },
  conocido: { label: 'Cliente conocido', color: CLASSIFICATIONS.conocido.color, soft: CLASSIFICATIONS.conocido.soft },
  recomendado: { label: 'Recomendado', color: '#B8963E', soft: 'rgba(184,150,62,0.13)' },
  amplio: { label: 'Público amplio', color: CLASSIFICATIONS.sin.color, soft: CLASSIFICATIONS.sin.soft },
}

/* ───────── Orígenes de contacto */
export const ORIGINS: Record<Origin, { label: string; color: string }> = {
  campana: { label: 'Pauta', color: '#B5704F' },
  recomendacion: { label: 'Recomendación', color: '#A8862F' },
  organico: { label: 'Orgánico', color: '#6E8A55' },
  portal: { label: 'Portal', color: '#5F83A6' },
  cliente: { label: 'Cliente MARQ', color: CLASSIFICATIONS.conocido.color },
}

export const CAMPAIGN_COLOR = '#B5704F'

export function originOf(c: Pick<Contact, 'campaignId' | 'origin' | 'channel' | 'classification' | 'tags'>): Origin {
  if (c.campaignId) return 'campana'
  if (c.origin) return c.origin
  if (c.channel === 'portal') return 'portal'
  if (c.tags.some((t) => t.toLowerCase().includes('recomend'))) return 'recomendacion'
  if (c.classification === 'conocido') return 'cliente'
  return 'organico'
}

/** Atribución de los contactos existentes del tablero */
export const ATTRIBUTION: Record<string, Partial<Pick<Contact, 'campaignId' | 'origin'>>> = {
  lucia: { campaignId: 'c-col-1v' },
  valentina: { campaignId: 'c-col-1v' },
  paula: { campaignId: 'c-col-1v' },
  agustina: { origin: 'portal' },
  camila: { campaignId: 'c-urq-amp' },
  ezequiel: { campaignId: 'c-urq-amp' },
  martin: { campaignId: 'c-nun-inv' },
  ignacio: { campaignId: 'c-nun-inv' },
  rocio: { campaignId: 'c-nun-inv' },
  carolina: { origin: 'recomendacion' },
  florencia: { origin: 'organico' },
  joaquin: { origin: 'organico' },
  daniela: { origin: 'organico' },
  martina: { origin: 'organico' },
}

/* ───────── Campañas */
let cv = 0
const conv = (name: string, event: Conversion['event'], ago: number, contactId?: string): Conversion => ({
  id: `cv${cv++}`,
  name,
  event,
  at: NOW - ago,
  contactId,
})

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'c-col-1v',
    name: 'Colegiales 1ª vivienda',
    developmentId: 'colegiales',
    typology: '2 ambientes',
    profile: 'primera',
    status: 'activa',
    startedAt: NOW - 21 * D,
    days: 30,
    budget: 1_800_000,
    spent: 1_240_000,
    inquiries: 96,
    meetingsScheduled: 22,
    meetingsDone: 15,
    reservations: 3,
    adText: `Tu primer 2 ambientes en Colegiales, con crédito hipotecario. Desde ${usd(priceFor('colegiales', '2 ambientes'))}.`,
    conversions: [
      conv('Federico A.', 'Reunión realizada', 5 * H),
      conv('Sabrina L.', 'Reunión programada', 1 * D + 2 * H),
      conv('Nahuel R.', 'Reserva', 2 * D + 4 * H),
      conv('Juliana M.', 'Reunión programada', 3 * D + 1 * H),
      conv('Federico A.', 'Reunión programada', 4 * D + 6 * H),
    ],
  },
  {
    id: 'c-urq-amp',
    name: 'Villa Urquiza lanzamiento',
    developmentId: 'urquiza',
    typology: '2 ambientes',
    profile: 'amplio',
    status: 'activa',
    startedAt: NOW - 24 * D,
    days: 30,
    budget: 2_000_000,
    spent: 1_580_000,
    inquiries: 214,
    meetingsScheduled: 9,
    meetingsDone: 6,
    reservations: 0,
    adText: `Nuevo lanzamiento en Villa Urquiza. 2 y 3 ambientes desde ${usd(priceFor('urquiza', '2 ambientes'))}. ¡Consultá!`,
    conversions: [
      conv('Marcos T.', 'Reunión programada', 2 * D + 3 * H),
      conv('Elena G.', 'Reunión realizada', 6 * D),
    ],
  },
  {
    id: 'c-nun-inv',
    name: 'Núñez inversores',
    developmentId: 'nunez',
    typology: 'Monoambiente',
    profile: 'inversor',
    status: 'activa',
    startedAt: NOW - 16 * D,
    days: 30,
    budget: 1_200_000,
    spent: 860_000,
    inquiries: 41,
    meetingsScheduled: 12,
    meetingsDone: 9,
    reservations: 2,
    adText: `Monoambientes en Núñez a 6 cuadras de Ciudad Universitaria. Desde ${usd(priceFor('nunez', 'Monoambiente'))}.`,
    conversions: [
      conv('Rocío Fernández', 'Reserva', 5 * D, 'rocio'),
      conv('Gastón P.', 'Reunión programada', 1 * D + 5 * H),
      conv('Ignacio Castro', 'Reunión realizada', 12 * D, 'ignacio'),
    ],
  },
  {
    id: 'c-bel-ult',
    name: 'Belgrano R últimas unidades',
    developmentId: 'belgrano',
    typology: '3 ambientes',
    profile: 'conocido',
    status: 'pausada',
    startedAt: NOW - 40 * D,
    days: 30,
    budget: 700_000,
    spent: 540_000,
    inquiries: 38,
    meetingsScheduled: 5,
    meetingsDone: 4,
    reservations: 1,
    adText: `Últimos 3 ambientes en Belgrano R, listos para mudarse. Desde ${usd(priceFor('belgrano', '3 ambientes'))}.`,
    conversions: [conv('Horacio V.', 'Reserva', 14 * D), conv('Lía B.', 'Reunión realizada', 18 * D)],
  },
  {
    id: 'c-col-inv',
    name: 'Colegiales invierno',
    developmentId: 'colegiales',
    typology: '2 ambientes',
    profile: 'primera',
    status: 'finalizada',
    startedAt: NOW - 95 * D,
    days: 21,
    budget: 420_000,
    spent: 420_000,
    inquiries: 44,
    meetingsScheduled: 11,
    meetingsDone: 8,
    reservations: 2,
    adText: `2 ambientes en Colegiales con cuotas en pesos durante la obra. Desde ${usd(priceFor('colegiales', '2 ambientes'))}.`,
    conversions: [conv('Pilar S.', 'Reserva', 70 * D), conv('Matías O.', 'Reunión realizada', 78 * D)],
  },
]

export const cpm = (c: Pick<Campaign, 'spent' | 'meetingsScheduled'>) => (c.meetingsScheduled ? c.spent / c.meetingsScheduled : 0)
export const cpi = (c: Pick<Campaign, 'spent' | 'inquiries'>) => (c.inquiries ? c.spent / c.inquiries : 0)

/** Serie diaria determinística para el gráfico del drawer */
export function dailySeries(c: Campaign) {
  const elapsed = Math.max(1, Math.min(c.days, Math.round((NOW - c.startedAt) / D)))
  let seed = c.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const w = Array.from({ length: elapsed }, (_, i) => 0.6 + rnd() * 0.8 + (i / elapsed) * 0.4)
  const total = w.reduce((a, b) => a + b, 0)
  let acc = 0
  let shown = 0
  return w.map((x, i) => {
    acc += (c.meetingsScheduled * x) / total
    const reuniones = Math.round(acc) - shown
    shown += reuniones
    const d = new Date(c.startedAt + i * D)
    return { day: `${d.getDate()}/${d.getMonth() + 1}`, consultas: Math.round((c.inquiries * x) / total), reuniones }
  })
}

/* ───────── Señales: lo que el agente lee de la Bandeja y el Tablero */
export const DEV_SIGNALS = [
  { developmentId: 'colegiales', typology: '2 ambientes', inquiries: 52, meetings: 19 },
  { developmentId: 'nunez', typology: 'Monoambiente', inquiries: 30, meetings: 10 },
  { developmentId: 'colegiales', typology: 'Monoambiente', inquiries: 34, meetings: 7 },
  { developmentId: 'belgrano', typology: '3 ambientes', inquiries: 16, meetings: 6 },
  { developmentId: 'urquiza', typology: '3 ambientes', inquiries: 16, meetings: 4 },
  { developmentId: 'urquiza', typology: '2 ambientes', inquiries: 38, meetings: 3 },
]

export const PROFILE_SIGNALS: { profile: Profile; inquiries: number; meetings: number }[] = [
  { profile: 'conocido', inquiries: 19, meetings: 11 },
  { profile: 'recomendado', inquiries: 25, meetings: 13 },
  { profile: 'primera', inquiries: 74, meetings: 30 },
  { profile: 'inversor', inquiries: 48, meetings: 16 },
]

export const QUESTION_SIGNALS: { id: string; profile: Profile; template: string; questions: { q: string; pct: number }[] }[] = [
  {
    id: 'sig-q-primera',
    profile: 'primera',
    template: 'col-primera',
    questions: [
      { q: '¿Aceptan crédito hipotecario?', pct: 68 },
      { q: '¿Cuándo es la entrega?', pct: 41 },
      { q: '¿Cuánto es el anticipo?', pct: 33 },
    ],
  },
  {
    id: 'sig-q-inversor',
    profile: 'inversor',
    template: 'col-mono-inv',
    questions: [
      { q: '¿Qué rentabilidad tiene?', pct: 57 },
      { q: '¿Cuándo es la entrega?', pct: 44 },
      { q: '¿Se puede ceder antes de la escritura?', pct: 29 },
    ],
  },
  {
    id: 'sig-q-conocido',
    profile: 'conocido',
    template: 'bel-conocido',
    questions: [
      { q: '¿Mantengo el beneficio de cliente?', pct: 52 },
      { q: '¿Puedo entregar mi depto como parte de pago?', pct: 31 },
      { q: '¿Qué desarrollos tienen ahora?', pct: 27 },
    ],
  },
  {
    id: 'sig-q-recomendado',
    profile: 'recomendado',
    template: 'nun-recomendado',
    questions: [
      { q: '¿Tengo beneficio por venir recomendado?', pct: 61 },
      { q: '¿Puedo ver un departamento terminado?', pct: 38 },
      { q: '¿Es el mismo edificio que mi conocido?', pct: 24 },
    ],
  },
]

/* ───────── Plantillas de borradores de campaña */
type Template = Omit<CampaignDraft, 'id' | 'template' | 'status' | 'createdAt'> & { campaignName: string }

const q = (t: string, question: string, pct: number): AdSegment => ({ t, q: question, pct })

export const TEMPLATES: Record<string, () => Template> = {
  'col-primera': () => ({
    campaignName: 'Colegiales 1ª vivienda II',
    developmentId: 'colegiales',
    typology: '2 ambientes',
    profile: 'primera',
    budget: 350_000,
    days: 14,
    cta: 'Enviar mensaje',
    segments: [
      { t: 'Tu primer 2 ambientes en Colegiales, ' },
      q('con crédito hipotecario', '¿Aceptan crédito hipotecario?', 68),
      { t: '. ' },
      q('Entrega diciembre 2027', '¿Cuándo es la entrega?', 41),
      { t: `. Desde ${usd(priceFor('colegiales', '2 ambientes'))}, ` },
      q('30% de anticipo y cuotas en pesos durante la obra', '¿Cuánto es el anticipo?', 33),
      { t: '. Escribinos y coordinamos una visita al departamento modelo.' },
    ],
    reasoning:
      'La campaña anterior de este desarrollo consiguió 11 reuniones con ARS 420.000. Proponemos ARS 350.000 por 14 días enfocados solo en primera vivienda, que es el perfil que más avanza en Colegiales.',
    signals: [
      { id: 'sig-dev', label: 'Colegiales 2 amb · 19 reuniones' },
      { id: 'sig-profiles', label: 'Primera vivienda avanza 41%' },
      { id: 'sig-q-primera', label: 'Preguntas de primera vivienda' },
    ],
  }),
  'nun-inversor': () => ({
    campaignName: 'Núñez inversores II',
    developmentId: 'nunez',
    typology: 'Monoambiente',
    profile: 'inversor',
    budget: 280_000,
    days: 10,
    cta: 'Más información',
    segments: [
      { t: 'Monoambientes en Núñez, a 6 cuadras de Ciudad Universitaria. ' },
      q('Rentabilidad estimada de 5,5% a 6% anual', '¿Qué rentabilidad tiene?', 57),
      { t: '. ' },
      q('Entrega marzo 2027', '¿Cuándo es la entrega?', 44),
      { t: ', con ' },
      q('cesión de boleto permitida antes de escriturar', '¿Se puede ceder antes de la escritura?', 29),
      { t: `. Desde ${usd(priceFor('nunez', 'Monoambiente'))}.` },
    ],
    reasoning:
      'Núñez inversores lleva 12 reuniones con ARS 860.000 (ARS 71.667 cada una). Sumamos ARS 280.000 por 10 días con un texto que responde rentabilidad y cesión, las dos preguntas que hoy demoran la primera reunión.',
    signals: [
      { id: 'sig-dev', label: 'Núñez mono · 33% llega a reunión' },
      { id: 'sig-q-inversor', label: 'Preguntas de inversores' },
    ],
  }),
  'bel-conocido': () => ({
    campaignName: 'Belgrano R clientes MARQ',
    developmentId: 'belgrano',
    typology: '3 ambientes',
    profile: 'conocido',
    budget: 180_000,
    days: 10,
    cta: 'Enviar mensaje',
    segments: [
      { t: 'Volvé a elegir MARQ: últimos 3 ambientes en Belgrano R, listos para mudarse. ' },
      q('Como cliente MARQ mantenés tu 3% de beneficio', '¿Mantengo el beneficio de cliente?', 52),
      { t: ' y ' },
      q('podés entregar tu depto actual como parte de pago', '¿Puedo entregar mi depto como parte de pago?', 31),
      { t: `. Desde ${usd(priceFor('belgrano', '3 ambientes'))}.` },
    ],
    reasoning:
      'Los clientes conocidos son el perfil que más avanza (58% llega a reunión). La campaña de Belgrano R está pausada; proponemos reactivarla con ARS 180.000 por 10 días, solo para clientes MARQ y personas parecidas a ellos.',
    signals: [
      { id: 'sig-profiles', label: 'Cliente conocido avanza 58%' },
      { id: 'sig-q-conocido', label: 'Preguntas de clientes' },
    ],
  }),
  'urq-primera': () => ({
    campaignName: 'Villa Urquiza 1ª vivienda',
    developmentId: 'urquiza',
    typology: '2 ambientes',
    profile: 'primera',
    budget: 300_000,
    days: 14,
    cta: 'Enviar mensaje',
    segments: [
      { t: 'Tu primer 2 ambientes en Villa Urquiza, ' },
      q('con crédito hipotecario al escriturar', '¿Aceptan crédito hipotecario?', 68),
      { t: '. ' },
      q('Anticipo del 25% y el resto en cuotas en pesos', '¿Cuánto es el anticipo?', 33),
      { t: `. Desde ${usd(priceFor('urquiza', '2 ambientes'))}, ` },
      q('entrega 2028', '¿Cuándo es la entrega?', 41),
      { t: '.' },
    ],
    reasoning:
      'La campaña amplia de Villa Urquiza trajo 214 consultas pero solo 9 reuniones (ARS 175.556 cada una). Proponemos pasar ARS 300.000 por 14 días a primera vivienda: menos consultas, pero de gente que avanza.',
    signals: [
      { id: 'sig-dev', label: 'Villa Urquiza 2 amb · 8% llega a reunión' },
      { id: 'sig-profiles', label: 'Primera vivienda avanza 41%' },
      { id: 'sig-q-primera', label: 'Preguntas de primera vivienda' },
    ],
  }),
  'col-mono-inv': () => ({
    campaignName: 'Colegiales mono inversores',
    developmentId: 'colegiales',
    typology: 'Monoambiente',
    profile: 'inversor',
    budget: 220_000,
    days: 10,
    cta: 'Más información',
    segments: [
      { t: `Invertí en Colegiales: monoambientes desde ${usd(priceFor('colegiales', 'Monoambiente'))}. ` },
      q('Rentabilidad estimada de 5,5% a 6% anual', '¿Qué rentabilidad tiene?', 57),
      { t: ', ' },
      q('entrega diciembre 2027', '¿Cuándo es la entrega?', 44),
      { t: ' y ' },
      q('cesión de boleto permitida', '¿Se puede ceder antes de la escritura?', 29),
      { t: '.' },
    ],
    reasoning:
      'Colegiales monoambiente suma 34 consultas pero solo 7 llegan a reunión, y más de la mitad pregunta por rentabilidad antes de avanzar. Probamos ARS 220.000 por 10 días con la rentabilidad en el primer renglón.',
    signals: [
      { id: 'sig-dev', label: 'Colegiales mono · 21% llega a reunión' },
      { id: 'sig-q-inversor', label: 'Preguntas de inversores' },
    ],
  }),
  'nun-recomendado': () => ({
    campaignName: 'Núñez parecidos a clientes',
    developmentId: 'nunez',
    typology: '2 ambientes',
    profile: 'recomendado',
    budget: 200_000,
    days: 14,
    cta: 'Enviar mensaje',
    segments: [
      { t: `Como quienes ya viven en MARQ: 2 ambientes en Núñez desde ${usd(priceFor('nunez', '2 ambientes'))}. ` },
      q('Si venís recomendado, tenés beneficio en el anticipo', '¿Tengo beneficio por venir recomendado?', 61),
      { t: '. ' },
      q('Visitá un departamento terminado cuando quieras', '¿Puedo ver un departamento terminado?', 38),
      { t: '.' },
    ],
    reasoning:
      'Los recomendados avanzan 52% a reunión y hoy llegan solo de boca en boca. Proponemos ARS 200.000 por 14 días a personas parecidas a los clientes MARQ.',
    signals: [
      { id: 'sig-profiles', label: 'Recomendado avanza 52%' },
      { id: 'sig-q-recomendado', label: 'Preguntas de recomendados' },
    ],
  }),
  'urq-amplio': () => ({
    campaignName: 'Villa Urquiza ampliación',
    developmentId: 'urquiza',
    typology: '3 ambientes',
    profile: 'amplio',
    budget: 900_000,
    days: 21,
    cta: 'Más información',
    segments: [{ t: `Nuevo en Villa Urquiza: 3 ambientes desde ${usd(priceFor('urquiza', '3 ambientes'))}. Consultá por financiación.` }],
    reasoning: 'Ampliar alcance del lanzamiento de Villa Urquiza a todo CABA y GBA norte.',
    signals: [{ id: 'sig-dev', label: 'Villa Urquiza 3 amb' }],
  }),
}

/** Orden en que el botón "Generar propuesta" va sacando borradores */
export const GEN_CYCLE = ['urq-primera', 'col-mono-inv', 'nun-recomendado', 'bel-conocido']

let did = 0
export function buildDraft(template: string, createdAt = Date.now(), extra: Partial<CampaignDraft> = {}): CampaignDraft {
  const { campaignName: _n, ...t } = TEMPLATES[template]()
  return { ...t, id: `cd-${template}-${did++}`, template, status: 'pendiente', createdAt, ...extra }
}

export const campaignNameFor = (template: string) => TEMPLATES[template]().campaignName

export const INITIAL_DRAFTS: CampaignDraft[] = [
  buildDraft('col-primera', NOW - 2 * H),
  buildDraft('nun-inversor', NOW - 5 * H - 20 * MIN),
  buildDraft('bel-conocido', NOW - 1 * D - 3 * H),
  buildDraft('urq-amplio', NOW - 3 * D, { status: 'descartado', discardReason: 'Presupuesto muy alto' }),
]

export const DRAFT_DISCARD_REASONS = [
  'No es el desarrollo que queremos empujar',
  'Presupuesto muy alto',
  'El tono no es MARQ',
  'Ya no hay unidades de esa tipología',
]

/** Histórico previo al prototipo, para Métricas */
export const DRAFT_BASELINE = {
  approved: 14,
  edited: 9,
  discarded: 5,
  reasons: {
    'Presupuesto muy alto': 2,
    'No es el desarrollo que queremos empujar': 1,
    'El tono no es MARQ': 1,
    'Ya no hay unidades de esa tipología': 1,
  } as Record<string, number>,
}

export const adText = (segments: AdSegment[]) => segments.map((s) => s.t).join('')

/** Re-arma los tramos tras una edición: conserva las anotaciones cuyo texto sigue presente */
export function resegment(text: string, prev: AdSegment[]): AdSegment[] {
  const marks = prev.filter((s) => s.q && text.includes(s.t))
  const out: AdSegment[] = []
  let rest = text
  while (rest) {
    let best: { i: number; s: AdSegment } | null = null
    for (const s of marks) {
      const i = rest.indexOf(s.t)
      if (i >= 0 && (!best || i < best.i)) best = { i, s }
    }
    if (!best) {
      out.push({ t: rest })
      break
    }
    if (best.i > 0) out.push({ t: rest.slice(0, best.i) })
    out.push(best.s)
    rest = rest.slice(best.i + best.s.t.length)
  }
  return out
}

export const devShort = (id: string) => devById(id).neighborhood
