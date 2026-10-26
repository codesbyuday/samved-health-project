import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'patient_health_record_screen.dart';

class ScanHealthCardScreen extends StatelessWidget {
  const ScanHealthCardScreen({super.key});

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Scan Citizen Health Card"),
      ),

      body: MobileScanner(

        onDetect: (BarcodeCapture capture) {

          final List<Barcode> barcodes = capture.barcodes;

          for (final barcode in barcodes) {

            final String? citizenId = barcode.rawValue;

            if (citizenId != null) {

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      PatientHealthRecordScreen(citizenId: citizenId),
                ),
              );

              break; // stop scanning after first detection
            }
          }
        },
      ),
    );
  }
}