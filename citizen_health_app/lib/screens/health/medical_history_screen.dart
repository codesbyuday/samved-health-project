import 'package:flutter/material.dart';

import '../../models/medical_record_model.dart';
import '../../services/citizen_service.dart';
import 'medical_record_detail_screen.dart';

class MedicalHistoryScreen extends StatefulWidget {
  const MedicalHistoryScreen({super.key});

  @override
  State<MedicalHistoryScreen> createState() => _MedicalHistoryScreenState();
}

class _MedicalHistoryScreenState extends State<MedicalHistoryScreen> {
  late Future<List<MedicalRecordModel>> _historyFuture;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  void _loadHistory() {
    _historyFuture = CitizenService.getHealthRecords();
  }

  Future<void> _refreshHistory() async {
    setState(() {
      _loadHistory();
    });
  }

  String _doctorDisplayName(dynamic rawName) {
    final name = (rawName ?? 'Doctor').toString().trim();
    if (name.isEmpty || name.toLowerCase() == 'null' || name.toLowerCase() == 'none') {
      return 'Doctor';
    }
    final normalized = name.toLowerCase();
    return normalized.startsWith('dr.') || normalized.startsWith('dr ')
        ? name
        : 'Dr. $name';
  }

  String _formatVisitDate(dynamic rawDate) {
    final value = (rawDate ?? '').toString().trim();
    if (value.isEmpty || value.toLowerCase() == 'null') return '';
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
      body: FutureBuilder<List<MedicalRecordModel>>(
        future: _historyFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final records = snapshot.data ?? const <MedicalRecordModel>[];

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
                                Icons.favorite_border_rounded,
                                color: Colors.white,
                                size: 28,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        const Text(
                          'Medical History',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'View your past diagnoses and visits',
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
                    child: RefreshIndicator(
                      onRefresh: _refreshHistory,
                      child: records.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              children: [
                                SizedBox(
                                  height: MediaQuery.of(context).size.height * 0.5,
                                  child: Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.assignment_outlined,
                                          size: 56,
                                          color: Colors.grey.shade400,
                                        ),
                                        const SizedBox(height: 12),
                                        const Text(
                                          'No medical history found',
                                          style: TextStyle(
                                            color: Color(0xFF64748B),
                                            fontSize: 16,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          'Pull down to refresh',
                                          style: TextStyle(
                                            color: Colors.grey.shade400,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : ListView.builder(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                              itemCount: records.length,
                              itemBuilder: (context, index) {
                                final record = records[index];
                                final hasRx = record.prescription != null &&
                                    record.prescription!.trim().isNotEmpty &&
                                    record.prescription!.trim().toLowerCase() != 'none' &&
                                    record.prescription!.trim().toLowerCase() != 'null';

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: _MedicalHistoryCard(
                                    hospitalName: record.hospitalName,
                                    doctorName: _doctorDisplayName(record.doctorName),
                                    department: record.department ?? 'General Medicine',
                                    visitDate: _formatVisitDate(record.visitDate),
                                    diagnosis: (record.diagnosis != null && record.diagnosis!.trim().isNotEmpty)
                                        ? record.diagnosis!
                                        : 'Clinical Consultation',
                                    hasPrescription: hasRx,
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => MedicalRecordDetailScreen(
                                            record: record,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                );
                              },
                            ),
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

class _MedicalHistoryCard extends StatelessWidget {
  const _MedicalHistoryCard({
    required this.hospitalName,
    required this.doctorName,
    required this.department,
    required this.visitDate,
    required this.diagnosis,
    this.hasPrescription = false,
    required this.onTap,
  });

  final String hospitalName;
  final String doctorName;
  final String department;
  final String visitDate;
  final String diagnosis;
  final bool hasPrescription;
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
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  width: 6,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0xFF3B82F6),
                        Color(0xFF06B6D4),
                      ],
                    ),
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
                            color: const Color(0xFFF1F7FF),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.medical_services_outlined,
                            color: Color(0xFF2563EB),
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                hospitalName,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                doctorName,
                                style: const TextStyle(
                                  color: Color(0xFF334155),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEFF6FF),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      department,
                                      style: const TextStyle(
                                        color: Color(0xFF2563EB),
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  if (visitDate.isNotEmpty)
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.calendar_today_outlined,
                                          size: 14,
                                          color: Color(0xFF64748B),
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          visitDate,
                                          style: const TextStyle(
                                            color: Color(0xFF64748B),
                                            fontSize: 13,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  if (hasPrescription)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF0FDF4),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: const Color(0xFFBBF7D0)),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.medication_outlined,
                                            size: 13,
                                            color: Color(0xFF16A34A),
                                          ),
                                          SizedBox(width: 3),
                                          Text(
                                            'Rx Prescribed',
                                            style: TextStyle(
                                              color: Color(0xFF16A34A),
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                diagnosis,
                                style: const TextStyle(
                                  color: Color(0xFF475569),
                                  fontSize: 14,
                                  height: 1.45,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
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
      ),
    );
  }
}
