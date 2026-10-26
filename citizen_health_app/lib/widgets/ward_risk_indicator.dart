import 'package:flutter/material.dart';
import '../services/citizen_service.dart';
import '../services/surveillance_service.dart';
import '../screens/risk/ward_risk_details_screen.dart';

class WardRiskIndicator extends StatefulWidget {
  final int? wardNumber;
  const WardRiskIndicator({super.key, this.wardNumber});

  @override
  State<WardRiskIndicator> createState() => _WardRiskIndicatorState();
}

class _WardRiskIndicatorState extends State<WardRiskIndicator> {
  Future<Map<String, dynamic>?> getWardRisk() async {
    try {
      int? ward = widget.wardNumber;
      if (ward == null) {
        final citizen = await CitizenService.getCurrentProfile();
        ward = citizen?.wardNumber;
      }
      if (ward == null) {
        return {
          "ward": null,
          "risk": "Not Available",
        };
      }

      final wardRisks = await SurveillanceService.getWardRisks();
      String riskLevel = "Low";
      for (final w in wardRisks) {
        if (w.wardNumber == ward) {
          riskLevel = w.riskLevel;
          break;
        }
      }

      return {
        "ward": ward,
        "risk": riskLevel,
      };
    } catch (_) {
      return {
        "ward": widget.wardNumber,
        "risk": "Not Available",
      };
    }
  }

  Color riskColor(String risk) {
    switch (risk.toLowerCase()) {
      case "high":
        return Colors.red;
      case "moderate":
      case "medium":
        return Colors.orange;
      case "low":
        return Colors.green;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: getWardRisk(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 24,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: const Center(child: CircularProgressIndicator()),
          );
        }

        final data = snapshot.data!;
        final ward = data["ward"];
        final risk = data["risk"].toString();
        final int? parsedWardNumber = ward is int ? ward : int.tryParse(ward?.toString() ?? '');

        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => WardRiskDetailsScreen(wardNumber: parsedWardNumber),
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x14000000),
                  blurRadius: 24,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Your Ward Status",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.blueGrey.shade600,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        ward != null ? "Ward $ward" : "Ward Unassigned",
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF12284C),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: riskColor(risk).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          "Risk: $risk",
                          style: TextStyle(
                            color: riskColor(risk),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Container(
                  height: 64,
                  width: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF4FF),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Icon(
                    Icons.local_hospital_rounded,
                    color: riskColor(risk),
                    size: 32,
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
