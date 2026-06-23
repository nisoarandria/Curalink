from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])


@router.get("/rubriques")
async def rubriques(request: Request):
    return await forward(request, "/api/nutrition/rubriques")


@router.get("/rubriques/article-count")
async def rubriques_article_count(request: Request):
    return await forward(request, "/api/nutrition/rubriques/article-count")


@router.get("/articles")
async def articles(request: Request):
    return await forward(request, "/api/nutrition/articles")


@router.get("/nutritionnistes/{nutritionniste_id}/articles")
async def articles_by_nutritionniste(request: Request, nutritionniste_id: int):
    return await forward(request, f"/api/nutrition/nutritionnistes/{nutritionniste_id}/articles")


@router.get("/articles/{article_id}")
async def article_detail(request: Request, article_id: int):
    return await forward(request, f"/api/nutrition/articles/{article_id}")


@router.post("/articles")
async def create_article(request: Request):
    return await forward(request, "/api/nutrition/articles")


@router.put("/articles/{article_id}")
async def update_article(request: Request, article_id: int):
    return await forward(request, f"/api/nutrition/articles/{article_id}")


@router.delete("/articles/{article_id}")
async def delete_article(request: Request, article_id: int):
    return await forward(request, f"/api/nutrition/articles/{article_id}")
