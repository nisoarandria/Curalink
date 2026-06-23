from fastapi import APIRouter, Request

from app.spring_client import forward

router = APIRouter(prefix="/api/rendezvous", tags=["rendezvous"])


@router.get("/medecin/me")
async def medecin_me(request: Request):
    return await forward(request, "/api/rendezvous/medecin/me")


@router.get("/medecins/{medecin_id}/rendezvous")
async def medecin_rendezvous(request: Request, medecin_id: int):
    return await forward(request, f"/api/rendezvous/medecins/{medecin_id}/rendezvous")


@router.get("/medecins/{medecin_id}/rendezvous/resume")
async def medecin_rendezvous_resume(request: Request, medecin_id: int):
    return await forward(request, f"/api/rendezvous/medecins/{medecin_id}/rendezvous/resume")


@router.post("")
async def create_rendezvous(request: Request):
    return await forward(request, "/api/rendezvous")


@router.patch("/{rendez_vous_id}/proposer")
async def proposer(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/proposer")


@router.patch("/{rendez_vous_id}/proposer-creneau")
async def proposer_creneau(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/proposer-creneau")


@router.patch("/{rendez_vous_id}/confirmer")
async def confirmer(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/confirmer")


@router.patch("/{rendez_vous_id}/refuser")
async def refuser(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/refuser")


@router.patch("/{rendez_vous_id}/annuler")
async def annuler(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/annuler")


@router.patch("/{rendez_vous_id}/terminer")
async def terminer(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/terminer")


@router.patch("/{rendez_vous_id}/absent")
async def absent(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/absent")


@router.patch("/{rendez_vous_id}/status")
async def status(request: Request, rendez_vous_id: int):
    return await forward(request, f"/api/rendezvous/{rendez_vous_id}/status")
