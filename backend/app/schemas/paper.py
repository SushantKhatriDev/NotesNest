from pydantic import BaseModel


class PaperOut(BaseModel):
    id: int
    subject_id: int
    subject_code: str
    subject_name: str
    title: str
    exam: str | None
    year: int | None
