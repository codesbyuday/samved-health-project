class WardRiskModel {
  final int wardNumber;
  final String wardName;
  final double? healthIndex;
  final String riskLevel; // Low, Medium, High
  final int? population;
  final int? activeCases;
  final String? zone;
  final int? totalDoctors;
  final int? totalBeds;
  final int? totalDeaths;
  final double? zoneRiskScore;

  WardRiskModel({
    required this.wardNumber,
    required this.wardName,
    this.healthIndex,
    required this.riskLevel,
    this.population,
    this.activeCases,
    this.zone,
    this.totalDoctors,
    this.totalBeds,
    this.totalDeaths,
    this.zoneRiskScore,
  });

  factory WardRiskModel.fromJson(Map<String, dynamic> json) {
    final rawWardNum = json['ward_id'] ??
        json['ward_number'] ??
        json['ward'] ??
        (json['wards'] is Map ? (json['wards']['ward_id'] ?? json['wards']['ward_number']) : null);
    final wardNum = rawWardNum is int
        ? rawWardNum
        : (int.tryParse(rawWardNum?.toString() ?? '') ?? 0);

    String extractedWardName = 'Ward $wardNum';
    if (json['ward_name'] != null && json['ward_name'].toString().trim().isNotEmpty) {
      extractedWardName = json['ward_name'].toString().trim();
    } else if (json['wards'] is Map && json['wards']['ward_name'] != null) {
      extractedWardName = json['wards']['ward_name'].toString().trim();
    }

    return WardRiskModel(
      wardNumber: wardNum,
      wardName: extractedWardName,
      healthIndex: json['health_index'] != null ? double.tryParse(json['health_index'].toString()) : null,
      riskLevel: (json['risk_level'] ?? json['risk_grade'] ?? 'Low').toString(),
      population: json['population'] is int ? json['population'] : int.tryParse(json['population']?.toString() ?? ''),
      activeCases: json['active_cases'] is int ? json['active_cases'] : int.tryParse(json['active_cases']?.toString() ?? ''),
      zone: json['zone']?.toString(),
      totalDoctors: json['total_doctors'] is int ? json['total_doctors'] : int.tryParse(json['total_doctors']?.toString() ?? ''),
      totalBeds: json['total_beds'] is int ? json['total_beds'] : int.tryParse(json['total_beds']?.toString() ?? ''),
      totalDeaths: json['total_deaths'] is int ? json['total_deaths'] : int.tryParse(json['total_deaths']?.toString() ?? ''),
      zoneRiskScore: json['zone_risk_score'] != null ? double.tryParse(json['zone_risk_score'].toString()) : null,
    );
  }
}
