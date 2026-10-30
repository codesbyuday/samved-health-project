import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'screens/alerts_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/health/health_screen.dart';
import 'screens/home_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/services_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://yxknckhlzcjybjbdqnbg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a25ja2hsemNqeWJqYmRxbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY4MTYsImV4cCI6MjA4ODg5MjgxNn0.MA64InqN_hkdrLHPDP3WCigPkTJFlk-mhKEdNa5MPSk',
  );

  runApp(const CitizenApp());
}

class AuthCheck extends StatefulWidget {
  const AuthCheck({super.key});

  @override
  State<AuthCheck> createState() => _AuthCheckState();
}

class _AuthCheckState extends State<AuthCheck> {

  Future<bool> checkLogin() async {

    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('user_id');

    return userId != null;
  }

  @override
  Widget build(BuildContext context) {

    return FutureBuilder(
      future: checkLogin(),
      builder: (context, snapshot) {

        if (!snapshot.hasData) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.data == true) {
          return const MainNavigation();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}

class CitizenApp extends StatelessWidget {
  const CitizenApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: "Smart Health System",
      theme: ThemeData(
        primaryColor: const Color(0xFF0F9D9A),
        scaffoldBackgroundColor: const Color(0xFFF5F7FA),

        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F9D9A),
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
      ),
      home: const AuthCheck(),
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int currentIndex = 0;

  final screens = const [
    HomeScreen(),
    ServicesScreen(),
    HealthScreen(),
    AlertsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: screens[currentIndex],
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 0, 16, 18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.96),
            borderRadius: BorderRadius.circular(30),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1A0F172A),
                blurRadius: 24,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _NavItem(
                icon: Icons.home_rounded,
                label: 'Home',
                isSelected: currentIndex == 0,
                onTap: () => _onTap(0),
              ),
              _NavItem(
                icon: Icons.medical_services_outlined,
                label: 'Services',
                isSelected: currentIndex == 1,
                onTap: () => _onTap(1),
              ),
              _NavItem(
                icon: Icons.favorite_border_rounded,
                label: 'Health',
                isSelected: currentIndex == 2,
                onTap: () => _onTap(2),
              ),
              _NavItem(
                icon: Icons.notifications_none_rounded,
                label: 'Alerts',
                isSelected: currentIndex == 3,
                onTap: () => _onTap(3),
              ),
              _NavItem(
                icon: Icons.person_outline_rounded,
                label: 'Profile',
                isSelected: currentIndex == 4,
                onTap: () => _onTap(4),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onTap(int index) {
    setState(() {
      currentIndex = index;
    });
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    const activeGradient = LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFF2563EB),
        Color(0xFF06B6D4),
      ],
    );

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                height: 48,
                width: 48,
                decoration: BoxDecoration(
                  gradient: isSelected ? activeGradient : null,
                  color: isSelected ? null : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: isSelected
                      ? const [
                          BoxShadow(
                            color: Color(0x332563EB),
                            blurRadius: 16,
                            offset: Offset(0, 8),
                          ),
                        ]
                      : null,
                ),
                child: Icon(
                  icon,
                  color: isSelected
                      ? Colors.white
                      : const Color(0xFF98A2B3),
                  size: 24,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected
                      ? const Color(0xFF2563EB)
                      : const Color(0xFF98A2B3),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
