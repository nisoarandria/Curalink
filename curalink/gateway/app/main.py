from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import GATEWAY_HOST, GATEWAY_PORT
from app.routers import admin, auth, catalog, medecin, notifications, nutrition, orientation, patient_portal, patients, rendezvous

app = FastAPI(title="Curalink API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(patient_portal.router)
app.include_router(orientation.router)
app.include_router(catalog.router)
app.include_router(rendezvous.router)
app.include_router(medecin.disponibilites_router)
app.include_router(medecin.patients_router)
app.include_router(medecin.consultations_router)
app.include_router(nutrition.router)
app.include_router(notifications.router)
app.include_router(admin.admin_router)
app.include_router(admin.services_router)
app.include_router(admin.disponibilites_router)
app.include_router(admin.planning_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=GATEWAY_HOST, port=GATEWAY_PORT, reload=True)
