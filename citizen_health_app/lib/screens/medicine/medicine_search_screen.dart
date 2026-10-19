import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/pharmacy_service.dart';

class MedicineSearchScreen extends StatefulWidget {
  const MedicineSearchScreen({super.key});

  @override
  State<MedicineSearchScreen> createState() => _MedicineSearchScreenState();
}

class _MedicineSearchScreenState extends State<MedicineSearchScreen> {
  final TextEditingController searchController = TextEditingController();

  bool isLoading = true;
  String errorMessage = '';
  List<_MedicineItem> medicines = [];

  @override
  void initState() {
    super.initState();
    searchController.addListener(_onSearchChanged);
    fetchMedicines();
  }

  @override
  void dispose() {
    searchController.removeListener(_onSearchChanged);
    searchController.dispose();
    super.dispose();
  }

  Future<void> fetchMedicines() async {
    try {
      final data = await _fetchMedicineRows();
      if (!mounted) return;
      setState(() {
        medicines = data;
        isLoading = false;
        errorMessage = '';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        medicines = const [];
        isLoading = false;
        errorMessage = e.toString();
      });
    }
  }

  Future<List<_MedicineItem>> _fetchMedicineRows() async {
    try {
      final serviceMedicines = await PharmacyService.getMedicines();
      if (serviceMedicines.isNotEmpty) {
        return serviceMedicines.map((m) {
          return _MedicineItem(
            medicineId: m.medicineId,
            category: m.category ?? 'Essential Medication',
            manufacturer: m.manufacturer ?? 'Approved SMC Manufacturer',
            description: '${m.dosageForm ?? ""} ${m.strength ?? ""}'.trim(),
            stock: m.quantity ?? 100,
            expiryDate: m.expiryDate ?? '2026-12-31',
            name: m.name,
            pharmacyName: m.pharmacyName ?? 'SMC Municipal Pharmacy',
            address: m.pharmacyAddress ?? 'Solapur Municipal Health Center',
            phone: m.pharmacyPhone ?? '+91 217 2740300',
            latitude: 17.6599,
            longitude: 75.9064,
            isAvailable: m.isAvailable,
            price: m.unitPrice,
            distanceKm: 1.5,
            hasDetails: true,
          );
        }).toList();
      }
    } catch (e) {
      debugPrint('PharmacyService error in search screen: $e');
    }

    return const [];
  }

  Map<String, dynamic> _extractNestedMap(dynamic value) {
    if (value is List && value.isNotEmpty && value.first is Map<String, dynamic>) {
      return value.first as Map<String, dynamic>;
    }
    if (value is Map<String, dynamic>) {
      return value;
    }
    return const {};
  }

  void _onSearchChanged() {
    if (!mounted) return;
    setState(() {});
  }

