import 'package:flutter/material.dart';
import '../../services/appointment_service.dart';
import '../../services/auth_service.dart';
import '../../services/hospital_service.dart';
import 'appointment_confirmation_screen.dart';

class AppointmentFormScreen extends StatefulWidget {
  final String appointmentType;
  final String? selectedHospitalId;

  const AppointmentFormScreen({
    Key? key,
    required this.appointmentType,
    this.selectedHospitalId,
  }) : super(key: key);

  @override
  State<AppointmentFormScreen> createState() => _AppointmentFormScreenState();
}

class _AppointmentFormScreenState extends State<AppointmentFormScreen> {
  String? selectedHospitalId;
  String? selectedDepartment;
  String? selectedDoctorId;
  String? selectedDoctorName;
  DateTime? selectedDate;
  String? selectedTimeSlot;

  List<dynamic> hospitals = [];
  List<String> departments = [];
  List<dynamic> doctors = [];

  List<String> timeSlots = [];

  @override
  void initState() {
    super.initState();
    selectedHospitalId = widget.selectedHospitalId;
    fetchHospitals();

    if (selectedHospitalId != null) {
      fetchDepartments(selectedHospitalId!);
    }
  }

  String mapAppointmentType(String type) {
    switch (type.toLowerCase()) {
      case "doctor":
      case "department":
      case "general":
        return "in_person";
      case "telemedicine":
        return "telemedicine";
      case "emergency":
        return "emergency";
      default:
        return "in_person";
    }
  }

  Future<void> fetchHospitals() async {
    try {
      final list = await HospitalService.getHospitals();
      if (!mounted) return;

      setState(() {
        hospitals = list.map((h) => {
          'hospital_id': h.hospitalId,
          'name': h.name,
        }).toList();
      });
    } catch (e) {
      debugPrint("Hospital Error : $e");
      if (!mounted) return;
      setState(() {
        hospitals = [];
      });
    }
  }

  Future<void> fetchDepartments(String hospitalId) async {
    try {
      final list = await HospitalService.getDepartments(hospitalId);
      if (!mounted) return;

      setState(() {
        departments = list;
      });
    } catch (e) {
      debugPrint("Department Error : $e");
      if (!mounted) return;
      setState(() {
        departments = [];
      });
    }
  }

  Future<void> fetchDoctors(
      String hospitalId,
      String department,
  ) async {
    try {
      final list = await HospitalService.getDoctors(hospitalId: hospitalId, department: department);
      if (!mounted) return;

      setState(() {
        doctors = list.map((d) => {
          'staff_uuid': d.staffUuid,
          'name': d.name,
          'department': d.department,
          'specialization': d.specialization,
          'consultation_time': d.consultationTime,
          'work_start_time': d.workStartTime ?? '09:00:00',
          'work_end_time': d.workEndTime ?? '17:00:00',
          'break_start_time': d.breakStartTime ?? '13:00:00',
          'break_end_time': d.breakEndTime ?? '14:00:00',
        }).toList();
      });

      if (selectedDate != null) {
        await loadAvailableSlots();
      }
    } catch (e) {
      debugPrint("Doctor Error : $e");
      if (!mounted) return;
      setState(() {
        doctors = [];
      });
      if (selectedDate != null) {
        await loadAvailableSlots();
      }
    }
  }

  Future<String?> getCitizenId() async {
    return await AuthService.getCurrentCitizenId();
  }

