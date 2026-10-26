from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.citizens.router import router as citizens_router
from app.modules.hospitals.router import router as hospitals_router
from app.modules.appointments.router import router as appointments_router
from app.modules.disease_surveillance.router import router as disease_surveillance_router
from app.modules.smc.router import router as smc_router
from app.modules.laboratories.router import router as laboratories_router
from app.modules.pharmacies.router import router as pharmacies_router
from app.modules.health_cards.router import router as health_cards_router
from app.modules.notifications.router import router as notifications_router
from app.modules.ai.router import router as ai_router
from app.modules.payments.router import router as payments_router
from app.modules.referrals.router import router as referrals_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(citizens_router)
api_v1_router.include_router(hospitals_router)
api_v1_router.include_router(appointments_router)
api_v1_router.include_router(disease_surveillance_router)
api_v1_router.include_router(smc_router)
api_v1_router.include_router(laboratories_router)
api_v1_router.include_router(pharmacies_router)
api_v1_router.include_router(health_cards_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(ai_router)
api_v1_router.include_router(payments_router)
api_v1_router.include_router(referrals_router)
