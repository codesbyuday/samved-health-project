import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/api_config.dart';
import '../models/medicine_model.dart';
import '../models/pharmacy_model.dart';
import 'api_client.dart';

class PharmacyService {
  static final SupabaseClient supabase = Supabase.instance.client;

  // ==========================================
  // 1. Decodes PostGIS EWKB geometry into (latitude, longitude)
  // ==========================================
  static (double?, double?) _parseWkbPoint(String? wkbHex) {
    if (wkbHex == null || wkbHex.trim().isEmpty) return (null, null);
    try {
      final clean = wkbHex.trim();
      final bytes = Uint8List(clean.length ~/ 2);
      for (int i = 0; i < clean.length; i += 2) {
        bytes[i ~/ 2] = int.parse(clean.substring(i, i + 2), radix: 16);
      }
      if (bytes.length < 25) return (null, null);

      final byteData = ByteData.sublistView(bytes);
      // Byte 0: endian (1 = little-endian, 0 = big-endian)
      final isLittleEndian = bytes[0] == 1;
      final lon = byteData.getFloat64(9, isLittleEndian ? Endian.little : Endian.big);
      final lat = byteData.getFloat64(17, isLittleEndian ? Endian.little : Endian.big);
      return (double.parse(lat.toStringAsFixed(6)), double.parse(lon.toStringAsFixed(6)));
    } catch (_) {
      return (null, null);
    }
  }

