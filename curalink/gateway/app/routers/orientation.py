from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(prefix="/api/orientation", tags=["orientation"])


@router.post("/symptomes")
async def symptomes(request: Request):
    return await forward(request, "/api/orientation/symptomes")


@router.post("/chat")
async def chat(request: Request):
    return await forward(request, "/api/orientation/chat")
