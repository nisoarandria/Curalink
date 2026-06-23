from fastapi import APIRouter, Request

from app.spring_client import forward

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])

services_router = APIRouter(prefix="/api/admin/services", tags=["admin-services"])

disponibilites_router = APIRouter(prefix="/api/admin/disponibilites", tags=["admin-disponibilites"])

planning_router = APIRouter(prefix="/api/admin/rendezvous", tags=["admin-planning"])


@admin_router.get("/staff")
async def list_staff(request: Request):
    return await forward(request, "/api/admin/staff")


@admin_router.post("/staff")
async def create_staff(request: Request):
    return await forward(request, "/api/admin/staff")


@admin_router.get("/patients")
async def list_patients(request: Request):
    return await forward(request, "/api/admin/patients")


@admin_router.delete("/users/{user_id}")
async def delete_user(request: Request, user_id: int):
    return await forward(request, f"/api/admin/users/{user_id}")


@services_router.get("")
async def list_services(request: Request):
    return await forward(request, "/api/admin/services")


@services_router.get("/{service_id}")
async def get_service(request: Request, service_id: int):
    return await forward(request, f"/api/admin/services/{service_id}")


@services_router.post("")
async def create_service(request: Request):
    return await forward(request, "/api/admin/services")


@services_router.put("/{service_id}")
async def update_service(request: Request, service_id: int):
    return await forward(request, f"/api/admin/services/{service_id}")


@services_router.delete("/{service_id}")
async def delete_service(request: Request, service_id: int):
    return await forward(request, f"/api/admin/services/{service_id}")


@disponibilites_router.get("")
async def list_disponibilites(request: Request):
    return await forward(request, "/api/admin/disponibilites")


@disponibilites_router.post("/medecins/{medecin_id}")
async def create_disponibilite(request: Request, medecin_id: int):
    return await forward(request, f"/api/admin/disponibilites/medecins/{medecin_id}")


@disponibilites_router.put("/{disponibilite_id}")
async def update_disponibilite(request: Request, disponibilite_id: int):
    return await forward(request, f"/api/admin/disponibilites/{disponibilite_id}")


@disponibilites_router.delete("/{disponibilite_id}")
async def delete_disponibilite(request: Request, disponibilite_id: int):
    return await forward(request, f"/api/admin/disponibilites/{disponibilite_id}")


@disponibilites_router.patch("/{disponibilite_id}/valider")
async def validate_disponibilite(request: Request, disponibilite_id: int):
    return await forward(request, f"/api/admin/disponibilites/{disponibilite_id}/valider")


@disponibilites_router.patch("/medecins/{medecin_id}/valider")
async def validate_medecin_planning(request: Request, medecin_id: int):
    return await forward(request, f"/api/admin/disponibilites/medecins/{medecin_id}/valider")


@planning_router.get("/planning")
async def planning(request: Request):
    return await forward(request, "/api/admin/rendezvous/planning")
