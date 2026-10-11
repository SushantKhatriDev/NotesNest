from fastapi import APIRouter

from app.api.routes import articles, faculty, health, papers, resources, subjects, terms

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(terms.router)
api_router.include_router(subjects.router)
api_router.include_router(resources.router)
api_router.include_router(papers.router)
api_router.include_router(faculty.router)
api_router.include_router(articles.router)
