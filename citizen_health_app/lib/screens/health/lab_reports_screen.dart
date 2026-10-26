import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/lab_report_model.dart';
import '../../services/lab_service.dart';

class LabReportsScreen extends StatefulWidget {
  const LabReportsScreen({super.key});

  @override
  State<LabReportsScreen> createState() => _LabReportsScreenState();
}

class _LabReportsScreenState extends State<LabReportsScreen> {
  LabReportItem? selectedReport;

  Future<List<LabReportItem>> getLabReports() async {
    try {
      final List<LabReportModel> reports = await LabService.getReports();

      final mapped = reports.map<LabReportItem>((r) {
        return LabReportItem(
          id: r.reportId,
          testName: r.testName,
          hospitalName: r.hospitalName,
          dateOfTest: r.testDate ?? '',
          status: r.isCompleted ? LabReportStatus.completed : LabReportStatus.pending,
          result: r.result,
          description: r.description,
          fileUrl: r.reportFileUrl,
        );
      }).toList();

      return mapped;
    } catch (e) {
      debugPrint("LabReportsScreen getLabReports error: $e");
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

  Future<void> _openReportFile(String url) async {
    final rawUrl = url.trim();

    if (rawUrl.isEmpty) {
      _showReportMessage('Report file is not available.');
      return;
    }

    try {
      final uri = Uri.tryParse(rawUrl);

      if (uri == null) {
        _showReportMessage('Invalid report file link.');
        return;
      }

      // `url_launcher` can only open absolute URLs here. DB rows may contain
      // storage paths such as `reports/file.png`, which are not directly
      // launchable on device.
      if (!uri.hasScheme) {
        _showReportMessage('Report file is not available to open yet.');
        return;
      }

      final canOpen = await canLaunchUrl(uri);
      if (!canOpen) {
        _showReportMessage('No app available to open this report file.');
        return;
      }

      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      _showReportMessage('Unable to open report file right now.');
    }
  }

  void _showReportMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: FutureBuilder<List<LabReportItem>>(
        future: getLabReports(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final reports = snapshot.data ?? const <LabReportItem>[];

          if (selectedReport != null) {
            return _ReportDetailsView(
              report: selectedReport!,
              onBack: () {
                setState(() {
                  selectedReport = null;
                });
              },
              onOpenFile: selectedReport!.fileUrl?.isNotEmpty == true
                  ? () => _openReportFile(selectedReport!.fileUrl!)
                  : null,
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
                  const _GradientHealthHeader(
                    title: 'Lab Reports',
                    subtitle: 'View your diagnostic reports',
                    icon: Icons.assignment_outlined,
                  ),
                  Expanded(
                    child: reports.isEmpty
                        ? const Center(
                            child: Text(
                              'No lab reports found',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                            itemCount: reports.length,
                            itemBuilder: (context, index) {
                              final report = reports[index];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: _LabReportCard(
                                  report: report.copyWith(
                                    dateOfTest: _formatDate(report.dateOfTest),
                                  ),
                                  onTap: () {
                                    setState(() {
                                      selectedReport = report.copyWith(
                                        dateOfTest:
                                            _formatDate(report.dateOfTest),
                                      );
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

class _ReportDetailsView extends StatelessWidget {
  const _ReportDetailsView({
    required this.report,
    required this.onBack,
    required this.onOpenFile,
  });

  final LabReportItem report;
  final VoidCallback onBack;
  final VoidCallback? onOpenFile;

  @override
  Widget build(BuildContext context) {
    final isCompleted = report.status == LabReportStatus.completed;

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
            _GradientHealthHeader(
              title: 'Report Details',
              subtitle: 'Complete diagnostic report information',
              icon: Icons.description_outlined,
              onBack: onBack,
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                children: [
                  _SectionCard(
                    title: 'Report Information',
                    icon: Icons.assignment_outlined,
                    iconBackground: const Color(0xFFEFF6FF),
                    iconColor: const Color(0xFF2563EB),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _InfoRow(
                          label: 'Test Name',
                          value: report.testName,
                          emphasize: true,
                        ),
                        _InfoRow(
                          label: 'Hospital Name',
                          value: report.hospitalName,
                          leadingIcon: Icons.local_hospital_outlined,
                        ),
                        _InfoRow(
                          label: 'Date of Test',
                          value: report.dateOfTest,
                          leadingIcon: Icons.calendar_today_outlined,
                        ),
                        const Text(
                          'Status',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _StatusBadge(status: report.status),
                      ],
                    ),
                  ),
                  if (report.result?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Test Results',
                      icon: Icons.fact_check_outlined,
                      iconBackground: const Color(0xFFF0FDF4),
                      iconColor: const Color(0xFF16A34A),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Text(
                          report.result!,
                          style: const TextStyle(
                            color: Color(0xFF334155),
                            fontSize: 15,
                            height: 1.65,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (report.description?.trim().isNotEmpty == true) ...[
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Description',
                      icon: Icons.description_outlined,
                      iconBackground: const Color(0xFFECFEFF),
                      iconColor: const Color(0xFF0891B2),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFEFF),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Text(
                          report.description!,
                          style: const TextStyle(
                            color: Color(0xFF334155),
                            fontSize: 15,
                            height: 1.65,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ],
                  if (isCompleted) ...[
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Report File',
                      icon: Icons.download_outlined,
                      iconBackground: const Color(0xFFFAF5FF),
                      iconColor: const Color(0xFF9333EA),
                      child: Row(
                        children: [
                          Expanded(
                            child: _ActionButton(
                              label: 'View Report',
                              icon: Icons.visibility_outlined,
                              backgroundColor: const Color(0xFF3B82F6),
                              onTap: onOpenFile,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: _ActionButton(
                              label: 'Download',
                              icon: Icons.download_outlined,
                              backgroundColor: const Color(0xFF22C55E),
                              onTap: onOpenFile,
                            ),
                          ),
                        ],
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
  }
}

class _LabReportCard extends StatelessWidget {
  const _LabReportCard({
    required this.report,
    required this.onTap,
  });

  final LabReportItem report;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isCompleted = report.status == LabReportStatus.completed;

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
                decoration: BoxDecoration(
                  color: isCompleted
                      ? const Color(0xFF22C55E)
                      : const Color(0xFFF97316),
                  borderRadius: const BorderRadius.horizontal(
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
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.description_outlined,
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
                              report.testName,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              report.hospitalName,
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
                                      report.dateOfTest,
                                      style: const TextStyle(
                                        color: Color(0xFF64748B),
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                                _StatusBadge(status: report.status),
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

class LabReportItem {
  const LabReportItem({
    required this.id,
    required this.testName,
    required this.hospitalName,
    required this.dateOfTest,
    required this.status,
    this.result,
    this.description,
    this.fileUrl,
  });

  final String id;
  final String testName;
  final String hospitalName;
  final String dateOfTest;
  final LabReportStatus status;
  final String? result;
  final String? description;
  final String? fileUrl;

  factory LabReportItem.fromDb(Map<String, dynamic> report) {
    final rawStatus = (report['status'] ?? '').toString().toLowerCase();
    return LabReportItem(
      id: (report['report_id'] ?? '').toString(),
      testName: (report['test_types']?['test_name'] ?? 'Test').toString(),
      hospitalName: (report['hospitals']?['name'] ?? 'Hospital').toString(),
      dateOfTest: (report['test_date'] ?? '').toString(),
      status: rawStatus == 'completed'
          ? LabReportStatus.completed
          : LabReportStatus.pending,
      result: report['result']?.toString(),
      description: report['description']?.toString(),
      fileUrl: report['report_file_url']?.toString(),
    );
  }

  LabReportItem copyWith({
    String? dateOfTest,
  }) {
    return LabReportItem(
      id: id,
      testName: testName,
      hospitalName: hospitalName,
      dateOfTest: dateOfTest ?? this.dateOfTest,
      status: status,
      result: result,
      description: description,
      fileUrl: fileUrl,
    );
  }
}

enum LabReportStatus { completed, pending }

class _GradientHealthHeader extends StatelessWidget {
  const _GradientHealthHeader({
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

class _SectionCard extends StatelessWidget {
  const _SectionCard({
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

class _InfoRow extends StatelessWidget {
  const _InfoRow({
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final LabReportStatus status;

  @override
  Widget build(BuildContext context) {
    final isCompleted = status == LabReportStatus.completed;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isCompleted
            ? const Color(0xFFF0FDF4)
            : const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        isCompleted ? 'Completed' : 'Pending',
        style: TextStyle(
          color: isCompleted
              ? const Color(0xFF16A34A)
              : const Color(0xFFEA580C),
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.backgroundColor,
    this.onTap,
  });

  final String label;
  final IconData icon;
  final Color backgroundColor;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
      ),
      icon: Icon(icon, size: 18),
      label: Text(
        label,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

const List<LabReportItem> _fallbackReports = [
  LabReportItem(
    id: '1',
    testName: 'Complete Blood Count (CBC)',
    hospitalName: 'City Diagnostic Center',
    dateOfTest: 'March 18, 2026',
    status: LabReportStatus.completed,
    result:
        'Hemoglobin: 14.2 g/dL (Normal)\nWBC Count: 7,500 cells/μL (Normal)\nPlatelet Count: 2,50,000 cells/μL (Normal)\nRBC Count: 5.2 million cells/μL (Normal)',
    description:
        'Complete blood count test shows all parameters within normal range. No abnormalities detected.',
  ),
  LabReportItem(
    id: '2',
    testName: 'Lipid Profile',
    hospitalName: 'Apollo Diagnostics',
    dateOfTest: 'March 10, 2026',
    status: LabReportStatus.completed,
    result:
        'Total Cholesterol: 185 mg/dL (Normal)\nLDL Cholesterol: 110 mg/dL (Normal)\nHDL Cholesterol: 55 mg/dL (Normal)\nTriglycerides: 140 mg/dL (Normal)',
    description:
        'Lipid profile indicates healthy cholesterol levels. Maintain current lifestyle and diet.',
  ),
  LabReportItem(
    id: '3',
    testName: 'Thyroid Function Test (TSH)',
    hospitalName: 'Community Health Lab',
    dateOfTest: 'March 20, 2026',
    status: LabReportStatus.pending,
    description:
        'Test sample collected. Results will be available within 24-48 hours.',
  ),
];
