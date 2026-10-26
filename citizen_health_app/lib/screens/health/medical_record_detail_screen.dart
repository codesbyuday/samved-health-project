import 'package:flutter/material.dart';

class MedicalRecordDetailScreen extends StatelessWidget {
  const MedicalRecordDetailScreen({
    super.key,
    required this.record,
  });

  final Map record;

  String _doctorDisplayName(dynamic rawName) {
    final name = (rawName ?? '').toString().trim();
    if (name.isEmpty) return '';
    final normalized = name.toLowerCase();
    return normalized.startsWith('dr.') || normalized.startsWith('dr ')
        ? name
        : 'Dr. $name';
  }

  String _formatVisitDate(dynamic rawDate) {
    final value = (rawDate ?? '').toString().trim();
    if (value.isEmpty) return '';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;

    const months = [
      '',
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return '${months[parsed.month]} ${parsed.day}, ${parsed.year}';
  }

  List<Map<String, String>> _prescriptionItems(dynamic prescription) {
    if (prescription is List) {
      return prescription.map<Map<String, String>>((item) {
        final map = item as Map;
        return {
          'name': (map['name'] ?? 'Medicine').toString(),
          'dosage': (map['dosage'] ?? '').toString(),
          'duration': (map['duration'] ?? '').toString(),
        };
      }).toList();
    }

    return [];
  }

  @override
  Widget build(BuildContext context) {
    final hospital = record['hospitals'];
    final doctor = record['hospital_staff'];
    final prescriptionItems = _prescriptionItems(record['prescription']);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFFFFFFF),
              Color(0xFFF1F7FF),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 44),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFF3B82F6),
                      Color(0xFF06B6D4),
                    ],
                  ),
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(30),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x223B82F6),
                      blurRadius: 24,
                      offset: Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(
                            Icons.chevron_left_rounded,
                            color: Colors.white,
                            size: 34,
                          ),
                          splashRadius: 24,
                        ),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.16),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: const Icon(
                            Icons.description_outlined,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      'Health Record Details',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Complete medical record information',
                      style: TextStyle(
                        color: Color(0xE6FFFFFF),
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                  children: [
                    _DetailSectionCard(
                      title: 'Hospital Information',
                      icon: Icons.local_hospital_outlined,
                      iconColor: const Color(0xFF2563EB),
                      iconBackground: const Color(0xFFEFF6FF),
                      children: [
                        _InfoBlock(
                          label: 'Hospital Name',
                          value: (hospital?['name'] ?? '').toString(),
                          emphasize: true,
                        ),
                        _InfoBlock(
                          label: 'Address',
                          value: (hospital?['address'] ?? '').toString(),
                          leadingIcon: Icons.location_on_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _DetailSectionCard(
                      title: 'Doctor Information',
                      icon: Icons.medical_services_outlined,
                      iconColor: const Color(0xFF0891B2),
                      iconBackground: const Color(0xFFECFEFF),
                      children: [
                        _InfoBlock(
                          label: 'Doctor Name',
                          value: _doctorDisplayName(doctor?['name']),
                          emphasize: true,
                        ),
                        _InfoBlock(
                          label: 'Department / Specialization',
                          value: (doctor?['department'] ?? '').toString(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _DetailSectionCard(
                      title: 'Visit Information',
                      icon: Icons.calendar_month_outlined,
                      iconColor: const Color(0xFF9333EA),
                      iconBackground: const Color(0xFFFAF5FF),
                      children: [
                        _InfoBlock(
                          label: 'Date of Visit',
                          value: _formatVisitDate(record['visit_date']),
                          emphasize: true,
                        ),
                        _InfoBlock(
                          label: 'Diagnosis',
                          value: (record['diagnosis'] ?? '').toString(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _DetailSectionCard(
                      title: 'Prescription',
                      icon: Icons.medication_outlined,
                      iconColor: const Color(0xFF16A34A),
                      iconBackground: const Color(0xFFF0FDF4),
                      children: prescriptionItems.isEmpty
                          ? [
                              Text(
                                (record['prescription'] ??
                                        'No prescription available')
                                    .toString(),
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ]
                          : prescriptionItems
                              .map(
                                (medicine) => Padding(
                                  padding:
                                      const EdgeInsets.only(bottom: 12),
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FAFC),
                                      borderRadius:
                                          BorderRadius.circular(18),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          medicine['name'] ?? '',
                                          style: const TextStyle(
                                            color: Color(0xFF0F172A),
                                            fontSize: 16,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        if ((medicine['dosage'] ?? '')
                                            .isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            'Dosage: ${medicine['dosage']}',
                                            style: const TextStyle(
                                              color: Color(0xFF475569),
                                              fontSize: 15,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                        if ((medicine['duration'] ?? '')
                                            .isNotEmpty) ...[
                                          const SizedBox(height: 6),
                                          Text(
                                            'Duration: ${medicine['duration']}',
                                            style: const TextStyle(
                                              color: Color(0xFF64748B),
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                ),
                              )
                              .toList(),
                    ),
                    const SizedBox(height: 16),
                    _DetailSectionCard(
                      title: "Doctor's Notes",
                      icon: Icons.description_outlined,
                      iconColor: const Color(0xFFEA580C),
                      iconBackground: const Color(0xFFFFF7ED),
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF7ED),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Text(
                            (record['notes'] ?? 'No notes available')
                                .toString(),
                            style: const TextStyle(
                              color: Color(0xFF475569),
                              fontSize: 15,
                              height: 1.65,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
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

class _DetailSectionCard extends StatelessWidget {
  const _DetailSectionCard({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
    required this.children,
  });

  final String title;
  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: iconBackground,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 26,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          ...children,
        ],
      ),
    );
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({
    required this.label,
    required this.value,
    this.leadingIcon,
    this.emphasize = false,
  });

  final String label;
  final String value;
  final IconData? leadingIcon;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    if (value.trim().isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (leadingIcon != null) ...[
                Icon(
                  leadingIcon,
                  size: 16,
                  color: const Color(0xFF64748B),
                ),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              color: const Color(0xFF0F172A),
              fontSize: emphasize ? 17 : 16,
              fontWeight: emphasize ? FontWeight.w700 : FontWeight.w500,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}
