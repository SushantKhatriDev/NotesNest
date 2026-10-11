from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, distinct, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Resource, Subject
from app.models.enums import ResourceType
from app.schemas.paper import PaperOut

router = APIRouter(prefix="/papers", tags=["papers"])

_EXAM_ORDER = case(
    (Resource.exam == "CAT-2", 0),
    (Resource.exam == "CAT-1", 1),
    (Resource.exam == "CAT", 2),
    (Resource.exam == "FAT-Theory", 3),
    (Resource.exam == "FAT-Lab", 4),
    else_=5,
)


@router.get("", response_model=list[PaperOut])
def list_papers(
    q: str = "",
    year: int | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[PaperOut]:
    search = q.strip()
    if len(search) < 2:
        return []
    escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    pattern = f"%{escaped}%"
    stmt = (
        select(
            Resource.id,
            Resource.subject_id,
            Subject.code.label("subject_code"),
            Subject.name.label("subject_name"),
            Resource.title,
            Resource.exam,
            Resource.year,
        )
        .join(Subject, Subject.id == Resource.subject_id)
        .where(Resource.type == ResourceType.pyq)
        .where(
            Subject.code.ilike(pattern, escape="\\")
            | Subject.name.ilike(pattern, escape="\\")
        )
        .order_by(
            Subject.code,
            Resource.year.desc().nulls_last(),
            _EXAM_ORDER,
            Resource.title,
        )
        .limit(limit)
    )
    if year is not None:
        stmt = stmt.where(Resource.year == year)
    return [PaperOut.model_validate(row._mapping) for row in db.execute(stmt)]


@router.get("/years", response_model=list[int])
def list_paper_years(db: Session = Depends(get_db)) -> list[int]:
    stmt = (
        select(distinct(Resource.year))
        .where(Resource.type == ResourceType.pyq, Resource.year.is_not(None))
        .order_by(Resource.year.desc())
    )
    return list(db.scalars(stmt))
