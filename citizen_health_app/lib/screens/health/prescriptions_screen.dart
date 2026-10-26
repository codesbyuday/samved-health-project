// import 'package:flutter/material.dart';
// import '../../config/supabase_config.dart';
// import 'package:shared_preferences/shared_preferences.dart';

// class PrescriptionsScreen extends StatelessWidget {
//   const PrescriptionsScreen({super.key});

//   Future<List<dynamic>> getPrescriptions() async {

//     final prefs = await SharedPreferences.getInstance();
//     final userId = prefs.getString('user_id');

//     if (userId == null) return [];

//     /// find citizen id
//     final citizen = await supabase
//         .from('citizens')
//         .select()
//         .eq('user_id', userId)
//         .single();

//     final citizenId = citizen['citizen_id'];

//     /// fetch prescriptions
//     final records = await supabase
//         .from('health_records')
//         .select()
//         .eq('citizen_id', citizenId)
//         .not('prescription', 'is', null)
//         .order('visit_date', ascending: false);

//     return records;
//   }

//   @override
//   Widget build(BuildContext context) {

//     return Scaffold(
//       appBar: AppBar(
//         title: const Text("Prescriptions"),
//       ),

//       body: FutureBuilder(
//         future: getPrescriptions(),

//         builder: (context, snapshot) {

//           if (snapshot.connectionState == ConnectionState.waiting) {
//             return const Center(child: CircularProgressIndicator());
//           }

//           if (!snapshot.hasData || snapshot.data!.isEmpty) {
//             return const Center(child: Text("No prescriptions found"));
//           }

//           final records = snapshot.data!;

//           return ListView.builder(
//             padding: const EdgeInsets.all(16),
//             itemCount: records.length,

//             itemBuilder: (context, index) {

//               final record = records[index];

//               return Card(
//                 child: ListTile(

//                   leading: const Icon(
//                     Icons.medication,
//                     color: Colors.teal,
//                   ),

//                   title: Text(record['prescription'] ?? "Prescription"),

//                   subtitle: Text(
//                     "${record['diagnosis'] ?? ""} • ${record['visit_date'] ?? ""}",
//                   ),

//                 ),
//               );
//             },
//           );
//         },
//       ),
//     );
//   }
// }