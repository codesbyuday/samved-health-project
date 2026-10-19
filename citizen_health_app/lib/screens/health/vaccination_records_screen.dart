import 'package:flutter/material.dart';

import '../../models/vaccination_record_model.dart';
import '../../services/citizen_service.dart';

class VaccinationRecordsScreen extends StatefulWidget {
  const VaccinationRecordsScreen({super.key});

  @override
  State<VaccinationRecordsScreen> createState() =>
      _VaccinationRecordsScreenState();
}

class _VaccinationRecordsScreenState extends State<VaccinationRecordsScreen> {
  VaccinationItem? selectedVaccination;

  Future<List<VaccinationItem>> getVaccinations() async {
    try {
      final records = await CitizenService.getVaccinationRecords();
      final mapped = records.map<VaccinationItem>((v) {
        return VaccinationItem(
          id: v.recordId,
          vaccineName: v.vaccineType,
          doseNumber: VaccinationItem._doseLabel(v.doseNumber),
          dateAdministered: v.dateAdministered ?? '',
          hospitalName: v.hospitalName,
        );
      }).toList();

      return mapped;
    } catch (_) {
      return const [];
    }
  }

  String _formatDate(dynamic rawDate) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: FutureBuilder<List<VaccinationItem>>(
        future: getVaccinations(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final vaccines = snapshot.data ?? const <VaccinationItem>[];

          if (selectedVaccination != null) {
            return _VaccinationDetailsView(
              vaccination: selectedVaccination!,
              onBack: () {
                setState(() {
                  selectedVaccination = null;
                });
              },
            );
          }

          return Container(
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
                  const _VaccinationHeader(
                    title: 'Vaccination Records',
                    subtitle: 'Track your immunizations',
                    icon: Icons.vaccines_outlined,
                  ),
                  Expanded(
                    child: vaccines.isEmpty
                        ? const Center(
                            child: Text(
                              'No vaccination records found',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                            itemCount: vaccines.length,
                            itemBuilder: (context, index) {
                              final vaccination = vaccines[index];
                              final formatted = vaccination.copyWith(
                                dateAdministered: _formatDate(
                                  vaccination.dateAdministered,
                                ),
                              );

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: _VaccinationCard(
                                  vaccination: formatted,
                                  onTap: () {
                                    setState(() {
                                      selectedVaccination = formatted;
                                    });
                                  },
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _VaccinationDetailsView extends StatelessWidget {
  const _VaccinationDetailsView({
    required this.vaccination,
    required this.onBack,
  });

  final VaccinationItem vaccination;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
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
            _VaccinationHeader(
              title: 'Vaccination Details',
              subtitle: 'Complete immunization information',
              icon: Icons.vaccines_outlined,
              onBack: onBack,
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                children: [
                  _VaccinationSectionCard(
                    title: 'Vaccine Information',
                    icon: Icons.vaccines_outlined,
                    iconBackground: const Color(0xFFF0FDF4),
                    iconColor: const Color(0xFF16A34A),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _VaccinationInfoRow(
                          label: 'Vaccine Name',
                          value: vaccination.vaccineName,
                          emphasize: true,
                        ),
                        const Text(
                          'Dose Number',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Text(
                            vaccination.doseNumber,
                            style: const TextStyle(
                              color: Color(0xFF16A34A),
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _VaccinationSectionCard(
                    title: 'Date & Hospital',
                    icon: Icons.calendar_month_outlined,
                    iconBackground: const Color(0xFFEFF6FF),
                    iconColor: const Color(0xFF2563EB),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _VaccinationInfoRow(
                          label: 'Date Administered',
                          value: vaccination.dateAdministered,
                          leadingIcon: Icons.calendar_today_outlined,
                          emphasize: true,
                        ),
                        _VaccinationInfoRow(
                          label: 'Hospital Name',
                          value: vaccination.hospitalName,
                          leadingIcon: Icons.local_hospital_outlined,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _VaccinationSectionCard(
                    title: 'Status',
                    icon: Icons.check_circle_outline_rounded,
                    iconBackground: const Color(0xFFF0FDF4),
                    iconColor: const Color(0xFF16A34A),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Icon(
                            Icons.check_circle_outline_rounded,
                            color: Color(0xFF16A34A),
                            size: 28,
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Completed',
                                  style: TextStyle(
                                    color: Color(0xFF15803D),
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(height: 6),
                                Text(
                                  'This vaccination has been successfully administered',
                                  style: TextStyle(
                                    color: Color(0xFF15803D),
                                    fontSize: 15,
                                    height: 1.55,
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
                  const SizedBox(height: 16),
                  _VaccinationSectionCard(
                    title: 'Vaccination Certificate',
                    icon: Icons.verified_outlined,
                    iconBackground: const Color(0xFFFAF5FF),
                    iconColor: const Color(0xFF9333EA),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3B82F6),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        icon: const Icon(
                          Icons.download_done_outlined,
                          size: 18,
                        ),
                        label: const Text(
                          'Download Certificate',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
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

class _VaccinationCard extends StatelessWidget {
  const _VaccinationCard({
    required this.vaccination,
    required this.onTap,
  });

  final VaccinationItem vaccination;
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
          child: Row(
            children: [
              Container(
                width: 6,
                height: 138,
                decoration: const BoxDecoration(
                  color: Color(0xFF22C55E),
                  borderRadius: BorderRadius.horizontal(
                    left: Radius.circular(24),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.vaccines_outlined,
                          color: Color(0xFF16A34A),
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              vaccination.vaccineName,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              vaccination.hospitalName,
                              style: const TextStyle(
                                color: Color(0xFF475569),
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 12,
                              runSpacing: 10,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF0FDF4),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Text(
                                    vaccination.doseNumber,
                                    style: const TextStyle(
                                      color: Color(0xFF16A34A),
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.calendar_today_outlined,
                                      color: Color(0xFF64748B),
                                      size: 16,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      vaccination.dateAdministered,
                                      style: const TextStyle(
                                        color: Color(0xFF64748B),
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Padding(
                        padding: EdgeInsets.only(top: 28),
                        child: Icon(
                          Icons.chevron_right_rounded,
                          color: Color(0xFF9CA3AF),
                          size: 26,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class VaccinationItem {
  const VaccinationItem({
    required this.id,
    required this.vaccineName,
    required this.doseNumber,
    required this.dateAdministered,
    required this.hospitalName,
  });

  final String id;
  final String vaccineName;
  final String doseNumber;
  final String dateAdministered;
  final String hospitalName;

  factory VaccinationItem.fromDb(Map<String, dynamic> vaccine) {
    final doseNumber = (vaccine['dose_number'] as num?)?.toInt();
    return VaccinationItem(
      id: (vaccine['record_id'] ?? '').toString(),
      vaccineName: (vaccine['vaccine_type'] ?? 'Vaccine').toString(),
      doseNumber: _doseLabel(doseNumber),
      dateAdministered: (vaccine['date_administered'] ?? '').toString(),
      hospitalName: (vaccine['hospitals']?['name'] ?? 'Hospital').toString(),
    );
  }

  VaccinationItem copyWith({
    String? dateAdministered,
  }) {
    return VaccinationItem(
      id: id,
      vaccineName: vaccineName,
      doseNumber: doseNumber,
      dateAdministered: dateAdministered ?? this.dateAdministered,
      hospitalName: hospitalName,
    );
  }

  static String _doseLabel(int? doseNumber) {
    switch (doseNumber) {
      case 1:
        return 'Dose 1';
      case 2:
        return 'Dose 2';
      case 3:
        return 'Booster';
      default:
        return 'Dose';
    }
  }
}

class _VaccinationHeader extends StatelessWidget {
  const _VaccinationHeader({
    required this.title,
    required this.subtitle,
    required this.icon,
    this.onBack,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
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
                onPressed: onBack ?? () => Navigator.pop(context),
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
                child: Icon(
                  icon,
                  color: Colors.white,
                  size: 28,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              color: Color(0xE6FFFFFF),
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _VaccinationSectionCard extends StatelessWidget {
  const _VaccinationSectionCard({
    required this.title,
    required this.icon,
    required this.iconBackground,
    required this.iconColor,
    required this.child,
  });

  final String title;
  final IconData icon;
  final Color iconBackground;
  final Color iconColor;
  final Widget child;

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
          child,
        ],
      ),
    );
  }
}

class _VaccinationInfoRow extends StatelessWidget {
  const _VaccinationInfoRow({
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

const List<VaccinationItem> _fallbackVaccinations = [
  VaccinationItem(
    id: '1',
    vaccineName: 'COVID-19 Vaccine (Covishield)',
    doseNumber: 'Dose 1',
    dateAdministered: 'January 15, 2026',
    hospitalName: 'City Vaccination Center',
  ),
  VaccinationItem(
    id: '2',
    vaccineName: 'COVID-19 Vaccine (Covishield)',
    doseNumber: 'Dose 2',
    dateAdministered: 'February 20, 2026',
    hospitalName: 'City Vaccination Center',
  ),
  VaccinationItem(
    id: '3',
    vaccineName: 'COVID-19 Vaccine (Covishield)',
    doseNumber: 'Booster',
    dateAdministered: 'August 10, 2025',
    hospitalName: 'Community Health Center',
  ),
];