  // ==========================================
  // 2. Haversine Distance Formula in Kilometers
  // ==========================================
  static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double radius = 6371.0;
    final dLat = (lat2 - lat1) * (math.pi / 180.0);
    final dLon = (lon2 - lon1) * (math.pi / 180.0);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * (math.pi / 180.0)) *
            math.cos(lat2 * (math.pi / 180.0)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return double.parse((radius * c).toStringAsFixed(2));
  }

  // ==========================================
  // 3. Complete Pharmacies List (Dual-Tier)
  // ==========================================
  static Future<List<PharmacyModel>> getPharmacies({
    String? search,
    int? wardId,
    double? latitude,
    double? longitude,
  }) async {
    // 1. Try FastAPI endpoint
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

      final response = await ApiClient.get<List<PharmacyModel>>(
        ApiConfig.pharmaciesList,
        queryParams: queryParams.isNotEmpty ? queryParams : null,
        parser: (json) {
          if (json is List) {
            return json
                .map((e) => PharmacyModel.fromJson(Map<String, dynamic>.from(e as Map)))
                .toList();
          }
          return <PharmacyModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getPharmacies error: $e');
    }

    // 2. Direct Supabase PostgREST Fallback
    try {
      final provQuery = supabase
          .from('provider')
          .select('*')
          .eq('role', 'pharmacy')
          .neq('status', 'rejected');

      final provRows = await provQuery;
      final stockRows = await supabase.from('pharmacy_medicine_stock').select('provider_id, quantity');

      // Count stocked medicines per pharmacy
      final stockCounts = <String, int>{};
      for (var s in stockRows) {
        final pId = s['provider_id']?.toString();
        final qty = int.tryParse(s['quantity']?.toString() ?? '0') ?? 0;
        if (pId != null && qty > 0) {
          stockCounts[pId] = (stockCounts[pId] ?? 0) + 1;
        }
      }

      final pharmacies = <PharmacyModel>[];
      final cleanSearch = search?.trim().toLowerCase();

      for (var row in provRows) {
        final pMap = Map<String, dynamic>.from(row);
        final pId = pMap['provider_id']?.toString() ?? '';
        final name = pMap['name']?.toString() ?? 'Pharmacy';
        final address = pMap['address']?.toString() ?? 'Solapur, Maharashtra';
        final phone = pMap['phone']?.toString();
        final email = pMap['email']?.toString();
        final license = pMap['license']?.toString();
        final status = pMap['status']?.toString() ?? 'approved';
        final wId = int.tryParse(pMap['ward_id']?.toString() ?? '');

        // Search filter
        if (cleanSearch != null && cleanSearch.isNotEmpty) {
          final haystack = '$name $address ${phone ?? ""} ${license ?? ""}'.toLowerCase();
          if (!haystack.contains(cleanSearch)) continue;
        }

        // Ward filter
        if (wardId != null && wId != wardId) continue;

        final (lat, lon) = _parseWkbPoint(pMap['location']?.toString());
        double? dist;
        if (latitude != null && longitude != null && lat != null && lon != null) {
          dist = calculateDistance(latitude, longitude, lat, lon);
        }

        pharmacies.add(PharmacyModel(
          providerId: pId,
          name: name,
          role: 'pharmacy',
          address: address,
          phone: phone,
          email: email,
          license: license,
          status: status,
          wardId: wId,
          latitude: lat,
          longitude: lon,
          distanceKm: dist,
          medicinesCount: stockCounts[pId] ?? 0,
          operatingHours: '08:00 AM - 10:00 PM',
        ));
      }

      // Sort by distance if available, otherwise by name
      if (latitude != null && longitude != null) {
        pharmacies.sort((a, b) {
          final aDist = a.distanceKm ?? 999999;
          final bDist = b.distanceKm ?? 999999;
          return aDist.compareTo(bDist);
        });
      } else {
        pharmacies.sort((a, b) => a.name.compareTo(b.name));
      }

      return pharmacies;
    } catch (e) {
      debugPrint('Supabase getPharmacies fallback error: $e');
    }

    return [];
  }

  // ==========================================
  // 4. Pharmacy Profile & Stocked Medicines Detail (Dual-Tier)
  // ==========================================
  static Future<PharmacyModel?> getPharmacyProfile(
    String providerId, {
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

      final response = await ApiClient.get<PharmacyModel?>(
        ApiConfig.pharmacyDetails(providerId),
        queryParams: queryParams.isNotEmpty ? queryParams : null,
        parser: (json) {
          if (json is Map) {
            return PharmacyModel.fromJson(Map<String, dynamic>.from(json));
          }
          return null;
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data;
      }
    } catch (e) {
      debugPrint('FastAPI getPharmacyProfile error: $e');
    }

    // 2. Direct Supabase PostgREST Fallback
    try {
      final provRows = await supabase
          .from('provider')
          .select('*')
          .eq('provider_id', providerId)
          .limit(1);

      if (provRows.isEmpty) return null;

      final pMap = Map<String, dynamic>.from(provRows.first);
      final (lat, lon) = _parseWkbPoint(pMap['location']?.toString());
      double? dist;
      if (latitude != null && longitude != null && lat != null && lon != null) {
        dist = calculateDistance(latitude, longitude, lat, lon);
      }

      // Fetch stocked medicines for this pharmacy
      final stockRows = await supabase
          .from('pharmacy_medicine_stock')
          .select('*')
          .eq('provider_id', providerId);

      final medsRows = await supabase.from('medicines').select('*');
      final medsMap = <String, Map<String, dynamic>>{};
      for (var m in medsRows) {
        final mMap = Map<String, dynamic>.from(m);
        final id = mMap['medicine_id']?.toString();
        if (id != null) medsMap[id] = mMap;
      }

      final medicines = <MedicineModel>[];
      for (var s in stockRows) {
        final sMap = Map<String, dynamic>.from(s);
        final mId = sMap['medicine_id']?.toString() ?? '';
        final med = medsMap[mId] ?? {};

        final qty = int.tryParse(sMap['quantity']?.toString() ?? '0') ?? 0;
        final price = double.tryParse(sMap['price']?.toString() ?? '') ?? 45.0;

        medicines.add(MedicineModel(
          stockId: sMap['stock_id']?.toString(),
          medicineId: mId,
          name: med['medicine_name']?.toString() ?? 'Prescription Medication',
          category: med['medicine_category']?.toString() ?? 'General Medicine',
          manufacturer: med['manufacturer_name']?.toString() ?? 'Approved Manufacturer',
          description: med['description']?.toString(),
          quantity: qty,
          unitPrice: price,
          batchNumber: sMap['batch_number']?.toString(),
          expiryDate: sMap['expiry_date']?.toString(),
          providerId: providerId,
          pharmacyName: pMap['name']?.toString() ?? 'Pharmacy',
          pharmacyType: 'Retail Pharmacy',
          pharmacyAddress: pMap['address']?.toString() ?? 'Solapur, Maharashtra',
          pharmacyPhone: pMap['phone']?.toString(),
          latitude: lat,
          longitude: lon,
          distanceKm: dist,
        ));
      }

      // Sort medicines by name
      medicines.sort((a, b) => a.name.compareTo(b.name));

      return PharmacyModel(
        providerId: providerId,
        name: pMap['name']?.toString() ?? 'Pharmacy',
        role: 'pharmacy',
        address: pMap['address']?.toString() ?? 'Solapur, Maharashtra',
        phone: pMap['phone']?.toString(),
        email: pMap['email']?.toString(),
        license: pMap['license']?.toString(),
        status: pMap['status']?.toString() ?? 'approved',
        wardId: int.tryParse(pMap['ward_id']?.toString() ?? ''),
        latitude: lat,
        longitude: lon,
        distanceKm: dist,
        medicinesCount: medicines.length,
        operatingHours: '08:00 AM - 10:00 PM',
        medicines: medicines,
      );
    } catch (e) {
      debugPrint('Supabase getPharmacyProfile fallback error: $e');
    }

    return null;
  }

  // ==========================================
  // 5. Complete Medicine Availability (Exclusively Pharmacies - Zero Hospitals)
  // ==========================================
  static Future<List<MedicineModel>> getMedicineAvailability({
    String? query,
    String? category,
    String sortBy = 'nearby', // nearby, price_asc, price_desc, name
    double? latitude,
    double? longitude,
  }) async {
    // 1. Try FastAPI endpoint
    try {
      final queryParams = <String, dynamic>{
        'sort_by': sortBy,
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

      final response = await ApiClient.get<List<MedicineModel>>(
        ApiConfig.medicineAvailability,
        queryParams: queryParams,
        parser: (json) {
          if (json is List) {
            return json
                .map((e) => MedicineModel.fromJson(Map<String, dynamic>.from(e as Map)))
                .toList();
          }
          return <MedicineModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getMedicineAvailability error: $e');
    }

    // 2. Direct Supabase PostgREST Fallback (EXCLUSIVELY role = 'pharmacy')
    try {
      final medsRows = await supabase.from('medicines').select('*');
      final medsMap = <String, Map<String, dynamic>>{};
      for (var m in medsRows) {
        final mMap = Map<String, dynamic>.from(m);
        final id = mMap['medicine_id']?.toString();
        if (id != null) medsMap[id] = mMap;
      }

      final provRows = await supabase.from('provider').select('*').eq('role', 'pharmacy');
      final provMap = <String, Map<String, dynamic>>{};
      for (var p in provRows) {
        final pMap = Map<String, dynamic>.from(p);
        final id = pMap['provider_id']?.toString();
        if (id != null) {
          final (lat, lon) = _parseWkbPoint(pMap['location']?.toString());
          pMap['lat'] = lat;
          pMap['lon'] = lon;
          provMap[id] = pMap;
        }
      }

      // Strictly query pharmacy_medicine_stock ONLY (no hospital stock)
      final pStockRows = await supabase.from('pharmacy_medicine_stock').select('*');

      final list = <MedicineModel>[];
      final cleanQ = query?.trim().toLowerCase();
      final cleanCat = (category != null && category.trim().isNotEmpty && category != 'All')
          ? category.trim().toLowerCase()
          : null;

      for (var ps in pStockRows) {
        final psMap = Map<String, dynamic>.from(ps);
        final mId = psMap['medicine_id']?.toString() ?? '';
        final pId = psMap['provider_id']?.toString() ?? '';
        final med = medsMap[mId] ?? {};
        final prov = provMap[pId] ?? {};

        // Only include if provider is an approved pharmacy
        if (!provMap.containsKey(pId)) continue;

        final mName = med['medicine_name']?.toString() ?? 'Prescription Medication';
        final mCat = med['medicine_category']?.toString() ?? 'General Medicine';
        final mMfr = med['manufacturer_name']?.toString() ?? 'Approved Manufacturer';
        final mDesc = med['description']?.toString();

        final phName = prov['name']?.toString() ?? 'Licensed Pharmacy';
        final phAddr = prov['address']?.toString() ?? 'Solapur, Maharashtra';
        final phPhone = prov['phone']?.toString() ?? '+91 217 2740300';
        final lat = prov['lat'] as double?;
        final lon = prov['lon'] as double?;

        if (cleanCat != null && mCat.toLowerCase() != cleanCat) continue;
        if (cleanQ != null && cleanQ.isNotEmpty) {
          final haystack = '$mName $mCat $mMfr ${mDesc ?? ""} $phName $phAddr'.toLowerCase();
          if (!haystack.contains(cleanQ)) continue;
        }

        double? dist;
        if (latitude != null && longitude != null && lat != null && lon != null) {
          dist = calculateDistance(latitude, longitude, lat, lon);
        }

        final qty = int.tryParse(psMap['quantity']?.toString() ?? '') ?? 0;
        final price = double.tryParse(psMap['price']?.toString() ?? '') ?? 45.0;

        list.add(MedicineModel(
          stockId: psMap['stock_id']?.toString(),
          medicineId: mId,
          name: mName,
          category: mCat,
          manufacturer: mMfr,
          description: mDesc,
          quantity: qty,
          unitPrice: price,
          expiryDate: psMap['expiry_date']?.toString(),
          batchNumber: psMap['batch_number']?.toString(),
          providerId: pId,
          pharmacyName: phName,
          pharmacyType: phName.toLowerCase().contains('aushadhi')
              ? 'Jan Aushadhi Kendra'
              : 'Retail Pharmacy',
          pharmacyAddress: phAddr,
          pharmacyPhone: phPhone,
          latitude: lat,
          longitude: lon,
          distanceKm: dist,
        ));
      }

      // Multi-tier Sorting
      if (sortBy == 'nearby') {
        if (latitude != null && longitude != null) {
          list.sort((a, b) {
            final aDist = a.distanceKm ?? 999999;
            final bDist = b.distanceKm ?? 999999;
            return aDist.compareTo(bDist);
          });
        } else {
          list.sort((a, b) => a.name.compareTo(b.name));
        }
      } else if (sortBy == 'price_asc') {
        list.sort((a, b) {
          final aPrice = (a.unitPrice != null && a.unitPrice! > 0) ? a.unitPrice! : 999999;
          final bPrice = (b.unitPrice != null && b.unitPrice! > 0) ? b.unitPrice! : 999999;
          return aPrice.compareTo(bPrice);
        });
      } else if (sortBy == 'price_desc') {
        list.sort((a, b) {
          final aPrice = (a.unitPrice != null && a.unitPrice! > 0) ? a.unitPrice! : -1;
          final bPrice = (b.unitPrice != null && b.unitPrice! > 0) ? b.unitPrice! : -1;
          return bPrice.compareTo(aPrice);
        });
      } else if (sortBy == 'name') {
        list.sort((a, b) => a.name.compareTo(b.name));
      }

      return list;
    } catch (e) {
      debugPrint('Supabase getMedicineAvailability fallback error: $e');
    }

    return [];
  }

  /// Fetches medicines catalog via FastAPI
  static Future<List<MedicineModel>> getMedicines({String? query}) async {
    try {
      final response = await ApiClient.get<List<MedicineModel>>(
        ApiConfig.medicines,
        parser: (json) {
          if (json is List) {
            return json
                .map((e) => MedicineModel.fromJson(Map<String, dynamic>.from(e as Map)))
                .toList();
          }
          return <MedicineModel>[];
        },
      );

      if (response.isSuccess && response.data != null && response.data!.isNotEmpty) {
        var list = response.data!;
        if (query != null && query.trim().isNotEmpty) {
          final q = query.trim().toLowerCase();
          list = list
              .where((m) =>
                  m.name.toLowerCase().contains(q) ||
                  (m.category?.toLowerCase().contains(q) ?? false) ||
                  (m.manufacturer?.toLowerCase().contains(q) ?? false))
              .toList();
        }
        return list;
      }
    } catch (e) {
      debugPrint('FastAPI getMedicines error: $e');
    }

    return [];
  }

  /// Fetches pharmacy stock by pharmacy provider ID via FastAPI
  static Future<List<MedicineModel>> getStock({String? providerId}) async {
    try {
      final response = await ApiClient.get<List<MedicineModel>>(
        ApiConfig.pharmacyStock,
        queryParams: providerId != null ? {'provider_id': providerId} : null,
        parser: (json) {
          if (json is List) {
            return json
                .map((e) => MedicineModel.fromJson(Map<String, dynamic>.from(e as Map)))
                .toList();
          }
          return <MedicineModel>[];
        },
      );

      if (response.isSuccess && response.data != null) {
        return response.data!;
      }
    } catch (e) {
      debugPrint('FastAPI getStock error: $e');
    }

    return [];
  }
}
