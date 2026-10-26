import 'package:flutter/material.dart';

class HealthScreen extends StatelessWidget {
  const HealthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Health"),
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),

        child: Column(
          children: [

            // My Health Card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),

              child: ListTile(
                leading: const Icon(Icons.credit_card, color: Colors.teal),
                title: const Text("My Health Card"),
                subtitle: const Text("View your digital health ID"),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {},
              ),
            ),

            const SizedBox(height: 15),

            // Medical History
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),

              child: ListTile(
                leading: const Icon(Icons.history, color: Colors.teal),
                title: const Text("Medical History"),
                subtitle: const Text("Prescriptions & lab reports"),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {},
              ),
            ),

            const SizedBox(height: 15),

            // Vaccination Records
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),

              child: ListTile(
                leading: const Icon(Icons.vaccines, color: Colors.teal),
                title: const Text("Vaccination Records"),
                subtitle: const Text("Track your vaccinations"),
                trailing: const Icon(Icons.arrow_forward_ios),
                onTap: () {},
              ),
            ),

          ],
        ),
      ),
    );
  }
}