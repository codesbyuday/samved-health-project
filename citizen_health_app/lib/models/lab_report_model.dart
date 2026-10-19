class LabReportModel {
  final String reportId;
  final String? citizenId;
  final String? hospitalId;
  final String testName;
  final String? testCategory;
  final String hospitalName;
  final String? testDate;
  final String status;
  final String? result;
  final String? description;
  final String? reportFileUrl;

  LabReportModel({
    required this.reportId,
    this.citizenId,
    this.hospitalId,
    required this.testName,
    this.testCategory,
    required this.hospitalName,
    this.testDate,
    required this.status,
    this.result,
    this.description,
    this.reportFileUrl,
  });

  bool get isCompleted => status.toLowerCase() == 'completed';

  factory LabReportModel.fromJson(Map<String, dynamic> json) {
    // Handles both FastAPI schema and joined Supabase structure
    String extractedTestName = 'Diagnostic Test';
    if (json['test_name'] != null && json['test_name'].toString().isNotEmpty) {
      extractedTestName = json['test_name'].toString();
    } else if (json['test_types'] is Map && json['test_types']['test_name'] != null) {
      extractedTestName = json['test_types']['test_name'].toString();
    }

    String extractedHospitalName = 'Municipal Diagnostic Lab';
    if (json['hospital_name'] != null && json['hospital_name'].toString().isNotEmpty) {
      extractedHospitalName = json['hospital_name'].toString();
    } else if (json['hospitals'] is Map && json['hospitals']['name'] != null) {
      extractedHospitalName = json['hospitals']['name'].toString();
    }

    return LabReportModel(
      reportId: (json['report_id'] ?? json['id'] ?? '').toString(),
      citizenId: json['citizen_id']?.toString(),
      hospitalId: json['hospital_id']?.toString(),
      testName: extractedTestName,
      testCategory: json['test_category']?.toString(),
      hospitalName: extractedHospitalName,
      testDate: (json['test_date'] ?? json['created_at'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      result: json['result']?.toString(),
      description: json['description']?.toString(),
      reportFileUrl: (json['report_file_url'] ?? json['file_url'])?.toString(),
    );
  }
}
