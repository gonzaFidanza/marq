import { Mail, MessageCircle, Building2, type LucideProps } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Channel, Classification, StageId } from '../types'
import { CHANNELS, CLASSIFICATIONS, TEAM, stageById } from '../data/config'
import { cn, initials } from '../lib/utils'

export function InstagramIcon(props: LucideProps) {
  const { size = 16, strokeWidth = 2, ...rest } = props
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(rest as React.SVGProps<SVGSVGElement>)}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function WhatsAppIcon(props: LucideProps) {
  return <MessageCircle {...props} />
}

const channelIcon: Record<Channel, (p: LucideProps) => React.ReactNode> = {
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
  mail: (p) => <Mail {...p} />,
  portal: (p) => <Building2 {...p} />,
}

export function ChannelIcon({ channel, size = 14, className }: { channel: Channel; size?: number; className?: string }) {
  const Icon = channelIcon[channel]
  return (
    <span className={cn('inline-flex', className)} style={{ color: CHANNELS[channel].color }}>
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}

/** Small round channel badge (used over avatars) */
export function ChannelBadge({ channel, size = 20, className }: { channel: Channel; size?: number; className?: string }) {
  const Icon = channelIcon[channel]
  const bg =
    channel === 'instagram'
      ? 'linear-gradient(135deg,#d58aa8,#a47cc4)'
      : CHANNELS[channel].color
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full text-white ring-2 ring-surface', className)}
      style={{ width: size, height: size, background: bg }}
    >
      <Icon size={size * 0.55} strokeWidth={2.4} />
    </span>
  )
}

export function ChannelPill({ channel, portal }: { channel: Channel; portal?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: CHANNELS[channel].soft, color: CHANNELS[channel].color }}
    >
      <ChannelIcon channel={channel} size={12} />
      {portal ?? CHANNELS[channel].label}
    </span>
  )
}

export function Avatar({
  name,
  hue,
  size = 40,
  channel,
  className,
  ring,
}: {
  name: string
  hue: number
  size?: number
  channel?: Channel
  className?: string
  ring?: boolean
}) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      <span
        className={cn(
          'flex h-full w-full items-center justify-center rounded-full font-medium tracking-wide',
          ring && 'ring-2 ring-surface',
        )}
        style={{
          background: `linear-gradient(145deg, hsl(${hue} 38% 88%), hsl(${hue + 18} 30% 74%))`,
          color: `hsl(${hue} 30% 26%)`,
          fontSize: size * 0.36,
        }}
      >
        {initials(name)}
      </span>
      {channel && (
        <ChannelBadge
          channel={channel}
          size={Math.max(16, size * 0.42)}
          className="absolute -right-0.5 -bottom-0.5"
        />
      )}
    </span>
  )
}

export function TeamAvatar({ id, size = 22, className }: { id: string; size?: number; className?: string }) {
  const t = TEAM[id]
  if (!t) return null
  return (
    <span
      title={t.name}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-surface', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `hsl(${t.hue} 30% 30%)`,
        color: `hsl(${t.hue} 40% 92%)`,
      }}
    >
      {t.initials}
    </span>
  )
}

export function ClassChip({
  value,
  size = 'sm',
  analyzing,
}: {
  value: Classification
  size?: 'xs' | 'sm'
  analyzing?: boolean
}) {
  if (analyzing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-accent"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        Analizando…
      </span>
    )
  }
  const c = CLASSIFICATIONS[value]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'xs' ? 'px-1.5 py-px text-[10.5px]' : 'px-2 py-0.5 text-[11px]',
      )}
      style={{ background: c.soft, color: c.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  )
}

export function StagePill({ stage, onClick }: { stage: StageId; onClick?: () => void }) {
  const s = stageById(stage)
  const Icon = s.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-2 transition',
        onClick && 'hover:border-line-strong hover:text-ink',
      )}
    >
      <Icon size={12} style={{ color: s.color }} />
      {s.label}
    </button>
  )
}

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-white/25 bg-white/15 px-1 font-sans text-[10.5px] font-semibold',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

export function SparkleIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a9a6a" />
          <stop offset="0.5" stopColor="#c98a6b" />
          <stop offset="1" stopColor="#8f84c0" />
        </linearGradient>
      </defs>
      <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5z" fill="url(#spk)" />
      <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" fill="url(#spk)" opacity=".8" />
    </svg>
  )
}

export function Logo({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('font-serif font-medium tracking-[0.18em] text-ink', className)} style={{ fontSize: size }}>
      MARQ
    </span>
  )
}