  TimeOfDay _parseTime(String value) {
    final parts = value.split(":");
    return TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts[1]),
    );
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? "AM" : "PM";

    return "$hour:$minute $period";
  }

  TimeOfDay _addMinutes(TimeOfDay time, int minutes) {
    final total = time.hour * 60 + time.minute + minutes;

    return TimeOfDay(
      hour: total ~/ 60,
      minute: total % 60,
    );
  }

  Future<void> loadAvailableSlots() async {
    if (selectedDate == null) return;

    Map<String, dynamic>? selectedDoc;
    if (selectedDoctorId != null) {
      for (final d in doctors) {
        if (d['staff_uuid'] == selectedDoctorId) {
          selectedDoc = d;
          break;
        }
      }
    }

    final start = _parseTime(selectedDoc?['work_start_time'] ?? '09:00:00');
    final end = _parseTime(selectedDoc?['work_end_time'] ?? '17:00:00');
    final breakStart = _parseTime(selectedDoc?['break_start_time'] ?? '13:00:00');
    final breakEnd = _parseTime(selectedDoc?['break_end_time'] ?? '14:00:00');
    final duration = (selectedDoc?['consultation_time'] as int?) ?? 15;

    List<String> generated = [];
    TimeOfDay current = start;

    while ((current.hour * 60 + current.minute) < (end.hour * 60 + end.minute)) {
      final next = _addMinutes(current, duration);
      final currentMinutes = current.hour * 60 + current.minute;
      final breakStartMinutes = breakStart.hour * 60 + breakStart.minute;
      final breakEndMinutes = breakEnd.hour * 60 + breakEnd.minute;

      if (currentMinutes >= breakStartMinutes && currentMinutes < breakEndMinutes) {
        current = next;
        continue;
      }

      final slot = _formatTime(current);
      generated.add(slot);
      current = next;
    }

    if (!mounted) return;
    setState(() {
      timeSlots = generated;
    });
  }

  Future<void> bookAppointment() async {
    if (selectedHospitalId == null ||
        selectedDepartment == null ||
        selectedDate == null ||
        selectedTimeSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill all fields")),
      );
      return;
    }

    final citizenId = await getCitizenId();
    if (!mounted) return;
    if (citizenId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("User not found")),
      );
      return;
    }

    final date = selectedDate!.toIso8601String().split('T')[0];

    try {
      final appointment = await AppointmentService.bookAppointment(
        hospitalId: selectedHospitalId!,
        doctorId: selectedDoctorId,
        appointmentType: mapAppointmentType(widget.appointmentType),
        appointmentDate: date,
        timeSlot: selectedTimeSlot!,
      );

      final token = appointment?.tokenId ?? 1;

      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => AppointmentConfirmationScreen(
            token: token,
            doctorName: selectedDoctorName ?? "General",
            date: date,
            timeSlot: selectedTimeSlot!,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Booking Error: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 56),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF4F46E5),
                    Color(0xFF2563EB),
                    Color(0xFF06B6D4),
                  ],
                ),
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x1A2563EB),
                    blurRadius: 24,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Book Appointment',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Choose hospital, department, doctor and time slot',
                    style: TextStyle(
                      color: Color(0xD9FFFFFF),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _FormShell(
                    child: DropdownButtonFormField<String>(
                      value: selectedHospitalId,
                      decoration: _inputDecoration('Select Hospital'),
                      items: hospitals.map<DropdownMenuItem<String>>((h) {
                        return DropdownMenuItem<String>(
                          value: h['hospital_id'] as String,
                          child: Text(h['name'] as String),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          selectedHospitalId = value;
                          selectedDepartment = null;
                          selectedDoctorId = null;
                          doctors = [];
                        });
                        fetchDepartments(value!);
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  _FormShell(
                    child: DropdownButtonFormField<String>(
                      value: selectedDepartment,
                      decoration: _inputDecoration('Select Department'),
                      items: departments.map((d) {
                        return DropdownMenuItem<String>(
                          value: d,
                          child: Text(d),
                        );
                      }).toList(),
                      onChanged: (value) async {
                        if (value == null) return;
                        setState(() {
                          selectedDepartment = value;
                          selectedDoctorId = null;
                          selectedDoctorName = null;
                          selectedTimeSlot = null;
                          doctors = [];
                        });
                        await fetchDoctors(selectedHospitalId!, value);
                        if (selectedDate != null) {
                          await loadAvailableSlots();
                        }
                      },
                    ),
                  ),
                  if (doctors.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _FormShell(
                      child: DropdownButtonFormField<String?>(
                        value: selectedDoctorId,
                        decoration: _inputDecoration('Select Doctor (Optional)'),
                        items: [
                          const DropdownMenuItem<String?>(
                            value: null,
                            child: Text('Any Available Doctor (General)'),
                          ),
                          ...doctors.map<DropdownMenuItem<String?>>((doc) {
                            return DropdownMenuItem<String?>(
                              value: doc['staff_uuid'] as String,
                              child: Text(doc['name'] as String),
                            );
                          }),
                        ],
                        onChanged: (value) async {
                          final doc = doctors.cast<Map<String, dynamic>?>().firstWhere(
                            (e) => e?['staff_uuid'] == value,
                            orElse: () => null,
                          );

                          setState(() {
                            selectedDoctorId = value;
                            selectedDoctorName = doc?['name'] as String?;
                            selectedTimeSlot = null;
                          });

                          if (selectedDate != null) {
                            await loadAvailableSlots();
                          }
                        },
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  _FormShell(
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: selectedDate ?? DateTime.now(),
                          firstDate: DateTime.now(),
                          lastDate: DateTime(2030),
                        );

                        if (picked != null) {
                          if (!mounted) return;

                          setState(() {
                            selectedDate = picked;
                            selectedTimeSlot = null;
                          });

                          await loadAvailableSlots();
                        }
                      },
                      child: InputDecorator(
                        decoration: _inputDecoration('Select Date'),
                        child: Text(
                          selectedDate == null
                              ? 'Choose appointment date'
                              : selectedDate!.toString().split(' ')[0],
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Available Time Slots',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (selectedDate == null)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(
                          "Please select a date to view available time slots.",
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    )
                  else if (timeSlots.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Center(
                        child: Text(
                          "No available slots for the selected date.",
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 15,
                          ),
                        ),
                      ),
                    )
                  else
                  GridView.builder(
                    itemCount: timeSlots.length,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 2.6,
                    ),
                    itemBuilder: (context, index) {
                      final slot = timeSlots[index];
                      final selected = selectedTimeSlot == slot;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            selectedTimeSlot = slot;
                          });
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          decoration: BoxDecoration(
                            gradient: selected
                                ? const LinearGradient(
                                    colors: [Color(0xFF4F46E5), Color(0xFF2563EB)],
                                  )
                                : null,
                            color: selected ? null : Colors.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: selected
                                  ? Colors.transparent
                                  : const Color(0xFFDCE5F5),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: selected
                                    ? const Color(0x224F46E5)
                                    : const Color(0x120F172A),
                                blurRadius: 14,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              slot,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: selected ? Colors.white : const Color(0xFF334155),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: bookAppointment,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                      ),
                      child: const Text(
                        "Book Appointment",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: const Color(0xFFF8FAFF),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFDCE5F5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFFDCE5F5)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.4),
      ),
    );
  }
}

class _FormShell extends StatelessWidget {
  const _FormShell({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}
