from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(prefix="/api/patients/me", tags=["patient-portal"])


@router.get("")
async def profile(request: Request):
    return await forward(request, "/api/patients/me")


@router.get("/antecedents")
async def antecedents(request: Request):
    return await forward(request, "/api/patients/me/antecedents")


@router.get("/constantes")
async def constantes(request: Request):
    return await forward(request, "/api/patients/me/constantes")


@router.get("/consultations")
async def consultations(request: Request):
    return await forward(request, "/api/patients/me/consultations")


@router.get("/ordonnances")
async def ordonnances(request: Request):
    return await forward(request, "/api/patients/me/ordonnances")


@router.get("/ordonnances/{ordonnance_id}/pdf")
async def ordonnance_pdf(request: Request, ordonnance_id: int):
    return await forward(request, f"/api/patients/me/ordonnances/{ordonnance_id}/pdf")


@router.get("/rendezvous")
async def rendezvous(request: Request):
    return await forward(request, "/api/patients/me/rendezvous")
