from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(tags=["catalog"])


@router.get("/services")
async def list_services(request: Request):
    return await forward(request, "/services")


@router.get("/services/{service_id}/medecins")
async def list_medecins(request: Request, service_id: int):
    return await forward(request, f"/services/{service_id}/medecins")


@router.get("/medecins/{medecin_id}/disponibilites")
async def list_medecin_disponibilites(request: Request, medecin_id: int):
    return await forward(request, f"/medecins/{medecin_id}/disponibilites")


@router.get("/services/{service_id}/disponibilites")
async def list_service_disponibilites(request: Request, service_id: int):
    return await forward(request, f"/services/{service_id}/disponibilites")
