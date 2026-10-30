import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../config/api_config.dart';
import '../config/supabase_config.dart';
import '../models/lab_report_model.dart';
import '../models/laboratory_model.dart';
import 'api_client.dart';
import 'auth_service.dart';

class LabService {
  /// PostGIS WKB hex decoder for geographic point coordinates
  static (double?, double?) _parseWkbPoint(String? wkbHex) {
    if (wkbHex == null || wkbHex.isEmpty || wkbHex.length < 50) return (null, null);
    try {
      final clean = wkbHex.trim();
      final bytes = Uint8List(clean.length ~/ 2);
      for (int i = 0; i < clean.length; i += 2) {
        bytes[i ~/ 2] = int.parse(clean.substring(i, i + 2), radix: 16);
      }
      final byteData = ByteData.sublistView(bytes);
      final isLittleEndian = bytes[0] == 1;
      final endian = isLittleEndian ? Endian.little : Endian.big;
      final lon = byteData.getFloat64(9, endian);
      final lat = byteData.getFloat64(17, endian);
      return (
        double.parse(lat.toStringAsFixed(6)),
        double.parse(lon.toStringAsFixed(6)),
      );
    } catch (_) {
      return (null, null);
    }
  }

  /// Calculates distance in km between two coordinate points
  static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    try {
      final meters = Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
      return double.parse((meters / 1000).toStringAsFixed(2));
    } catch (_) {
      return 0.0;
    }
  }

  /// Clinical protocol metadata mapping for preparation and turnaround time
  static Map<String, String> getClinicalMetadata(String testName, String? category) {
    final nameLower = testName.toLowerCase();
    final catLower = (category ?? '').toLowerCase();

    String sampleType = 'Venous Blood Sample';
    String prep = 'No special preparation required. Maintain routine hydration.';
    String turnaround = 'Within 6-12 hours';

    if (nameLower.contains('urine') || nameLower.contains('urinalysis')) {
      sampleType = 'Midstream Clean-Catch Urine';
      prep = 'Collect first-morning urine sample in sterile container provided by laboratory.';
      turnaround = 'Within 4-6 hours';
    } else if (nameLower.contains('sputum')) {
      sampleType = 'Early Morning Sputum';
      prep = 'Rinse mouth with water and collect deep cough sputum in sterile container before eating.';
      turnaround = 'Within 24-48 hours';
    } else if (nameLower.contains('culture') || catLower.contains('microbiology')) {
      sampleType = 'Blood / Specimen Culture';
      prep = 'Sample should be collected prior to starting antibiotic therapy if possible.';
      turnaround = 'Within 48-72 hours (Incubation required)';
    } else if (nameLower.contains('x-ray')) {
      sampleType = 'Digital Radiography Imaging';
      prep = 'Remove metallic objects, jewelry, and belts before entering scan room.';
      turnaround = 'Within 1-2 hours';
    } else if (nameLower.contains('ct scan') || nameLower.contains('mri') || catLower.contains('radiology')) {
      sampleType = 'Medical Imaging (Radiology)';
      prep = 'Fasting for 4 hours may be required if contrast agent is administered. Remove all metals.';
      turnaround = 'Within 4-8 hours (Radiologist report)';
    } else if (nameLower.contains('ecg') || catLower.contains('cardiology')) {
      sampleType = 'Electrocardiogram Recording';
      prep = 'Avoid heavy caffeine or strenuous exercise 2 hours before the recording.';
      turnaround = 'Immediate (Within 30 mins)';
    } else if (nameLower.contains('ultrasound') || nameLower.contains('sonography')) {
      sampleType = 'Ultrasonography Scan';
      prep = 'Drink 1 liter water 1 hour prior to maintain full bladder (for pelvic/abdominal scan).';
      turnaround = 'Within 1-2 hours';
    } else if (nameLower.contains('mammography')) {
      sampleType = 'Low-Dose X-Ray Imaging';
      prep = 'Do not apply deodorants, perfumes, or powders under arms or on breasts before test.';
      turnaround = 'Within 24 hours';
    } else if (nameLower.contains('fasting')) {
      sampleType = 'Fluoride Blood Plasma';
      prep = 'Strict overnight fasting required (8-10 hours). Only plain water permitted.';
      turnaround = 'Within 4-6 hours';
    } else if (nameLower.contains('post-prandial') || nameLower.contains('pp')) {
      sampleType = 'Fluoride Blood Plasma';
      prep = 'Sample must be drawn exactly 2 hours after completing your meal.';
      turnaround = 'Within 4-6 hours';
    } else if (nameLower.contains('lipid')) {
      sampleType = 'Serum Blood Sample';
      prep = 'Strict 10-12 hours overnight fasting required. Avoid high-fat meals on previous day.';
      turnaround = 'Within 6-8 hours';
    } else if (nameLower.contains('thyroid') || nameLower.contains('tsh')) {
      sampleType = 'Serum Blood Sample';
      prep = 'Morning fasting sample preferred. If taking thyroid medication, take after blood draw.';
      turnaround = 'Within 8-12 hours';
    } else if (nameLower.contains('dengue') || nameLower.contains('malaria') || catLower.contains('serology')) {
      sampleType = 'Serum / EDTA Whole Blood';
      prep = 'No fasting required. Can be tested any time during fever.';
      turnaround = 'Within 2-4 hours (Rapid Diagnostic)';
    } else if (nameLower.contains('hba1c')) {
      sampleType = 'EDTA Whole Blood';
      prep = 'No fasting required. Can be given at any time of the day.';
      turnaround = 'Within 4-6 hours';
    } else if (nameLower.contains('lft') || nameLower.contains('liver')) {
      sampleType = 'Serum Blood Sample';
      prep = '8 hours overnight fasting recommended. Avoid alcohol 24 hours prior to test.';
      turnaround = 'Within 6-8 hours';
    } else if (nameLower.contains('kft') || nameLower.contains('kidney')) {
      sampleType = 'Serum Blood Sample';
      prep = 'Overnight fasting recommended. Maintain normal water intake.';
      turnaround = 'Within 6-8 hours';
    } else if (nameLower.contains('cbc') || nameLower.contains('complete blood') || catLower.contains('hematology')) {
      sampleType = 'EDTA Whole Blood';
      prep = 'No special fasting required. Stay well hydrated.';
      turnaround = 'Within 4-6 hours';
    }

    return {
      'sample_type': sampleType,
      'preparation': prep,
      'turnaround_time': turnaround,
    };
  }

  // ==========================================
  // 1. Discover Laboratories
  // ==========================================
  static Future<List<LaboratoryModel>> getLaboratories({
    String? search,
    int? wardId,
    double? latitude,
    double? longitude,
  }) async {
    // 1. Try FastAPI endpoint: GET /api/v1/laboratories
    try {
      final queryParams = <String, dynamic>{};
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }
      if (wardId != null) {
        queryParams['ward_id'] = wardId;
      }
      if (latitude != null && longitude != null) {
        queryParams['latitude'] = latitude;
        queryParams['longitude'] = longitude;
      }

      final response = await ApiClient.get<List<LaboratoryModel>>(
        ApiConfig.laboratories,
        queryParams: queryParams.isNotEmpty ? queryParams : null,
        parser: (json) {
          if (json is List) {
            return json.map((e) => LaboratoryModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <LaboratoryModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getLaboratories error: $e');
    }

    // 2. Direct Supabase Fallback
    try {
      var builder = supabase.from('provider').select('*').eq('role', 'lab');
      if (wardId != null) {
        builder = builder.eq('ward_id', wardId);
      }
      final providers = await builder.order('name');

      final labTestsResponse = await supabase.from('lab_tests').select('provider_id');
      final counts = <String, int>{};
      for (var row in labTestsResponse) {
        final pid = row['provider_id']?.toString();
        if (pid != null) {
          counts[pid] = (counts[pid] ?? 0) + 1;
        }
      }

      final list = <LaboratoryModel>[];
        for (var p in providers) {
          final pMap = Map<String, dynamic>.from(p as Map);
          final status = pMap['status']?.toString();
          if (status != null && !['approved', 'active', 'verified'].contains(status.toLowerCase())) {
            continue;
          }

          final pid = pMap['provider_id']?.toString() ?? '';
          final (lat, lon) = _parseWkbPoint(pMap['location']?.toString());
          double? dist;
          if (latitude != null && longitude != null && lat != null && lon != null) {
            dist = calculateDistance(latitude, longitude, lat, lon);
          }

          final lab = LaboratoryModel(
            providerId: pid,
            name: pMap['name']?.toString() ?? 'Diagnostic Laboratory',
            role: 'lab',
            address: pMap['address']?.toString() ?? 'Solapur, Maharashtra',
            email: pMap['email']?.toString(),
            phone: pMap['phone']?.toString() ?? '+91 217 2740300',
            license: pMap['license']?.toString(),
            status: status ?? 'approved',
            wardId: int.tryParse(pMap['ward_id']?.toString() ?? ''),
            latitude: lat,
            longitude: lon,
            operatingHours: '08:00 AM - 08:00 PM',
            testsCount: counts[pid] ?? 0,
            distanceKm: dist,
          );

          if (search != null && search.trim().isNotEmpty) {
            final q = search.trim().toLowerCase();
            final name = lab.name.toLowerCase();
            final addr = (lab.address ?? '').toLowerCase();
            if (!name.contains(q) && !addr.contains(q)) {
              continue;
            }
          }

          list.add(lab);
        }

        if (latitude != null && longitude != null) {
          list.sort((a, b) => (a.distanceKm ?? 999999).compareTo(b.distanceKm ?? 999999));
        } else {
          list.sort((a, b) => a.name.compareTo(b.name));
        }

        return list;
    } catch (e) {
      debugPrint('Supabase getLaboratories fallback error: $e');
    }

    return [];
  }

  // ==========================================
  // 2. Laboratory Profile & Complete Catalogue
  // ==========================================
  static Future<LaboratoryModel?> getLaboratoryProfile(
    String providerId, {
    double? latitude,
    double? longitude,
  }) async {
    // 1. Try FastAPI endpoint: GET /api/v1/laboratories/{provider_id}
    try {
      final queryParams = <String, dynamic>{};
      if (latitude != null && longitude != null) {
        queryParams['latitude'] = latitude;
        queryParams['longitude'] = longitude;
      }

      final response = await ApiClient.get<LaboratoryModel?>(
        ApiConfig.laboratoryDetails(providerId),
        queryParams: queryParams.isNotEmpty ? queryParams : null,
        parser: (json) {
          if (json is Map<String, dynamic>) {
            return LaboratoryModel.fromJson(json);
          }
          return null;
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data;
      }
    } catch (e) {
      debugPrint('FastAPI getLaboratoryProfile error: $e');
    }

    // 2. Direct Supabase Fallback
    try {
      final provRows = await supabase
          .from('provider')
          .select('*')
          .eq('provider_id', providerId)
          .eq('role', 'lab')
          .limit(1);

      if (provRows.isNotEmpty) {
        final pMap = Map<String, dynamic>.from(provRows.first as Map);
        final (lat, lon) = _parseWkbPoint(pMap['location']?.toString());
        double? dist;
        if (latitude != null && longitude != null && lat != null && lon != null) {
          dist = calculateDistance(latitude, longitude, lat, lon);
        }

        final tests = await getLaboratoryCatalogue(providerId);

        return LaboratoryModel(
          providerId: providerId,
          name: pMap['name']?.toString() ?? 'Diagnostic Laboratory',
          role: 'lab',
          address: pMap['address']?.toString() ?? 'Solapur, Maharashtra',
          email: pMap['email']?.toString(),
          phone: pMap['phone']?.toString() ?? '+91 217 2740300',
          license: pMap['license']?.toString(),
          status: pMap['status']?.toString() ?? 'approved',
          wardId: int.tryParse(pMap['ward_id']?.toString() ?? ''),
          latitude: lat,
          longitude: lon,
          operatingHours: '08:00 AM - 08:00 PM',
          testsCount: tests.length,
          distanceKm: dist,
          tests: tests,
        );
      }
    } catch (e) {
      debugPrint('Supabase getLaboratoryProfile fallback error: $e');
    }

    return null;
  }

  // ==========================================
  // 3. Laboratory Catalogue Tests
  // ==========================================
  static Future<List<LabTestDetailModel>> getLaboratoryCatalogue(
    String providerId, {
    String? category,
    String? search,
  }) async {
    // 1. Try FastAPI endpoint
    try {
      final queryParams = <String, dynamic>{};
      if (category != null && category.trim().isNotEmpty && category != 'All') {
        queryParams['category'] = category.trim();
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }

      final response = await ApiClient.get<List<LabTestDetailModel>>(
        ApiConfig.laboratoryCatalogue(providerId),
        queryParams: queryParams.isNotEmpty ? queryParams : null,
        parser: (json) {
          if (json is List) {
            return json.map((e) => LabTestDetailModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <LabTestDetailModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getLaboratoryCatalogue error: $e');
    }

    // 2. Direct Supabase Fallback
    try {
      final labTestsRows = await supabase
          .from('lab_tests')
          .select('lab_test_id, provider_id, test_type_id, price')
          .eq('provider_id', providerId);

      final typesRows = await supabase
          .from('test_types')
          .select('test_id, test_name, test_category, description');

      final ttMap = <int, Map<String, dynamic>>{};
      for (var t in typesRows) {
        final tMap = Map<String, dynamic>.from(t as Map);
        final tid = int.tryParse(tMap['test_id']?.toString() ?? '');
        if (tid != null) {
          ttMap[tid] = tMap;
        }
      }

      final list = <LabTestDetailModel>[];
        for (var lt in labTestsRows) {
          final ltMap = Map<String, dynamic>.from(lt as Map);
          final ttId = int.tryParse(ltMap['test_type_id']?.toString() ?? '') ?? 0;
          final tt = ttMap[ttId] ?? {};
          final tName = tt['test_name']?.toString() ?? 'Diagnostic Test';
          final tCat = tt['test_category']?.toString() ?? 'General Pathology';
          final desc = tt['description']?.toString();

          if (category != null && category.isNotEmpty && category != 'All' && tCat.toLowerCase() != category.toLowerCase()) {
            continue;
          }

          if (search != null && search.trim().isNotEmpty) {
            final q = search.trim().toLowerCase();
            if (!tName.toLowerCase().contains(q) && !tCat.toLowerCase().contains(q)) {
              continue;
            }
          }

          final meta = getClinicalMetadata(tName, tCat);

          list.add(LabTestDetailModel(
            labTestId: ltMap['lab_test_id']?.toString() ?? '',
            providerId: providerId,
            testTypeId: ttId,
            price: int.tryParse(ltMap['price']?.toString() ?? '') ?? 0,
            testName: tName,
            testCategory: tCat,
            description: desc,
            sampleType: meta['sample_type'],
            preparation: meta['preparation'],
            turnaroundTime: meta['turnaround_time'],
          ));
        }

        list.sort((a, b) => a.testName.compareTo(b.testName));
        return list;
    } catch (e) {
      debugPrint('Supabase getLaboratoryCatalogue fallback error: $e');
    }

    return [];
  }

  // ==========================================
  // 4. Global Test Search Across Laboratories
  // ==========================================
  static Future<List<LabTestDetailModel>> searchTests({
    String? query,
    String? category,
    String sortBy = 'price',
    double? latitude,
    double? longitude,
  }) async {
    // 1. Try FastAPI endpoint: GET /api/v1/laboratories/search-tests
    try {
      final queryParams = <String, dynamic>{
        'sort_by': sortBy == 'nearby' ? 'nearby' : 'price',
      };
      if (query != null && query.trim().isNotEmpty) {
        queryParams['q'] = query.trim();
      }
      if (category != null && category.trim().isNotEmpty && category != 'All') {
        queryParams['category'] = category.trim();
      }
      if (latitude != null && longitude != null) {
        queryParams['latitude'] = latitude;
        queryParams['longitude'] = longitude;
      }

      final response = await ApiClient.get<List<LabTestDetailModel>>(
        ApiConfig.labSearchTests,
        queryParams: queryParams,
        parser: (json) {
          if (json is List) {
            return json.map((e) => LabTestDetailModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <LabTestDetailModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI searchTests error: $e');
    }

    // 2. Direct Supabase Fallback
    try {
      final provRows = await supabase.from('provider').select('*').eq('role', 'lab');
      final provMap = <String, Map<String, dynamic>>{};
      for (var p in provRows) {
        final pMap = Map<String, dynamic>.from(p as Map);
        final pid = pMap['provider_id']?.toString();
        if (pid != null) {
          final (lat, lon) = _parseWkbPoint(pMap['location']?.toString());
          pMap['lat'] = lat;
          pMap['lon'] = lon;
          provMap[pid] = pMap;
        }
      }

      final typesRows = await supabase.from('test_types').select('*');
      final ttMap = <int, Map<String, dynamic>>{};
      for (var t in typesRows) {
        final tMap = Map<String, dynamic>.from(t as Map);
        final tid = int.tryParse(tMap['test_id']?.toString() ?? '');
        if (tid != null) {
          ttMap[tid] = tMap;
        }
      }

      final testsRows = await supabase.from('lab_tests').select('*');
      final list = <LabTestDetailModel>[];
        final cleanQ = query?.trim().toLowerCase();
        final cleanCat = (category != null && category != 'All') ? category.trim().toLowerCase() : null;

        for (var lt in testsRows) {
          final ltMap = Map<String, dynamic>.from(lt as Map);
          final pid = ltMap['provider_id']?.toString() ?? '';
          final prov = provMap[pid];
          if (prov == null) continue;

          final ttId = int.tryParse(ltMap['test_type_id']?.toString() ?? '') ?? 0;
          final tt = ttMap[ttId] ?? {};
          final tName = tt['test_name']?.toString() ?? 'Diagnostic Test';
          final tCat = tt['test_category']?.toString() ?? 'General Pathology';
          final desc = tt['description']?.toString();

          if (cleanCat != null && tCat.toLowerCase() != cleanCat) {
            continue;
          }

          if (cleanQ != null && cleanQ.isNotEmpty) {
            final tLower = tName.toLowerCase();
            final catLower = tCat.toLowerCase();
            bool matches = tLower.contains(cleanQ) || catLower.contains(cleanQ);
            if (!matches) {
              if (cleanQ == 'cbc' && tLower.contains('complete blood')) matches = true;
              if ((cleanQ == 'blood sugar' || cleanQ == 'sugar') && tLower.contains('blood sugar')) matches = true;
              if ((cleanQ == 'lft' || cleanQ == 'liver') && tLower.contains('liver')) matches = true;
              if ((cleanQ == 'kft' || cleanQ == 'kidney') && tLower.contains('kidney')) matches = true;
              if ((cleanQ == 'thyroid' || cleanQ == 'tsh') && tLower.contains('thyroid')) matches = true;
              if (cleanQ == 'lipid' && tLower.contains('lipid')) matches = true;
            }
            if (!matches) continue;
          }

          final lat = prov['lat'] as double?;
          final lon = prov['lon'] as double?;
          double? dist;
          if (latitude != null && longitude != null && lat != null && lon != null) {
            dist = calculateDistance(latitude, longitude, lat, lon);
          }

          final meta = getClinicalMetadata(tName, tCat);
          final price = int.tryParse(ltMap['price']?.toString() ?? '') ?? 0;

          list.add(LabTestDetailModel(
            labTestId: ltMap['lab_test_id']?.toString() ?? '',
            providerId: pid,
            testTypeId: ttId,
            price: price,
            testName: tName,
            testCategory: tCat,
            description: desc,
            sampleType: meta['sample_type'],
            preparation: meta['preparation'],
            turnaroundTime: meta['turnaround_time'],
            laboratoryName: prov['name']?.toString() ?? 'Diagnostic Center',
            laboratoryAddress: prov['address']?.toString() ?? 'Solapur, Maharashtra',
            laboratoryPhone: prov['phone']?.toString(),
            laboratoryEmail: prov['email']?.toString(),
            laboratoryLicense: prov['license']?.toString(),
            laboratoryStatus: prov['status']?.toString() ?? 'approved',
            latitude: lat,
            longitude: lon,
            distanceKm: dist,
          ));
        }

        if (sortBy == 'nearby') {
          if (latitude != null && longitude != null) {
            list.sort((a, b) => (a.distanceKm ?? 999999).compareTo(b.distanceKm ?? 999999));
          } else {
            list.sort((a, b) => (a.price > 0 ? a.price : 999999).compareTo(b.price > 0 ? b.price : 999999));
          }
        } else if (sortBy == 'price_desc' || sortBy == 'price_high_to_low') {
          list.sort((a, b) => (b.price > 0 ? b.price : -1).compareTo(a.price > 0 ? a.price : -1));
        } else {
          list.sort((a, b) => (a.price > 0 ? a.price : 999999).compareTo(b.price > 0 ? b.price : 999999));
        }

        return list;
    } catch (e) {
      debugPrint('Supabase searchTests fallback error: $e');
    }

    return [];
  }

  // ==========================================
  // 5. Single Test Detail
  // ==========================================
  static Future<LabTestDetailModel?> getTestDetail(
    String labTestId, {
    double? latitude,
    double? longitude,
  }) async {
    // 1. Try FastAPI endpoint
    try {
      final queryParams = <String, dynamic>{};
      if (latitude != null && longitude != null) {
        queryParams['latitude'] = latitude;
        queryParams['longitude'] = longitude;
      }

      final response = await ApiClient.get<LabTestDetailModel?>(
        ApiConfig.laboratoryTestDetails(labTestId),
        queryParams: queryParams.isNotEmpty ? queryParams : null,
        parser: (json) {
          if (json is Map<String, dynamic>) {
            return LabTestDetailModel.fromJson(json);
          }
          return null;
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data;
      }
    } catch (e) {
      debugPrint('FastAPI getTestDetail error: $e');
    }

    return null;
  }

  // ==========================================
  // 6. Citizen Diagnostic Reports (Existing)
  // ==========================================
  static Future<List<LabReportModel>> getReports([String? citizenId]) async {
    final targetCitizenId = citizenId ?? await AuthService.getCurrentCitizenId();
    if (targetCitizenId == null) return [];

    try {
      final response = await ApiClient.get<List<LabReportModel>>(
        ApiConfig.labReports,
        queryParams: {'citizen_id': targetCitizenId},
        parser: (json) {
          if (json is List) {
            return json.map((e) => LabReportModel.fromJson(e as Map<String, dynamic>)).toList();
          }
          return <LabReportModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getReports error: $e');
    }

    try {
      final reports = await supabase
          .from('diagnostic_reports')
          .select('''
            report_id,
            result,
            description,
            report_file_url,
            test_date,
            status,
            test_types (
              test_name,
              category
            ),
            hospitals (
              name
            )
          ''')
          .eq('citizen_id', targetCitizenId)
          .order('test_date', ascending: false);

      return reports.map((e) => LabReportModel.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    } catch (e) {
      debugPrint('Supabase getReports fallback error: $e');
    }

    return [];
  }

  /// Resolves any report file reference (storage path, signed URL, or external link)
  /// into a fully qualified, authenticated and accessible download/view URL.
  static Future<String?> resolveReportFileUrl(
    String reportId, {
    String? rawFilePath,
  }) async {
    // 1. If rawFilePath is already a full web URL, return it directly
    if (rawFilePath != null && rawFilePath.trim().isNotEmpty) {
      final trimmed = rawFilePath.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
    }

    // 2. Try FastAPI backend endpoint first
    try {
      final response = await ApiClient.get<Map<String, dynamic>>(
        '${ApiConfig.labReports}/$reportId/file',
      );

      if (response.isSuccess && response.data != null) {
        final url = response.data!['file_url']?.toString() ?? response.data!['download_url']?.toString();
        if (url != null && (url.startsWith('http://') || url.startsWith('https://'))) {
          return url;
        }
        if (url != null && url.isNotEmpty && (rawFilePath == null || rawFilePath.isEmpty)) {
          rawFilePath = url;
        }
      }
    } catch (e) {
      debugPrint('FastAPI getReportFileUrl error: $e');
    }

    // 3. Fallback: resolve path directly via Supabase Storage
    String path = (rawFilePath ?? '').trim();

    // If path is still empty, look up diagnostic_reports table
    if (path.isEmpty && reportId.isNotEmpty) {
      try {
        final res = await supabase
            .from('diagnostic_reports')
            .select('report_file_url')
            .eq('report_id', reportId)
            .maybeSingle();
        final dbPath = res?['report_file_url']?.toString();
        if (dbPath != null && dbPath.trim().isNotEmpty) {
          path = dbPath.trim();
          if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
          }
        }
      } catch (e) {
        debugPrint('Supabase direct query report_file_url error: $e');
      }
    }

    if (path.isNotEmpty) {
      try {
        String cleanPath = path.replaceFirst(RegExp(r'^/+'), '');
        String bucket = 'lab_reports';
        if (cleanPath.startsWith('lab_reports/')) {
          cleanPath = cleanPath.substring('lab_reports/'.length);
        } else if (cleanPath.startsWith('lab_document/')) {
          bucket = 'lab_document';
          cleanPath = cleanPath.substring('lab_document/'.length);
        }

        final signedUrl = await supabase.storage.from(bucket).createSignedUrl(cleanPath, 7200);
        if (signedUrl.isNotEmpty) {
          return signedUrl;
        }
      } catch (e) {
        debugPrint('Supabase createSignedUrl error: $e');
        // Try fallback bucket if primary failed
        try {
          String cleanPath = path.replaceFirst(RegExp(r'^/+'), '');
          if (cleanPath.startsWith('lab_reports/')) {
            cleanPath = cleanPath.substring('lab_reports/'.length);
          } else if (cleanPath.startsWith('lab_document/')) {
            cleanPath = cleanPath.substring('lab_document/'.length);
          }
          final fallbackUrl = await supabase.storage.from('lab_document').createSignedUrl(cleanPath, 7200);
          if (fallbackUrl.isNotEmpty) {
            return fallbackUrl;
          }
        } catch (_) {}
      }
    }

    return null;
  }

  static Future<String?> getReportFileUrl(String reportId, [String? rawFilePath]) {
    return resolveReportFileUrl(reportId, rawFilePath: rawFilePath);
  }
}
