import { useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Field, Notice, PageHead, Pill, Stat } from '../components/ui'

export default function DocumentsPage() {
  const { docs, setDocs, openModal, toast } = useApp()
  const [filter, setFilter] = useState('')
  const [correction, setCorrection] = useState('The application is allowed subject to conditions specified in paragraph 7…')

  const upload = () => openModal({
    title: 'Upload document',
    body: (
      <>
        <Field label="Choose a file"><input name="file" type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg" /></Field>
        <Field label="Link to matter">
          <select><option>CR/2025/0412 · State v. R. Kumar</option><option>CS/2024/118 · Mehta v. Rao</option></select>
        </Field>
        <Notice>Prototype only: file is not uploaded to a server and OCR is not run.</Notice>
      </>
    ),
    onSave: (fd) => {
      const f = fd.get('file')
      if (f instanceof File && f.name) {
        setDocs((d) => [{ name: f.name, type: `${Math.round(f.size / 1024)} KB · local demo`, status: 'Not processed', confidence: '—' }, ...d])
        toast('File listed in local demo only')
      }
    },
  })

  const visible = docs.filter((d) => `${d.name} ${d.type}`.toLowerCase().includes(filter.toLowerCase()))

  return (
    <>
      <PageHead title="Documents & OCR" sub="Upload and organise matter files, inspect extraction quality, and keep versions traceable.">
        <Btn kind="primary" onClick={upload}>Upload document</Btn>
      </PageHead>
      <div className="grid stats">
        <Stat label="Matter files" num="126" desc="Across active matters" ico="▤" />
        <Stat label="OCR complete" num="112" desc="Extracted text available" ico="✓" />
        <Stat label="Needs review" num="4" desc="Low-confidence passages" ico="!" />
        <Stat label="Versions" num="18" desc="Recent document changes" ico="↻" />
      </div>
      <div className="grid layout2">
        <Card title="Document library">
          <div className="field"><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search file name or type…" /></div>
          {visible.map((d) => (
            <div className="listrow" key={d.name}>
              <div className="docrow">
                <div className="docicon">{d.name.endsWith('.txt') ? 'TXT' : 'PDF'}</div>
                <div><strong>{d.name}</strong><small>{d.type} · {d.confidence} confidence</small></div>
              </div>
              <div>
                <Pill kind={d.status === 'Review needed' ? 'amber' : 'green'}>{d.status}</Pill>
                <Btn className="small" style={{ marginLeft: 5 }} onClick={() => toast('Open original and compare flagged passages')}>Review</Btn>
              </div>
            </div>
          ))}
          <Notice>Scanned documents may contain OCR errors. Compare extracted text with the original page before relying on names, dates, amounts or section references.</Notice>
        </Card>
        <Card title="OCR review panel">
          <div className="docrow" style={{ marginBottom: 18 }}>
            <div className="docicon">PDF</div>
            <div><strong>Order dated 02 Sep 2026.pdf</strong><small className="muted">Page 4 of 6 · OCR confidence 84%</small></div>
          </div>
          <Pill kind="amber">1 passage flagged</Pill>
          <div className="transcript" style={{ marginTop: 12 }}>
            “The application is allowed subject to <span className="uncertain">[uncertain: conditions]</span> specified in paragraph 7…”
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Corrected text (confirm against original)">
              <textarea value={correction} onChange={(e) => setCorrection(e.target.value)} />
            </Field>
          </div>
          <div className="actions">
            <Btn onClick={() => toast('Document flagged for manual OCR review')}>Mark for review</Btn>
            <Btn kind="primary" onClick={() => toast('Correction marked confirmed in prototype session')}>Confirm correction</Btn>
          </div>
          <div className="sourcebox"><h4>Provenance</h4><p>Original file preserved · Page-level reference retained · Correction history should be auditable.</p></div>
        </Card>
      </div>
    </>
  )
}
