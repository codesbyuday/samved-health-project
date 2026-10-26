import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/notification_model.dart';
import '../services/notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState
    extends State<NotificationsScreen> {

  late final Future<List<Map<String, dynamic>>> _notificationsFuture =
      _fetchNotifications();

  Future<List<Map<String, dynamic>>> _fetchNotifications() async {
    try {
      final List<NotificationModel> list = await NotificationService.getNotifications();
      return list.map((n) => {
        'notification_id': n.notificationId,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'priority': n.priority,
        'is_read': n.isRead,
        'created_at': n.createdAt ?? DateTime.now().toIso8601String(),
        'action_url': n.actionUrl,
      }).toList();
    } catch (e) {
      debugPrint("NotificationsScreen fetch error: $e");
      return [];
    }
  }

  IconData _notificationIcon(String? type) {

    switch (type) {

      case 'appointment':
        return Icons.calendar_today;

      case 'health_alert':
        return Icons.warning_amber_rounded;

      case 'lab_report':
        return Icons.science;

      case 'complaint_update':
        return Icons.assignment;

      case 'vaccination_campaign':
        return Icons.vaccines;

      case 'emergency':
        return Icons.emergency;

      default:
        return Icons.notifications;
    }
  }

  Color _priorityColor(String? priority) {

    switch (priority) {

      case 'critical':
        return Colors.red;

      case 'high':
        return Colors.orange;

      case 'medium':
        return Colors.amber;

      case 'low':
        return Colors.green;

      default:
        return Colors.blue;
    }
  }

  String _formatDate(String value) {

    final date = DateTime.parse(value);

    return DateFormat(
      "dd MMM yyyy • hh:mm a",
    ).format(date);
  }

    @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F9FF),
      body: SafeArea(
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _notificationsFuture,
          builder: (context, snapshot) {
            final notifications =
                snapshot.data ?? [];

            return Column(
              children: [

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(
                    20,
                    24,
                    20,
                    32,
                  ),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF1565C0),
                        Color(0xFF1E88E5),
                        Color(0xFF42A5F5),
                      ],
                    ),
                    borderRadius:
                        BorderRadius.vertical(
                      bottom: Radius.circular(30),
                    ),
                  ),
                  child: Row(
                    children: [

                      IconButton(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        icon: const Icon(
                          Icons.arrow_back,
                          color: Colors.white,
                        ),
                      ),

                      const SizedBox(width: 8),

                      const Expanded(
                        child: Text(
                          "Notifications",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight:
                                FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                Expanded(

                  child: snapshot.connectionState ==
                          ConnectionState.waiting

                      ? const Center(
                          child:
                              CircularProgressIndicator(),
                        )

                      : notifications.isEmpty

                          ? const Center(
                              child: Text(
                                "No notifications available.",
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey,
                                ),
                              ),
                            )

                          : ListView.separated(

                              padding:
                                  const EdgeInsets.all(
                                      16),

                              itemCount:
                                  notifications.length,

                              separatorBuilder:
                                  (_, __) =>
                                      const SizedBox(
                                        height: 14,
                                      ),

                              itemBuilder:
                                  (context, index) {

                                final notification =
                                    notifications[index];

                                return _NotificationCard(

                                  notification:
                                      notification,

                                  icon:
                                      _notificationIcon(
                                    notification[
                                        'type'],
                                  ),

                                  priorityColor:
                                      _priorityColor(
                                    notification[
                                        'priority'],
                                  ),

                                  formattedDate:
                                      _formatDate(
                                    notification[
                                        'created_at'],
                                  ),
                                );
                              },
                            ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  }

class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> notification;
  final IconData icon;
  final Color priorityColor;
  final String formattedDate;

  const _NotificationCard({
    required this.notification,
    required this.icon,
    required this.priorityColor,
    required this.formattedDate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Container(
            height: 52,
            width: 52,
            decoration: BoxDecoration(
              color: priorityColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              icon,
              color: priorityColor,
            ),
          ),

          const SizedBox(width: 16),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [

                Text(
                  notification['title'] ?? '',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F2937),
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  notification['message'] ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF667085),
                  ),
                ),

                const SizedBox(height: 12),

                Row(
                  children: [

                    Container(
                      padding:
                          const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color:
                            priorityColor.withOpacity(
                                0.10),
                        borderRadius:
                            BorderRadius.circular(12),
                      ),
                      child: Text(
                        (notification['priority'] ??
                                'info')
                            .toString()
                            .toUpperCase(),
                        style: TextStyle(
                          color: priorityColor,
                          fontWeight:
                              FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),

                    const Spacer(),

                    Text(
                      formattedDate,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}