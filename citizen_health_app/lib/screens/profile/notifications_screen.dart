import 'package:flutter/material.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final List<_NotificationSetting> settings = [
    _NotificationSetting(
      id: 'health-alerts',
      title: 'Health Alerts',
      description: 'Get notified about important health updates',
      enabled: true,
    ),
    _NotificationSetting(
      id: 'appointment-reminders',
      title: 'Appointment Reminders',
      description: 'Reminders for upcoming appointments',
      enabled: true,
    ),
    _NotificationSetting(
      id: 'vaccination-reminders',
      title: 'Vaccination Reminders',
      description: 'Stay updated on vaccination schedules',
      enabled: false,
    ),
    _NotificationSetting(
      id: 'general-notifications',
      title: 'General Notifications',
      description: 'App updates and general information',
      enabled: true,
    ),
  ];

  void handleToggle(String id) {
    setState(() {
      final index = settings.indexWhere((setting) => setting.id == id);
      if (index != -1) {
        settings[index] = settings[index].copyWith(
          enabled: !settings[index].enabled,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
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
              const _SettingsHeader(
                title: 'Notifications & Reminders',
                subtitle: 'Manage alerts and reminders',
                icon: Icons.notifications_none_rounded,
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 22, 20, 24),
                  itemCount: settings.length,
                  itemBuilder: (context, index) {
                    final setting = settings[index];

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 20,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x140F172A),
                              blurRadius: 18,
                              offset: Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    setting.title,
                                    style: const TextStyle(
                                      color: Color(0xFF0F172A),
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    setting.description,
                                    style: const TextStyle(
                                      color: Color(0xFF64748B),
                                      fontSize: 15,
                                      height: 1.45,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 16),
                            Switch(
                              value: setting.enabled,
                              onChanged: (_) => handleToggle(setting.id),
                              activeColor: Colors.white,
                              activeTrackColor: const Color(0xFF0F172A),
                              inactiveThumbColor: Colors.white,
                              inactiveTrackColor: const Color(0xFFD1D5DB),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationSetting {
  const _NotificationSetting({
    required this.id,
    required this.title,
    required this.description,
    required this.enabled,
  });

  final String id;
  final String title;
  final String description;
  final bool enabled;

  _NotificationSetting copyWith({
    String? id,
    String? title,
    String? description,
    bool? enabled,
  }) {
    return _NotificationSetting(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      enabled: enabled ?? this.enabled,
    );
  }
}

class _SettingsHeader extends StatelessWidget {
  const _SettingsHeader({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 42),
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
