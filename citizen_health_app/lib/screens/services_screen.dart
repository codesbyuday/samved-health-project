import 'package:flutter/material.dart';
import 'medicine/medicine_search_screen.dart';
import 'appointment/appointment_form_screen.dart';
import 'telemedicine/telemedicine_screen.dart';
import 'hospitals/hospital_finder_screen.dart';
import 'emergency/emergency_assistance_screen.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFF),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFFFFFF),
              Color(0xFFF3F7FF),
              Color(0xFFEEF4FF),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Services',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF12284C),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Access all healthcare services in one place',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.4,
                        color: Color(0xFF62708A),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                const _SectionTitle(
                  title: 'Healthcare Services',
                  icon: Icons.medical_services_outlined,
                  iconGradient: [
                    Color(0xFF7C4DFF),
                    Color(0xFF5B8CFF),
                  ],
                  titleColor: Color(0xFF4E5BD5),
                ),
                const SizedBox(height: 14),
                HealthcareServiceCard(
                  title: 'Book Appointment',
                  description:
                      'Schedule doctor visits and manage consultations with ease.',
                  icon: Icons.calendar_month_rounded,
                  cardGradient: const [
                    Color(0xFFF2EDFF),
                    Color(0xFFE8F0FF),
                  ],
                  iconGradient: const [
                    Color(0xFF7C4DFF),
                    Color(0xFF5B8CFF),
                  ],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AppointmentFormScreen(
                          appointmentType: 'doctor',
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),
                HealthcareServiceCard(
                  title: 'Telemedicine Consultation',
                  description:
                      'Connect with healthcare professionals from anywhere instantly.',
                  icon: Icons.videocam_rounded,
                  cardGradient: const [
                    Color(0xFFEEF2FF),
                    Color(0xFFE7F5FF),
                  ],
                  iconGradient: const [
                    Color(0xFF5E60CE),
                    Color(0xFF3A86FF),
                  ],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TelemedicineScreen(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 28),
                const _SectionTitle(
                  title: 'Nearby & Access',
                  icon: Icons.apartment_rounded,
                  iconGradient: [
                    Color(0xFF21B6FF),
                    Color(0xFF2F80ED),
                  ],
                  titleColor: Color(0xFF0396C8),
                ),
                const SizedBox(height: 14),
                NearbyServiceCard(
                  title: 'Find Hospitals',
                  description:
                      'Locate nearby hospitals and get directions quickly.',
                  detail: '- 5 hospitals within 3km',
                  icon: Icons.location_on_rounded,
                  iconGradient: const [
                    Color(0xFF00A6FB),
                    Color(0xFF0582CA),
                  ],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const HospitalFinderScreen(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),
                NearbyServiceCard(
                  title: 'Medicine Availability',
                  description:
                      'Check stock updates and access nearby pharmacies fast.',
                  detail: '- 12 pharmacies available',
                  icon: Icons.medication_liquid_rounded,
                  iconGradient: const [
                    Color(0xFF38BDF8),
                    Color(0xFF2563EB),
                  ],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MedicineSearchScreen(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 28),
                const _SectionTitle(
                  title: 'Emergency',
                  icon: Icons.error_outline_rounded,
                  iconGradient: [
                    Color(0xFFFF5B5B),
                    Color(0xFFF03232),
                  ],
                  titleColor: Color(0xFFF03232),
                ),
                const SizedBox(height: 14),
                EmergencyCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const EmergencyAssistanceScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({
    required this.title,
    required this.icon,
    required this.iconGradient,
    required this.titleColor,
  });

  final String title;
  final IconData icon;
  final List<Color> iconGradient;
  final Color titleColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 40,
          width: 40,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: iconGradient,
            ),
            borderRadius: BorderRadius.circular(12),
            boxShadow: const [
              BoxShadow(
                color: Color(0x140F172A),
                blurRadius: 14,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Icon(
            icon,
            color: Colors.white,
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: titleColor,
          ),
        ),
      ],
    );
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.icon,
    required this.onTap,
  });

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}

class HealthcareServiceCard extends StatelessWidget {
  const HealthcareServiceCard({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
    required this.cardGradient,
    required this.iconGradient,
    required this.onTap,
  });

  final String title;
  final String description;
  final IconData icon;
  final List<Color> cardGradient;
  final List<Color> iconGradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _BaseServiceTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: cardGradient,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
              color: Color(0x140F172A),
              blurRadius: 28,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 58,
              width: 58,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: iconGradient,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x22000000),
                    blurRadius: 14,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Icon(
                icon,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF14213D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 13.5,
                      height: 1.45,
                      color: Color(0xFF5F6F89),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class NearbyServiceCard extends StatelessWidget {
  const NearbyServiceCard({
    super.key,
    required this.title,
    required this.description,
    required this.detail,
    required this.icon,
    required this.iconGradient,
    required this.onTap,
  });

  final String title;
  final String description;
  final String detail;
  final IconData icon;
  final List<Color> iconGradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _BaseServiceTap(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: const Color(0xFFD9E7FF),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x120F172A),
              blurRadius: 24,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 54,
              width: 54,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: iconGradient,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                icon,
                color: Colors.white,
                size: 27,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF14213D),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 13.5,
                      height: 1.45,
                      color: Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    detail,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF2374E1),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class EmergencyCard extends StatelessWidget {
  const EmergencyCard({
    super.key,
    required this.onTap,
  });

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _BaseServiceTap(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFFF6B6B),
              Color(0xFFF04452),
              Color(0xFFD62839),
            ],
          ),
          borderRadius: BorderRadius.circular(28),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33D62839),
              blurRadius: 28,
              offset: Offset(0, 14),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              top: -18,
              right: -16,
              child: Container(
                height: 92,
                width: 92,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Positioned(
              bottom: -26,
              left: -24,
              child: Container(
                height: 84,
                width: 84,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            Row(
              children: [
                Container(
                  height: 72,
                  width: 72,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: Colors.white.withOpacity(0.22),
                    ),
                  ),
                  child: const Icon(
                    Icons.emergency_rounded,
                    size: 36,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 18),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Emergency Assistance',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Get immediate help - 24/7 available',
                        style: TextStyle(
                          fontSize: 14,
                          height: 1.45,
                          color: Color(0xFFFFE5E7),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BaseServiceTap extends StatelessWidget {
  const _BaseServiceTap({
    required this.child,
    required this.onTap,
  });

  final Widget child;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: child,
      ),
    );
  }
}
