import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store'

const COLOR = '#8A74B0'

/** Pulso que sale de la tarjeta y partícula que viaja hasta "Atracción" en la sidebar */
export function Beams() {
  const beams = useStore((s) => s.beams)
  const remove = useStore((s) => s.removeBeam)

  return (
    <div className="pointer-events-none fixed inset-0 z-[85]">
      <AnimatePresence>
        {beams.map((b) => {
          const target = document.getElementById('nav-attraction')?.getBoundingClientRect()
          const tx = target ? target.left + target.width / 2 : 42
          const ty = target ? target.top + 20 : 200
          const midX = (b.x + tx) / 2
          const midY = Math.min(b.y, ty) - 120
          return (
            <motion.div key={b.id} className="absolute inset-0" exit={{ opacity: 0 }}>
              {[0, 1, 2].map((k) => (
                <motion.span
                  key={k}
                  className="absolute h-16 w-16 rounded-full border-2"
                  style={{ left: b.x - 32, top: b.y - 32, borderColor: COLOR }}
                  initial={{ scale: 0.3, opacity: 0.9 }}
                  animate={{ scale: 2.6, opacity: 0 }}
                  transition={{ duration: 1, delay: k * 0.16, ease: 'easeOut' }}
                />
              ))}
              {[0, 1, 2, 3].map((k) => (
                <motion.span
                  key={'p' + k}
                  className="absolute rounded-full"
                  style={{
                    width: 12 - k * 2.5,
                    height: 12 - k * 2.5,
                    left: -(6 - k * 1.25),
                    top: -(6 - k * 1.25),
                    background: k === 0 ? `radial-gradient(circle, #fff 0%, ${COLOR} 60%)` : COLOR,
                    boxShadow: k === 0 ? `0 0 18px 6px ${COLOR}88` : undefined,
                    opacity: 1 - k * 0.22,
                  }}
                  initial={{ x: b.x, y: b.y, scale: 0.4 }}
                  animate={{ x: [b.x, midX, tx], y: [b.y, midY, ty], scale: [0.4, 1.2, 0.7] }}
                  transition={{ duration: 0.95, delay: 0.25 + k * 0.045, ease: [0.55, 0, 0.35, 1], times: [0, 0.45, 1] }}
                  onAnimationComplete={k === 0 ? () => setTimeout(() => remove(b.id), 150) : undefined}
                />
              ))}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
