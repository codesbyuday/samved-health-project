import 'dart:convert';
import 'package:flutter/material.dart';

import '../../models/medical_record_model.dart';

class MedicalRecordDetailScreen extends StatelessWidget {
  const MedicalRecordDetailScreen({
    super.key,
    required this.record,
  });

  final dynamic record;

  String _doctorDisplayName(dynamic rawName) {
    final name = (rawName ?? '').toString().trim();
    if (name.isEmpty || name.toLowerCase() == 'null' || name.toLowerCase() == 'none') {
      return 'Consulting Medical Officer';
    }
    final normalized = name.toLowerCase();
    return normalized.startsWith('dr.') || normalized.startsWith('dr ')
        ? name
        : 'Dr. $name';
  }

  String _formatVisitDate(dynamic rawDate) {
    final value = (rawDate ?? '').toString().trim();
    if (value.isEmpty || value.toLowerCase() == 'null') return 'Recent Visit';
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
    if (prescription == null) return [];

    if (prescription is List) {
      return prescription.map<Map<String, String>>((item) {
        if (item is Map) {
          return {
            'name': (item['name'] ?? item['medicine_name'] ?? 'Medicine').toString(),
            'dosage': (item['dosage'] ?? '').toString(),
            'duration': (item['duration'] ?? '').toString(),
          };
        }
        return {'name': item.toString(), 'dosage': '', 'duration': ''};
      }).toList();
    }

    final raw = prescription.toString().trim();
    if (raw.isEmpty || raw.toLowerCase() == 'none' || raw.toLowerCase() == 'null') {
      return [];
    }

    // Try decoding JSON array if formatted as JSON string
    if ((raw.startsWith('[') && raw.endsWith(']')) || (raw.startsWith('{') && raw.endsWith('}'))) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return _prescriptionItems(decoded);
        }
      } catch (_) {}
    }

    // Split comma, semicolon, or newline separated strings
    final parts = raw.split(RegExp(r'[,;\n]+')).map((s) => s.trim()).where((s) => s.isNotEmpty);
    return parts.map<Map<String, String>>((item) {
      return {
        'name': item,
        'dosage': '',
        'duration': '',
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    // Normalise incoming record from either MedicalRecordModel or Map
    final Map<String, dynamic> data = record is MedicalRecordModel
        ? (record as MedicalRecordModel).toJson()
        : (record is Map ? Map<String, dynamic>.from(record as Map) : <String, dynamic>{});

    final hospital = data['hospitals'] is Map ? data['hospitals'] as Map : null;
    final staff = data['hospital_staff'] is Map ? data['hospital_staff'] as Map : null;

    final String rawHospitalName = (data['hospital_name'] ?? hospital?['name'] ?? '').toString().trim();
    final String hospitalName = (rawHospitalName.isNotEmpty && rawHospitalName.toLowerCase() != 'null')
        ? rawHospitalName
        : 'Solapur Municipal Health Center';

    final String rawHospitalAddress = (data['hospital_address'] ?? hospital?['address'] ?? data['address'] ?? '').toString().trim();
    final String hospitalAddress = (rawHospitalAddress.isNotEmpty && rawHospitalAddress.toLowerCase() != 'null')
        ? rawHospitalAddress
        : 'Solapur, Maharashtra';

    final String hospitalId = (data['hospital_id'] ?? '').toString().trim();

    final String doctorName = _doctorDisplayName(data['doctor_name'] ?? staff?['name']);
    final String rawDept = (data['department'] ?? staff?['department'] ?? '').toString().trim();
    final String department = (rawDept.isNotEmpty && rawDept.toLowerCase() != 'null')
        ? rawDept
        : 'General Medicine';
    final String staffId = (data['staff_id'] ?? '').toString().trim();

    final String visitDate = _formatVisitDate(data['visit_date']);
    final String rawDiagnosis = (data['diagnosis'] ?? '').toString().trim();
    final String diagnosis = (rawDiagnosis.isNotEmpty && rawDiagnosis.toLowerCase() != 'null' && rawDiagnosis.toLowerCase() != 'none')
        ? rawDiagnosis
        : 'General Consultation & Health Evaluation';

    final prescriptionItems = _prescriptionItems(data['prescription']);

    final String rawNotes = (data['notes'] ?? '').toString().trim();
    final bool hasNotes = rawNotes.isNotEmpty &&
        rawNotes.toLowerCase() != 'none' &&
        rawNotes.toLowerCase() != 'null';

    final String recordId = (data['record_id'] ?? '').toString().trim();
    final String citizenId = (data['citizen_id'] ?? '').toString().trim();

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
              // Header
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
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
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.description_outlined,
                            color: Colors.white,
                            size: 26,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Health Record Details',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Complete medical record and visit summary',
                      style: TextStyle(
                        color: Color(0xE6FFFFFF),
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),

              // Detail Cards
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                  children: [
                    // 1. Hospital Information Card
                    _DetailSectionCard(
                      title: 'Hospital Information',
                      icon: Icons.local_hospital_outlined,
                      iconColor: const Color(0xFF2563EB),
                      iconBackground: const Color(0xFFEFF6FF),
                      children: [
                        _InfoBlock(
                          label: 'Hospital Name',
                          value: hospitalName,
                          emphasize: true,
                        ),
                        _InfoBlock(
                          label: 'Address',
                          value: hospitalAddress,
                          leadingIcon: Icons.location_on_outlined,
                        ),
                        if (hospitalId.isNotEmpty)
                          _InfoBlock(
                            label: 'Hospital Code',
                            value: hospitalId,
                            leadingIcon: Icons.badge_outlined,
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // 2. Doctor Information Card
                    _DetailSectionCard(
                      title: 'Doctor Information',
                      icon: Icons.medical_services_outlined,
                      iconColor: const Color(0xFF0891B2),
                      iconBackground: const Color(0xFFECFEFF),
                      children: [
                        _InfoBlock(
                          label: 'Doctor Name',
                          value: doctorName,
                          emphasize: true,
                        ),
                        _InfoBlock(
                          label: 'Department / Specialization',
                          value: department,
                          leadingIcon: Icons.category_outlined,
                        ),
                        if (staffId.isNotEmpty && staffId.length <= 16)
                          _InfoBlock(
                            label: 'Medical Staff ID',
                            value: staffId,
                            leadingIcon: Icons.perm_identity_outlined,
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // 3. Visit Information Card
                    _DetailSectionCard(
                      title: 'Visit Information',
                      icon: Icons.calendar_month_outlined,
                      iconColor: const Color(0xFF9333EA),
                      iconBackground: const Color(0xFFFAF5FF),
                      children: [
                        _InfoBlock(
                          label: 'Date of Visit',
                          value: visitDate,
                          emphasize: true,
                          leadingIcon: Icons.event_outlined,
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Clinical Diagnosis',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAF5FF),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE9D5FF)),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.health_and_safety_outlined,
                                color: Color(0xFF9333EA),
                                size: 22,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  diagnosis,
                                  style: const TextStyle(
                                    color: Color(0xFF1E1B4B),
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (recordId.isNotEmpty) ...[
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              const Icon(
                                Icons.tag_rounded,
                                size: 14,
                                color: Color(0xFF94A3B8),
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'Record ID: $recordId',
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 16),

                    // 4. Prescription Card
                    _DetailSectionCard(
                      title: 'Prescription',
                      icon: Icons.medication_outlined,
                      iconColor: const Color(0xFF16A34A),
                      iconBackground: const Color(0xFFF0FDF4),
                      children: prescriptionItems.isEmpty
                          ? [
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(
                                      Icons.info_outline_rounded,
                                      color: Color(0xFF64748B),
                                      size: 20,
                                    ),
                                    SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        'No specific medicines prescribed for this consultation.',
                                        style: TextStyle(
                                          color: Color(0xFF64748B),
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ]
                          : prescriptionItems.map((med) {
                              final name = med['name'] ?? 'Medication';
                              final dosage = med['dosage'] ?? '';
                              final duration = med['duration'] ?? '';

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDCFCE7),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: const Icon(
                                          Icons.medication_outlined,
                                          color: Color(0xFF16A34A),
                                          size: 18,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              name,
                                              style: const TextStyle(
                                                color: Color(0xFF0F172A),
                                                fontSize: 15,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            if (dosage.isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                'Dosage: $dosage',
                                                style: const TextStyle(
                                                  color: Color(0xFF475569),
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                            if (duration.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                'Duration: $duration',
                                                style: const TextStyle(
                                                  color: Color(0xFF64748B),
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // 5. Doctor's Notes Card
                    _DetailSectionCard(
                      title: "Doctor's Notes & Advice",
                      icon: Icons.notes_outlined,
                      iconColor: const Color(0xFFEA580C),
                      iconBackground: const Color(0xFFFFF7ED),
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: hasNotes ? const Color(0xFFFFF7ED) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: hasNotes ? const Color(0xFFFFEDD5) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                hasNotes ? Icons.rate_review_outlined : Icons.info_outline_rounded,
                                color: hasNotes ? const Color(0xFFEA580C) : const Color(0xFF64748B),
                                size: 20,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  hasNotes
                                      ? rawNotes
                                      : 'No additional clinical notes or lifestyle advice recorded for this visit.',
                                  style: TextStyle(
                                    color: hasNotes ? const Color(0xFF431407) : const Color(0xFF64748B),
                                    fontSize: 14,
                                    height: 1.55,
                                    fontWeight: hasNotes ? FontWeight.w500 : FontWeight.w400,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // 6. Verification Footer Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.verified_outlined,
                              color: Color(0xFF059669),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'SMC Verified Electronic Health Record',
                                  style: TextStyle(
                                    color: Color(0xFF065F46),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  citizenId.isNotEmpty
                                      ? 'Registered to Citizen ID: $citizenId'
                                      : 'Integrated with Municipal Smart Health System',
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
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
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: iconBackground,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
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
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (leadingIcon != null) ...[
                Icon(
                  leadingIcon,
                  size: 15,
                  color: const Color(0xFF64748B),
                ),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              color: const Color(0xFF0F172A),
              fontSize: emphasize ? 16 : 15,
              fontWeight: emphasize ? FontWeight.w700 : FontWeight.w500,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
