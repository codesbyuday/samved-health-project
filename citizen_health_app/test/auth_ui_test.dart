import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:citizen_health_app/screens/auth/login_screen.dart';
import 'package:citizen_health_app/screens/auth/register_screen.dart';
import 'package:citizen_health_app/services/auth_service.dart';

void main() {
  group('Login & Registration Interactive UI/UX Tests', () {
    testWidgets('LoginScreen renders inputs and Sign In button properly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Verify header and fields exist
      expect(find.text('Welcome Back!'), findsOneWidget);
      expect(find.text('Phone Number'), findsOneWidget);
      expect(find.text('Password'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);

      // Tap Sign In with empty fields -> should display warning snackbar
      await tester.tap(find.text('Sign In'));
      await tester.pump();

      expect(
        find.byWidgetPredicate(
          (widget) =>
              widget is Text &&
              (widget.data?.contains('phone') == true &&
                  widget.data?.contains('password') == true),
        ),
        findsOneWidget,
      );
    });

    testWidgets('LoginScreen password visibility toggle works interactively', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      final toggleFinder = find.text('👁️');
      expect(toggleFinder, findsOneWidget);

      // Tap toggle to show password
      await tester.tap(toggleFinder);
      await tester.pump();

      expect(find.text('🙈'), findsOneWidget);
    });

    testWidgets('LoginScreen switches between Phone and Email login modes seamlessly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Initially in Phone mode
      expect(find.text('Phone Number'), findsOneWidget);
      expect(find.text('Use Email'), findsOneWidget);

      // Scroll to Email social button and tap it
      final emailSocialFinder = find.text('Email');
      await tester.ensureVisible(emailSocialFinder);
      await tester.tap(emailSocialFinder);
      await tester.pumpAndSettle();

      // Now in Email mode
      expect(find.text('Email Address'), findsOneWidget);
      expect(find.text('Enter your email address'), findsOneWidget);
      expect(find.text('Use Phone'), findsOneWidget);
      expect(find.text('Phone'), findsOneWidget);

      // Scroll to Sign In and tap with empty fields -> should display email warning snackbar
      final signInFinder = find.text('Sign In');
      await tester.ensureVisible(signInFinder);
      await tester.tap(signInFinder);
      await tester.pump();

      expect(find.text('Please enter your email and password'), findsOneWidget);

      // Enter invalid email format and tap Sign In
      await tester.enterText(find.byType(TextField).first, 'citizenwithoutat');
      await tester.enterText(find.byType(TextField).last, 'secret123');
      await tester.tap(signInFinder);
      await tester.pump();

      expect(find.text('Please enter a valid email address'), findsOneWidget);

      // Tap Use Phone to toggle back to Phone mode
      final usePhoneFinder = find.text('Use Phone');
      await tester.ensureVisible(usePhoneFinder);
      await tester.tap(usePhoneFinder);
      await tester.pumpAndSettle();

      expect(find.text('Phone Number'), findsOneWidget);
      expect(find.text('Use Email'), findsOneWidget);
    });

    testWidgets('RegisterScreen renders fields, gender chips, and Create Account button', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: RegisterScreen(),
        ),
      );

      // Both the header title and submit button display "Create Citizen Account"
      expect(find.text('Create Citizen Account'), findsNWidgets(2));
      expect(find.text('FULL NAME *'), findsOneWidget);
      expect(find.text('PHONE NUMBER *'), findsOneWidget);
      expect(find.text('PASSWORD *'), findsOneWidget);
      expect(find.text('CONFIRM PASSWORD *'), findsOneWidget);

      // Test gender selection interaction
      final femaleChip = find.text('Female');
      await tester.ensureVisible(femaleChip);
      await tester.tap(femaleChip);
      await tester.pump();

      // Scroll to submit button and tap with empty fields -> should show warning snackbar
      final submitButton = find.byIcon(Icons.check_circle_outline_rounded);
      await tester.ensureVisible(submitButton);
      await tester.tap(submitButton);
      await tester.pump();

      expect(find.text('Please enter your full name'), findsOneWidget);
    });

    testWidgets('LoginScreen enforces strict type-checking for phone and email inputs', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      final signInFinder = find.text('Sign In');
      await tester.ensureVisible(signInFinder);

      // 1. Phone mode: User enters an email ID -> must show "Please enter a valid phone number"
      await tester.enterText(find.byType(TextField).first, 'user@example.com');
      await tester.enterText(find.byType(TextField).last, 'password123');
      await tester.tap(signInFinder);
      await tester.pump();

      expect(find.text('Please enter a valid phone number'), findsOneWidget);

      // 2. Phone mode: User enters letters or short number -> must show "Please enter a valid phone number"
      await tester.enterText(find.byType(TextField).first, '12345');
      await tester.tap(signInFinder);
      await tester.pump();

      expect(find.text('Please enter a valid phone number'), findsOneWidget);

      // 3. Switch to Email mode via header button
      final useEmailFinder = find.text('Use Email');
      await tester.ensureVisible(useEmailFinder);
      await tester.tap(useEmailFinder);
      await tester.pumpAndSettle();

      // 4. Email mode: User enters a phone number -> must show "Please enter a valid email address"
      await tester.enterText(find.byType(TextField).first, '9876543210');
      await tester.enterText(find.byType(TextField).last, 'password123');
      await tester.ensureVisible(signInFinder);
      await tester.tap(signInFinder);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Please enter a valid email address'), findsOneWidget);

      // 5. Email mode: User enters invalid email format -> must show "Please enter a valid email address"
      await tester.enterText(find.byType(TextField).first, 'invalid.email@');
      await tester.ensureVisible(signInFinder);
      await tester.tap(signInFinder);
      await tester.pump();

      expect(find.text('Please enter a valid email address'), findsOneWidget);
    });

    test('AuthService strictly enforces phone vs email type-checking', () async {
      // Calling phone login with an email format should be rejected
      final phoneRes = await AuthService.login(
        phone: 'citizen@example.com',
        password: 'password123',
      );
      expect(phoneRes.success, false);
      expect(phoneRes.message, 'Please enter a valid phone number.');

      // Calling email login with a phone number format should be rejected
      final emailRes = await AuthService.login(
        email: '9876543210',
        password: 'password123',
      );
      expect(emailRes.success, false);
      expect(emailRes.message, 'Please enter a valid email address.');
    });

    test('AuthService contract defines user_email preference key', () {
      expect(AuthService.prefUserEmailKey, 'user_email');
      expect(AuthService.prefUserPhoneKey, 'user_phone');
      expect(AuthService.prefUserIdKey, 'user_id');
      expect(AuthService.prefCitizenIdKey, 'citizen_id');
    });

    testWidgets('LoginScreen updates input decoration and keyboard type in Email mode', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: LoginScreen(),
        ),
      );

      // Verify phone mode input decoration
      var textField = tester.widget<TextField>(find.byType(TextField).first);
      expect(textField.keyboardType, TextInputType.phone);
      expect(find.byIcon(Icons.phone_outlined), findsOneWidget);

      // Switch to Email mode via header button
      await tester.tap(find.text('Use Email'));
      await tester.pumpAndSettle();

      // Verify email mode input decoration
      textField = tester.widget<TextField>(find.byType(TextField).first);
      expect(textField.keyboardType, TextInputType.emailAddress);
      expect(find.byIcon(Icons.mail_outline_rounded), findsWidgets);
    });
  });
}
