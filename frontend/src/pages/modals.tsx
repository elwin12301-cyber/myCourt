import type { AppContextValue } from '../types'
import { Field, Notice, Input, Select, Textarea } from '../components/ui'

export function newMatterModal({ openModal, toast }: AppContextValue) {
  openModal({
    title: 'Create matter',
    body: (
      <>
        <Field label="Matter title"><Input name="title" placeholder="Client v. Opposing party" /></Field>
        <Field label="Case number (if assigned)"><Input name="number" placeholder="e.g. CR/2026/001" /></Field>
        <Field label="Practice area">
          <Select name="area">
            <option>Criminal</option><option>Civil</option><option>Writ</option><option>Family</option><option>Commercial</option>
          </Select>
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
        <Field label="Task title"><Input name="title" required placeholder="What needs to be done?" /></Field>
        <Field label="Due date / label"><Input name="due" type="date" /></Field>
        <Field label="Assign to">
          <Select name="owner"><option>Me</option><option>Associate</option><option>Clerk</option></Select>
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
        <Field label="Note title"><Input name="title" defaultValue="Matter review note" /></Field>
        <Field label="Content">
          <Textarea name="content" defaultValue="Review source materials and confirm any uncertain dates or legal references." />
        </Field>
        <Notice>A real system should retain source references, author, timestamps and version history.</Notice>
      </>
    ),
    onSave: () => toast('Case note saved in prototype session'),
  })
}
