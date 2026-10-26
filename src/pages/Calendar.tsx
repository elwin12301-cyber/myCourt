import { useApp } from '../context'
import { Btn, Card, Notice, PageHead, Stat } from '../components/ui'
import { newTaskModal } from './modals'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const EVENTS: Record<number, string> = { 23: 'Task due', 28: 'Hearing · CR/0412', 30: 'Draft review' }

export default function CalendarPage() {
  const app = useApp()
  const { tasks, setTasks } = app

  return (
    <>
      <PageHead title="Calendar & Follow-up" sub="Track hearings, limitation-related dates, tasks, client follow-ups and delivery confirmations.">
        <Btn kind="primary" onClick={() => newTaskModal(app)}>+ Add reminder</Btn>
      </PageHead>
      <div className="grid stats">
        <Stat label="This week" num="7" desc="Events and tasks" ico="◷" />
        <Stat label="Due today" num="4" desc="2 need confirmation" ico="!" />
        <Stat label="Awaiting client" num="3" desc="Follow-up required" ico="↗" />
        <Stat label="Completed" num="19" desc="This month" ico="✓" />
      </div>
      <div className="grid layout2">
        <Card title="October 2026">
          <div className="calendar">
            {DAYS.map((d) => <div className="day" key={d}><b>{d}</b></div>)}
            {Array.from({ length: 35 }, (_, i) => {
              const n = i - 2
              const inMonth = n > 0 && n <= 31
              return (
                <div className={`day ${n === 23 ? 'today' : ''}`} key={i}>
                  <b>{inMonth ? n : ''}</b>
                  {inMonth && EVENTS[n] && <span className="dot">{EVENTS[n]}</span>}
                </div>
              )
            })}
          </div>
        </Card>
        <Card title="Tasks & follow-up">
          {tasks.map((t, i) => (
            <label className="checkrow" key={`${t.title}-${i}`}>
              <input type="checkbox" checked={t.done} onChange={(e) => setTasks((all) => all.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))} />
              <div style={{ flex: 1 }}>
                <strong style={t.done ? { textDecoration: 'line-through', color: '#98a2b3' } : undefined}>{t.title}</strong>
                <small>Due: {t.due}</small>
              </div>
              <span className={`pill ${t.due === 'Today' ? 'amber' : ''}`}>{t.done ? 'Done' : t.due}</span>
            </label>
          ))}
          <div className="actions" style={{ marginTop: 14 }}>
            <Btn kind="primary" onClick={() => newTaskModal(app)}>+ Add task</Btn>
            <Btn kind="soft" to="hearing">Prepare hearing</Btn>
          </div>
          <Notice>Date calculations depend on the applicable statute, rules, holidays and case facts. This prototype does not calculate or certify limitation dates.</Notice>
        </Card>
      </div>
    </>
  )
}
