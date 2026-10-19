import 'package:flutter/material.dart';
import '../services/citizen_service.dart';
import '../services/surveillance_service.dart';
import '../screens/alerts/alert_details_screen.dart';

class HealthAlertBanner extends StatefulWidget {
  final int? wardNumber;
  const HealthAlertBanner({super.key, this.wardNumber});

  @override
  State<HealthAlertBanner> createState() => _HealthAlertBannerState();
}

class _HealthAlertBannerState extends State<HealthAlertBanner> {
  Future<Map<String, dynamic>?> _fetchAlert() async {
    try {
      int? ward = widget.wardNumber;
      if (ward == null) {
        final citizen = await CitizenService.getCurrentProfile();
        ward = citizen?.wardNumber;
      }

      final alerts = await SurveillanceService.getAlerts();
      if (alerts.isEmpty) return null;

      // Find matching alert for ward or top severity alert
      final alert = alerts.firstWhere(
        (a) => ward != null && a.wardNumber == ward,
        orElse: () => alerts.first,
      );

      return {
        'alert_id': alert.alertId,
        'title': alert.title,
        'description': alert.description,
        'severity': alert.severity,
        'affected_area': alert.wardNumber != null ? 'Ward ${alert.wardNumber}' : 'Solapur Municipal Area',
        'issued_at': alert.createdAt,
      };
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: _fetchAlert(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(height: 84, child: Center(child: CircularProgressIndicator()));
        }
        final alert = snapshot.data;
        if (alert == null) return const SizedBox.shrink();

        return GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => AlertDetailsScreen(alert: alert)),
          ),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFFFA726), Color(0xFFFB8C00)],
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(color: Color(0x1FFF9800), blurRadius: 20, offset: Offset(0, 10)),
              ],
            ),
            child: Row(
              children: [
                Container(
                  height: 52,
                  width: 52,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        alert['title'].toString(),
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        alert['description'].toString(),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, height: 1.35, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
