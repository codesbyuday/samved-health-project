import 'dart:ui';

import 'package:flutter/material.dart';

import '../services/citizen_service.dart';
import '../services/surveillance_service.dart';
import 'alerts/alert_details_screen.dart';
import 'risk/ward_risk_details_screen.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  String selectedFilter = 'all';
  late final Future<List<_AlertItem>> _alertsFuture = _fetchAlerts();

  Future<List<_AlertItem>> _fetchAlerts() async {
    try {
      final alerts = await SurveillanceService.getAlerts();
      return alerts.map((a) => _AlertItem(
        raw: {
          'alert_id': a.alertId,
          'title': a.title,
          'description': a.description,
          'severity': a.severity,
          'ward_number': a.wardNumber,
          'created_at': a.createdAt,
        },
        title: a.title,
        description: a.description,
        time: _timeAgo(a.createdAt),
        severity: _normalizeSeverity(a.severity),
        icon: _resolveAlertIcon({'severity': a.severity, 'type': a.alertType}, _normalizeSeverity(a.severity)),
        hasDetails: true,
      )).toList();
    } catch (e) {
      debugPrint("AlertsScreen _fetchAlerts error: $e");
      return const [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFFFFFFF),
              Color(0xFFF5F8FF),
              Color(0xFFF0F4FF),
            ],
          ),
        ),
        child: SafeArea(
          child: FutureBuilder<List<_AlertItem>>(
            future: _alertsFuture,
            builder: (context, snapshot) {
              final alerts = snapshot.data ?? const <_AlertItem>[];
              final filteredAlerts = alerts.where(
                (alert) =>
                    selectedFilter == 'all' ||
                    alert.severity == selectedFilter,
              ).toList();

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Health Alerts',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF101828),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Stay informed about health risks and updates',
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.4,
                        color: Color(0xFF667085),
                      ),
                    ),
                    const SizedBox(height: 24),
                    RiskStatusCard(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                const WardRiskDetailsScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 22),
                    SizedBox(
                      height: 46,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          FilterChipWidget(
                            label: 'All',
                            isSelected: selectedFilter == 'all',
                            onTap: () => _setFilter('all'),
                          ),
                          const SizedBox(width: 10),
                          FilterChipWidget(
                            label: 'High',
                            isSelected: selectedFilter == 'high',
                            onTap: () => _setFilter('high'),
                          ),
                          const SizedBox(width: 10),
                          FilterChipWidget(
                            label: 'Medium',
                            isSelected: selectedFilter == 'medium',
                            onTap: () => _setFilter('medium'),
                          ),
                          const SizedBox(width: 10),
                          FilterChipWidget(
                            label: 'Low',
                            isSelected: selectedFilter == 'low',
                            onTap: () => _setFilter('low'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const _AlertsSectionHeader(),
                    const SizedBox(height: 16),
                    if (snapshot.connectionState == ConnectionState.waiting)
                      const Padding(
                        padding: EdgeInsets.only(top: 48),
                        child: Center(
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (snapshot.hasError)
                      const Padding(
                        padding: EdgeInsets.only(top: 24),
                        child: _AlertsPlaceholder(
                          title: 'Unable to load alerts',
                          subtitle:
                              'Please try again in a moment.',
                        ),
                      )
                    else if (filteredAlerts.isEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 24),
                        child: _AlertsPlaceholder(
                          title: alerts.isEmpty
                              ? 'No alerts available'
                              : 'No alerts match this filter',
                          subtitle: alerts.isEmpty
                              ? 'There are currently no health alerts to show.'
                              : 'Try switching to another severity filter.',
                        ),
                      )
                    else
                      ...filteredAlerts.map(
                        (alert) => Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: AlertCard(
                            alert: alert,
                            onTap: alert.hasDetails
                                ? () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            AlertDetailsScreen(
                                          alert: alert.raw,
                                        ),
                                      ),
                                    );
                                  }
                                : null,
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _setFilter(String filter) {
    setState(() {
      selectedFilter = filter;
    });
  }
}

class RiskStatusCard extends StatefulWidget {
  const RiskStatusCard({
    super.key,
    required this.onTap,
  });

  final VoidCallback onTap;

  @override
  State<RiskStatusCard> createState() => _RiskStatusCardState();
}

class _RiskStatusCardState extends State<RiskStatusCard> {
  late final Future<Map<String, String>?> _statusFuture = _fetchStatus();

  Future<Map<String, String>?> _fetchStatus() async {
    try {
      final citizen = await CitizenService.getCurrentProfile();
      final wardNumber = citizen?.wardNumber;
      if (wardNumber == null) {
        return {
          'level': 'Not Available',
          'ward': 'Ward Unassigned',
        };
      }

      final wardRisks = await SurveillanceService.getWardRisks();
      String riskLevel = "Low";
      String wardName = "Ward $wardNumber";

      for (final w in wardRisks) {
        if (w.wardNumber == wardNumber) {
          riskLevel = w.riskLevel;
          wardName = w.wardName;
          break;
        }
      }

      return {
        'level': riskLevel,
        'ward': wardName,
      };
    } catch (_) {
      return {
        'level': 'Not Available',
        'ward': 'Ward Unassigned',
      };
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, String>?>(
      future: _statusFuture,
      builder: (context, snapshot) {
        final status = snapshot.data;
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SizedBox(height: 126, child: Center(child: CircularProgressIndicator()));
        }
        if (status == null) return const SizedBox.shrink();
        final level = status['level'] ?? 'Unknown';
        final label = level[0].toUpperCase() + level.substring(1).toLowerCase();
        return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(28),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: Stack(
            children: [
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFFFA63D),
                      Color(0xFFFF8A1F),
                      Color(0xFFFFB300),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Color(0x33FF9800),
                      blurRadius: 24,
                      offset: Offset(0, 12),
                    ),
                  ],
                ),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.monitor_heart_outlined,
                            color: Colors.white,
                            size: 30,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                                CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'CURRENT RISK STATUS',
                                style: TextStyle(
                                  color: Color(0xE6FFFFFF),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: 0.8,
                                ),
                              ),
                              SizedBox(height: 6),
                              Text(
                                '$label risk detected in ${status['ward']}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                  height: 1.3,
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
                            color: const Color(0x55D9480F),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            label.toUpperCase(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                top: -24,
                right: -30,
                child: Container(
                  height: 120,
                  width: 120,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.20),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                bottom: -28,
                left: -22,
                child: Container(
                  height: 92,
                  width: 92,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.14),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
        );
      },
    );
  }
}

class FilterChipWidget extends StatelessWidget {
  const FilterChipWidget({
    super.key,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 12,
        ),
        decoration: BoxDecoration(
          gradient: isSelected
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF5B4BFF),
                    Color(0xFF4338CA),
                  ],
                )
              : null,
          color: isSelected ? null : Colors.white.withOpacity(0.78),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: isSelected
                ? Colors.transparent
                : Colors.white.withOpacity(0.75),
          ),
          boxShadow: [
            if (isSelected)
              const BoxShadow(
                color: Color(0x335B4BFF),
                blurRadius: 14,
                offset: Offset(0, 6),
              )
            else
              const BoxShadow(
                color: Color(0x100F172A),
                blurRadius: 12,
                offset: Offset(0, 4),
              ),
          ],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: isSelected
                ? Colors.white
                : const Color(0xFF475467),
          ),
        ),
      ),
    );
  }
}

