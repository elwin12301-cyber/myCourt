import { useState } from 'react'
import { useApp } from '../context'
import { Btn, Card, Check, Field, Notice, PageHead, Pill, Select, Textarea } from '../components/ui'
import { caseNoteModal } from './modals'

export default function ResearchPage() {
  const app = useApp()
  const { researchQuery, setResearchQuery, toast } = app
  const [results, setResults] = useState<string | null>(null)

  return (
    <>
      <PageHead title="RAG Research Workspace" sub="Search across authorised matter files, judgments, statutes and notes with evidence-linked answers.">
        <Btn kind="soft" onClick={() => toast('Research note saved in this prototype session')}>Save research note</Btn>
      </PageHead>
      <div className="card" style={{ marginBottom: 18 }}>
        <Field label="Research question">
          <Textarea
            value={researchQuery}
            onChange={(e) => setResearchQuery(e.target.value)}
            placeholder="Ask a focused legal question. Example: Find authorities on admissibility and flag conflicting treatment."
          />
        </Field>
        <div className="grid layout3">
          <Field label="Jurisdiction">
            <Select><option>All relevant courts</option><option>Supreme Court of India</option><option>Madras High Court</option><option>Sessions Court</option></Select>
          </Field>
          <Field label="Source type">
            <Select><option>All authorised sources</option><option>Judgments</option><option>Statutes</option><option>Uploaded matter files</option><option>Advocate notes</option></Select>
          </Field>
          <Field label="Time filter">
            <Select><option>Current and historical, labelled</option><option>Current law only</option><option>Before 1 July 2024</option><option>Custom date range</option></Select>
          </Field>
        </div>
        <div className="actions">
          <Btn kind="primary" onClick={() => setResults(researchQuery)}>⌕ Retrieve sources</Btn>
          <Btn onClick={() => setResults(researchQuery)}>Search within this matter</Btn>
        </div>
      </div>
      <div className="grid layout2">
        <Card title="Retrieved evidence">
          {results === null ? (
            <div className="empty">Enter a question and select “Retrieve sources” to preview evidence-linked results.</div>
          ) : (
            <>
              <div className="result">
                <div className="resultmeta"><Pill kind="blue">Illustrative retrieval</Pill><Pill>Uploaded matter file</Pill><Pill kind="amber">OCR review</Pill></div>
                <h4>1. Order dated 02 Sep 2026 · page 4</h4>
                <p>Potentially relevant passage for <b>{results || 'your research question'}</b>. One phrase has medium OCR confidence; inspect the original page before relying on it.</p>
                <div className="actions">
                  <Btn className="small" to="documents">Open document review</Btn>
                  <Btn className="small" onClick={() => caseNoteModal(app)}>Add to case note</Btn>
                </div>
              </div>
              <div className="result">
                <div className="resultmeta"><Pill kind="blue">Authority candidate</Pill><Pill kind="amber">Treatment not verified</Pill></div>
                <h4>2. Relevant judgment — source verification required</h4>
                <p>The prototype does not fetch live case law. In a connected implementation, show the actual case name, court, date, neutral citation, pinpoint paragraph and subsequent treatment here.</p>
                <div className="actions">
                  <Btn className="small" to="mapping">Open legal mapping</Btn>
                  <Btn className="small" to="hearing">Add to hearing brief</Btn>
                </div>
              </div>
              <div className="result">
                <div className="resultmeta"><Pill>Statutory text</Pill><Pill kind="amber">Applicability check</Pill></div>
                <h4>3. Provision to verify</h4>
                <p>Confirm current text, commencement, transitional rules and jurisdiction against an authoritative source before applying it to these facts.</p>
                <div className="actions">
                  <Btn className="small" to="mapping">Check section mapping</Btn>
                  <Btn className="small" to="hearing">Prepare hearing</Btn>
                </div>
              </div>
              <Notice>These are sample interface results, not actual legal retrieval or verified authorities. No citations are fabricated in this prototype.</Notice>
            </>
          )}
        </Card>
        <Card title="Evidence & provenance">
          <Check defaultChecked title="Judgments" sub="Show court, date, pinpoint and treatment status" />
          <Check defaultChecked title="Statutes and amendments" sub="Check commencement and transitional provisions" />
          <Check defaultChecked title="Uploaded case documents" sub="Page number, OCR confidence and source excerpt" />
          <Check title="Include persuasive authorities" sub="Label separately from binding authority" />
          <Notice>Retrieval is not verification. A source not found in this prototype is not proof that no authority exists. Verify every citation against an authoritative source.</Notice>
          <Btn kind="soft" to="mapping">Open legal section mapping</Btn>
        </Card>
      </div>
    </>
  )
}
