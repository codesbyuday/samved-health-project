import 'package:flutter_test/flutter_test.dart';
import 'package:citizen_health_app/main.dart';

void main() {
  testWidgets('CitizenApp smoke test', (WidgetTester tester) async {
    // Build CitizenApp
    await tester.pumpWidget(const CitizenApp());
    expect(find.byType(CitizenApp), findsOneWidget);
  });
}
