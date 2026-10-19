import 'package:flutter/material.dart';

class FirstAidScreen extends StatelessWidget {
  const FirstAidScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("First Aid Guide"),
      ),

      body: ListView(
        padding: const EdgeInsets.all(16),

        children: const [

          ListTile(
            leading: Icon(Icons.favorite),
            title: Text("CPR Instructions"),
            subtitle: Text("Chest compressions for cardiac arrest"),
          ),

          ListTile(
            leading: Icon(Icons.local_fire_department),
            title: Text("Burn Treatment"),
            subtitle: Text("Cool the burn with running water"),
          ),

          ListTile(
            leading: Icon(Icons.healing),
            title: Text("Bleeding Control"),
            subtitle: Text("Apply firm pressure with cloth"),
          ),

          ListTile(
            leading: Icon(Icons.warning),
            title: Text("Choking Help"),
            subtitle: Text("Perform Heimlich maneuver"),
          ),

        ],
      ),
    );
  }
}