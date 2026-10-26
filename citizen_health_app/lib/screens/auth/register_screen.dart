import 'package:flutter/material.dart';

import '../../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController wardController = TextEditingController(text: '1');
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();
  final TextEditingController dobController = TextEditingController();
  final TextEditingController addressController = TextEditingController();

  String selectedGender = '';
  bool showPassword = false;
  bool showConfirmPassword = false;
  bool isPressed = false;

  Future<void> registerUser(BuildContext context) async {
    final phone = mobileController.text.trim();
    final pwd = passwordController.text.trim();
    final confirmPwd = confirmPasswordController.text.trim();

    if (phone.isEmpty || pwd.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill in mobile number and password")),
      );
      return;
    }

    if (pwd != confirmPwd) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Passwords do not match")),
      );
      return;
    }

    final result = await AuthService.register(
      phone: phone,
      password: pwd,
      name: nameController.text.trim().isNotEmpty ? nameController.text.trim() : 'Citizen',
      wardNumber: int.tryParse(wardController.text.trim()) ?? 1,
      gender: selectedGender.isNotEmpty ? selectedGender : null,
      address: addressController.text.trim().isNotEmpty ? addressController.text.trim() : null,
      dateOfBirth: dobController.text.trim().isNotEmpty ? dobController.text.trim() : null,
    );

    if (!mounted) return;

    if (result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Registration Successful")),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.message ?? "Registration failed")),
      );
    }
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
    final now = DateTime.now();
    final selected = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 20),
      firstDate: DateTime(1900),
      lastDate: now,
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
    return Scaffold(
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
                padding: const EdgeInsets.fromLTRB(22, 18, 22, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: const _GlassIconBox(
                            icon: Icons.arrow_back_rounded,
                            size: 68,
                            iconSize: 30,
                          ),
                        ),
                        const _GlassIconBox(
                          icon: Icons.auto_awesome_rounded,
                          size: 76,
                          iconSize: 36,
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    const Text(
                      'Create Account',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 34,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Join us and start your wellness journey',
                      style: TextStyle(
                        color: Color(0xE6FFFFFF),
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 26),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: _glassCardDecoration(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const _RegisterLabel('Full Name'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: nameController,
                            hintText: 'John Doe',
                            prefixIcon: Icons.person_outline_rounded,
                          ),
                          const SizedBox(height: 18),
                          const _RegisterLabel('Phone Number'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: mobileController,
                            keyboardType: TextInputType.phone,
                            hintText: '+1 (555) 000-0000',
                            prefixIcon: Icons.phone_outlined,
                          ),
                          const SizedBox(height: 18),
                          const _RegisterLabel('Email Address'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: emailController,
                            keyboardType: TextInputType.emailAddress,
                            hintText: 'john@example.com',
                            prefixIcon: Icons.mail_outline_rounded,
                          ),
                          const SizedBox(height: 18),
                          const _RegisterLabel('Password'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: passwordController,
                            obscureText: !showPassword,
                            hintText: '••••••••',
                            prefixIcon: Icons.lock_outline_rounded,
                            suffix: IconButton(
                              onPressed: () {
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
                          const SizedBox(height: 18),
                          const _RegisterLabel('Confirm Password'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: confirmPasswordController,
                            obscureText: !showConfirmPassword,
                            hintText: '••••••••',
                            prefixIcon: Icons.lock_outline_rounded,
                            suffix: IconButton(
                              onPressed: () {
                                setState(() {
                                  showConfirmPassword =
                                      !showConfirmPassword;
                                });
                              },
                              icon: Text(
                                showConfirmPassword ? '🙈' : '👁️',
                                style: const TextStyle(fontSize: 20),
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          const _RegisterLabel('Gender'),
                          const SizedBox(height: 10),
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
                                        isSelected:
                                            selectedGender == gender,
                                        onTap: () {
                                          setState(() {
                                            selectedGender = gender;
                                          });
                                        },
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                          const SizedBox(height: 18),
                          const _RegisterLabel('Date of Birth'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: dobController,
                            hintText: 'dd-mm-yyyy',
                            prefixIcon: Icons.calendar_today_outlined,
                            readOnly: true,
                            onTap: _pickDate,
                            suffix: const Padding(
                              padding: EdgeInsets.only(right: 16),
                              child: Icon(
                                Icons.check_box_outline_blank_rounded,
                                color: Colors.white70,
                                size: 18,
                              ),
                            ),
                          ),
                          const SizedBox(height: 18),
                          const _RegisterLabel('Address'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: addressController,
                            hintText: '123 Main Street, City, State',
                            prefixIcon: Icons.location_on_outlined,
                            maxLines: 3,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    GestureDetector(
                      onTapDown: (_) {
                        setState(() {
                          isPressed = true;
                        });
                      },
                      onTapUp: (_) {
                        setState(() {
                          isPressed = false;
                        });
                      },
                      onTapCancel: () {
                        setState(() {
                          isPressed = false;
                        });
                      },
                      onTap: () {
                        registerUser(context);
                      },
                      child: AnimatedScale(
                        duration: const Duration(milliseconds: 120),
                        scale: isPressed ? 0.98 : 1,
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 20),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                              colors: [
                                Color(0xFF4F46E5),
                                Color(0xFF9333EA),
                                Color(0xFFEC4899),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(22),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x334F46E5),
                                blurRadius: 18,
                                offset: Offset(0, 10),
                              ),
                            ],
                          ),
                          child: const Center(
                            child: Text(
                              'Create Account',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      child: RichText(
                        textAlign: TextAlign.center,
                        text: const TextSpan(
                          style: TextStyle(
                            color: Color(0xE6FFFFFF),
                            fontSize: 14,
                            height: 1.6,
                            fontWeight: FontWeight.w500,
                          ),
                          children: [
                            TextSpan(
                              text:
                                  'By creating an account, you agree to our ',
                            ),
                            TextSpan(
                              text: 'Terms of Service',
                              style: TextStyle(
                                color: Colors.white,
                                decoration: TextDecoration.underline,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            TextSpan(text: ' and '),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: TextStyle(
                                color: Colors.white,
                                decoration: TextDecoration.underline,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'Already have an account? ',
                            style: TextStyle(
                              color: Color(0xE6FFFFFF),
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: const Text(
                              'Sign In',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

BoxDecoration _glassCardDecoration() {
  return BoxDecoration(
    color: Colors.white.withOpacity(0.94),
    borderRadius: BorderRadius.circular(30),
    border: Border.all(
      color: Colors.white.withOpacity(0.65),
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
              color: Colors.white.withOpacity(0.10),
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
              color: Colors.white.withOpacity(0.10),
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
            decoration: BoxDecoration(
              color: const Color(0x33FBBF24),
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
        color: Colors.white.withOpacity(0.18),
        borderRadius: BorderRadius.circular(size * 0.32),
        border: Border.all(
          color: Colors.white.withOpacity(0.28),
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
        color: Color(0xFF6B7280),
        fontSize: 13,
        letterSpacing: 0.6,
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

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      maxLines: maxLines,
      readOnly: readOnly,
      onTap: onTap,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(
          color: Color(0xFF9CA3AF),
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 18,
        ),
        prefixIcon: Icon(
          prefixIcon,
          color: const Color(0xFF6366F1),
        ),
        suffixIcon: suffix,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(
            color: Color(0xFFE5E7EB),
            width: 1.5,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(
            color: Color(0xFFE5E7EB),
            width: 1.5,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(
            color: Color(0xFF6366F1),
            width: 1.8,
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
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

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
        color: isSelected ? null : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(16),
        boxShadow: isSelected
            ? const [
                BoxShadow(
                  color: Color(0x334F46E5),
                  blurRadius: 12,
                  offset: Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 15),
            child: Center(
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected
                      ? Colors.white
                      : const Color(0xFF475569),
                  fontSize: 16,
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
