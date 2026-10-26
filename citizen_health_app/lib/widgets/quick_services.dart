import 'package:flutter/material.dart';
import '../screens/hospitals/hospital_finder_screen.dart';
import '../screens/appointment/appointment_form_screen.dart';
import '../screens/emergency/emergency_assistance_screen.dart';
import '../screens/telemedicine/telemedicine_screen.dart';

class QuickServices extends StatelessWidget {
  const QuickServices({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1.02,
      children: [
        serviceCard(
          context,
          Icons.calendar_month,
          "Book Appointment",
          const Color(0xFF1565C0),
          Colors.white,
          const AppointmentFormScreen(
            appointmentType: "doctor",
          ),
        ),

        serviceCard(
          context,
          Icons.location_on,
          "Find Hospitals",
          const Color(0xFF2E7D32),
          Colors.white,
          const HospitalFinderScreen(),
        ),

        serviceCard(
          context,
          Icons.videocam,
          "Telemedicine",
          const Color(0xFFEF6C00),
          Colors.white,
          const TelemedicineScreen(),
        ),

        serviceCard(
          context,
          Icons.call,
          "Emergency Help",
          const Color(0xFFC2185B),
          Colors.white,
          const EmergencyAssistanceScreen(),
        ),
      ],
    );
  }

  Widget serviceCard(
    BuildContext context,
    IconData icon,
    String title,
    Color iconBackground,
    Color iconColor,
    Widget screen,
  ) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => screen,
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: const [
            BoxShadow(
              color: Color(0x12000000),
              blurRadius: 20,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconBackground,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 28, color: iconColor),
            ),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1A2B49),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
