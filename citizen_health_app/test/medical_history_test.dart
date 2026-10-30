import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:citizen_health_app/models/medical_record_model.dart';
import 'package:citizen_health_app/screens/health/medical_record_detail_screen.dart';

void main() {
  group('Medical Record & Detail Screen Tests', () {
    test('MedicalRecordModel.fromJson parses flat FastAPI response accurately', () {
      final json = {
        'record_id': '9c982f8d-b13b-41a0-99bc-554e9484a999',
        'citizen_id': 'SMC-2026-000132',
        'hospital_id': 'HOSP004',
        'hospital_name': 'Dhanraj Girji Hospital',
        'hospital_address': 'MIDC Area, Akkalkot Road, Solapur - 413006',
        'staff_id': '46134dd2-ffd5-4a29-b2d7-117319cc2e8b',
        'doctor_name': 'Uday Gupta',
        'department': 'Gynecology',
        'diagnosis': 'found dengue positive',
        'prescription': 'Atovaquone-progunail, Primaquine phosphate',
        'notes': 'take healthy diet time to time',
        'visit_date': '2026-07-08',
      };

      final model = MedicalRecordModel.fromJson(json);

      expect(model.recordId, '9c982f8d-b13b-41a0-99bc-554e9484a999');
      expect(model.hospitalName, 'Dhanraj Girji Hospital');
      expect(model.hospitalAddress, 'MIDC Area, Akkalkot Road, Solapur - 413006');
      expect(model.doctorName, 'Uday Gupta');
      expect(model.department, 'Gynecology');
      expect(model.diagnosis, 'found dengue positive');
      expect(model.prescription, 'Atovaquone-progunail, Primaquine phosphate');
      expect(model.notes, 'take healthy diet time to time');
      expect(model.visitDate, '2026-07-08');
    });

    test('MedicalRecordModel.toJson outputs nested compatibility maps', () {
      final model = MedicalRecordModel(
        recordId: 'rec-001',
        citizenId: 'cz-001',
        hospitalId: 'HOSP004',
        hospitalName: 'Dhanraj Girji Hospital',
        hospitalAddress: 'MIDC Area, Solapur',
        staffId: 'stf-001',
        doctorName: 'Dr. Rohan Chavan',
        department: 'Neurology',
        diagnosis: 'Found Dengue',
        prescription: 'Paracetamol 500mg',
        notes: 'Rest for 3 days',
        visitDate: '2026-03-23',
      );

      final json = model.toJson();

      expect(json['hospital_name'], 'Dhanraj Girji Hospital');
      expect(json['hospitals']['name'], 'Dhanraj Girji Hospital');
      expect(json['hospitals']['address'], 'MIDC Area, Solapur');
      expect(json['doctor_name'], 'Dr. Rohan Chavan');
      expect(json['hospital_staff']['name'], 'Dr. Rohan Chavan');
      expect(json['hospital_staff']['department'], 'Neurology');
    });

    testWidgets('MedicalRecordDetailScreen renders all sections with full details', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final record = MedicalRecordModel(
        recordId: 'rec-12345',
        citizenId: 'SMC-2026-000132',
        hospitalId: 'HOSP004',
        hospitalName: 'Dhanraj Girji Hospital',
        hospitalAddress: 'MIDC Area, Akkalkot Road, Solapur - 413006',
        staffId: 'STF-H4-001',
        doctorName: 'Rohan Chavan',
        department: 'Neurology',
        diagnosis: 'Dengue Fever with mild thrombocytopenia',
        prescription: 'Paracetamol 650mg, ORS Electrolytes',
        notes: 'Adequate hydration and monitor platelets daily',
        visitDate: '2026-03-22',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: MedicalRecordDetailScreen(record: record),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Verify Hospital Information is rendered
      expect(find.text('Hospital Information'), findsOneWidget);
      expect(find.text('Dhanraj Girji Hospital'), findsOneWidget);
      expect(find.text('MIDC Area, Akkalkot Road, Solapur - 413006'), findsOneWidget);

      // 2. Verify Doctor Information is rendered
      expect(find.text('Doctor Information'), findsOneWidget);
      expect(find.text('Dr. Rohan Chavan'), findsOneWidget);
      expect(find.text('Neurology'), findsOneWidget);

      // 3. Verify Visit Information is rendered
      expect(find.text('Visit Information'), findsOneWidget);
      expect(find.text('Dengue Fever with mild thrombocytopenia'), findsOneWidget);
      expect(find.textContaining('March 22, 2026'), findsOneWidget);

      // 4. Verify Prescription items are rendered
      expect(find.text('Prescription'), findsOneWidget);
      expect(find.text('Paracetamol 650mg'), findsOneWidget);
      expect(find.text('ORS Electrolytes'), findsOneWidget);

      // 5. Verify Doctor's Notes are rendered
      expect(find.text("Doctor's Notes & Advice"), findsOneWidget);
      expect(find.text('Adequate hydration and monitor platelets daily'), findsOneWidget);

      // 6. Verify SMC Verified banner
      expect(find.text('SMC Verified Electronic Health Record'), findsOneWidget);
    });

    testWidgets('MedicalRecordDetailScreen handles null or empty fields gracefully', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final record = MedicalRecordModel(
        recordId: 'rec-empty',
        citizenId: 'SMC-2026-000132',
        hospitalId: null,
        hospitalName: 'Solapur Municipal Health Center',
        hospitalAddress: 'Solapur, Maharashtra',
        staffId: null,
        doctorName: 'Medical Officer',
        department: 'General Medicine',
        diagnosis: null,
        prescription: null,
        notes: null,
        visitDate: null,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: MedicalRecordDetailScreen(record: record),
        ),
      );
      await tester.pumpAndSettle();

      // Ensure fallback text displays without crashing
      expect(find.text('Solapur Municipal Health Center'), findsOneWidget);
      expect(find.text('Dr. Medical Officer'), findsOneWidget);
      expect(find.text('General Consultation & Health Evaluation'), findsOneWidget);
      expect(find.text('No specific medicines prescribed for this consultation.'), findsOneWidget);
      expect(find.text('No additional clinical notes or lifestyle advice recorded for this visit.'), findsOneWidget);
    });
  });
}
