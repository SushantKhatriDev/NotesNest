def test_terms_exclude_summer_and_newest_first(client):
    terms = client.get("/api/v1/terms").json()
    assert terms
    assert all("Summer" not in t["name"] for t in terms)
    assert terms[0]["academic_year"] == "2025-26"


def test_subjects_filtered_by_term(client):
    terms = client.get("/api/v1/terms").json()
    current = next(t for t in terms if t["is_freshers"])
    assert len(client.get(f"/api/v1/subjects?term_id={current['id']}").json()) == 2
    assert client.get("/api/v1/subjects?term_id=9999").json() == []


def test_subject_by_id_and_missing_subject(client):
    subject = client.get("/api/v1/subjects").json()[0]
    assert client.get(f"/api/v1/subjects/{subject['id']}").json() == subject
    assert client.get("/api/v1/subjects/9999").status_code == 404


def test_papers_search_and_years(client, session_factory):
    from app.models import Resource, Subject
    from app.models.enums import ResourceType

    with session_factory() as db:
        subject = db.query(Subject).filter_by(code="TEST101").one()
        db.add_all(
            [
                Resource(subject_id=subject.id, type=ResourceType.pyq, title="CAT 2025",
                         file_path="TEST101/pyq/CAT-2025.pdf", exam="CAT", year=2025),
                Resource(subject_id=subject.id, type=ResourceType.pyq, title="CAT-2 2025",
                         file_path="TEST101/pyq/CAT2-2025.pdf", exam="CAT-2", year=2025),
                Resource(subject_id=subject.id, type=ResourceType.note, title="Note",
                         file_path="TEST101/notes/note.pdf", year=2025),
            ]
        )
        db.commit()
    response = client.get("/api/v1/papers?q=mat&year=2025&limit=100")
    assert response.status_code == 200
    assert [item["exam"] for item in response.json()] == ["CAT-2", "CAT"]
    assert client.get("/api/v1/papers/years").json() == [2025]
    assert client.get("/api/v1/papers?q=%25").json() == []
