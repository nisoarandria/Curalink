from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(request: Request):
    return await forward(request, "/api/auth/login")


@router.post("/logout")
async def logout(request: Request):
    return await forward(request, "/api/auth/logout")


@router.post("/password-reset/request")
async def password_reset_request(request: Request):
    return await forward(request, "/api/auth/password-reset/request")


@router.post("/password-reset/confirm")
async def password_reset_confirm(request: Request):
    return await forward(request, "/api/auth/password-reset/confirm")


@router.put("/password")
async def change_password(request: Request):
    return await forward(request, "/api/auth/password")