  Future<void> openMaps(_MedicineItem item) async {
    if (item.latitude == null || item.longitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Location not available"),
        ),
      );
      return;
    }

    final Uri googleMapsUrl = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}',
    );

    try {
      await launchUrl(
        googleMapsUrl,
        mode: LaunchMode.externalApplication,
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Could not open Google Maps"),
        ),
      );
    }
  }

    void _showMedicineDetails(BuildContext context, _MedicineItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(28),
            ),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                /// Drag Handle
                Center(
                  child: Container(
                    width: 45,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade400,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                /// Medicine Name
                Text(
                  "💊 ${item.name}",
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 10),

                /// Availability
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: item.isAvailable
                    ? Colors.green.shade100
                    : Colors.red.shade100,
                    borderRadius: BorderRadius.circular(30),
                  ),
                  child: Text(
                    item.isAvailable ? "🟢 In Stock" : "🔴 Out of Stock",
                    style: TextStyle(
                      color: item.isAvailable
                          ? Colors.green
                          : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                buildInfoTile(Icons.medication,
                    "Category", item.category),

                buildInfoTile(Icons.business,
                    "Manufacturer", item.manufacturer),

                buildInfoTile(Icons.inventory_2,
                    "Available Stock", "${item.stock} Units"),

                buildInfoTile(Icons.calendar_month,
                    "Expiry", item.expiryDate),

                const SizedBox(height: 25),

                /// Description Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [

                      Row(
                        children: [
                          Icon(Icons.info,
                              color: Colors.blue),
                          SizedBox(width: 8),
                          Text(
                            "About Medicine",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: 10),

                      Text(
                          item.description,
                          style: TextStyle(fontSize: 15),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 25),

                /// Pharmacy Card
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(18),
                  ),
                  child: Padding(
                    padding:
                        const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [

                        Row(
                          children: [
                            Icon(Icons.local_pharmacy,
                                color: Colors.red),
                            SizedBox(width: 8),
                            Text(
                              "Pharmacy",
                              style: TextStyle(
                                fontWeight:
                                    FontWeight.bold,
                                fontSize: 17,
                              ),
                            ),
                          ],
                        ),

                        SizedBox(height: 15),

                        Text(
                          item.pharmacyName,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                                FontWeight.w600,
                          ),
                        ),

                        SizedBox(height: 10),

                        Row(
                          children: [
                            Icon(Icons.location_on,
                                size: 18),
                            SizedBox(width: 6),
                            Expanded(
                              child: Text(
                              item.address,
                            ),
                            ),
                          ],
                        ),

                        SizedBox(height: 8),

                        Row(
                          children: [
                            Icon(Icons.phone,
                                size: 18),
                            SizedBox(width: 6),
                            Text(item.phone),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 30),

                /// Get Directions Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.map),
                    label: const Text(
                      "Get Directions",
                      style: TextStyle(fontSize: 16),
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                      openMaps(item);
                    },
                  ),
                ),

                const SizedBox(height: 12),

                /// Call Button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.call),
                    label: const Text(
                      "Call Pharmacy",
                      style: TextStyle(fontSize: 16),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                          vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius:
                            BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () async {

                      final Uri phoneUri = Uri(
                        scheme: 'tel',
                        path: item.phone,
                      );

                    },
                  ),
                ),

                const SizedBox(height: 10),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget buildInfoTile(
      IconData icon,
      String title,
      String value,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Icon(
            icon,
            color: Colors.teal,
            size: 24,
          ),

          const SizedBox(width: 14),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [

                Text(
                  title,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 13,
                  ),
                ),

                const SizedBox(height: 2),

                Text(
                  value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final query = searchController.text.trim().toLowerCase();
    final filteredMedicines = medicines.where((medicine) {
      if (query.isEmpty) return true;
      return medicine.name.toLowerCase().contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFF),
      body: Column(
        children: [
          SizedBox(
            height: 286,
            child: Stack(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 54, 20, 118),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFF2563EB),
                        Color(0xFF0EA5E9),
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
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _HeaderButton(
                        icon: Icons.arrow_back_ios_new_rounded,
                        onTap: () => Navigator.pop(context),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Medicine Availability',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Search and check availability of medicines',
                              style: TextStyle(
                                color: Color(0xE6FFFFFF),
                                fontSize: 14,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: const Icon(
                          Icons.medication_outlined,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 18,
                  child: SearchBarWidget(
                    controller: searchController,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
              children: [
                const InfoBanner(),
                const SizedBox(height: 18),
                if (isLoading)
                  const Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: Center(child: CircularProgressIndicator()),
                  )
                else if (errorMessage.isNotEmpty)
                  _EmptyState(
                    title: 'Unable to load medicines',
                    subtitle: errorMessage,
                  )
                else if (filteredMedicines.isEmpty)
                  const _EmptyState(
                    title: 'No medicines found',
                    subtitle:
                        'Try searching with a different medicine name.',
                  )
                else
                  ...filteredMedicines.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: MedicineCard(
                          item: item,
                          onDirections: () => openMaps(item),
                          onViewDetails: () => _showMedicineDetails(context, item),
                        ),
                      ),
                    ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class SearchBarWidget extends StatelessWidget {
  const SearchBarWidget({
    super.key,
    required this.controller,
  });

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        decoration: const InputDecoration(
          hintText: 'Search medicines (e.g., Paracetamol)',
          prefixIcon: Icon(
            Icons.search_rounded,
            color: Color(0xFF64748B),
          ),
          border: InputBorder.none,
        ),
      ),
    );
  }
}

class InfoBanner extends StatelessWidget {
  const InfoBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE6F7FB),
        borderRadius: BorderRadius.circular(18),
      ),
      child: const Row(
        children: [
          Icon(
            Icons.location_on_outlined,
            color: Color(0xFF0891B2),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Showing availability in nearby pharmacies',
              style: TextStyle(
                color: Color(0xFF0F766E),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MedicineCard extends StatelessWidget {
  const MedicineCard({
    super.key,
    required this.item,
    required this.onDirections,
    required this.onViewDetails,
  });

  final _MedicineItem item;
  final VoidCallback onDirections;
  final VoidCallback onViewDetails;

  @override
  Widget build(BuildContext context) {
    final accentColor =
        item.isAvailable ? const Color(0xFF16A34A) : const Color(0xFFDC2626);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x140F172A),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 20,
            bottom: 20,
            child: Container(
              width: 5,
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: const BorderRadius.horizontal(
                  right: Radius.circular(10),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 60,
                      width: 60,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: item.isAvailable
                              ? const [Color(0xFF22C55E), Color(0xFF16A34A)]
                              : const [Color(0xFFEF4444), Color(0xFFDC2626)],
                        ),
                        borderRadius: BorderRadius.circular(18),
                      ),
                      child: const Icon(
                        Icons.medication_outlined,
                        color: Colors.white,
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item.pharmacyName,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF334155),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.availabilityText,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: accentColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text(
                      item.distanceText,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Text(
                      item.priceText,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: item.hasDetails
                          ? onViewDetails
                          : null,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Text('View Details'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: ElevatedButton(
                          onPressed: onDirections,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text('Directions'),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  const _HeaderButton({
    required this.icon,
    required this.onTap,
  });

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 48,
        width: 48,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.18),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [
          BoxShadow(
            color: Color(0x120F172A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          const Icon(
            Icons.medication_liquid_outlined,
            size: 42,
            color: Color(0xFF94A3B8),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF64748B),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _MedicineItem {
  const _MedicineItem({
    required this.medicineId,
    required this.category,
    required this.manufacturer,
    required this.description,
    required this.stock,
    required this.expiryDate,
    required this.phone,

    required this.name,
    required this.pharmacyName,
    required this.isAvailable,
    required this.price,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.distanceKm,
    required this.hasDetails,
  });

  final String medicineId;
  final String category;
  final String manufacturer;
  final String description;
  final int stock;
  final String expiryDate;
  final String phone;

  final String name;
  final String pharmacyName;
  final bool isAvailable;
  final double? price;
  final String address;
  final double? latitude;
  final double? longitude;
  final double? distanceKm;
  final bool hasDetails;  

  String get availabilityText {
    return isAvailable ? 'Available • In Stock' : 'Not Available • Out of Stock';
  }

  String get distanceText {
    if (distanceKm == null) return 'Nearby pharmacy';
    return '${distanceKm!.toStringAsFixed(1)} km';
  }

  String get priceText {
    if (price == null) return 'Price unavailable';
    return '₹${price!.toStringAsFixed(0)}';
  }

  static double? _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '');
  }
}
