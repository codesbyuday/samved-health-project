import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/supabase_config.dart';
import '../../services/auth_service.dart';
import '../../services/citizen_service.dart';
import 'health_card_screen.dart';
import 'medical_history_screen.dart';
import 'lab_reports_screen.dart';
import 'vaccination_records_screen.dart';

class HealthScreen extends StatelessWidget {
  const HealthScreen({super.key});

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
              Color(0xFFEEF5FF),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'My Health',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF12284C),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Access your complete health records',
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.4,
                    color: Color(0xFF6E7B91),
                  ),
                ),
                const SizedBox(height: 24),
                FutureBuilder<(String, String)>(
                  future: _getCitizenDetails(),
                  builder: (context, snapshot) {
                    final userName = snapshot.data?.$1 ?? 'User';
                    final citizenId = snapshot.data?.$2 ?? 'SMC-2026-000132';

                    return HealthCardPreview(
                      userName: userName,
                      citizenId: citizenId,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const HealthCardScreen(),
                          ),
                        );
                      },
                      onQrTap: () {
                        _showAnimatedQrDialog(
                          context,
                          userName: userName,
                          citizenId: citizenId,
                        );
                      },
                    );
                  },
                ),
                const SizedBox(height: 28),
                const _HealthSectionHeader(),
                const SizedBox(height: 16),
                HealthRecordCard(
                  title: 'Medical History',
                  subtitle: 'View past diagnoses and visits',
                  icon: Icons.history_rounded,
                  accentGradient: const [
                    Color(0xFFA855F7),
                    Color(0xFF4F46E5),
                  ],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const MedicalHistoryScreen(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),
                HealthRecordCard(
                  title: 'Lab Reports',
                  subtitle: 'Check test results and reports',
                  icon: Icons.description_outlined,
                  accentGradient: const [
                    Color(0xFF0EA5E9),
                    Color(0xFF0284C7),
                  ],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LabReportsScreen(),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 14),
                HealthRecordCard(
                  title: 'Vaccination Records',
                  subtitle: 'Track your immunizations',
                  icon: Icons.vaccines_rounded,
                  accentGradient: const [
                    Color(0xFF6366F1),
                    Color(0xFFA21CAF),
                  ],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            const VaccinationRecordsScreen(),
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

  Future<(String, String)> _getCitizenDetails() async {
    try {
      final citizen = await CitizenService.getCurrentProfile();
      if (citizen != null) {
        final name = citizen.name.trim().isNotEmpty ? citizen.name.trim() : 'User';
        final id = citizen.citizenId.trim().isNotEmpty ? citizen.citizenId.trim() : '';
        if (id.isNotEmpty) return (name, id);
      }
    } catch (e) {
      debugPrint("HealthScreen _getCitizenDetails error: $e");
    }

    try {
      final cachedId = await AuthService.getCurrentCitizenId();
      if (cachedId != null && cachedId.trim().isNotEmpty) {
        final citizen = await CitizenService.getCitizenById(cachedId.trim());
        if (citizen != null) {
          final name = citizen.name.trim().isNotEmpty ? citizen.name.trim() : 'User';
          return (name, citizen.citizenId.trim());
        }
        return ('User', cachedId.trim());
      }
    } catch (_) {}

    return ('User', 'SMC-2026-000132');
  }

  void _showAnimatedQrDialog(
    BuildContext context, {
    required String userName,
    required String citizenId,
  }) {
    final qrUrl = 'https://samved-health-project.vercel.app/citizen/$citizenId/';

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Citizen QR Code',
      barrierColor: Colors.black.withOpacity(0.6),
      transitionDuration: const Duration(milliseconds: 320),
      pageBuilder: (ctx, anim1, anim2) => const SizedBox.shrink(),
      transitionBuilder: (ctx, anim1, anim2, child) {
        final curveValue = Curves.easeOutBack.transform(anim1.value);
        return Transform.scale(
          scale: curveValue,
          child: Opacity(
            opacity: anim1.value,
            child: Dialog(
              backgroundColor: Colors.transparent,
              insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x33000000),
                      blurRadius: 30,
                      offset: Offset(0, 12),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(28),
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.fromLTRB(20, 16, 12, 16),
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Color(0xFF1565C0),
                                Color(0xFF2563EB),
                                Color(0xFF0284C7),
                              ],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.qr_code_2_rounded,
                                  color: Colors.white,
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Citizen Digital QR',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 2),
                                    Text(
                                      'Scan for Verified Health Records',
                                      style: TextStyle(
                                        color: Color(0xD9FFFFFF),
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                onPressed: () => Navigator.of(ctx).pop(),
                                icon: const Icon(Icons.close_rounded, color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(22),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor: const Color(0xFF1565C0).withOpacity(0.12),
                                      child: const Icon(
                                        Icons.person_rounded,
                                        color: Color(0xFF1565C0),
                                        size: 20,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            userName,
                                            style: const TextStyle(
                                              color: Color(0xFF0F172A),
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Health ID: $citizenId',
                                            style: const TextStyle(
                                              color: Color(0xFF2563EB),
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 18),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                                  boxShadow: const [
                                    BoxShadow(
                                      color: Color(0x10000000),
                                      blurRadius: 16,
                                      offset: Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: QrImageView(
                                  data: qrUrl,
                                  version: QrVersions.auto,
                                  size: 200,
                                  padding: EdgeInsets.zero,
                                  gapless: true,
                                  errorCorrectionLevel: QrErrorCorrectLevel.M,
                                ),
                              ),
                              const SizedBox(height: 14),
                              const Text(
                                'Scan with camera to view records online',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Text(
                                  qrUrl,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Color(0xFF0284C7),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 18),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.of(ctx).pop();
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const HealthCardScreen(),
                                      ),
                                    );
                                  },
                                  icon: const Icon(Icons.credit_card_rounded, size: 18),
                                  label: const Text('View Full Health Card'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF1565C0),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    elevation: 0,
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
              ),
            ),
          ),
        );
      },
    );
  }
}

class HealthCardPreview extends StatelessWidget {
  const HealthCardPreview({
    super.key,
    required this.onTap,
    required this.userName,
    required this.citizenId,
    this.onQrTap,
  });

  final VoidCallback onTap;
  final VoidCallback? onQrTap;
  final String userName;
  final String citizenId;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            boxShadow: const [
              BoxShadow(
                color: Color(0x220F172A),
                blurRadius: 30,
                offset: Offset(0, 14),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF6675F5),
                    Color(0xFF2F6CF6),
                    Color(0xFF26B7E6),
                  ],
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: -28,
                    right: -20,
                    child: Container(
                      height: 120,
                      width: 120,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.10),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -38,
                    left: -26,
                    child: Container(
                      height: 96,
                      width: 96,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.10),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                    ),
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'DIGITAL HEALTH ID',
                                    style: TextStyle(
                                      color: Color(0xD9FFFFFF),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    'My Health Card',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: onQrTap ?? onTap,
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.18),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Icon(
                                    Icons.qr_code_2_rounded,
                                    color: Colors.white,
                                    size: 28,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 28),
                        const Text(
                          'Name',
                          style: TextStyle(
                            color: Color(0xCCFFFFFF),
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          userName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 18),
                        const Text(
                          'Health ID',
                          style: TextStyle(
                            color: Color(0xCCFFFFFF),
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          citizenId.isNotEmpty ? citizenId : 'SMC-2026-000132',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Container(
                          height: 1,
                          color: Colors.white.withOpacity(0.20),
                        ),
                        const SizedBox(height: 18),
                        const Text(
                          'Tap to view full digital health card',
                          style: TextStyle(
                            color: Color(0xE6FFFFFF),
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _HealthSectionHeader extends StatelessWidget {
  const _HealthSectionHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 40,
          width: 40,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF4F46E5),
                Color(0xFF2563EB),
              ],
            ),
            borderRadius: BorderRadius.all(Radius.circular(12)),
            boxShadow: [
              BoxShadow(
                color: Color(0x224F46E5),
                blurRadius: 14,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: const Icon(
            Icons.description_outlined,
            color: Colors.white,
            size: 22,
          ),
        ),
        const SizedBox(width: 12),
        const Text(
          'Health Records',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: Color(0xFF2E36B5),
          ),
        ),
      ],
    );
  }
}

class HealthRecordCard extends StatelessWidget {
  const HealthRecordCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.accentGradient,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> accentGradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.78),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: Colors.white.withOpacity(0.75),
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x140F172A),
                blurRadius: 24,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                left: 0,
                top: 30,
                bottom: 30,
                child: Container(
                  width: 4,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: accentGradient,
                    ),
                    borderRadius: const BorderRadius.horizontal(
                      right: Radius.circular(8),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 20,
                ),
                child: Row(
                  children: [
                    Container(
                      height: 72,
                      width: 72,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: accentGradient,
                        ),
                        borderRadius: BorderRadius.circular(20),
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
                        size: 30,
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
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1A2438),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            subtitle,
                            style: const TextStyle(
                              fontSize: 14,
                              height: 1.45,
                              color: Color(0xFF7B8598),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: Color(0xFFB0B8C8),
                      size: 28,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
