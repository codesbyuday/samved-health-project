import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/hospital_model.dart';
import '../../services/hospital_service.dart';

class EmergencyActionScreen extends StatefulWidget {
  final String emergencyType;

  const EmergencyActionScreen({
    super.key,
    required this.emergencyType,
  });

  @override
  State<EmergencyActionScreen> createState() =>
      _EmergencyActionScreenState();
}

class _EmergencyActionScreenState
    extends State<EmergencyActionScreen> {
  
  Future<void> callEmergency() async {
    final number =
        widget.emergencyType == "Fire Emergency"
            ? "101"
            : "108";

    final uri = Uri.parse("tel:$number");

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<Position> getUserLocation() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw Exception("Location service disabled");
    }

    var permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    return Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  Future<void> openNearestHospital() async {
    final position = await getUserLocation();

    final hospitals = await HospitalService.getHospitals();
    if (hospitals.isEmpty) return;

    HospitalModel? nearest;
    double nearestDistance = double.infinity;

    for (final hospital in hospitals) {
      final lat = hospital.latitude;
      final lng = hospital.longitude;
      if (lat == null || lng == null) continue;

      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        lat,
        lng,
      ) / 1000;

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = hospital;
      }
    }

    if (nearest == null) return;

    final url = Uri.parse(
      "https://www.google.com/maps/dir/?api=1&destination=${nearest.latitude},${nearest.longitude}",
    );

    await launchUrl(
      url,
      mode: LaunchMode.externalApplication,
    );
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
                  'Emergency Response',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Immediate assistance is being prepared',
                  style: TextStyle(
                    color: Color(0xD9FFFFFF),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Center(
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
                      Text(
                        widget.emergencyType,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        "Call emergency services immediately or navigate to the nearest hospital.",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          height: 1.55,
                          color: Color(0xFF667085),
                        ),
                      ),
                      const SizedBox(height: 28),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.call),
                        label: Text(
                          widget.emergencyType == "Fire Emergency"
                          ? "Call Fire Brigade"
                          : "Call Ambulance"),
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
                        onPressed: callEmergency,
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
                        onPressed: openNearestHospital,
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
