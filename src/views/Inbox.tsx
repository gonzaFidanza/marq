import { useStore } from '../store'
import { ConversationList } from './ConversationList'
import { ChatPane } from './ChatPane'
import { ContactPanel } from './ContactPanel'

export function Inbox() {
  const c = useStore((s) => s.contacts.find((x) => x.id === s.selectedId) ?? s.contacts[0])
  return (
    <div className="flex h-full min-h-0">
      <ConversationList />
      <ChatPane c={c} />
      <ContactPanel c={c} />
    </div>
  )
}
