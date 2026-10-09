import confetti from 'canvas-confetti'

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const DAYS_LONG = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const pad = (n: number) => String(n).padStart(2, '0')
export const hhmm = (t: number) => {
  const d = new Date(t)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Short relative label for lists */
export function relTime(t: number, now = Date.now()) {
  const diff = now - t
  if (diff < 60_000) return 'ahora'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`
  const days = Math.round((startOfDay(now) - startOfDay(t)) / 86_400_000)
  if (days === 0) return hhmm(t)
  if (days === 1) return 'ayer'
  if (days < 7) return `${DAYS[new Date(t).getDay()]} ${hhmm(t)}`
  const d = new Date(t)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function dayLabel(t: number, now = Date.now()) {
  const days = Math.round((startOfDay(now) - startOfDay(t)) / 86_400_000)
  const d = new Date(t)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `${DAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function daysIn(t: number, now = Date.now()) {
  return Math.floor((now - t) / 86_400_000)
}

export function stageAgeLabel(t: number) {
  const diff = Date.now() - t
  const d = Math.floor(diff / 86_400_000)
  if (d >= 1) return `${d} ${d === 1 ? 'día' : 'días'} en esta etapa`
  const h = Math.floor(diff / 3_600_000)
  if (h >= 1) return `${h} h en esta etapa`
  const m = Math.max(1, Math.floor(diff / 60_000))
  return `${m} min en esta etapa`
}

export const usd = (n: number) => `USD ${n.toLocaleString('es-AR')}`
export const ars = (n: number) => `ARS ${Math.round(n).toLocaleString('es-AR')}`

export const firstName = (n: string) => n.split(' ')[0]

export const initials = (n: string) =>
  n
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

export function isOutOfHours(t: number) {
  const d = new Date(t)
  return d.getDay() === 0 || d.getDay() === 6 || d.getHours() < 9 || d.getHours() >= 19
}

/* ───────── Sound: soft two-note chime generated with WebAudio */
let ctx: AudioContext | null = null
export function chime() {
  try {
    ctx = ctx ?? new AudioContext()
    const now = ctx.currentTime
    ;[
      [880, 0],
      [1318.5, 0.11],
    ].forEach(([f, delay]) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0, now + delay)
      g.gain.linearRampToValueAtTime(0.08, now + delay + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.9)
      o.connect(g).connect(ctx!.destination)
      o.start(now + delay)
      o.stop(now + delay + 1)
    })
  } catch {
    /* ignore */
  }
}

export function celebrate() {
  const colors = ['#4a5a3a', '#b8963e', '#e9dfcf', '#c98a6b', '#8a9a6a', '#ffffff']
  const end = Date.now() + 900
  confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors, scalar: 0.9 })
  ;(function frame() {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
