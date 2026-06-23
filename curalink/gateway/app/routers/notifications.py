from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/me/stream")
async def stream(request: Request):
    return await forward(request, "/api/notifications/me/stream")


@router.get("/me")
async def list_notifications(request: Request):
    return await forward(request, "/api/notifications/me")


@router.get("/me/non-lues")
async def unread_count(request: Request):
    return await forward(request, "/api/notifications/me/non-lues")


@router.patch("/{notification_id}/lu")
async def mark_read(request: Request, notification_id: int):
    return await forward(request, f"/api/notifications/{notification_id}/lu")


@router.patch("/me/lire-tout")
async def mark_all_read(request: Request):
    return await forward(request, "/api/notifications/me/lire-tout")
