import 'package:flutter/material.dart';
import '../../models/ward_risk_model.dart';
import '../../services/surveillance_service.dart';

class SolapurRiskScreen extends StatelessWidget {
  const SolapurRiskScreen({super.key});

  Future<List<WardRiskModel>> getWardRisk() async {
    return await SurveillanceService.getWardRisks();
  }

  Color riskColor(String risk) {
    switch (risk.toLowerCase()) {
      case "high":
        return Colors.red;
      case "medium":
      case "moderate":
        return Colors.orange;
      case "low":
        return Colors.green;
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      appBar: AppBar(
        title: const Text("Solapur Risk Overview"),
        backgroundColor: const Color(0xFF1565C0),
        foregroundColor: Colors.white,
      ),
      body: FutureBuilder<List<WardRiskModel>>(
        future: getWardRisk(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
              child: Text(
                "No ward data available",
                style: TextStyle(color: Color(0xFF64748B), fontSize: 16),
              ),
            );
          }

          final wards = snapshot.data!;

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: wards.length,
            itemBuilder: (context, index) {
              final ward = wards[index];
              final wardName = ward.wardName;
              final risk = ward.riskLevel;
              final healthIndex = ward.healthIndex?.toStringAsFixed(1) ?? "-";

              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: riskColor(risk).withOpacity(0.15),
                    child: Icon(
                      Icons.warning_amber_rounded,
                      color: riskColor(risk),
                    ),
                  ),
                  title: Text(
                    wardName,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  subtitle: Text("Health Index: $healthIndex"),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: riskColor(risk).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      risk,
                      style: TextStyle(
                        color: riskColor(risk),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}