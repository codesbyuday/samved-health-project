import 'package:flutter/material.dart';
import '../../services/citizen_service.dart';
import 'health_card_flutter.dart'; // 🔥 IMPORTANT: your provided file

class HealthCardScreen extends StatefulWidget {
  const HealthCardScreen({super.key});

  @override
  State<HealthCardScreen> createState() => _HealthCardScreenState();
}

class _HealthCardScreenState extends State<HealthCardScreen> {

  Citizen? citizenObj;
  String wardName = "";
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchCitizen();
  }

  Future<void> fetchCitizen() async {
    try {
      final citizen = await CitizenService.getCurrentProfile();

      if (citizen != null) {
        citizenObj = Citizen(
          citizenId: citizen.citizenId,
          name: citizen.name,
          gender: citizen.gender,
          dateOfBirth: citizen.dateOfBirth,
          age: citizen.age,
          bloodGroup: citizen.bloodGroup,
          wardNumber: citizen.wardNumber?.toString(),
          userPhotoUrl: citizen.userPhotoUrl,
          createdAt: citizen.createdAt != null ? DateTime.tryParse(citizen.createdAt!) : null,
        );

        wardName = citizen.wardNumber != null ? "Ward ${citizen.wardNumber}" : "Solapur Ward";
      }

      if (!mounted) return;
      setState(() => isLoading = false);
    } catch (e) {
      debugPrint("HealthCardScreen fetchCitizen error: $e");
      if (!mounted) return;
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {

    if (isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (citizenObj == null) {
      return const Scaffold(
        body: Center(child: Text("No data found")),
      );
    }

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
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Color(0xFF1565C0),
                      Color(0xFF1E88E5),
                      Color(0xFF42A5F5),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(30),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.arrow_back,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const Text(
                      "Health Card",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.credit_card,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      const SizedBox(height: 20),
                      HealthCard(
                        citizen: citizenObj!,
                        wardName: wardName,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
