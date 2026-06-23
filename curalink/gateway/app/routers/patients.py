from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(prefix="/api/patients", tags=["patients"])


@router.post("/register")
async def register(request: Request):
    return await forward(request, "/api/patients/register")


@router.post("/set-password")
async def set_password(request: Request):
    return await forward(request, "/api/patients/set-password")
