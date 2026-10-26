import 'package:flutter/material.dart';

class UpdateDetailsScreen extends StatelessWidget {

  final String title;
  final String description;

  const UpdateDetailsScreen({
    super.key,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Update Details"),
      ),

      body: Padding(
        padding: const EdgeInsets.all(20),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [

            Text(
              title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 20),

            Text(
              description,
              style: const TextStyle(fontSize: 16),
            ),

            const SizedBox(height: 20),

            const Text(
              "Issued by: Solapur Municipal Corporation",
            ),

            const Text(
              "Date: 10 March 2026",
            ),
          ],
        ),
      ),
    );
  }
}