class AlertCard extends StatelessWidget {
  const AlertCard({
    super.key,
    required this.alert,
    required this.onTap,
  });

  final _AlertItem alert;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final severityStyle = _severityStyle(alert.severity);

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
              color: Colors.white.withOpacity(0.72),
            ),
            boxShadow: const [
              BoxShadow(
                color: Color(0x140F172A),
                blurRadius: 22,
                offset: Offset(0, 10),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                left: 0,
                top: 28,
                bottom: 28,
                child: Container(
                  width: 5,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: severityStyle.gradient,
                    ),
                    borderRadius: const BorderRadius.horizontal(
                      right: Radius.circular(10),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: severityStyle.gradient,
                        ),
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x22000000),
                            blurRadius: 12,
                            offset: Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Icon(
                        alert.icon,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          Text(
                            alert.title,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1D2939),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            alert.description,
                            style: const TextStyle(
                              fontSize: 14,
                              height: 1.55,
                              color: Color(0xFF667085),
                            ),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Container(
                                padding:
                                    const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: severityStyle.badgeBg,
                                  borderRadius:
                                      BorderRadius.circular(999),
                                  border: Border.all(
                                    color: severityStyle.badgeBorder,
                                  ),
                                ),
                                child: Text(
                                  alert.severityLabel,
                                  style: TextStyle(
                                    color: severityStyle.badgeText,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  '- ${alert.time}',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF98A2B3),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (onTap != null) ...[
                      const SizedBox(width: 8),
                      Icon(
                        Icons.chevron_right_rounded,
                        color: severityStyle.arrowColor,
                        size: 28,
                      ),
                    ],
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

class _AlertsSectionHeader extends StatelessWidget {
  const _AlertsSectionHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          height: 44,
          width: 44,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF4F46E5),
                Color(0xFF2563EB),
              ],
            ),
            borderRadius: BorderRadius.all(Radius.circular(14)),
            boxShadow: [
              BoxShadow(
                color: Color(0x224F46E5),
                blurRadius: 16,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: const Icon(
            Icons.notifications_none_rounded,
            color: Colors.white,
            size: 22,
          ),
        ),
        const SizedBox(width: 12),
        const Text(
          'Recent Alerts',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: Color(0xFF2E36B5),
          ),
        ),
      ],
    );
  }
}

class _AlertsPlaceholder extends StatelessWidget {
  const _AlertsPlaceholder({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Colors.white.withOpacity(0.78),
        ),
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
              fontSize: 17,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1D2939),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF667085),
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

