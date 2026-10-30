import 'package:flutter/material.dart';
import '../../config/api_config.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController mobileController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool isEmailLogin = false;
  bool showPassword = false;
  bool isPressed = false;
  bool isLoading = false;

  Future<void> _showServerConfigDialog() async {
    final currentUrl = await ApiConfig.getBaseUrl();
    final urlController = TextEditingController(text: currentUrl);
    String? testResult;
    bool isTesting = false;
    bool testSuccess = false;

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.dns_rounded, color: Color(0xFF7C3AED)),
                SizedBox(width: 10),
                Text('Server Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'FastAPI Backend Base URL:',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF475467)),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: urlController,
                    decoration: InputDecoration(
                      hintText: 'e.g. https://smart-health-ecosystem-backend.vercel.app',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('Quick Presets:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [
                      ActionChip(
                        avatar: const Icon(Icons.cloud_done_rounded, size: 16, color: Color(0xFF0284C7)),
                        label: const Text('Live Backend (Vercel)'),
                        backgroundColor: const Color(0xFFE0F2FE),
                        onPressed: () {
                          setDialogState(() {
                            urlController.text = ApiConfig.liveProductionUrl;
                            testResult = null;
                          });
                        },
                      ),
                      ActionChip(
                        label: const Text('USB adb reverse (127.0.0.1)'),
                        onPressed: () {
                          setDialogState(() {
                            urlController.text = 'http://127.0.0.1:8000';
                            testResult = null;
                          });
                        },
                      ),
                      ActionChip(
                        label: const Text('Wi-Fi LAN (172.22.180.106)'),
                        onPressed: () {
                          setDialogState(() {
                            urlController.text = 'http://172.22.180.106:8000';
                            testResult = null;
                          });
                        },
                      ),
                      ActionChip(
                        label: const Text('Android Emulator (10.0.2.2)'),
                        onPressed: () {
                          setDialogState(() {
                            urlController.text = 'http://10.0.2.2:8000';
                            testResult = null;
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (testResult != null) ...[
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: testSuccess ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: testSuccess ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                        ),
                      ),
                      child: Text(
                        testResult!,
                        style: TextStyle(
                          fontSize: 12,
                          color: testSuccess ? const Color(0xFF065F46) : const Color(0xFF991B1B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: isTesting
                          ? null
                          : () async {
                              setDialogState(() {
                                isTesting = true;
                                testResult = 'Testing connection...';
                              });
                              final res = await ApiConfig.testConnection(urlController.text);
                              setDialogState(() {
                                isTesting = false;
                                testSuccess = res['success'] == true;
                                testResult = '${res['success'] ? "✓" : "✕"} ${res['message']}';
                              });
                            },
                      icon: isTesting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.network_check_rounded, size: 18),
                      label: Text(isTesting ? 'Pinging server...' : 'Test Server Connection'),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogCtx),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  await ApiConfig.setCustomBaseUrl(urlController.text);
                  if (ctx.mounted) Navigator.pop(dialogCtx);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Server URL set to: ${urlController.text}')),
                    );
                  }
                },
                child: const Text('Save & Apply'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _toggleLoginMethod(bool toEmail) {
    if (isEmailLogin == toEmail) return;
    FocusManager.instance.primaryFocus?.unfocus();
    setState(() {
      isEmailLogin = toEmail;
    });
  }

  Future<void> loginUser() async {
    final identifier = isEmailLogin ? emailController.text.trim() : mobileController.text.trim();
    final password = passwordController.text.trim();

    ScaffoldMessenger.of(context).clearSnackBars();

    if (identifier.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isEmailLogin
                ? "Please enter your email and password"
                : "Please enter phone number and password",
          ),
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    if (isEmailLogin) {
      final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
      if (!emailRegex.hasMatch(identifier)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Please enter a valid email address"),
            duration: Duration(seconds: 3),
          ),
        );
        return;
      }
    } else {
      final cleanDigits = identifier.replaceAll(RegExp(r'[\s\-]'), '');
      final phoneRegex = RegExp(r'^\+?[0-9]{10,13}$');
      if (!phoneRegex.hasMatch(cleanDigits) ||
          identifier.contains('@') ||
          RegExp(r'[a-zA-Z]').hasMatch(identifier)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Please enter a valid phone number"),
            duration: Duration(seconds: 3),
          ),
        );
        return;
      }
    }

    setState(() => isLoading = true);

    try {
      final result = await AuthService.login(
        email: isEmailLogin ? identifier : null,
        phone: isEmailLogin ? null : identifier,
        password: password,
      );

      if (!mounted) return;
      setState(() => isLoading = false);

      if (result.success) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const MainNavigation(),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result.message ?? "Invalid login credentials"),
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
          : 'Login error: $e';

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(displayMsg),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  void dispose() {
    mobileController.dispose();
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
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
              Color(0xFF7C3AED),
              Color(0xFFEC4899),
              Color(0xFFFB923C),
            ],
          ),
        ),
        child: Stack(
          children: [
            const _AuthBackgroundShapes(),
            SafeArea(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                child: Column(
                  children: [
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(width: 44),
                        const Expanded(
                          child: Text(
                            'Welcome Back!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 34,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.settings_ethernet_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                          tooltip: 'Server Settings',
                          onPressed: _showServerConfigDialog,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Sign in to continue your journey',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xE6FFFFFF),
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 28),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: _glassCardDecoration(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _FieldLabel(isEmailLogin ? 'Email Address' : 'Phone Number'),
                              TextButton(
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                onPressed: isLoading
                                    ? null
                                    : () => _toggleLoginMethod(!isEmailLogin),
                                child: Text(
                                  isEmailLogin ? 'Use Phone' : 'Use Email',
                                  style: const TextStyle(
                                    color: Color(0xFF7C3AED),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            key: ValueKey(isEmailLogin ? 'login_email_input' : 'login_phone_input'),
                            controller: isEmailLogin ? emailController : mobileController,
                            keyboardType: isEmailLogin ? TextInputType.emailAddress : TextInputType.phone,
                            textCapitalization: TextCapitalization.none,
                            autocorrect: false,
                            hintText: isEmailLogin ? 'Enter your email address' : 'Enter your phone number',
                            prefixIcon: isEmailLogin ? Icons.mail_outline_rounded : Icons.phone_outlined,
                            enabled: !isLoading,
                          ),
                          const SizedBox(height: 20),
                          const _FieldLabel('Password'),
                          const SizedBox(height: 10),
                          _AuthTextField(
                            controller: passwordController,
                            obscureText: !showPassword,
                            hintText: 'Enter your password',
                            prefixIcon: Icons.lock_outline_rounded,
                            enabled: !isLoading,
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
                          const SizedBox(height: 14),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {},
                              child: const Text(
                                'Forgot Password?',
                                style: TextStyle(
                                  color: Color(0xFF9333EA),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
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
                            onTap: isLoading ? null : loginUser,
                            child: AnimatedScale(
                              duration: const Duration(milliseconds: 120),
                              scale: isPressed ? 0.98 : 1,
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 18),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    begin: Alignment.centerLeft,
                                    end: Alignment.centerRight,
                                    colors: [
                                      Color(0xFF7C3AED),
                                      Color(0xFFEC4899),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(22),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x337C3AED),
                                      blurRadius: 18,
                                      offset: Offset(0, 10),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: isLoading
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.5,
                                            color: Colors.white,
                                          ),
                                        )
                                      : const Text(
                                          'Sign In',
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
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    Row(
                      children: const [
                        Expanded(
                          child: Divider(
                            color: Color(0x66FFFFFF),
                            thickness: 1,
                          ),
                        ),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 14),
                          child: Text(
                            'OR CONTINUE WITH',
                            style: TextStyle(
                              color: Color(0xCCFFFFFF),
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ),
                        Expanded(
                          child: Divider(
                            color: Color(0x66FFFFFF),
                            thickness: 1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    Row(
                      children: [
                        Expanded(
                          child: _SocialButton(
                            label: 'Google',
                            icon: const _GoogleMark(),
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Google Sign-In will be available soon. Please use Email or Phone.'),
                                  duration: Duration(seconds: 3),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _SocialButton(
                            label: isEmailLogin ? 'Phone' : 'Email',
                            icon: Icon(
                              isEmailLogin ? Icons.phone_android_rounded : Icons.mail_outline_rounded,
                              color: const Color(0xFF475569),
                              size: 22,
                            ),
                            onTap: isLoading ? null : () => _toggleLoginMethod(!isEmailLogin),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 26),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Don't have an account? ",
                          style: TextStyle(
                            color: Color(0xE6FFFFFF),
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const RegisterScreen(),
                              ),
                            );
                          },
                          child: const Text(
                            'Create Account',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
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
    color: Colors.white,
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
          top: 70,
          left: -20,
          child: Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.10),
              shape: BoxShape.circle,
            ),
          ),
        ),
        Positioned(
          right: -40,
          bottom: 120,
          child: Container(
            width: 180,
            height: 180,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.10),
              shape: BoxShape.circle,
            ),
          ),
        ),
        Positioned(
          top: 260,
          left: 80,
          child: Container(
            width: 240,
            height: 240,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.06),
              shape: BoxShape.circle,
            ),
          ),
        ),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF374151),
        fontSize: 15,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField({
    super.key,
    required this.controller,
    required this.hintText,
    required this.prefixIcon,
    this.keyboardType,
    this.obscureText = false,
    this.suffix,
    this.maxLines = 1,
    this.readOnly = false,
    this.enabled = true,
    this.textCapitalization = TextCapitalization.none,
    this.autocorrect = true,
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
  final bool enabled;
  final TextCapitalization textCapitalization;
  final bool autocorrect;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return TextField(
      key: key,
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      autocorrect: autocorrect,
      obscureText: obscureText,
      maxLines: maxLines,
      readOnly: readOnly,
      enabled: enabled,
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
          color: const Color(0xFF8B5CF6),
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
            color: Color(0xFF7C3AED),
            width: 1.8,
          ),
        ),
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.label,
    required this.icon,
    this.onTap,
  });

  final String label;
  final Widget icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            boxShadow: const [
              BoxShadow(
                color: Color(0x220F172A),
                blurRadius: 18,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              icon,
              const SizedBox(width: 10),
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF374151),
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GoogleMark extends StatelessWidget {
  const _GoogleMark();

  @override
  Widget build(BuildContext context) {
    return const Text(
      'G',
      style: TextStyle(
        color: Color(0xFF4285F4),
        fontSize: 22,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}
