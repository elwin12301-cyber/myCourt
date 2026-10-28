from datetime import date, timedelta


def test_documents_limits_and_review(alice, bob):
    m = alice.matter()
    big = alice.post(f"/matters/{m['id']}/documents", {"name": "d", "fileType": "pdf", "extractedText": "x" * 200_001})
    assert big.status_code == 413 and big.json()["code"] == "too_large"
    assert alice.post(f"/matters/{m['id']}/documents", {"name": "d", "fileType": "exe"}).status_code == 422
    d = alice.post(f"/matters/{m['id']}/documents", {"name": "Petition", "fileType": "pdf", "extractedText": "text", "extractionConfidence": 0.7}).json()
    assert d["reviewStatus"] == "needs_review"
    r = alice.post(f"/matters/{m['id']}/documents/{d['id']}/review").json()
    assert r["reviewStatus"] == "reviewed" and r["reviewedBy"] == alice.person_id and r["reviewedAt"]
    edited = alice.patch(f"/matters/{m['id']}/documents/{d['id']}", {"version": r["version"], "extractedText": "new"}).json()
    assert edited["reviewStatus"] == "needs_review" and edited["reviewedBy"] is None
    assert bob.get(f"/matters/{m['id']}/documents").status_code == 404


def test_voice_note_transcript_limit(alice):
    m = alice.matter()
    assert alice.post(f"/matters/{m['id']}/voice-notes", {"transcript": "x" * 50_001}).status_code == 413
    assert alice.post(f"/matters/{m['id']}/voice-notes", {"transcript": "ok"}).status_code == 201


def test_deadline_is_unapproved_until_approved_and_a_change_withdraws_approval(alice, bob):
    m = alice.matter()
    e = alice.post(f"/matters/{m['id']}/calendar", {"kind": "deadline", "title": "File reply", "startsAt": "2031-03-01T09:00:00Z"}).json()
    assert e["approvedAt"] is None
    alice.put(f"/matters/{m['id']}/assignments/{bob.person_id}", {"level": "view"})
    assert bob.post(f"/matters/{m['id']}/calendar/{e['id']}/approve").status_code == 403
    ok = alice.post(f"/matters/{m['id']}/calendar/{e['id']}/approve").json()
    assert ok["approvedBy"] == alice.person_id and ok["approvedAt"]
    moved = alice.patch(f"/matters/{m['id']}/calendar/{e['id']}", {"version": ok["version"], "startsAt": "2031-03-05T09:00:00Z"}).json()
    assert moved["approvedAt"] is None


def test_calendar_spans_my_matters_only(alice, bob):
    a, b = alice.matter("A"), bob.matter("B")
    alice.post(f"/matters/{a['id']}/calendar", {"kind": "hearing", "title": "Mine", "startsAt": "2031-05-01T10:00:00Z"})
    bob.post(f"/matters/{b['id']}/calendar", {"kind": "hearing", "title": "Theirs", "startsAt": "2031-05-02T10:00:00Z"})
    items = alice.get("/calendar?from=2031-04-01T00:00:00Z&to=2031-06-01T00:00:00Z").json()["items"]
    assert [i["title"] for i in items] == ["Mine"]


def test_tasks_crud_and_pagination(alice):
    m = alice.matter()
    for i in range(3):
        alice.post(f"/matters/{m['id']}/tasks", {"title": f"t{i}", "due": str(date.today() + timedelta(days=i))})
    page = alice.get(f"/matters/{m['id']}/tasks?limit=2").json()
    assert len(page["items"]) == 2 and page["nextCursor"] == "2"
    t = page["items"][0]
    done = alice.patch(f"/matters/{m['id']}/tasks/{t['id']}", {"version": t["version"], "done": True}).json()
    assert done["done"] is True and done["version"] == 2


