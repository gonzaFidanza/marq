import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Toasts } from './components/Toasts'
import { Login } from './components/Login'
import { Inbox } from './views/Inbox'
import { Board } from './views/Board'
import { Metrics } from './views/Metrics'
import { CardDrawer, DiscardModal } from './views/Overlays'
import { Attraction } from './views/attraction/Attraction'
import { CampaignDrawer } from './views/attraction/Campaigns'
import { DraftDiscardModal, WhyModal } from './views/attraction/Overlays'
import { Beams } from './components/Beams'

export default function App() {
  const loggedIn = useStore((s) => s.loggedIn)
  const view = useStore((s) => s.view)
  const drawerId = useStore((s) => s.drawerId)
  const pendingDiscard = useStore((s) => s.pendingDiscard)
  const campaignDrawerId = useStore((s) => s.campaignDrawerId)
  const whyOpen = useStore((s) => s.whyOpen)
  const pendingDraftDiscard = useStore((s) => s.pendingDraftDiscard)

  // Presentation mode: N simula una consulta entrante, C genera una propuesta de campaña
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const s = useStore.getState()
      if (!s.loggedIn) return
      if (e.key === 'n' || e.key === 'N') s.simulateIncoming()
      if (e.key === 'c' || e.key === 'C') s.generateCampaign()
      if (e.key === '1') s.setView('inbox')
      if (e.key === '2') s.setView('board')
      if (e.key === '3') s.setView('attraction')
      if (e.key === '4') s.setView('metrics')
      if (e.key === 'Escape') {
        s.openDrawer(null)
        s.setRemindersOpen(false)
        s.openCampaign(null)
        s.setWhyOpen(false)
        s.cancelDraftDiscard()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <AnimatePresence>{!loggedIn && <Login key="login" />}</AnimatePresence>
      {loggedIn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="flex h-full overflow-hidden"
        >
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="relative min-h-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  {view === 'inbox' && <Inbox />}
                  {view === 'board' && <Board />}
                  {view === 'attraction' && <Attraction />}
                  {view === 'metrics' && <Metrics />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </motion.div>
      )}
      <AnimatePresence>{drawerId && <CardDrawer key={drawerId} id={drawerId} />}</AnimatePresence>
      <AnimatePresence>{pendingDiscard && <DiscardModal key="discard" id={pendingDiscard} />}</AnimatePresence>
      <AnimatePresence>{campaignDrawerId && <CampaignDrawer key={campaignDrawerId} id={campaignDrawerId} />}</AnimatePresence>
      <AnimatePresence>{whyOpen && <WhyModal key="why" />}</AnimatePresence>
      <AnimatePresence>{pendingDraftDiscard && <DraftDiscardModal key="ddiscard" id={pendingDraftDiscard} />}</AnimatePresence>
      <Beams />
      <Toasts />
    </>
  )
}
