import 'package:flutter/material.dart';

class AlertDetailsScreen extends StatelessWidget {
  const AlertDetailsScreen({
    super.key,
    required this.alert,
  });

  final Map<String, dynamic> alert;

  @override
  Widget build(BuildContext context) {
    final title =
        (alert['title'] ?? alert['headline'] ?? 'Health Alert').toString();
    final description = (alert['details'] ??
            alert['content'] ??
            alert['full_description'] ??
            alert['description'] ??
            alert['message'] ??
            '')
        .toString();

    final preventionTips = _extractTips(
      alert['prevention_tips'] ?? alert['tips'],
    );
    final affectedArea =
        (alert['affected_area'] ?? alert['location'] ?? '').toString();
    final issuedBy =
        (alert['issued_by'] ?? alert['source'] ?? '').toString();
    final issuedDate =
        (alert['issued_at'] ?? alert['created_at'] ?? alert['date'] ?? '')
            .toString();

    if (title.trim().isEmpty && description.trim().isEmpty) {
      return const Scaffold(
        body: Center(
          child: Text('No Alerts'),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: SingleChildScrollView(
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
                    Color(0xFFFB923C),
                    Color(0xFFF97316),
                    Color(0xFFEA580C),
                  ],
                ),
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x1AF97316),
                    blurRadius: 24,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 60,
                    width: 60,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Health Alert Details',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          title,
                          style: const TextStyle(
                            color: Color(0xE6FFFFFF),
                            fontSize: 15,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _SectionCard(
                    title: 'Description',
                    child: Text(
                      description.isEmpty
                          ? 'No additional details available.'
                          : description,
                      style: const TextStyle(
                        fontSize: 15,
                        height: 1.6,
                        color: Color(0xFF475467),
                      ),
                    ),
                  ),
                  if (preventionTips.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Prevention Tips',
                      child: Column(
                        children: preventionTips
                            .map(
                              (tip) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Padding(
                                      padding: EdgeInsets.only(top: 7),
                                      child: Icon(
                                        Icons.circle,
                                        size: 8,
                                        color: Color(0xFF2563EB),
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Text(
                                        tip,
                                        style: const TextStyle(
                                          fontSize: 15,
                                          height: 1.5,
                                          color: Color(0xFF475467),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  _SectionCard(
                    title: 'Details',
                    child: Column(
                      children: [
                        if (affectedArea.isNotEmpty)
                          _DetailLine(label: 'Affected Area', value: affectedArea),
                        if (issuedBy.isNotEmpty)
                          _DetailLine(label: 'Issued by', value: issuedBy),
                        if (issuedDate.isNotEmpty)
                          _DetailLine(label: 'Date', value: issuedDate),
                        if (affectedArea.isEmpty &&
                            issuedBy.isEmpty &&
                            issuedDate.isEmpty)
                          const Text(
                            'No additional metadata available.',
                            style: TextStyle(
                              fontSize: 15,
                              color: Color(0xFF667085),
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
    );
  }

  List<String> _extractTips(dynamic rawTips) {
    if (rawTips == null) return const [];
    if (rawTips is List) {
      return rawTips
          .map((tip) => tip.toString().trim())
          .where((tip) => tip.isNotEmpty)
          .toList();
    }

    final text = rawTips.toString().trim();
    if (text.isEmpty) return const [];

    return text
        .split(RegExp(r'[\n,;]+'))
        .map((tip) => tip.replaceFirst(RegExp(r'^[-•]\s*'), '').trim())
        .where((tip) => tip.isNotEmpty)
        .toList();
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

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
          child,
        ],
      ),
    );
  }
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xFF344054),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Color(0xFF667085),
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
