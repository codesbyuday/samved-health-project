import 'package:flutter/material.dart';
import '../../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController wardController = TextEditingController(text: '1');
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();
  final TextEditingController dobController = TextEditingController();
  final TextEditingController addressController = TextEditingController();

  String selectedGender = 'Male';
  bool showPassword = false;
  bool showConfirmPassword = false;
  bool isPressed = false;
  bool isLoading = false;
  String loadingMessage = 'Creating account...';

  Future<void> registerUser() async {
    if (isLoading) return;

    // Dismiss soft keyboard
    FocusScope.of(context).unfocus();

    final name = nameController.text.trim();
    final phone = mobileController.text.trim();
    final pwd = passwordController.text.trim();
    final confirmPwd = confirmPasswordController.text.trim();

    // 1. Validation checks
    if (name.isEmpty) {
      _showWarningSnackBar("Please enter your full name");
      return;
    }

    if (phone.isEmpty || phone.length < 10) {
      _showWarningSnackBar("Please enter a valid 10-digit mobile number");
      return;
    }

    if (pwd.isEmpty || pwd.length < 6) {
      _showWarningSnackBar("Password must be at least 6 characters long");
      return;
    }

    if (pwd != confirmPwd) {
      _showWarningSnackBar("Passwords do not match");
      return;
    }

    setState(() {
      isLoading = true;
      loadingMessage = 'Creating citizen profile...';
    });

    try {
      final wardNum = int.tryParse(wardController.text.trim()) ?? 1;

      final result = await AuthService.register(
        phone: phone,
        password: pwd,
        name: name,
        wardNumber: wardNum,
        gender: selectedGender.isNotEmpty ? selectedGender : null,
        address: addressController.text.trim().isNotEmpty ? addressController.text.trim() : null,
        dateOfBirth: dobController.text.trim().isNotEmpty ? dobController.text.trim() : null,
      );

      if (!mounted) return;

      if (result.success) {
        setState(() {
          loadingMessage = 'Account created! Redirecting...';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            backgroundColor: const Color(0xFF16A34A),
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 22),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "Registration Successful! Please sign in with your credentials.",
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            duration: const Duration(seconds: 4),
          ),
        );

        await Future.delayed(const Duration(milliseconds: 350));
        if (!mounted) return;
        Navigator.pop(context);
      } else {
        setState(() => isLoading = false);
        final msg = result.message ?? "Registration failed. Please try again.";
        final isOffline = msg.toLowerCase().contains('internet') ||
            msg.toLowerCase().contains('network') ||
            msg.toLowerCase().contains('offline') ||
            msg.toLowerCase().contains('connection');

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            backgroundColor: isOffline ? const Color(0xFFD97706) : const Color(0xFFDC2626),
            content: Row(
              children: [
                Icon(
                  isOffline ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    msg,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => isLoading = false);
      final errStr = e.toString().toLowerCase();
      final isOffline = errStr.contains('socketexception') ||
          errStr.contains('failed host lookup') ||
          errStr.contains('network') ||
          errStr.contains('internet') ||
          errStr.contains('connection');

      final displayMsg = isOffline
          ? 'No internet connection. Please check your mobile data or Wi-Fi and try again.'
          : 'Registration error: $e';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          backgroundColor: isOffline ? const Color(0xFFD97706) : const Color(0xFFDC2626),
          content: Row(
            children: [
              Icon(
                isOffline ? Icons.wifi_off_rounded : Icons.warning_amber_rounded,
                color: Colors.white,
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  displayMsg,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  void _showWarningSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        backgroundColor: const Color(0xFFDC2626),
        content: Row(
          children: [
            const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    mobileController.dispose();
    emailController.dispose();
    wardController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    dobController.dispose();
    addressController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    if (isLoading) return;
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 20),
      firstDate: DateTime(1900),
      lastDate: now,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF4F46E5),
              onPrimary: Colors.white,
              onSurface: Color(0xFF1E293B),
            ),
          ),
          child: child!,
        );
      },
    );

    if (selected == null) return;

    final day = selected.day.toString().padLeft(2, '0');
    final month = selected.month.toString().padLeft(2, '0');
    final year = selected.year.toString();

    setState(() {
      dobController.text = '$day-$month-$year';
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
        resizeToAvoidBottomInset: true,
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF4F46E5),
                Color(0xFF9333EA),
                Color(0xFFEC4899),
              ],
            ),
          ),
          child: Stack(
            children: [
              const _AuthBackgroundShapes(),
              SafeArea(
                child: SingleChildScrollView(
                  keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(22, 14, 22, 28),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: isLoading ? null : () => Navigator.pop(context),
                            child: const _GlassIconBox(
                              icon: Icons.arrow_back_rounded,
                              size: 56,
                              iconSize: 26,
                            ),
                          ),
                          const _GlassIconBox(
                            icon: Icons.health_and_safety_rounded,
                            size: 56,
                            iconSize: 28,
                          ),
                        ],
                      ),
                      const SizedBox(height: 22),
                      const Text(
                        'Create Citizen Account',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 30,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Join Solapur Smart Health & Surveillance Network',
                        style: TextStyle(
                          color: Color(0xE6FFFFFF),
                          fontSize: 15,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 22),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(22),
                        decoration: _glassCardDecoration(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const _RegisterLabel('Full Name *'),
                            const SizedBox(height: 8),
                            _AuthTextField(
                              controller: nameController,
                              hintText: 'e.g. Ramesh Patil',
                              prefixIcon: Icons.person_outline_rounded,
                              textInputAction: TextInputAction.next,
                              enabled: !isLoading,
                            ),
                            const SizedBox(height: 16),
                            const _RegisterLabel('Phone Number *'),
                            const SizedBox(height: 8),
                            _AuthTextField(
                              controller: mobileController,
                              keyboardType: TextInputType.phone,
                              textInputAction: TextInputAction.next,
                              hintText: '10-digit mobile number',
                              prefixIcon: Icons.phone_outlined,
                              enabled: !isLoading,
                            ),
                            const SizedBox(height: 16),
                            const _RegisterLabel('Email Address (Optional)'),
                            const SizedBox(height: 8),
                            _AuthTextField(
                              controller: emailController,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              hintText: 'ramesh@example.com',
                              prefixIcon: Icons.mail_outline_rounded,
                              enabled: !isLoading,
                            ),
                            const SizedBox(height: 16),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const _RegisterLabel('SMC Ward (1-20)'),
                                      const SizedBox(height: 8),
                                      _AuthTextField(
                                        controller: wardController,
                                        keyboardType: TextInputType.number,
                                        textInputAction: TextInputAction.next,
                                        hintText: '1',
                                        prefixIcon: Icons.location_city_rounded,
                                        enabled: !isLoading,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  flex: 3,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const _RegisterLabel('Date of Birth'),
                                      const SizedBox(height: 8),
                                      _AuthTextField(
                                        controller: dobController,
                                        hintText: 'dd-mm-yyyy',
                                        prefixIcon: Icons.calendar_today_outlined,
                                        readOnly: true,
                                        onTap: _pickDate,
                                        enabled: !isLoading,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            const _RegisterLabel('Password *'),
                            const SizedBox(height: 8),
                            _AuthTextField(
                              controller: passwordController,
                              obscureText: !showPassword,
                              textInputAction: TextInputAction.next,
                              hintText: 'At least 6 characters',
                              prefixIcon: Icons.lock_outline_rounded,
                              enabled: !isLoading,
                              suffix: IconButton(
                                onPressed: isLoading
                                    ? null
                                    : () {
                                        setState(() {
                                          showPassword = !showPassword;
                                        });
                                      },
                                icon: Text(
                                  showPassword ? '🙈' : '👁️',
                                  style: const TextStyle(fontSize: 20),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            const _RegisterLabel('Confirm Password *'),
                            const SizedBox(height: 8),
                            _AuthTextField(
                              controller: confirmPasswordController,
                              obscureText: !showConfirmPassword,
                              textInputAction: TextInputAction.next,
                              hintText: 'Re-enter your password',
                              prefixIcon: Icons.lock_outline_rounded,
                              enabled: !isLoading,
                              suffix: IconButton(
                                onPressed: isLoading
                                    ? null
                                    : () {
                                        setState(() {
                                          showConfirmPassword = !showConfirmPassword;
                                        });
                                      },
                                icon: Text(
                                  showConfirmPassword ? '🙈' : '👁️',
                                  style: const TextStyle(fontSize: 20),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            const _RegisterLabel('Gender'),
                            const SizedBox(height: 8),
                            Row(
                              children: ['Male', 'Female', 'Other']
                                  .map(
                                    (gender) => Expanded(
                                      child: Padding(
                                        padding: EdgeInsets.only(
                                          right: gender == 'Other' ? 0 : 8,
                                        ),
                                        child: _GenderChip(
                                          label: gender,
                                          isSelected: selectedGender == gender,
                                          enabled: !isLoading,
                                          onTap: () {
                                            if (!isLoading) {
                                              setState(() {
                                                selectedGender = gender;
                                              });
                                            }
                                          },
                                        ),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                            const SizedBox(height: 16),
                            const _RegisterLabel('Residential Address'),
                            const SizedBox(height: 8),
                            _AuthTextField(
                              controller: addressController,
                              hintText: 'Area, Solapur',
                              prefixIcon: Icons.location_on_outlined,
                              maxLines: 2,
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) {
                                if (!isLoading) registerUser();
                              },
                              enabled: !isLoading,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // INTERACTIVE CREATE ACCOUNT BUTTON WITH ANIMATED LOADING INDICATOR
                      GestureDetector(
                        onTapDown: isLoading
                            ? null
                            : (_) {
                                setState(() {
                                  isPressed = true;
                                });
                              },
                        onTapUp: isLoading
                            ? null
                            : (_) {
                                setState(() {
                                  isPressed = false;
                                });
                              },
                        onTapCancel: () {
                          setState(() {
                            isPressed = false;
                          });
                        },
                        onTap: isLoading ? null : registerUser,
                        child: AnimatedScale(
                          duration: const Duration(milliseconds: 120),
                          scale: isPressed && !isLoading ? 0.98 : 1,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: isLoading
                                    ? [
                                        const Color(0xFF4338CA),
                                        const Color(0xFF7E22CE),
                                      ]
                                    : [
                                        const Color(0xFF4F46E5),
                                        const Color(0xFF9333EA),
                                        const Color(0xFFEC4899),
                                      ],
                              ),
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF4F46E5)
                                      .withValues(alpha: isLoading ? 0.20 : 0.35),
                                  blurRadius: 18,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: Center(
                              child: isLoading
                                  ? Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.5,
                                            valueColor:
                                                AlwaysStoppedAnimation<Color>(Colors.white),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Text(
                                          loadingMessage,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ],
                                    )
                                  : const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Create Citizen Account',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 17,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: 0.4,
                                          ),
                                        ),
                                        SizedBox(width: 8),
                                        Icon(
                                          Icons.check_circle_outline_rounded,
                                          color: Colors.white,
                                          size: 20,
                                        ),
                                      ],
                                    ),
                            ),
                          ),
                        ),
                      ),

                      // Processing Registration Notice
                      if (isLoading) ...[
                        const SizedBox(height: 12),
                        Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.20),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.cloud_upload_outlined,
                                  size: 15,
                                  color: Colors.white,
                                ),
                                SizedBox(width: 6),
                                Text(
                                  'Registering with Solapur Municipal Health Gateway...',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 24),
                      Center(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'Already have an account? ',
                              style: TextStyle(
                                color: Color(0xE6FFFFFF),
                                fontSize: 15,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            GestureDetector(
                              onTap: isLoading ? null : () => Navigator.pop(context),
                              child: const Text(
                                'Sign In',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

BoxDecoration _glassCardDecoration() {
  return BoxDecoration(
    color: Colors.white.withValues(alpha: 0.95),
    borderRadius: BorderRadius.circular(28),
    border: Border.all(
      color: Colors.white.withValues(alpha: 0.65),
    ),
    boxShadow: const [
      BoxShadow(
        color: Color(0x260F172A),
        blurRadius: 28,
        offset: Offset(0, 16),
      ),
    ],
  );
}

class _AuthBackgroundShapes extends StatelessWidget {
  const _AuthBackgroundShapes();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: -80,
          left: -100,
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.10),
              shape: BoxShape.circle,
            ),
          ),
        ),
        Positioned(
          right: -120,
          bottom: -80,
          child: Container(
            width: 320,
            height: 320,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.10),
              shape: BoxShape.circle,
            ),
          ),
        ),
        Positioned(
          top: 220,
          right: 24,
          child: Container(
            width: 140,
            height: 140,
            decoration: const BoxDecoration(
              color: Color(0x33FBBF24),
              shape: BoxShape.circle,
            ),
          ),
        ),
      ],
    );
  }
}

class _GlassIconBox extends StatelessWidget {
  const _GlassIconBox({
    required this.icon,
    this.size = 72,
    this.iconSize = 34,
  });

  final IconData icon;
  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(size * 0.32),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.28),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x260F172A),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Icon(
        icon,
        color: Colors.white,
        size: iconSize,
      ),
    );
  }
}

