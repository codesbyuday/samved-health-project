import 'package:flutter_test/flutter_test.dart';
import 'package:citizen_health_app/models/laboratory_model.dart';
import 'package:citizen_health_app/services/lab_service.dart';

void main() {
  group('Laboratory Discovery & Catalogue Tests', () {
    test('LaboratoryModel.fromJson parses fields accurately', () {
      final json = {
        'provider_id': 'PROV-LAB-001',
        'name': 'Solapur Pathology Lab',
        'address': 'Kasbe Peth, Solapur',
        'phone': '9890001001',
        'email': 'solapur.lab1@gmail.com',
        'license': 'MH-LAB-2020-0012',
        'status': 'approved',
        'ward_id': 1,
        'latitude': 17.681,
        'longitude': 75.908,
        'operating_hours': '08:00 AM - 08:00 PM',
        'tests_count': 10,
        'distance_km': 2.35,
      };

      final lab = LaboratoryModel.fromJson(json);

      expect(lab.providerId, 'PROV-LAB-001');
      expect(lab.name, 'Solapur Pathology Lab');
      expect(lab.address, 'Kasbe Peth, Solapur');
      expect(lab.phone, '9890001001');
      expect(lab.license, 'MH-LAB-2020-0012');
      expect(lab.status, 'approved');
      expect(lab.wardId, 1);
      expect(lab.latitude, 17.681);
      expect(lab.longitude, 75.908);
      expect(lab.testsCount, 10);
      expect(lab.distanceKm, 2.35);
    });

    test('LabTestDetailModel.fromJson parses fields accurately', () {
      final json = {
        'lab_test_id': 'test-uuid-1234',
        'provider_id': 'PROV-LAB-004',
        'test_type_id': 2,
        'price': 240,
        'test_name': 'Complete Blood Count (CBC)',
        'test_category': 'Hematology',
        'description': 'Measures blood cells and hemoglobin',
        'sample_type': 'EDTA Whole Blood',
        'preparation': 'No fasting required. Stay hydrated.',
        'turnaround_time': 'Within 4-6 hours',
        'laboratory_name': 'Begam Peth Clinical Lab',
        'laboratory_address': 'Begam Peth, Solapur',
        'laboratory_phone': '9890001006',
        'latitude': 17.6745,
        'longitude': 75.9,
        'distance_km': 1.76,
      };

      final testDetail = LabTestDetailModel.fromJson(json);

      expect(testDetail.labTestId, 'test-uuid-1234');
      expect(testDetail.providerId, 'PROV-LAB-004');
      expect(testDetail.testTypeId, 2);
      expect(testDetail.price, 240);
      expect(testDetail.testName, 'Complete Blood Count (CBC)');
      expect(testDetail.testCategory, 'Hematology');
      expect(testDetail.sampleType, 'EDTA Whole Blood');
      expect(testDetail.laboratoryName, 'Begam Peth Clinical Lab');
      expect(testDetail.distanceKm, 1.76);
    });

    test('LabService.calculateDistance calculates accurate distance', () {
      // Solapur City Center (17.6599, 75.9064) to Begam Peth Clinical Lab (17.6745, 75.9)
      final dist = LabService.calculateDistance(17.6599, 75.9064, 17.6745, 75.9);
      expect(dist, greaterThan(1.0));
      expect(dist, lessThan(3.0));
    });

    test('LabService.getClinicalMetadata provides standard guidance', () {
      final cbcMeta = LabService.getClinicalMetadata('Complete Blood Count (CBC)', 'Hematology');
      expect(cbcMeta['sample_type'], contains('Blood'));
      expect(cbcMeta['turnaround_time'], isNotEmpty);

      final fastingMeta = LabService.getClinicalMetadata('Blood Sugar Fasting', 'Biochemistry');
      expect(fastingMeta['preparation'], contains('fasting'));

      final urineMeta = LabService.getClinicalMetadata('Urine Routine Examination', 'Pathology');
      expect(urineMeta['sample_type'], contains('Urine'));
    });

    test('Price sorting logic correctly sorts ascending', () {
      final tests = [
        const LabTestDetailModel(
          labTestId: '1', providerId: 'p1', testTypeId: 2, price: 300,
          testName: 'CBC', testCategory: 'Hematology',
        ),
        const LabTestDetailModel(
          labTestId: '2', providerId: 'p2', testTypeId: 2, price: 240,
          testName: 'CBC', testCategory: 'Hematology',
        ),
        const LabTestDetailModel(
          labTestId: '3', providerId: 'p3', testTypeId: 2, price: 260,
          testName: 'CBC', testCategory: 'Hematology',
        ),
      ];

      final sorted = List<LabTestDetailModel>.from(tests)
        ..sort((a, b) => a.price.compareTo(b.price));

      expect(sorted[0].price, 240);
      expect(sorted[1].price, 260);
      expect(sorted[2].price, 300);
    });

    test('Price descending sorting logic correctly sorts high to low', () {
      final tests = [
        const LabTestDetailModel(
          labTestId: '1', providerId: 'p1', testTypeId: 2, price: 240,
          testName: 'CBC', testCategory: 'Hematology',
        ),
        const LabTestDetailModel(
          labTestId: '2', providerId: 'p2', testTypeId: 2, price: 300,
          testName: 'CBC', testCategory: 'Hematology',
        ),
        const LabTestDetailModel(
          labTestId: '3', providerId: 'p3', testTypeId: 2, price: 260,
          testName: 'CBC', testCategory: 'Hematology',
        ),
      ];

      final sorted = List<LabTestDetailModel>.from(tests)
        ..sort((a, b) => (b.price > 0 ? b.price : -1).compareTo(a.price > 0 ? a.price : -1));

      expect(sorted[0].price, 300);
      expect(sorted[1].price, 260);
      expect(sorted[2].price, 240);
    });

    test('Distance sorting logic correctly sorts nearest first and handles null distance', () {
      final tests = [
        const LabTestDetailModel(
          labTestId: '1', providerId: 'p1', testTypeId: 2, price: 250,
          testName: 'CBC', testCategory: 'Hematology', distanceKm: 4.5,
        ),
        const LabTestDetailModel(
          labTestId: '2', providerId: 'p2', testTypeId: 2, price: 250,
          testName: 'CBC', testCategory: 'Hematology', distanceKm: 1.2,
        ),
        const LabTestDetailModel(
          labTestId: '3', providerId: 'p3', testTypeId: 2, price: 250,
          testName: 'CBC', testCategory: 'Hematology', distanceKm: null,
        ),
      ];

      final sorted = List<LabTestDetailModel>.from(tests)
        ..sort((a, b) => (a.distanceKm ?? 999999).compareTo(b.distanceKm ?? 999999));

      expect(sorted[0].distanceKm, 1.2);
      expect(sorted[1].distanceKm, 4.5);
      expect(sorted[2].distanceKm, isNull);
    });
  });
}