_SeverityStyle _severityStyle(String severity) {
  switch (severity.toLowerCase()) {
    case 'high':
      return const _SeverityStyle(
        gradient: [
          Color(0xFFFF2D55),
          Color(0xFFE11D48),
        ],
        badgeBg: Color(0xFFFFE4E8),
        badgeBorder: Color(0xFFFECDD3),
        badgeText: Color(0xFFE11D48),
        arrowColor: Color(0xFFF43F5E),
      );
    case 'medium':
      return const _SeverityStyle(
        gradient: [
          Color(0xFFFF8A00),
          Color(0xFFF97316),
        ],
        badgeBg: Color(0xFFFFEDD5),
        badgeBorder: Color(0xFFFED7AA),
        badgeText: Color(0xFFEA580C),
        arrowColor: Color(0xFFF97316),
      );
    case 'low':
      return const _SeverityStyle(
        gradient: [
          Color(0xFF22C55E),
          Color(0xFF16A34A),
        ],
        badgeBg: Color(0xFFDCFCE7),
        badgeBorder: Color(0xFFBBF7D0),
        badgeText: Color(0xFF16A34A),
        arrowColor: Color(0xFF22C55E),
      );
    default:
      return const _SeverityStyle(
        gradient: [
          Color(0xFF4F46E5),
          Color(0xFF2563EB),
        ],
        badgeBg: Color(0xFFDBEAFE),
        badgeBorder: Color(0xFFBFDBFE),
        badgeText: Color(0xFF2563EB),
        arrowColor: Color(0xFF2563EB),
      );
  }
}

IconData _resolveAlertIcon(Map<String, dynamic> raw, String severity) {
  final type = (raw['type'] ?? raw['category'] ?? raw['title'] ?? '')
      .toString()
      .toLowerCase();

  if (type.contains('vaccin')) return Icons.vaccines_rounded;
  if (type.contains('flu') || type.contains('advisory')) {
    return Icons.shield_outlined;
  }
  if (type.contains('announcement') || type.contains('center')) {
    return Icons.info_outline_rounded;
  }
  if (severity == 'high') return Icons.warning_amber_rounded;
  return Icons.notifications_active_outlined;
}

class _SeverityStyle {
  const _SeverityStyle({
    required this.gradient,
    required this.badgeBg,
    required this.badgeBorder,
    required this.badgeText,
    required this.arrowColor,
  });

  final List<Color> gradient;
  final Color badgeBg;
  final Color badgeBorder;
  final Color badgeText;
  final Color arrowColor;
}

class _AlertItem {
  const _AlertItem({
    required this.raw,
    required this.title,
    required this.description,
    required this.time,
    required this.severity,
    required this.icon,
    required this.hasDetails,
  });

  final Map<String, dynamic> raw;
  final String title;
  final String description;
  final String time;
  final String severity;
  final IconData icon;
  final bool hasDetails;

  factory _AlertItem.fromMap(Map<String, dynamic> raw) {
    final severity = _normalizeSeverity(
      raw['severity'] ?? raw['risk_level'] ?? raw['priority'],
    );
    final title = (raw['title'] ?? raw['headline'] ?? raw['type'] ?? 'Alert')
        .toString();
    final description =
        (raw['description'] ?? raw['message'] ?? raw['summary'] ?? '')
            .toString();

    return _AlertItem(
      raw: raw,
      title: title,
      description: description,
      time: _timeAgo(raw['created_at'] ?? raw['issued_at'] ?? raw['date']),
      severity: severity,
      icon: _resolveAlertIcon(raw, severity),
      hasDetails: _hasDetails(raw),
    );
  }

  String get severityLabel {
    return severity[0].toUpperCase() + severity.substring(1);
  }
}

String _normalizeSeverity(dynamic value) {
  final normalized = (value ?? 'low').toString().toLowerCase().trim();
  if (normalized == 'high') return 'high';
  if (normalized == 'medium' || normalized == 'moderate') return 'medium';
  if (normalized == 'low') return 'low';
  return 'low';
}

bool _hasDetails(Map<String, dynamic> raw) {
  final detailFields = [
    raw['details'],
    raw['content'],
    raw['full_description'],
    raw['prevention_tips'],
    raw['tips'],
    raw['affected_area'],
    raw['issued_by'],
    raw['source'],
  ];

  return detailFields.any((value) {
    if (value == null) return false;
    if (value is List) return value.isNotEmpty;
    return value.toString().trim().isNotEmpty;
  });
}

String _timeAgo(dynamic value) {
  if (value == null) return 'Recently';
  final parsed = DateTime.tryParse(value.toString());
  if (parsed == null) return 'Recently';

  final now = DateTime.now();
  final diff = now.difference(parsed.toLocal());

  if (diff.inMinutes < 1) return 'Just now';
  if (diff.inHours < 1) return '${diff.inMinutes} min ago';
  if (diff.inDays < 1) return '${diff.inHours} hours ago';
  if (diff.inDays < 7) return '${diff.inDays} days ago';
  return '${parsed.day}/${parsed.month}/${parsed.year}';
}