class _RegisterLabel extends StatelessWidget {
  const _RegisterLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: Color(0xFF475569),
        fontSize: 12,
        letterSpacing: 0.5,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    required this.controller,
    required this.hintText,
    required this.prefixIcon,
    this.keyboardType,
    this.obscureText = false,
    this.suffix,
    this.maxLines = 1,
    this.readOnly = false,
    this.onTap,
    this.textInputAction,
    this.onSubmitted,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String hintText;
  final IconData prefixIcon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? suffix;
  final int maxLines;
  final bool readOnly;
  final VoidCallback? onTap;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      maxLines: maxLines,
      readOnly: readOnly,
      onTap: onTap,
      enabled: enabled,
      textInputAction: textInputAction,
      onSubmitted: onSubmitted,
      style: const TextStyle(
        color: Color(0xFF1F2937),
        fontSize: 15,
        fontWeight: FontWeight.w600,
      ),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(
          color: Color(0xFF9CA3AF),
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        filled: true,
        fillColor: enabled ? const Color(0xFFF8FAFC) : const Color(0xFFF1F5F9),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 16,
        ),
        prefixIcon: Icon(
          prefixIcon,
          color: enabled ? const Color(0xFF6366F1) : const Color(0xFF9CA3AF),
          size: 20,
        ),
        suffixIcon: suffix,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(
            color: Color(0xFFE5E7EB),
            width: 1.5,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(
            color: Color(0xFFE5E7EB),
            width: 1.5,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(
            color: Color(0xFF6366F1),
            width: 1.8,
          ),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(
            color: Color(0xFFE2E8F0),
            width: 1.2,
          ),
        ),
      ),
    );
  }
}

class _GenderChip extends StatelessWidget {
  const _GenderChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.enabled = true,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: isSelected
            ? const LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  Color(0xFF4F46E5),
                  Color(0xFF7C3AED),
                ],
              )
            : null,
        color: isSelected ? null : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(14),
        boxShadow: isSelected
            ? const [
                BoxShadow(
                  color: Color(0x334F46E5),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 13),
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF475569),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
