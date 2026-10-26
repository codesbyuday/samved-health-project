class MedicineModel {
  final String? stockId;
  final String medicineId;
  final String name;
  final String? category;
  final String? manufacturer;
  final String? description;
  final double? unitPrice;
  final String? dosageForm;
  final String? strength;
  final int? quantity;
  final String? batchNumber;
  final String? expiryDate;
  final bool isCritical;
  final String? providerId;
  final String? hospitalId;
  final String? pharmacyName;
  final String? pharmacyType;
  final String? pharmacyAddress;
  final String? pharmacyPhone;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;

  const MedicineModel({
    this.stockId,
    required this.medicineId,
    required this.name,
    this.category,
    this.manufacturer,
    this.description,
    this.unitPrice,
    this.dosageForm,
    this.strength,
    this.quantity,
    this.batchNumber,
    this.expiryDate,
    this.isCritical = false,
    this.providerId,
    this.hospitalId,
    this.pharmacyName,
    this.pharmacyType,
    this.pharmacyAddress,
    this.pharmacyPhone,
    this.latitude,
    this.longitude,
    this.distanceKm,
  });

  bool get isAvailable => (quantity ?? 0) > 0;

  String get availabilityText {
    final qty = quantity ?? 0;
    if (qty <= 0) return 'Not Available • Out of Stock';
    if (qty < 30) return 'Low Stock • $qty units remaining';
    return 'Available • In Stock ($qty units)';
  }

  String get distanceText {
    if (distanceKm == null) return 'Distance N/A';
    return '${distanceKm!.toStringAsFixed(1)} km away';
  }

  String get priceText {
    if (unitPrice == null || unitPrice! <= 0) return 'Price N/A';
    return '₹${unitPrice!.toStringAsFixed(0)}';
  }

  String? get priceBadgeText {
    if (unitPrice != null && unitPrice! > 0) {
      return '₹${unitPrice!.toStringAsFixed(0)}';
    }
    return null;
  }

  MedicineModel copyWith({
    double? distanceKm,
  }) {
    return MedicineModel(
      stockId: stockId,
      medicineId: medicineId,
      name: name,
      category: category,
      manufacturer: manufacturer,
      description: description,
      unitPrice: unitPrice,
      dosageForm: dosageForm,
      strength: strength,
      quantity: quantity,
      batchNumber: batchNumber,
      expiryDate: expiryDate,
      isCritical: isCritical,
      providerId: providerId,
      hospitalId: hospitalId,
      pharmacyName: pharmacyName,
      pharmacyType: pharmacyType,
      pharmacyAddress: pharmacyAddress,
      pharmacyPhone: pharmacyPhone,
      latitude: latitude,
      longitude: longitude,
      distanceKm: distanceKm ?? this.distanceKm,
    );
  }

  factory MedicineModel.fromJson(Map<String, dynamic> json) {
    // Determine price from unit_price or price
    double? priceVal;
    if (json['unit_price'] != null) {
      priceVal = double.tryParse(json['unit_price'].toString());
    } else if (json['price'] != null) {
      priceVal = double.tryParse(json['price'].toString());
    }

    // Determine quantity from quantity or stock
    int? qtyVal;
    if (json['quantity'] != null) {
      qtyVal = int.tryParse(json['quantity'].toString());
    } else if (json['stock'] != null) {
      qtyVal = int.tryParse(json['stock'].toString());
    }

    return MedicineModel(
      stockId: json['stock_id']?.toString(),
      medicineId: (json['medicine_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? json['medicine_name'] ?? 'Medicine').toString(),
      category: (json['category'] ?? json['medicine_category'])?.toString(),
      manufacturer: (json['manufacturer'] ?? json['manufacturer_name'])?.toString(),
      description: json['description']?.toString(),
      unitPrice: priceVal,
      dosageForm: json['dosage_form']?.toString(),
      strength: json['strength']?.toString(),
      quantity: qtyVal,
      batchNumber: json['batch_number']?.toString(),
      expiryDate: json['expiry_date']?.toString(),
      isCritical: json['is_critical'] == true,
      providerId: json['provider_id']?.toString(),
      hospitalId: json['hospital_id']?.toString(),
      pharmacyName: json['pharmacy_name']?.toString() ?? json['hospital_name']?.toString(),
      pharmacyType: json['pharmacy_type']?.toString() ?? 'Retail Pharmacy',
      pharmacyAddress: (json['address'] ?? json['pharmacy_address'])?.toString(),
      pharmacyPhone: (json['phone'] ?? json['pharmacy_phone'])?.toString(),
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      distanceKm: json['distance_km'] != null ? double.tryParse(json['distance_km'].toString()) : null,
    );
  }
}
