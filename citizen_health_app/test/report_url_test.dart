import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:citizen_health_app/services/lab_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class _AllowHttpOverrides extends HttpOverrides {}

void main() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    HttpOverrides.global = _AllowHttpOverrides();
    SharedPreferences.setMockInitialValues({});
    await Supabase.initialize(
      url: 'https://yxknckhlzcjybjbdqnbg.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a25ja2hsemNqeWJqYmRxbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY4MTYsImV4cCI6MjA4ODg5MjgxNn0.MA64InqN_hkdrLHPDP3WCigPkTJFlk-mhKEdNa5MPSk',
    );
  });

  test('resolveReportFileUrl resolves valid signed URL for SMC-2026-000132 report', () async {
    const reportId = '44ac3c99-2276-416f-8f5e-9d483c12d57f';
    const filePath = 'reports/SMC-2026-000132_1792006669443_C858E6.pdf';

    final resolved = await LabService.resolveReportFileUrl(reportId, rawFilePath: filePath);

    expect(resolved, isNotNull);
    expect(resolved!.startsWith('http'), isTrue);
    expect(resolved.contains('token='), isTrue);
  });

  test('resolveReportFileUrl resolves when rawFilePath is omitted', () async {
    const reportId = '44ac3c99-2276-416f-8f5e-9d483c12d57f';

    final resolved = await LabService.resolveReportFileUrl(reportId);

    expect(resolved, isNotNull);
    expect(resolved!.startsWith('http'), isTrue);
    expect(resolved.contains('token='), isTrue);
  });
}
