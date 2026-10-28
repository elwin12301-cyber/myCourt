import { useState, type ReactNode } from 'react'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import * as W from '../../api/workspace'
import { Message, SelectField } from '../../components/mui'
import { PageHead } from '../../components/ui'
import { State, useLoad } from '../MatterWorkspace'

/** The matter a screen is working on is remembered while moving between screens. */
let remembered = ''

/**
 * Screens that used to hold their own browser-only state now work on one of the person's matters, so everything saved
 * is private to the people assigned to it and appears in its audit trail. This picks the matter and hands it to `children`.
 */
export function Scoped({ title, sub, actions, children }: { title: string; sub: string; actions?: ReactNode; children: (m: W.Matter) => ReactNode }) {
  const l = useLoad(() => W.matters.list(), [])
  const [id, setId] = useState(remembered)
  const items = l.data?.items ?? []
  const m = items.find((x) => x.id === id) ?? items[0] ?? null
  return (
    <>
      <PageHead title={title} sub={sub}>{actions}</PageHead>
      <State loading={l.loading} error={l.error} onRetry={l.reload}>
        {!m ? (
          <Message severity="info">You have no matters yet. <Link href="#/cases">Create one on the Cases screen</Link> first; this screen saves its work on a matter.</Message>
        ) : (
          <>
            <SelectField id="scope-matter" label="Matter" value={m.id} onChange={(e) => { remembered = e.target.value; setId(e.target.value) }}>
              {items.map((x) => <option key={x.id} value={x.id}>{x.title}{x.isDemo ? ' (demo)' : ''}</option>)}
            </SelectField>
            {!W.canEdit(m.myLevel) && <Typography variant="caption" color="text.secondary" component="p">You have view-only access to this matter.</Typography>}
            <div key={m.id}>{children(m)}</div>
          </>
        )}
      </State>
    </>
  )
}
