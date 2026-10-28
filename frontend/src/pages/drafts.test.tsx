import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Draft } from '../api/workspace'
import { DraftCard } from './MatterWorkspace'

const base: Draft = {
  id: 'd1', version: 1, kind: 'research', title: 'Bail research', body: 'Demonstration body', sources: [], status: 'draft',
  generatedBy: 'demo_provider', isDemoContent: true, label: 'Draft: advocate verification required', approvals: [],
}
const html = (d: Draft, canApprove: boolean) => renderToString(<DraftCard draft={d} canApprove={canApprove} onApprove={() => {}} />)

describe('draft card (constitution II)', () => {
  it('always says a draft needs advocate verification', () => {
    expect(html(base, true)).toContain('Draft: advocate verification required')
    expect(html(base, false)).toContain('Draft: advocate verification required')
  })

  it('labels demonstration content as not legal advice', () => {
    expect(html(base, true)).toContain('Demonstration content, not legal advice')
  })

  it('shows the Approve button only to someone who can edit, and only for a draft', () => {
    expect(html(base, true)).toContain('Approve this draft')
    expect(html(base, false)).not.toContain('Approve this draft')
    expect(html({ ...base, status: 'approved' }, true)).not.toContain('Approve this draft')
    expect(html({ ...base, status: 'approved' }, true)).toContain('Approved by an advocate')
  })

  it('says plainly when there are no sources, and lists them when there are', () => {
    expect(html(base, true)).toContain('No sources listed.')
    const withSources = html({ ...base, sources: [{ label: 'Fictional Authority A (demo)', reference: 'Fictional demonstration source' }] }, true)
    expect(withSources).toContain('Fictional Authority A (demo)')
    expect(withSources).not.toContain('No sources listed.')
  })
})
