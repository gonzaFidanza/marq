import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { Building2, Handshake, KeyRound, Megaphone, Sprout } from 'lucide-react'
import { useStore } from '../store'
import type { Contact, Origin, Profile } from '../types'
import { CAMPAIGN_COLOR, ORIGINS, PROFILES, originOf } from '../data/attraction'
import { devById } from '../data/config'
import { cn } from '../lib/utils'
import { Logo } from './ui'

export function ProfileChip({ value, size = 'sm' }: { value: Profile; size?: 'xs' | 'sm' }) {
  const p = PROFILES[value]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'xs' ? 'px-1.5 py-px text-[10.5px]' : 'px-2 py-0.5 text-[11px]',
      )}
      style={{ background: p.soft, color: p.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
      {p.label}
    </span>
  )
}

const ORIGIN_ICON: Record<Exclude<Origin, 'campana'>, typeof Sprout> = {
  recomendacion: Handshake,
  organico: Sprout,
  portal: Building2,
  cliente: KeyRound,
}

/** Chip de origen: campaña de pauta (destacado) o recomendación / orgánico / portal */
export function OriginChip({ c, size = 'xs', className }: { c: Contact; size?: 'xs' | 'sm'; className?: string }) {
  const campaign = useStore((s) => (c.campaignId ? s.campaigns.find((x) => x.id === c.campaignId) : undefined))
  const o = originOf(c)
  const pad = size === 'xs' ? 'px-1.5 py-px text-[10.5px]' : 'px-2 py-0.5 text-[11.5px]'
  if (o === 'campana') return <CampaignChip name={campaign?.name ?? 'Campaña'} size={size} className={className} />
  const Icon = ORIGIN_ICON[o]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-line bg-surface font-medium whitespace-nowrap text-ink-2', pad, className)}>
      <Icon size={size === 'xs' ? 10 : 12} style={{ color: ORIGINS[o].color }} />
      {ORIGINS[o].label}
    </span>
  )
}

export function CampaignChip({ name, size = 'xs', className }: { name: string; size?: 'xs' | 'sm'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full border font-medium whitespace-nowrap',
        size === 'xs' ? 'px-1.5 py-px text-[10.5px]' : 'px-2 py-0.5 text-[11.5px]',
        className,
      )}
      style={{ borderColor: CAMPAIGN_COLOR + '45', background: CAMPAIGN_COLOR + '12', color: CAMPAIGN_COLOR }}
    >
      <Megaphone size={size === 'xs' ? 10 : 12} className="shrink-0" />
      <span className="truncate">Camp. {name}</span>
    </span>
  )
}

/** Número que se anima desde su valor anterior al nuevo */
export function AnimatedNumber({
  value,
  from = 0,
  format = (n) => Math.round(n).toLocaleString('es-AR'),
  duration = 1.3,
}: {
  value: number
  from?: number
  format?: (n: number) => string
  duration?: number
}) {
  const [v, setV] = useState(from)
  const prev = useRef(from)
  useEffect(() => {
    const ctrl = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (x) => {
        prev.current = x
        setV(x)
      },
    })
    return () => ctrl.stop()
  }, [value, duration])
  return <>{format(v)}</>
}

/** Avatar de marca MARQ para el anuncio */
export function MarqAvatar({ size = 30 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-[#23211e] text-[#f6f3ec] ring-1 ring-black/10"
      style={{ width: size, height: size }}
    >
      <Logo compact width={size * 0.72} className="text-[#f6f3ec]!" />
    </span>
  )
}

/** Imagen de un desarrollo con degradé de respaldo */
export function DevImage({ id, className, children }: { id: string; className?: string; children?: React.ReactNode }) {
  const dev = devById(id)
  return (
    <div className={cn('relative overflow-hidden', className)} style={{ background: dev.gradient }}>
      <img
        src={dev.image}
        alt=""
        className="h-full w-full object-cover"
        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
      />
      {children}
    </div>
  )
}

/** Miniatura del anuncio que vio un contacto */
export function MiniAd({ developmentId, text, className }: { developmentId: string; text: string; className?: string }) {
  const dev = devById(developmentId)
  return (
    <div className={cn('w-[92px] shrink-0 overflow-hidden rounded-xl border border-line bg-surface shadow-soft', className)}>
      <div className="flex items-center gap-1 px-1.5 py-1">
        <MarqAvatar size={11} />
        <span className="truncate text-[6.5px] font-semibold text-ink">MARQ · {dev.neighborhood}</span>
      </div>
      <DevImage id={developmentId} className="h-[64px]" />
      <div className="bg-[#3a4730] px-1.5 py-[3px] text-[6.5px] font-semibold text-white">Enviar mensaje ›</div>
      <p className="line-clamp-3 px-1.5 py-1 text-[6.5px] leading-[1.35] text-ink-2">{text}</p>
    </div>
  )
}
