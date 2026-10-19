import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  Position? userPosition;

  final List<Map<String, dynamic>> hospitals = [
    {
      "name": "City Hospital",
      "lat": 18.5204,
      "lng": 73.8567,
    },
    {
      "name": "Apollo Clinic",
      "lat": 18.5230,
      "lng": 73.8582,
    },
    {
      "name": "Government Medical Center",
      "lat": 18.5250,
      "lng": 73.8601,
    }
  ];

  Map<String, dynamic>? nearestHospital;

  @override
  void initState() {
    super.initState();
    findNearestHospital();
  }

  Future<void> findNearestHospital() async {
    await Geolocator.requestPermission();

    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    userPosition = position;

    double minDistance = double.infinity;
    Map<String, dynamic>? closest;

    for (var hospital in hospitals) {
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        hospital["lat"],
        hospital["lng"],
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = hospital;
      }
    }

    if (!mounted) return;
    setState(() {
      nearestHospital = closest;
    });
  }

  void openMaps(double lat, double lng) async {
    final mapUrl =
        Uri.parse("https://www.google.com/maps/dir/?api=1&destination=$lat,$lng");
    await launchUrl(mapUrl, mode: LaunchMode.externalApplication);
  }

  void callAmbulance() async {
    final phone = Uri.parse("tel:102");
    await launchUrl(phone);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 54, 20, 56),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFFF5B5B),
                  Color(0xFFF03232),
                  Color(0xFFD62839),
                ],
              ),
              borderRadius: BorderRadius.vertical(
                bottom: Radius.circular(30),
              ),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Emergency Assistance',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Quick access to urgent support and nearby hospitals',
                  style: TextStyle(
                    color: Color(0xD9FFFFFF),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: nearestHospital == null
                ? const Center(child: CircularProgressIndicator())
                : Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: const [
                            BoxShadow(
                              color: Color(0x140F172A),
                              blurRadius: 24,
                              offset: Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              height: 96,
                              width: 96,
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFE4E6),
                                borderRadius: BorderRadius.circular(28),
                              ),
                              child: const Icon(
                                Icons.emergency_outlined,
                                color: Color(0xFFD62839),
                                size: 48,
                              ),
                            ),
                            const SizedBox(height: 22),
                            const Text(
                              "Nearest Hospital",
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF667085),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              nearestHospital!["name"],
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 28),
                            ElevatedButton.icon(
                              icon: const Icon(Icons.call),
                              label: const Text("Call Ambulance"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFD62839),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                              onPressed: callAmbulance,
                            ),
                            const SizedBox(height: 14),
                            OutlinedButton.icon(
                              icon: const Icon(Icons.navigation_outlined),
                              label: const Text("Get Directions"),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 24,
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                              onPressed: () {
                                openMaps(
                                  nearestHospital!["lat"],
                                  nearestHospital!["lng"],
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
