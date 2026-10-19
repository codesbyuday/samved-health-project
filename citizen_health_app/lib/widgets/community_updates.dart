import 'package:flutter/material.dart';
import '../services/citizen_service.dart';
import '../services/surveillance_service.dart';

class CommunityUpdates extends StatefulWidget {
  final int? wardNumber;
  const CommunityUpdates({super.key, this.wardNumber});

  @override
  State<CommunityUpdates> createState() => _CommunityUpdatesState();
}

class _CommunityUpdatesState extends State<CommunityUpdates> {
  Future<List<Map<String, String>>> _fetchUpdates() async {
    try {
      int? ward = widget.wardNumber;
      if (ward == null) {
        final citizen = await CitizenService.getCurrentProfile();
        ward = citizen?.wardNumber;
      }
      if (ward == null) return const [];

      final campaigns = await SurveillanceService.getCampaigns(wardNumber: ward);

      return campaigns.map((campaign) {
        final vaccine = (campaign.vaccineType ?? '').trim();
        final target = (campaign.targetPopulation ?? '').trim();
        return {
          'title': campaign.name,
          'description': [
            if (vaccine.isNotEmpty) 'Vaccine: $vaccine',
            if (target.isNotEmpty) 'For: $target',
          ].join('\n'),
          'date': (campaign.date ?? '').toString(),
          'status': (campaign.status ?? '').toString(),
        };
      }).toList();
    } catch (_) {
      return const [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Map<String, String>>>(
      future: _fetchUpdates(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            ),
          );
        }

        final updates = snapshot.data ?? const <Map<String, String>>[];
        if (updates.isEmpty) {
          return const _CommunityUpdatesEmptyState();
        }

        return Column(
          children: [
            for (var index = 0; index < updates.length && index < 2; index++) ...[
              _buildUpdateCard(
                accentColor: updates[index]['status'] == 'ongoing'
                    ? const Color(0xFF059669)
                    : const Color(0xFF2563EB),
                title: updates[index]['title'] ?? '',
                description: updates[index]['description'] ?? '',
                date: updates[index]['date'] ?? '',
              ),
              if (index == 0 && updates.length > 1) const SizedBox(height: 16),
            ],
          ],
        );
      },
    );
  }

  Widget _buildUpdateCard({
    required Color accentColor,
    required String title,
    required String description,
    required String date,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 132,
            decoration: BoxDecoration(
              color: accentColor,
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFF1A2B49))),
                  const SizedBox(height: 8),
                  Text(description, style: TextStyle(fontSize: 14, height: 1.4, color: Colors.blueGrey.shade700)),
                  const SizedBox(height: 12),
                  Text(date, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.blueGrey.shade500)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CommunityUpdatesEmptyState extends StatelessWidget {
  const _CommunityUpdatesEmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: const Text(
        'No vaccination campaigns are currently scheduled for your ward.',
        style: TextStyle(color: Color(0xFF64748B)),
      ),
    );
  }
}
