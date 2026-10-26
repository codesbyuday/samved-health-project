import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/hospital_model.dart';
import '../../services/hospital_service.dart';
import '../appointment/appointment_form_screen.dart';

class HospitalFinderScreen extends StatefulWidget {
  const HospitalFinderScreen({super.key});

  @override
  State<HospitalFinderScreen> createState() => _HospitalFinderScreenState();
}

class _HospitalFinderScreenState extends State<HospitalFinderScreen> {
  List<Map<String, dynamic>> hospitals = [];
  bool isLoading = true;
  String errorMessage = "";

  @override
  void initState() {
    super.initState();
    loadNearbyHospitals();
  }

  Future<Position?> getUserLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (_) {
      return null;
    }
  }

  double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2) / 1000;
  }

  Future<void> loadNearbyHospitals() async {
    try {
      final userPosition = await getUserLocation();
      final List<HospitalModel> hospitalList = await HospitalService.getHospitals();

      if (hospitalList.isEmpty) {
        throw Exception('No hospitals are currently available.');
      }

      // Default Solapur City Center coordinates
      final userLat = userPosition?.latitude ?? 17.6599;
      final userLng = userPosition?.longitude ?? 75.9064;

      final tempList = hospitalList.map<Map<String, dynamic>>((h) {
        final lat = h.latitude ?? 17.6599;
        final lng = h.longitude ?? 75.9064;

        final distance = calculateDistance(
          userLat,
          userLng,
          lat,
          lng,
        );

        return {
          'hospital_id': h.hospitalId,
          'name': h.name,
          'type': h.type ?? 'General Hospital',
          'address': h.address ?? 'Solapur Municipal Corporation',
          'contact_number': h.contactNumber ?? '+91 217 2740300',
          'email': h.email,
          'verified_by_smc': h.verifiedBySmc,
          'lat': lat,
          'lng': lng,
          'distance': distance,
        };
      }).toList();

      tempList.sort((a, b) => (a['distance'] as num).compareTo(b['distance'] as num));

      if (!mounted) return;
      setState(() {
        hospitals = tempList;
        isLoading = false;
        errorMessage = "";
      });
    } catch (e) {
      debugPrint("HospitalFinderScreen loadNearbyHospitals error: $e");
      if (!mounted) return;
      setState(() {
        isLoading = false;
        errorMessage = e.toString();
      });
    }
  }

  Future<void> openMaps(double lat, double lng) async {
    final url = Uri.parse(
      "https://www.google.com/maps/dir/?api=1&destination=$lat,$lng",
    );

    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw Exception("Could not launch maps");
    }
  }

  Future<void> callHospital(String phone) async {
    final url = Uri.parse("tel:$phone");
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  @override
  Widget build(BuildContext context) {
    debugPrint(
      "BUILD -> isLoading=$isLoading, hospitals=${hospitals.length}, error='$errorMessage'",
    );
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: Column(
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
                  Color(0xFF0EA5E9),
                  Color(0xFF2563EB),
                  Color(0xFF4F46E5),
                ],
              ),
              borderRadius: BorderRadius.vertical(
                bottom: Radius.circular(30),
              ),
              boxShadow: [
                BoxShadow(
                  color: Color(0x1A2563EB),
                  blurRadius: 24,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Nearby Hospitals',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Find nearby facilities and book appointments quickly',
                  style: TextStyle(
                    color: Color(0xD9FFFFFF),
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : errorMessage.isNotEmpty
                    ? Center(
                        child: Text(
                          errorMessage,
                          style: const TextStyle(color: Colors.red),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: hospitals.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 14),
                        itemBuilder: (context, index) {
                          debugPrint("Building hospital ${hospitals[index]['name']}");
                          final h = hospitals[index];
                          return _HospitalCard(
                            hospital: h,
                            onDirections: () => openMaps(
                              (h['lat'] as num).toDouble(),
                              (h['lng'] as num).toDouble(),
                            ),
                            onBook: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => AppointmentFormScreen(
                                    appointmentType: "general",
                                    selectedHospitalId: h['hospital_id'],
                                  ),
                                ),
                              );
                            },
                            onCall: h['contact_number'] != null
                                ? () => callHospital(h['contact_number'].toString())
                                : null,
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _HospitalCard extends StatelessWidget {
  const _HospitalCard({
    required this.hospital,
    required this.onDirections,
    required this.onBook,
    required this.onCall,
  });

  final Map hospital;
  final VoidCallback onDirections;
  final VoidCallback onBook;
  final VoidCallback? onCall;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onDirections,
        borderRadius: BorderRadius.circular(24),
        child: Container(
          padding: const EdgeInsets.all(18),
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
              Text(
                hospital['name']?.toString() ?? '',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                hospital['address']?.toString() ?? 'Address not available',
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: Color(0xFF667085),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                '${(hospital['distance'] as num).toStringAsFixed(2)} km away',
                style: const TextStyle(
                  color: Color(0xFF2563EB),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onDirections,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: const Icon(Icons.map_outlined),
                      label: const Text('Directions'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onBook,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: const Icon(Icons.calendar_month),
                      label: const Text('Book'),
                    ),
                  ),
                  if (onCall != null) ...[
                    const SizedBox(width: 10),
                    InkWell(
                      onTap: onCall,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF3),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.call,
                          color: Color(0xFF16A34A),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
