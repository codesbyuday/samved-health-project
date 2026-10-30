import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'package:printing/printing.dart';
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
  late Future<List<LabReportItem>> _reportsFuture;
  bool _isProcessingFile = false;
  String? _processingAction; // 'view' or 'download'

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  void _loadReports() {
    _reportsFuture = getLabReports();
  }

  Future<void> _refreshReports() async {
    setState(() {
      _loadReports();
    });
  }

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

  Future<void> _handleFileAction({
    required LabReportItem report,
    required bool isDownload,
  }) async {
    if (_isProcessingFile) return;

    setState(() {
      _isProcessingFile = true;
      _processingAction = isDownload ? 'download' : 'view';
    });

    try {
      // 1. Resolve storage path or relative link into accessible signed URL
      final resolvedUrl = await LabService.resolveReportFileUrl(
        report.id,
        rawFilePath: report.fileUrl,
      );

      if (resolvedUrl == null || resolvedUrl.trim().isEmpty) {
        _showReportMessage('Diagnostic report file is not yet uploaded by the laboratory.');
        return;
      }

      final uri = Uri.tryParse(resolvedUrl.trim());
      if (uri == null || !uri.hasScheme) {
        _showReportMessage('Invalid report file address.');
        return;
      }

      if (!isDownload) {
        // VIEW ACTION: Open directly via external viewer / browser
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        if (!launched) {
          final fallbackLaunched = await launchUrl(
            uri,
            mode: LaunchMode.platformDefault,
          );
          if (!fallbackLaunched) {
            _showReportMessage('No application found on device to view this report.');
          }
        }
      } else {
        // DOWNLOAD ACTION: Fetch file bytes and provide Save / Share / Open option
        _showReportMessage('Preparing diagnostic report download...');

        try {
          final response = await http.get(uri).timeout(const Duration(seconds: 25));
          if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
            final bytes = response.bodyBytes;
            final isPdf = resolvedUrl.toLowerCase().contains('.pdf') ||
                (response.headers['content-type']?.toLowerCase().contains('pdf') ?? false);

            final cleanTestName = report.testName
                .replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '_')
                .trim();
            final safeId = report.id.length > 8 ? report.id.substring(0, 8) : report.id;
            final ext = isPdf ? 'pdf' : (resolvedUrl.toLowerCase().contains('.png') ? 'png' : 'jpg');
            final filename = 'Report_${cleanTestName}_$safeId.$ext';

            if (isPdf) {
              await Printing.sharePdf(
                bytes: bytes,
                filename: filename,
              );
              _showReportMessage('Report ready to save or share.');
            } else {
              final dir = await getApplicationDocumentsDirectory();
              final file = File('${dir.path}/$filename');
              await file.writeAsBytes(bytes);
              await launchUrl(uri, mode: LaunchMode.externalApplication);
              _showReportMessage('Report downloaded successfully.');
            }
          } else {
            // Fallback to launching in browser directly which triggers native download
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          }
        } catch (downloadErr) {
          debugPrint('Direct file download error: $downloadErr');
          // Fallback to external browser download
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      }
    } catch (e) {
      debugPrint('Error handling report file action: $e');
      _showReportMessage('Unable to open or download report file right now.');
    } finally {
      if (mounted) {
        setState(() {
          _isProcessingFile = false;
          _processingAction = null;
        });
      }
    }
  }

  void _showReportMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: FutureBuilder<List<LabReportItem>>(
        future: _reportsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final reports = snapshot.data ?? const <LabReportItem>[];

          if (selectedReport != null) {
            return _ReportDetailsView(
              report: selectedReport!,
              isProcessingFile: _isProcessingFile,
              processingAction: _processingAction,
              onBack: () {
                setState(() {
                  selectedReport = null;
                });
              },
              onViewFile: () => _handleFileAction(
                report: selectedReport!,
                isDownload: false,
              ),
              onDownloadFile: () => _handleFileAction(
                report: selectedReport!,
                isDownload: true,
              ),
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
                    child: RefreshIndicator(
                      onRefresh: _refreshReports,
                      child: reports.isEmpty
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
                                          'No lab reports found',
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
                                          dateOfTest: _formatDate(report.dateOfTest),
                                        );
                                      });
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

class _ReportDetailsView extends StatelessWidget {
  const _ReportDetailsView({
    required this.report,
    required this.onBack,
    required this.onViewFile,
    required this.onDownloadFile,
    required this.isProcessingFile,
    required this.processingAction,
  });

  final LabReportItem report;
  final VoidCallback onBack;
  final VoidCallback onViewFile;
  final VoidCallback onDownloadFile;
  final bool isProcessingFile;
  final String? processingAction;

  @override
  Widget build(BuildContext context) {
    final isCompleted = report.status == LabReportStatus.completed;
    final hasFile = report.hasFile;

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
                          label: 'Diagnostic Facility / Hospital',
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
                      title: 'Clinical Observations / Notes',
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
                  // Report File Action Section (visible if completed or file exists)
                  if (hasFile || isCompleted) ...[
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Report File',
                      icon: Icons.file_present_outlined,
                      iconBackground: const Color(0xFFFAF5FF),
                      iconColor: const Color(0xFF9333EA),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (hasFile) ...[
                            Row(
                              children: [
                                Expanded(
                                  child: _ActionButton(
                                    label: 'View Report',
                                    icon: Icons.visibility_outlined,
                                    backgroundColor: const Color(0xFF3B82F6),
                                    isLoading: isProcessingFile && processingAction == 'view',
                                    onTap: isProcessingFile ? null : onViewFile,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: _ActionButton(
                                    label: 'Download',
                                    icon: Icons.download_outlined,
                                    backgroundColor: const Color(0xFF22C55E),
                                    isLoading: isProcessingFile && processingAction == 'download',
                                    onTap: isProcessingFile ? null : onDownloadFile,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            const Center(
                              child: Text(
                                'Tap to preview or save the official report on your device',
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ] else ...[
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFFBEB),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFFDE68A)),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.info_outline, color: Color(0xFFD97706), size: 20),
                                  SizedBox(width: 10),
                                  Expanded(
                                    child: Text(
                                      'Diagnostic document is currently being finalized by the facility.',
                                      style: TextStyle(
                                        color: Color(0xFF92400E),
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                      ),
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
                height: 142,
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
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              report.hospitalName,
                              style: const TextStyle(
                                color: Color(0xFF475569),
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
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.calendar_today_outlined,
                                      color: Color(0xFF64748B),
                                      size: 15,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      report.dateOfTest,
                                      style: const TextStyle(
                                        color: Color(0xFF64748B),
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                                _StatusBadge(status: report.status),
                                if (report.hasFile)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEFF6FF),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFFBFDBFE)),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.attach_file, size: 13, color: Color(0xFF2563EB)),
                                        SizedBox(width: 3),
                                        Text(
                                          'File Available',
                                          style: TextStyle(
                                            color: Color(0xFF2563EB),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
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

  bool get hasFile => fileUrl != null && fileUrl!.trim().isNotEmpty;

  factory LabReportItem.fromDb(Map<String, dynamic> report) {
    final rawStatus = (report['status'] ?? '').toString().toLowerCase();
    return LabReportItem(
      id: (report['report_id'] ?? '').toString(),
      testName: (report['test_types']?['test_name'] ?? 'Test').toString(),
      hospitalName: (report['hospitals']?['name'] ?? report['issuer_name'] ?? 'Diagnostic Center').toString(),
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
    this.isLoading = false,
  });

  final String label;
  final IconData icon;
  final Color backgroundColor;
  final VoidCallback? onTap;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: backgroundColor,
        foregroundColor: Colors.white,
        disabledBackgroundColor: backgroundColor.withOpacity(0.65),
        disabledForegroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
        ),
      ),
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: Colors.white,
              ),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
    );
  }
}
