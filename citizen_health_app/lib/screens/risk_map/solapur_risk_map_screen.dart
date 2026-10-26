import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../services/surveillance_service.dart';

class SolapurRiskMapScreen extends StatefulWidget {
  const SolapurRiskMapScreen({super.key});

  @override
  State<SolapurRiskMapScreen> createState() => _SolapurRiskMapScreenState();
}

class _SolapurRiskMapScreenState extends State<SolapurRiskMapScreen> {

  List<Polygon> wardPolygons = [];
  List<Marker> wardLabels = [];

  int? selectedWard;
  Map<int, Map<String, dynamic>> wardData = {};

  @override
  void initState() {
    super.initState();
    loadMap();
  }

  Color getRiskColor(String risk) {
    switch (risk.toLowerCase()) {
      case "high":
        return Colors.red;
      case "moderate":
        return Colors.orange;
      case "low":
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Future<void> loadMap() async {

    final geojsonString =
        await rootBundle.loadString('assets/maps/solapur_maps.geojson');

    final geojson = jsonDecode(geojsonString);

    final wardRisks = await SurveillanceService.getWardRisks();

    wardData.clear();

    for (var item in wardRisks) {
      wardData[item.wardNumber] = {
        "risk": item.riskLevel,
        "name": item.wardName,
        "health_index": item.healthIndex,
      };
    }

    List<Polygon> polygons = [];
    List<Marker> labels = [];

    for (var feature in geojson['features']) {

      final wardNo = feature['properties']['ward'];
      final coords = feature['geometry']['coordinates'][0];

      List<LatLng> points = coords.map<LatLng>((c) {
        return LatLng(c[1], c[0]);
      }).toList();

      final wardInfo = wardData[wardNo];

      String risk = wardInfo?['risk'] ?? "low";
      String name = wardInfo?['name'] ?? "Ward $wardNo";

      Color baseColor = getRiskColor(risk);

      // 🔥 Highlight selected ward
      Color color = (selectedWard == wardNo)
          ? Colors.blue.withOpacity(0.7)
          : baseColor.withOpacity(0.5);

      polygons.add(
        Polygon(
          points: points,
          borderStrokeWidth: selectedWard == wardNo ? 4 : 2,
          borderColor: Colors.black,
          color: color,
        ),
      );

      // 🔥 Center calculation
      double lat = 0;
      double lng = 0;

      for (var p in points) {
        lat += p.latitude;
        lng += p.longitude;
      }

      lat /= points.length;
      lng /= points.length;

      // 🔥 Label (ward number + name)
      labels.add(
        Marker(
          point: LatLng(lat, lng),
          width: 140,
          height: 60,
          child: GestureDetector(
            onTap: () {
              onWardTap(wardNo);
            },
            child: Container(
              alignment: Alignment.center,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    "W$wardNo",
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: Colors.black,
                    ),
                  ),
                  Text(
                    name,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    setState(() {
      wardPolygons = polygons;
      wardLabels = labels;
    });
  }

  // 🔥 Tap handler
  void onWardTap(int wardNo) {

    final wardInfo = wardData[wardNo];

    setState(() {
      selectedWard = wardNo;
    });

    showModalBottomSheet(
      context: context,
      builder: (_) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                wardInfo?['name'] ?? "Ward $wardNo",
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              Text("Risk: ${wardInfo?['risk']}"),
              Text("Health Index: ${wardInfo?['health_index']}"),
            ],
          ),
        );
      },
    );

    // 🔥 Reload map for highlight
    loadMap();
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Solapur Risk Overview"),
      ),

      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 500),
        child: FlutterMap(
          key: ValueKey(selectedWard),
          options: MapOptions(
            initialCenter: LatLng(17.6599, 75.9064),
            initialZoom: 12,
          ),

          children: [

            TileLayer(
              urlTemplate:
                  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
              subdomains: const ['a', 'b', 'c'],
              userAgentPackageName: 'com.example.citizen_health_app',
            ),

            PolygonLayer(
              polygons: wardPolygons,
            ),

            MarkerLayer(
              markers: wardLabels,
            ),
          ],
        ),
      ),
    );
  }
}