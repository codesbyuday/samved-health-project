import 'package:flutter/material.dart';

class AppointmentConfirmationScreen extends StatelessWidget {

  final int token;
  final String doctorName;
  final String date;
  final String timeSlot;

  const AppointmentConfirmationScreen({
    super.key,
    required this.token,
    required this.doctorName,
    required this.date,
    required this.timeSlot,
  });

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(title: const Text("Appointment Confirmed")),

      body: Center(
        child: Card(
          margin: const EdgeInsets.all(20),
          child: Padding(
            padding: const EdgeInsets.all(20),

            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [

                const Icon(Icons.check_circle,
                    color: Colors.green, size: 60),

                const SizedBox(height: 20),

                const Text("Appointment Booked!",
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold)),

                const SizedBox(height: 20),

                Text("Doctor: $doctorName"),
                Text("Date: $date"),
                Text("Time: $timeSlot"),

                const SizedBox(height: 20),

                Text(
                  "Token Number: $token",
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}