def test_intake_conflict_check_needs_a_confirmation(alice, bob):
    i = alice.post("/intake", {"prospectName": "Prospective Client (demo)", "summary": "s"}).json()
    assert i["conflictCheck"] == "not_checked"
    # the check cannot be set by editing
    assert alice.patch(f"/intake/{i['id']}", {"version": 1, "conflictCheck": "clear"}).status_code == 422
    assert alice.post(f"/intake/{i['id']}/convert").status_code == 422  # not cleared yet
    ok = alice.post(f"/intake/{i['id']}/conflict-check/confirm", {"result": "clear", "note": "Checked the register"}).json()
    assert ok["conflictCheck"] == "clear" and ok["confirmedBy"] == alice.person_id and ok["confirmedAt"]
    assert bob.get(f"/intake/{i['id']}").status_code == 404
    edited = alice.patch(f"/intake/{i['id']}", {"version": ok["version"], "summary": "changed"}).json()
    assert edited["conflictCheck"] == "needs_review" and edited["confirmedBy"] is None
    alice.post(f"/intake/{i['id']}/conflict-check/confirm", {"result": "clear"})
    m = alice.post(f"/intake/{i['id']}/convert")
    assert m.status_code == 201 and m.json()["myLevel"] == "owner" if "myLevel" in m.json() else m.status_code == 201
    assert alice.post(f"/intake/{i['id']}/convert").status_code == 409


def test_invoice_totals_are_computed_on_the_server(alice):
    m = alice.matter()
    e1 = alice.post(f"/matters/{m['id']}/time-entries", {"workedOn": "2026-01-02", "minutes": 90, "ratePaise": 200000, "description": "Drafting"}).json()
    e2 = alice.post(f"/matters/{m['id']}/time-entries", {"workedOn": "2026-01-03", "minutes": 30, "ratePaise": 200000}).json()
    inv = alice.post(f"/matters/{m['id']}/invoices", {
        "number": "INV-1", "timeEntryIds": [e1["id"], e2["id"]], "lines": [{"description": "Court fee", "amountPaise": 5000}], "totalPaise": 1,
    })
    assert inv.status_code == 201
    body = inv.json()
    assert body["totalPaise"] == 300000 + 100000 + 5000  # the client-sent total of 1 is ignored
    assert body["status"] == "draft"
    approved = alice.post(f"/matters/{m['id']}/invoices/{body['id']}/approve").json()
    assert approved["status"] == "approved" and approved["totalPaise"] == 405000 and approved["approvedBy"] == alice.person_id
    assert alice.patch(f"/matters/{m['id']}/invoices/{body['id']}", {"version": approved["version"], "number": "X"}).status_code == 422


def test_time_entry_limits_and_foreign_entries_in_invoices(alice):
    a, b = alice.matter("A"), alice.matter("B")
    assert alice.post(f"/matters/{a['id']}/time-entries", {"workedOn": "2026-01-01", "minutes": 0, "ratePaise": 1}).status_code == 422
    assert alice.post(f"/matters/{a['id']}/time-entries", {"workedOn": "2026-01-01", "minutes": 1441, "ratePaise": 1}).status_code == 422
    other = alice.post(f"/matters/{b['id']}/time-entries", {"workedOn": "2026-01-01", "minutes": 10, "ratePaise": 600}).json()
    r = alice.post(f"/matters/{a['id']}/invoices", {"number": "1", "timeEntryIds": [other["id"]]})
    assert r.status_code == 422


def test_dashboard_counts_only_my_matters(alice, bob):
    a, b = alice.matter("A"), bob.matter("B")
    alice.post(f"/matters/{a['id']}/tasks", {"title": "t"})
    alice.post(f"/matters/{a['id']}/drafts", {"kind": "summary", "title": "s", "body": "b"})
    alice.post(f"/matters/{a['id']}/calendar", {"kind": "deadline", "title": "d", "startsAt": "2031-01-01T00:00:00Z"})
    bob.post(f"/matters/{b['id']}/tasks", {"title": "x"})
    d = alice.get("/dashboard").json()
    assert d["matters"] == 1 and d["openTasks"] == 1 and d["draftsAwaitingApproval"] == 1 and d["unapprovedDeadlines"] == 1
    assert [x["title"] for x in d["nextDates"]] == ["d"]
