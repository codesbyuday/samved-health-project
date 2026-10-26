import 'package:flutter/material.dart';
import '../../config/supabase_config.dart';

class PatientHealthRecordScreen extends StatelessWidget {

  final String citizenId;

  const PatientHealthRecordScreen({
    super.key,
    required this.citizenId,
  });

  Future<Map<String, dynamic>> loadPatientData() async {

    final citizen = await supabase
        .from('citizens')
        .select()
        .eq('citizen_id', citizenId)
        .single();

    final records = await supabase
        .from('health_records')
        .select()
        .eq('citizen_id', citizenId);

    final reports = await supabase
        .from('diagnostic_reports')
        .select()
        .eq('citizen_id', citizenId);

    final vaccines = await supabase
        .from('vaccination_records')
        .select()
        .eq('citizen_id', citizenId);

    return {
      "citizen": citizen,
      "records": records,
      "reports": reports,
      "vaccines": vaccines
    };
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Patient Health Record"),
      ),

      body: FutureBuilder(
        future: loadPatientData(),

        builder: (context, snapshot) {

          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final data = snapshot.data!;
          final citizen = data["citizen"];
          final records = data["records"];

          return ListView(
            padding: const EdgeInsets.all(16),

            children: [

              Text(
                citizen['name'],
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),

              Text("Blood Group: ${citizen['blood_group']}"),
              Text("Ward: ${citizen['ward_number']}"),

              const SizedBox(height: 20),

              const Text(
                "Medical History",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),

              ...records.map<Widget>((record) {

                return ListTile(
                  leading: const Icon(Icons.medical_services),

                  title: Text(record['diagnosis'] ?? "Consultation"),

                  subtitle: Text(
                    record['visit_date']?.toString() ?? "",
                  ),
                );

              }).toList(),

            ],
          );
        },
      ),
    );
  }
}