import asyncio
import time
from app.modules.disease_surveillance.service import disease_surveillance_service
from app.modules.hospitals.service import hospital_service
from app.modules.appointments.service import appointment_service
from app.modules.pharmacies.service import pharmacy_service
from app.modules.citizens.service import citizen_service
from app.modules.smc.service import smc_service

async def run_benchmarks():
    print('=================================================================')
    print('      SAMVED FASTAPI BACKEND PERFORMANCE BENCHMARK REPORT        ')
    print('=================================================================')

    # 1. Public Analytics
    t0 = time.perf_counter()
    res1 = await disease_surveillance_service.get_public_analytics()
    t1 = time.perf_counter()
    latency_pub = (t1 - t0) * 1000
    print(f'1. GET /disease-surveillance/public-analytics : {latency_pub:.2f} ms')

    # 2. Hospital Dashboard Overview
    t0 = time.perf_counter()
    res2 = await hospital_service.get_dashboard_overview('HOSP001')
    t1 = time.perf_counter()
    latency_dash = (t1 - t0) * 1000
    print(f'2. GET /hospitals/HOSP001/dashboard-overview   : {latency_dash:.2f} ms')

    # 3. Appointments List
    t0 = time.perf_counter()
    res3 = await appointment_service.get_all()
    t1 = time.perf_counter()
    latency_apt = (t1 - t0) * 1000
    print(f'3. GET /appointments                          : {latency_apt:.2f} ms ({len(res3)} items)')

    # 4. Medicine Stock
    t0 = time.perf_counter()
    res4 = await pharmacy_service.get_stock('HOSP001')
    t1 = time.perf_counter()
    latency_stock = (t1 - t0) * 1000
    print(f'4. GET /pharmacies/stock                      : {latency_stock:.2f} ms ({len(res4)} items)')

    # 5. Citizen Count (Cached)
    t0 = time.perf_counter()
    cnt = await citizen_service.count()
    t1 = time.perf_counter()
    latency_cnt = (t1 - t0) * 1000
    print(f'5. GET /citizens/count                        : {latency_cnt:.2f} ms (Count: {cnt})')

    # 6. SMC Analytics
    t0 = time.perf_counter()
    smc_res = await smc_service.get_analytics_summary()
    t1 = time.perf_counter()
    latency_smc = (t1 - t0) * 1000
    print(f'6. GET /smc/analytics                        : {latency_smc:.2f} ms')

    # 7. Hospitals List
    t0 = time.perf_counter()
    hosps = await hospital_service.get_all_hospitals()
    t1 = time.perf_counter()
    latency_hosps = (t1 - t0) * 1000
    print(f'7. GET /hospitals                             : {latency_hosps:.2f} ms ({len(hosps)} items)')
    print('=================================================================')

if __name__ == '__main__':
    asyncio.run(run_benchmarks())
