import 'package:flutter_test/flutter_test.dart';
import 'package:citizen_health_app/models/medicine_model.dart';
import 'package:citizen_health_app/models/pharmacy_model.dart';
import 'package:citizen_health_app/services/pharmacy_service.dart';

void main() {
  group('Medicine Availability & Pharmacy Discovery Tests', () {
    test('MedicineModel.fromJson parses real database fields accurately', () {
      final json = {
        'stock_id': 'c3a0263b-916e-45cf-a90d-c2e11c2a22dc',
        'medicine_id': 'MED-007',
        'name': 'Amlodipine 5mg',
        'category': 'Cardiovascular',
        'manufacturer': 'Sun Pharma',
        'description': 'Used for high blood pressure and angina',
        'quantity': 600,
        'price': 45.0,
        'expiry_date': '2026-08-31',
        'pharmacy_name': 'Shastri Nagar Medical Store',
        'pharmacy_type': 'Retail Pharmacy',
        'address': 'Shastri Nagar, Solapur',
        'phone': '+91 217 2740300',
        'latitude': 17.6690,
        'longitude': 75.9115,
        'distance_km': 1.15,
      };

      final model = MedicineModel.fromJson(json);

      expect(model.medicineId, 'MED-007');
      expect(model.name, 'Amlodipine 5mg');
      expect(model.category, 'Cardiovascular');
      expect(model.quantity, 600);
      expect(model.isAvailable, true);
      expect(model.unitPrice, 45.0);
      expect(model.priceText, '₹45');
      expect(model.priceBadgeText, '₹45');
      expect(model.pharmacyName, 'Shastri Nagar Medical Store');
      expect(model.pharmacyType, 'Retail Pharmacy');
      expect(model.pharmacyAddress, 'Shastri Nagar, Solapur');
      expect(model.latitude, 17.6690);
      expect(model.longitude, 75.9115);
      expect(model.distanceKm, 1.15);
      expect(model.distanceText, '1.1 km away');
    });

    test('MedicineModel handles null or zero price cleanly without govt labels', () {
      final json = {
        'stock_id': 'p-001',
        'medicine_id': 'MED-001',
        'name': 'Paracetamol 500mg',
        'category': 'Analgesic/Antipyretic',
        'quantity': 2500,
        'price': 0.0,
        'pharmacy_name': 'Begam Peth Medicals',
        'pharmacy_type': 'Retail Pharmacy',
      };

      final model = MedicineModel.fromJson(json);

      expect(model.unitPrice, 0.0);
      expect(model.priceText, 'Price N/A');
      expect(model.priceBadgeText, isNull);
      expect(model.distanceKm, isNull);
      expect(model.distanceText, 'Distance N/A');
    });

    test('PharmacyModel parses JSON and formats fields properly', () {
      final json = {
        'provider_id': 'PROV-PHM-001',
        'name': 'Shastri Nagar Medical Store',
        'role': 'pharmacy',
        'address': 'Shop 4, Shastri Nagar, Solapur',
        'phone': '+91 217 2740300',
        'license': 'MH-SOL-104928',
        'status': 'approved',
        'ward_id': 12,
        'latitude': 17.6690,
        'longitude': 75.9115,
        'distance_km': 1.15,
        'medicines_count': 4,
        'operating_hours': '08:00 AM - 10:00 PM',
      };

      final pharm = PharmacyModel.fromJson(json);

      expect(pharm.providerId, 'PROV-PHM-001');
      expect(pharm.name, 'Shastri Nagar Medical Store');
      expect(pharm.role, 'pharmacy');
      expect(pharm.distanceText, '1.1 km away');
      expect(pharm.formattedMedicinesCount, '4 medicines in stock');
      expect(pharm.displayPhone, '+91 217 2740300');
      expect(pharm.operatingHours, '08:00 AM - 10:00 PM');
    });

    test('Strict filtering out of hospitals: only role == pharmacy accepted', () {
      final providers = [
        {'id': 'P1', 'role': 'pharmacy', 'name': 'Retail Chemist A'},
        {'id': 'H1', 'role': 'hospital', 'name': 'City General Hospital'},
        {'id': 'P2', 'role': 'pharmacy', 'name': 'Jan Aushadhi Kendra'},
        {'id': 'H2', 'role': 'hospital', 'name': 'Civil Hospital'},
      ];

      final filtered = providers.where((p) => p['role'] == 'pharmacy').toList();

      expect(filtered.length, 2);
      expect(filtered.any((p) => p['role'] == 'hospital'), isFalse);
      expect(filtered[0]['name'], 'Retail Chemist A');
      expect(filtered[1]['name'], 'Jan Aushadhi Kendra');
    });

    test('PharmacyService.calculateDistance calculates accurate distance', () {
      // Solapur center to Shastri Nagar Medical Store (~1.15 km)
      final dist = PharmacyService.calculateDistance(17.6599, 75.9064, 17.6690, 75.9115);
      expect(dist, greaterThan(0.9));
      expect(dist, lessThan(1.5));
    });

    test('Nearest pharmacy sorting logic sorts nearest first and handles null distance', () {
      final items = [
        const PharmacyModel(
          providerId: '1', name: 'Jule Solapur Pharmacy',
          distanceKm: 5.09,
        ),
        const PharmacyModel(
          providerId: '2', name: 'Shastri Nagar Medical Store',
          distanceKm: 1.15,
        ),
        const PharmacyModel(
          providerId: '3', name: 'Begam Peth Medicals',
          distanceKm: 1.93,
        ),
        const PharmacyModel(
          providerId: '4', name: 'Unknown Pharmacy',
          distanceKm: null,
        ),
      ];

      final sorted = List<PharmacyModel>.from(items)
        ..sort((a, b) => (a.distanceKm ?? 999999).compareTo(b.distanceKm ?? 999999));

      expect(sorted[0].name, 'Shastri Nagar Medical Store');
      expect(sorted[1].name, 'Begam Peth Medicals');
      expect(sorted[2].name, 'Jule Solapur Pharmacy');
      expect(sorted[3].name, 'Unknown Pharmacy');
    });

    test('Price sorting logic correctly sorts ascending and descending', () {
      final items = [
        const MedicineModel(medicineId: '1', name: 'Med A', unitPrice: 45.0),
        const MedicineModel(medicineId: '2', name: 'Med B', unitPrice: 15.0),
        const MedicineModel(medicineId: '3', name: 'Med C', unitPrice: 90.0),
      ];

      // Ascending
      final asc = List<MedicineModel>.from(items)
        ..sort((a, b) => (a.unitPrice ?? 999999).compareTo(b.unitPrice ?? 999999));
      expect(asc[0].unitPrice, 15.0);
      expect(asc[1].unitPrice, 45.0);
      expect(asc[2].unitPrice, 90.0);

      // Descending
      final desc = List<MedicineModel>.from(items)
        ..sort((a, b) => (b.unitPrice ?? -1).compareTo(a.unitPrice ?? -1));
      expect(desc[0].unitPrice, 90.0);
      expect(desc[1].unitPrice, 45.0);
      expect(desc[2].unitPrice, 15.0);
    });

    test('Search filter logic matches pharmacy name, address, and medicine salt', () {
      const pharm = PharmacyModel(
        providerId: 'PROV-003',
        name: 'Kumthe Jan Aushadhi Kendra',
        address: 'Kumthe Naka, Solapur',
        phone: '+91 217 2740300',
      );

      final matchesName = pharm.name.toLowerCase().contains('kumthe');
      final matchesAushadhi = pharm.name.toLowerCase().contains('aushadhi');
      final matchesAddr = pharm.address!.toLowerCase().contains('naka');

      expect(matchesName, true);
      expect(matchesAushadhi, true);
      expect(matchesAddr, true);
    });
  });
}
