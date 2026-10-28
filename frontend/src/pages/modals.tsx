import type { AppContextValue } from '../types'
import { Field, Notice } from '../components/ui'

export function newMatterModal({ openModal, toast }: AppContextValue) {
  openModal({
    title: 'Create matter',
    body: (
      <>
        <Field label="Matter title"><input name="title" placeholder="Client v. Opposing party" /></Field>
        <Field label="Case number (if assigned)"><input name="number" placeholder="e.g. CR/2026/001" /></Field>
        <Field label="Practice area">
          <select name="area">
            <option>Criminal</option><option>Civil</option><option>Writ</option><option>Family</option><option>Commercial</option>
          </select>
        </Field>
        <Notice>New matter will be simulated locally. Complete conflict checks before engagement.</Notice>
      </>
    ),
    onSave: () => toast('Matter draft created in prototype session'),
  })
}

export function newTaskModal({ openModal, toast, setTasks }: AppContextValue) {
  openModal({
    title: 'Add task',
    body: (
      <>
        <Field label="Task title"><input name="title" required placeholder="What needs to be done?" /></Field>
        <Field label="Due date / label"><input name="due" type="date" /></Field>
        <Field label="Assign to">
          <select name="owner"><option>Me</option><option>Associate</option><option>Clerk</option></select>
        </Field>
      </>
    ),
    onSave: (fd) => {
      const title = String(fd.get('title') ?? '').trim()
      if (!title) return toast('Enter a task title')
      const due = String(fd.get('due') ?? '') || 'Unscheduled'
      setTasks((t) => [...t, { title, due, done: false }])
      toast('Task added to demo task list')
    },
  })
}

export function caseNoteModal({ openModal, toast }: AppContextValue) {
  openModal({
    title: 'Create case note',
    body: (
      <>
        <Field label="Note title"><input name="title" defaultValue="Matter review note" /></Field>
        <Field label="Content">
          <textarea name="content" defaultValue="Review source materials and confirm any uncertain dates or legal references." />
        </Field>
        <Notice>A real system should retain source references, author, timestamps and version history.</Notice>
      </>
    ),
    onSave: () => toast('Case note saved in prototype session'),
  })
}
