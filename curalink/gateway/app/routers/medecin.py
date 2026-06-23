from fastapi import APIRouter, Request

from app.spring_client import forward

disponibilites_router = APIRouter(
    prefix="/api/medecins/me/disponibilites",
    tags=["medecin-disponibilites"],
)

patients_router = APIRouter(prefix="/api/medecins/me", tags=["medecin-patients"])

consultations_router = APIRouter(prefix="/api", tags=["medecin-consultations"])


@disponibilites_router.get("")
async def list_disponibilites(request: Request):
    return await forward(request, "/api/medecins/me/disponibilites")


@disponibilites_router.post("")
async def create_disponibilite(request: Request):
    return await forward(request, "/api/medecins/me/disponibilites")


@disponibilites_router.put("/{disponibilite_id}")
async def update_disponibilite(request: Request, disponibilite_id: int):
    return await forward(request, f"/api/medecins/me/disponibilites/{disponibilite_id}")


@disponibilites_router.delete("/{disponibilite_id}")
async def delete_disponibilite(request: Request, disponibilite_id: int):
    return await forward(request, f"/api/medecins/me/disponibilites/{disponibilite_id}")


@patients_router.get("/patients")
async def list_patients(request: Request):
    return await forward(request, "/api/medecins/me/patients")


@patients_router.get("/patients/{patient_id}")
async def patient_detail(request: Request, patient_id: int):
    return await forward(request, f"/api/medecins/me/patients/{patient_id}")


@consultations_router.post("/consultations")
async def create_consultation(request: Request):
    return await forward(request, "/api/consultations")


@consultations_router.post("/{patient_id}/constantes")
async def add_constantes(request: Request, patient_id: int):
    return await forward(request, f"/api/{patient_id}/constantes")


@consultations_router.get("/patients/{patient_id}/antecedents")
async def list_antecedents(request: Request, patient_id: int):
    return await forward(request, f"/api/patients/{patient_id}/antecedents")


@consultations_router.get("/medecins/me/patients/{patient_id}/antecedents")
async def list_antecedents_scoped(request: Request, patient_id: int):
    return await forward(request, f"/api/medecins/me/patients/{patient_id}/antecedents")


@consultations_router.get("/medecins/me/patients/{patient_id}/constantes")
async def list_constantes(request: Request, patient_id: int):
    return await forward(request, f"/api/medecins/me/patients/{patient_id}/constantes")


@consultations_router.get("/medecins/me/patients/{patient_id}/consultations")
async def list_consultations(request: Request, patient_id: int):
    return await forward(request, f"/api/medecins/me/patients/{patient_id}/consultations")


@consultations_router.post("/patients/{patient_id}/antecedents")
async def add_antecedent(request: Request, patient_id: int):
    return await forward(request, f"/api/patients/{patient_id}/antecedents")


@consultations_router.post("/consultations/{consultation_id}/ordonnance")
async def create_ordonnance(request: Request, consultation_id: int):
    return await forward(request, f"/api/consultations/{consultation_id}/ordonnance")
