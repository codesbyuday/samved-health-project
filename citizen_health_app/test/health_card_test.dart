import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:citizen_health_app/screens/health/health_screen.dart';
import 'package:citizen_health_app/screens/health/health_card_flutter.dart';

void main() {
  group('Health Card & QR UI Tests', () {
    testWidgets('HealthCardPreview displays full real Health ID and triggers QR dialog', (tester) async {
      bool qrTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: HealthCardPreview(
              userName: 'Uday Gupta',
              citizenId: 'SMC-2026-000132',
              onTap: () {},
              onQrTap: () {
                qrTapped = true;
              },
            ),
          ),
        ),
      );

      // Verify name and full unmasked Health ID are rendered
      expect(find.text('Uday Gupta'), findsOneWidget);
      expect(find.textContaining('SMC-2026-000132'), findsOneWidget);
      expect(find.text('XX-XXXX-XXXX-1234'), findsNothing);

      // Tap QR icon
      final qrIcon = find.byIcon(Icons.qr_code_2_rounded);
      expect(qrIcon, findsOneWidget);
      await tester.tap(qrIcon);
      await tester.pump();

      expect(qrTapped, isTrue);
    });

    testWidgets('HealthCard renders ID-1 card, correct QR URL and citizen details', (tester) async {
      final citizen = Citizen(
        citizenId: 'SMC-2026-000132',
        name: 'Uday Gupta',
        gender: 'Male',
        age: 36,
        bloodGroup: 'O+',
        wardNumber: '2',
        createdAt: DateTime(2026, 3, 14),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: HealthCard(
                citizen: citizen,
                wardName: 'Ward 2',
              ),
            ),
          ),
        ),
      );

      // Verify citizen information on card
      expect(find.text('Solapur Municipal Corporation'), findsOneWidget);
      expect(find.text('Citizen Health Card'), findsOneWidget);
      expect(find.text('Uday Gupta'), findsOneWidget);
      expect(find.textContaining('SMC-2026-000132'), findsOneWidget);
      expect(find.text('Scan for Records'), findsOneWidget);
      expect(find.text('Download Health Card (PDF)'), findsOneWidget);

      // Verify QR Code image is rendered with clean zero internal padding and gapless
      final qrWidgetFinder = find.byType(QrImageView);
      expect(qrWidgetFinder, findsOneWidget);
      final qrWidget = tester.widget<QrImageView>(qrWidgetFinder);
      expect(qrWidget.padding, EdgeInsets.zero);
      expect(qrWidget.gapless, isTrue);
    });

    testWidgets('HealthScreen renders and opening QR dialog shows citizen web URL', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: HealthScreen(),
        ),
      );

      // Allow FutureBuilder to complete
      await tester.pumpAndSettle();

      expect(find.text('My Health'), findsOneWidget);
      expect(find.text('XX-XXXX-XXXX-1234'), findsNothing);

      // Tap top-right QR icon on HealthCardPreview
      final qrIconButton = find.byIcon(Icons.qr_code_2_rounded);
      expect(qrIconButton, findsOneWidget);
      await tester.tap(qrIconButton);
      await tester.pumpAndSettle();

      // Verify animated dialog appears with dialog title, target URL, and close button
      expect(find.text('Citizen Digital QR'), findsOneWidget);
      expect(find.textContaining('https://samved-health-project.vercel.app/citizen/'), findsOneWidget);
      expect(find.text('View Full Health Card'), findsOneWidget);

      // Close the dialog
      await tester.tap(find.byIcon(Icons.close_rounded));
      await tester.pumpAndSettle();

      expect(find.text('Citizen Digital QR'), findsNothing);
    });
  });
}
