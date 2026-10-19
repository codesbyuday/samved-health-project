import 'package:flutter/material.dart';
import '../../services/citizen_service.dart';
import '../../services/surveillance_service.dart';
import '../risk_map/solapur_risk_map_screen.dart';

class WardRiskDetailsScreen extends StatefulWidget {
  final int? wardNumber;
  const WardRiskDetailsScreen({super.key, this.wardNumber});

  @override
  State<WardRiskDetailsScreen> createState() => _WardRiskDetailsScreenState();
}

class _WardRiskDetailsScreenState extends State<WardRiskDetailsScreen> {
  Future<Map<String, dynamic>?> getWardRisk() async {
    try {
      int? wardNumber = widget.wardNumber;
      if (wardNumber == null) {
        final citizen = await CitizenService.getCurrentProfile();
        wardNumber = citizen?.wardNumber;
      }
      if (wardNumber == null) return null;

      final wardRisks = await SurveillanceService.getWardRisks();
      for (final w in wardRisks) {
        if (w.wardNumber == wardNumber) {
          final riskScore = w.zoneRiskScore ?? (w.healthIndex != null ? (100.0 - w.healthIndex!) : 0.0);
          return {
            'ward': wardNumber,
            'ward_name': w.wardName,
            'risk_level': w.riskLevel,
            'risk_score': riskScore,
            'health_index': w.healthIndex != null ? w.healthIndex!.toStringAsFixed(1) : '-',
            'updated_at': null,
            'active_cases': w.activeCases ?? 0,
            'available_beds': w.totalBeds ?? 0,
            'cases_this_week': w.activeCases ?? 0,
            'vaccination_percent': 0.0,
            'major_diseases': const <String>[],
            'preventive_measures': const <String>[],
          };
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Color getRiskColor(String risk) {
    switch (risk.toLowerCase()) {
      case "high":
        return const Color(0xFFE11D48);
      case "moderate":
      case "medium":
        return const Color(0xFFF97316);
      case "low":
        return const Color(0xFF16A34A);
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: FutureBuilder<Map<String, dynamic>?>(
        future: getWardRisk(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData) {
            return const Center(child: Text("No ward risk data found"));
          }

          final data = snapshot.data!;
          final riskColor = getRiskColor(data['risk_level'].toString());

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 54, 20, 56),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF1D4ED8),
                        Color(0xFF2563EB),
                        Color(0xFF38BDF8),
                      ],
                    ),
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(30),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x1A1D4ED8),
                        blurRadius: 24,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Ward Risk Details',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        data['ward_name'].toString(),
                        style: const TextStyle(
                          color: Color(0xD9FFFFFF),
                          fontSize: 15,
                        ),
                      ),
                    ],
                  ),
                ),
                Transform.translate(
                  offset: const Offset(0, -28),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x140F172A),
                                blurRadius: 22,
                                offset: Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Container(
                                    height: 68,
                                    width: 68,
                                    decoration: BoxDecoration(
                                      color: riskColor.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Icon(
                                      Icons.warning_amber_rounded,
                                      color: riskColor,
                                      size: 38,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Ward ${data['ward']}',
                                          style: const TextStyle(
                                            fontSize: 22,
                                            fontWeight: FontWeight.w800,
                                            color: Color(0xFF0F172A),
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          'Status: ${data['risk_level']}',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w700,
                                            color: riskColor,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: riskColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: Text(
                                      'Score ${data['risk_score'].toStringAsFixed(1)}',
                                      style: TextStyle(
                                        color: riskColor,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 18),
                              Row(
                                children: [
                                  Expanded(
                                    child: _StatCard(
                                      label: 'Active Cases',
                                      value: data['active_cases'].toString(),
                                      color: const Color(0xFFE11D48),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _StatCard(
                                      label: 'Available Beds',
                                      value: data['available_beds'].toString(),
                                      color: const Color(0xFF2563EB),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _StatCard(
                                      label: 'Cases This Week',
                                      value: data['cases_this_week'].toString(),
                                      color: const Color(0xFFF97316),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _StatCard(
                                      label: 'Vaccination %',
                                      value: '${data['vaccination_percent'].toStringAsFixed(0)}%',
                                      color: const Color(0xFF16A34A),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 18),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const SolapurRiskMapScreen(),
                                      ),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF1D4ED8),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                  ),
                                  icon: const Icon(Icons.map_outlined),
                                  label: const Text('View Solapur Risk Map'),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        if ((data['major_diseases'] as List).isNotEmpty) ...[
                          _InfoSection(
                            title: 'Major Diseases',
                            children: data['major_diseases']
                                .map<Widget>((item) => _BulletLine(text: item.toString()))
                                .toList(),
                          ),
                          const SizedBox(height: 18),
                        ],
                        _InfoSection(
                          title: 'Additional Details',
                          children: [
                            _KeyValueLine(
                              label: 'Health Index',
                              value: data['health_index'].toString(),
                            ),
                            _KeyValueLine(
                              label: 'Last Updated',
                              value: data['updated_at']?.toString().split('T').first ?? '-',
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: color.withOpacity(0.85),
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoSection extends StatelessWidget {
  const _InfoSection({
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x120F172A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

class _BulletLine extends StatelessWidget {
  const _BulletLine({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 7),
            child: Icon(Icons.circle, size: 8, color: Color(0xFF2563EB)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                height: 1.5,
                color: Color(0xFF475467),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _KeyValueLine extends StatelessWidget {
  const _KeyValueLine({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF667085),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }
}
