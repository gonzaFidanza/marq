import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useStore } from '../store'
import { Logo } from './ui'

const HERO = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=75'

export function Login() {
  const login = useStore((s) => s.login)
  const [loading, setLoading] = useState(false)

  const enter = () => {
    setLoading(true)
    setTimeout(login, 900)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex bg-bg"
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Left: image */}
      <div className="relative hidden w-[56%] overflow-hidden lg:block">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#c9b79c,#8f9a78 55%,#3a4730)' }} />
        <motion.img
          src={HERO}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 8, ease: 'easeOut' }}
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1d1f17]/90 via-[#1d1f17]/45 to-[#1d1f17]/25" />
        <div className="grain absolute inset-0 opacity-[0.08] mix-blend-overlay" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="absolute right-14 bottom-14 left-14 text-[#f4efe6]"
        >
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase opacity-70">Asistente comercial</p>
          <p className="mt-4 max-w-[520px] font-serif text-[44px] leading-[1.08] font-light">
            La tecnología se queda <em className="font-normal">debajo</em> de la línea de visibilidad.
          </p>
          <p className="mt-5 max-w-[440px] text-[14px] leading-relaxed opacity-75">
            Registra, clasifica, redacta y recuerda. Las conversaciones las seguís teniendo vos.
          </p>
          <div className="mt-10 flex gap-8 text-[12px] opacity-70">
            <span>MARQ Colegiales</span>
            <span>MARQ Villa Urquiza</span>
            <span>MARQ Belgrano R</span>
            <span>MARQ Núñez</span>
          </div>
        </motion.div>
      </div>

      {/* Right: form */}
      <div className="relative flex flex-1 items-center justify-center px-10">
        <div className="dot-grid absolute inset-0 opacity-50" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative w-full max-w-[380px]"
        >
          <motion.div initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1.2 }}>
            <Logo width={210} />
          </motion.div>
          <p className="mt-4 text-[13px] text-ink-3">Desarrollos inmobiliarios · Buenos Aires</p>

          <div className="mt-12 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
                <input
                  defaultValue="candelaria@marq.com.ar"
                  className="h-12 w-full rounded-xl border border-line bg-surface pl-10 text-[14px] text-ink shadow-soft outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-ink-2">Contraseña</span>
              <div className="relative">
                <Lock size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
                <input
                  type="password"
                  defaultValue="marqmarq2026"
                  onKeyDown={(e) => e.key === 'Enter' && enter()}
                  className="h-12 w-full rounded-xl border border-line bg-surface pl-10 text-[14px] text-ink shadow-soft outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/10"
                />
              </div>
            </label>
          </div>

          <motion.button
            onClick={enter}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="group mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-strong text-[14px] font-medium text-accent-ink shadow-[0_10px_30px_-10px_rgba(58,71,48,0.7)] dark:bg-accent"
          >
            {loading ? (
              <motion.span
                className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                Entrar
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </>
            )}
          </motion.button>

          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-line bg-surface/70 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[12.5px] leading-relaxed text-ink-2">
              <b className="font-semibold text-ink">Nada se envía sin tu aprobación.</b> El asistente prepara borradores; vos
              decidís qué sale y cuándo.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
