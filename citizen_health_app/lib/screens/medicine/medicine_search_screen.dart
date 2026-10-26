import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/medicine_model.dart';
import '../../models/pharmacy_model.dart';
import '../../services/pharmacy_service.dart';
import 'pharmacy_details_screen.dart';

class MedicineSearchScreen extends StatefulWidget {
  const MedicineSearchScreen({super.key});

  @override
  State<MedicineSearchScreen> createState() => _MedicineSearchScreenState();
}

class _MedicineSearchScreenState extends State<MedicineSearchScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _pharmacySearchController = TextEditingController();
  final TextEditingController _medicineSearchController = TextEditingController();
  Timer? _debounceTimer;

  // Location state
  double? _userLat;
  double? _userLon;
  bool _isLocationAvailable = false;
  bool _isCheckingLocation = false;
  String? _locationStatusMessage;
  bool _isPermanentlyDenied = false;
  bool _isGpsDisabled = false;

  // Tab 1: Pharmacies state
  List<PharmacyModel> _allPharmacies = [];
  List<PharmacyModel> _filteredPharmacies = [];
  bool _isLoadingPharmacies = true;
  String? _pharmaciesErrorMessage;

  // Tab 2: Medicines search state
  List<MedicineModel> _allMedicines = [];
  List<MedicineModel> _displayedMedicines = [];
  bool _isLoadingMedicines = false;
  bool _hasLoadedMedicines = false; // Lazy loading Tab 2
  String? _medicinesErrorMessage;
  String _selectedCategory = 'All';
  String _sortBy = 'nearby'; // 'nearby', 'price_asc', 'price_desc', 'name'

  final List<String> _categories = [
    'All',
    'Analgesic/Antipyretic',
    'Antibiotic',
    'Antidiabetic',
    'Antihistamine',
    'Electrolyte',
    'Antacid/GI',
    'Cardiovascular',
    'Antimalarial',
    'Vitamins',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    // Lazy load Tab 2 when user switches to it
    _tabController.addListener(_onTabChanged);

    _pharmacySearchController.addListener(_onPharmacySearchChanged);
    _medicineSearchController.addListener(_onMedicineSearchInputChanged);

    // Initial load: check location and load Tab 1 pharmacies immediately
    _initData();
  }

  void _onTabChanged() {
    if (_tabController.index == 1 && !_hasLoadedMedicines && !_isLoadingMedicines) {
      _hasLoadedMedicines = true;
      _fetchMedicines();
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _debounceTimer?.cancel();
    _pharmacySearchController.removeListener(_onPharmacySearchChanged);
    _pharmacySearchController.dispose();
    _medicineSearchController.removeListener(_onMedicineSearchInputChanged);
    _medicineSearchController.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    // 1. Check location concurrently
    _checkUserLocation();
    // 2. Load pharmacies for Tab 1 immediately
    _loadPharmacies();
  }

  // ==========================================
  // RESILIENT LOCATION RESOLUTION (Cached + Medium Fallback)
  // ==========================================
  Future<void> _checkUserLocation() async {
    if (!mounted) return;
    setState(() {
      _isCheckingLocation = true;
      _isPermanentlyDenied = false;
      _isGpsDisabled = false;
    });

    try {
      // 1. Check if location services (GPS) are enabled on the device
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!mounted) return;
        setState(() {
          _isLocationAvailable = false;
          _isGpsDisabled = true;
          _locationStatusMessage = 'Device GPS / Location service is turned off.';
          _isCheckingLocation = false;
        });
        return;
      }

      // 2. Check and request location permission
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied) {
        if (!mounted) return;
        setState(() {
          _isLocationAvailable = false;
          _locationStatusMessage = 'Location permission is required to calculate distances.';
          _isCheckingLocation = false;
        });
        return;
      }

      if (permission == LocationPermission.deniedForever) {
        if (!mounted) return;
        setState(() {
          _isLocationAvailable = false;
          _isPermanentlyDenied = true;
          _locationStatusMessage = 'Location permission permanently denied. Enable it in App Settings.';
          _isCheckingLocation = false;
        });
        return;
      }

      // 3. Fast Path: cached last known position
      Position? position;
      try {
        position = await Geolocator.getLastKnownPosition();
      } catch (_) {}

      final cachedPos = position;
      if (cachedPos != null && mounted) {
        setState(() {
          _userLat = cachedPos.latitude;
          _userLon = cachedPos.longitude;
          _isLocationAvailable = true;
          _locationStatusMessage = null;
        });
        _updateDistancesForAllItems();
      }

      // 4. Fresh GPS Path: medium accuracy (fast & battery efficient)
      try {
        final freshPos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 12),
        );
        position = freshPos;
      } catch (_) {
        if (position == null) {
          try {
            position = await Geolocator.getCurrentPosition(
              desiredAccuracy: LocationAccuracy.low,
              timeLimit: const Duration(seconds: 8),
            );
          } catch (_) {}
        }
      }

      if (!mounted) return;

      final finalPos = position;
      if (finalPos != null) {
        setState(() {
          _userLat = finalPos.latitude;
          _userLon = finalPos.longitude;
          _isLocationAvailable = true;
          _locationStatusMessage = null;
          _isCheckingLocation = false;
        });
        _updateDistancesForAllItems();
      } else {
        setState(() {
          _isLocationAvailable = false;
          _locationStatusMessage = 'Could not acquire GPS fix. Distances displayed as N/A.';
          _isCheckingLocation = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLocationAvailable = false;
        _locationStatusMessage = 'Location unavailable. Distances displayed as N/A.';
        _isCheckingLocation = false;
      });
    }
  }

  /// Recalculates distances locally across loaded pharmacies and medicines
  void _updateDistancesForAllItems() {
    if (_userLat == null || _userLon == null) return;

    // Update pharmacies
    for (int i = 0; i < _allPharmacies.length; i++) {
      final p = _allPharmacies[i];
      if (p.latitude != null && p.longitude != null) {
        final dist = PharmacyService.calculateDistance(
          _userLat!,
          _userLon!,
          p.latitude!,
          p.longitude!,
        );
        _allPharmacies[i] = p.copyWith(distanceKm: dist);
      }
    }
    _onPharmacySearchChanged();

    // Update medicines
    for (int i = 0; i < _allMedicines.length; i++) {
      final m = _allMedicines[i];
      if (m.latitude != null && m.longitude != null) {
        final dist = PharmacyService.calculateDistance(
          _userLat!,
          _userLon!,
          m.latitude!,
          m.longitude!,
        );
        _allMedicines[i] = m.copyWith(distanceKm: dist);
      }
    }
    _applyLocalMedicineFiltersAndSorting();

    if (mounted) setState(() {});
  }

  // ==========================================
  // TAB 1: PHARMACIES FETCHING & FILTERING
  // ==========================================
  Future<void> _loadPharmacies() async {
    setState(() {
      _isLoadingPharmacies = true;
      _pharmaciesErrorMessage = null;
    });

    try {
      final pharmacies = await PharmacyService.getPharmacies(
        latitude: _userLat,
        longitude: _userLon,
      );

      if (!mounted) return;
      setState(() {
        _allPharmacies = pharmacies;
        _isLoadingPharmacies = false;
      });
      _onPharmacySearchChanged();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingPharmacies = false;
        _pharmaciesErrorMessage = 'Failed to load pharmacies: $e';
      });
    }
  }

  void _onPharmacySearchChanged() {
    final query = _pharmacySearchController.text.trim().toLowerCase();
    List<PharmacyModel> list = List.from(_allPharmacies);

    if (query.isNotEmpty) {
      list = list.where((p) {
        final name = p.name.toLowerCase();
        final addr = (p.address ?? '').toLowerCase();
        final phone = (p.phone ?? '').toLowerCase();
        final lic = (p.license ?? '').toLowerCase();
        return name.contains(query) ||
            addr.contains(query) ||
            phone.contains(query) ||
            lic.contains(query);
      }).toList();
    }

    // Sort by proximity if available, else by name
    if (_userLat != null && _userLon != null) {
      list.sort((a, b) {
        final aDist = a.distanceKm ?? 999999;
        final bDist = b.distanceKm ?? 999999;
        return aDist.compareTo(bDist);
      });
    } else {
      list.sort((a, b) => a.name.compareTo(b.name));
    }

    if (mounted) {
      setState(() {
        _filteredPharmacies = list;
      });
    }
  }

  // ==========================================
  // TAB 2: MEDICINES FETCHING & FILTERING
  // ==========================================
  Future<void> _fetchMedicines() async {
    setState(() {
      _isLoadingMedicines = true;
      _medicinesErrorMessage = null;
    });

    try {
      final offerings = await PharmacyService.getMedicineAvailability(
        latitude: _userLat,
        longitude: _userLon,
        sortBy: _sortBy,
      );

      if (!mounted) return;
      setState(() {
        _allMedicines = offerings;
        _isLoadingMedicines = false;
      });
      _applyLocalMedicineFiltersAndSorting();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingMedicines = false;
        _medicinesErrorMessage = 'Failed to load medicine availability: $e';
      });
    }
  }

  void _onMedicineSearchInputChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _applyLocalMedicineFiltersAndSorting();
    });
  }

  void _applyLocalMedicineFiltersAndSorting() {
    final query = _medicineSearchController.text.trim().toLowerCase();
    List<MedicineModel> list = List.from(_allMedicines);

    // 1. Search query filter
    if (query.isNotEmpty) {
      list = list.where((m) {
        final name = m.name.toLowerCase();
        final cat = (m.category ?? '').toLowerCase();
        final mfr = (m.manufacturer ?? '').toLowerCase();
        final ph = (m.pharmacyName ?? '').toLowerCase();
        final addr = (m.pharmacyAddress ?? '').toLowerCase();
        return name.contains(query) ||
            cat.contains(query) ||
            mfr.contains(query) ||
            ph.contains(query) ||
            addr.contains(query);
      }).toList();
    }

    // 2. Category filter
    if (_selectedCategory != 'All') {
      final cleanCat = _selectedCategory.toLowerCase();
      list = list.where((m) {
        final c = (m.category ?? '').toLowerCase();
        return c.contains(cleanCat) || cleanCat.contains(c);
      }).toList();
    }

    // 3. Sorting
    if (_sortBy == 'nearby') {
      if (_userLat != null && _userLon != null) {
        list.sort((a, b) {
          final aDist = a.distanceKm ?? 999999;
          final bDist = b.distanceKm ?? 999999;
          return aDist.compareTo(bDist);
        });
      } else {
        list.sort((a, b) => a.name.compareTo(b.name));
      }
    } else if (_sortBy == 'price_asc') {
      list.sort((a, b) {
        final aPrice = (a.unitPrice != null && a.unitPrice! > 0) ? a.unitPrice! : 999999;
        final bPrice = (b.unitPrice != null && b.unitPrice! > 0) ? b.unitPrice! : 999999;
        return aPrice.compareTo(bPrice);
      });
    } else if (_sortBy == 'price_desc') {
      list.sort((a, b) {
        final aPrice = (a.unitPrice != null && a.unitPrice! > 0) ? a.unitPrice! : -1;
        final bPrice = (b.unitPrice != null && b.unitPrice! > 0) ? b.unitPrice! : -1;
        return bPrice.compareTo(aPrice);
      });
    } else if (_sortBy == 'name') {
      list.sort((a, b) => a.name.compareTo(b.name));
    }

    if (mounted) {
      setState(() {
        _displayedMedicines = list;
      });
    }
  }

  // ==========================================
  // EXTERNAL ACTIONS: PHONE & DIRECTIONS
  // ==========================================
  Future<void> _makePhoneCall(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanPhone');
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } catch (_) {}
  }

  Future<void> _openDirections({
    required double? lat,
    required double? lon,
    String? name,
    String? address,
  }) async {
    if (lat == null && lon == null && (address == null || address.isEmpty)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location coordinates not available for directions'),
          ),
        );
      }
      return;
    }

    final String destination = (lat != null && lon != null)
        ? '$lat,$lon'
        : Uri.encodeComponent('${name ?? "Pharmacy"}, ${address ?? "Solapur"}');

    final Uri googleMapsDirUrl = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$destination',
    );

    try {
      final launched = await launchUrl(
        googleMapsDirUrl,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        final Uri googleMapsSearchUrl = Uri.parse(
          'https://www.google.com/maps/search/?api=1&query=$destination',
        );
        await launchUrl(
          googleMapsSearchUrl,
          mode: LaunchMode.externalApplication,
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open Google Maps'),
          ),
        );
      }
    }
  }

  // ==========================================
  // MAIN BUILD
  // ==========================================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7FAFF),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF12284C), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Medicine & Pharmacy Finder',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Color(0xFF12284C),
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
            ),
            child: TabBar(
              controller: _tabController,
              labelPadding: const EdgeInsets.symmetric(horizontal: 4),
              indicator: BoxDecoration(
                color: const Color(0xFF0284C7),
                borderRadius: BorderRadius.circular(12),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x260284C7),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: Colors.white,
              unselectedLabelColor: const Color(0xFF64748B),
              labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              tabs: const [
                Tab(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.local_pharmacy_rounded, size: 15),
                        SizedBox(width: 5),
                        Text('Pharmacies & Medicals'),
                      ],
                    ),
                  ),
                ),
                Tab(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.medication_liquid_rounded, size: 15),
                        SizedBox(width: 5),
                        Text('Find Medicines'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Non-intrusive Location Status Banner
          if (!_isLocationAvailable && _locationStatusMessage != null)
            _buildLocationStatusBanner(),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPharmaciesTab(),
                _buildMedicineSearchTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================
  // LOCATION BANNER
  // ==========================================
  Widget _buildLocationStatusBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      color: const Color(0xFFFFFBEB),
      child: Row(
        children: [
          const Icon(Icons.location_off_rounded, color: Color(0xFFD97706), size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _locationStatusMessage!,
              style: const TextStyle(fontSize: 11, color: Color(0xFF92400E), fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 6),
          if (_isGpsDisabled)
            TextButton(
              onPressed: () async {
                await Geolocator.openLocationSettings();
                _checkUserLocation();
              },
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Turn On', style: TextStyle(color: Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w700)),
            )
          else if (_isPermanentlyDenied)
            TextButton(
              onPressed: () async {
                await Geolocator.openAppSettings();
                _checkUserLocation();
              },
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Settings', style: TextStyle(color: Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w700)),
            )
          else
            TextButton(
              onPressed: _checkUserLocation,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: _isCheckingLocation
                  ? const SizedBox(height: 12, width: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFD97706)))
                  : const Text('Retry', style: TextStyle(color: Color(0xFFD97706), fontSize: 11, fontWeight: FontWeight.w700)),
            ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 1: PHARMACIES & MEDICALS TAB (LAZY LOADED)
  // ==========================================
  Widget _buildPharmaciesTab() {
    return RefreshIndicator(
      onRefresh: () async {
        await _checkUserLocation();
        await _loadPharmacies();
      },
      color: const Color(0xFF0284C7),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Bar
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x060F172A),
                          blurRadius: 10,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _pharmacySearchController,
                      decoration: InputDecoration(
                        hintText: 'Search pharmacies, medical stores...',
                        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                        suffixIcon: _pharmacySearchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
                                onPressed: () => _pharmacySearchController.clear(),
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Header summary
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${_filteredPharmacies.length} Approved Pharmacies',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF475569),
                        ),
                      ),
                      if (_isLocationAvailable)
                        const Text(
                          'Sorted by nearby',
                          style: TextStyle(fontSize: 11, color: Color(0xFF0284C7), fontWeight: FontWeight.w600),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                ],
              ),
            ),
          ),

          if (_isLoadingPharmacies)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF0284C7)),
              ),
            )
          else if (_pharmaciesErrorMessage != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorRetryView(_pharmaciesErrorMessage!, _loadPharmacies),
            )
          else if (_filteredPharmacies.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildEmptyView('No approved pharmacies found matching your search.'),
            )
          else
            // Virtualized lazy loading of pharmacy cards
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              sliver: SliverList.separated(
                itemCount: _filteredPharmacies.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final pharmacy = _filteredPharmacies[index];
                  return _buildPharmacyCard(pharmacy);
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPharmacyCard(PharmacyModel pharmacy) {
    final hasDistance = pharmacy.distanceKm != null;
    final distText = pharmacy.distanceText;
    final isJanAushadhi = pharmacy.name.toLowerCase().contains('aushadhi');

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PharmacyDetailsScreen(
              pharmacy: pharmacy,
              userLatitude: _userLat,
              userLongitude: _userLon,
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x080F172A),
              blurRadius: 14,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 48,
                  width: 48,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.local_pharmacy_rounded, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pharmacy.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF12284C),
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 5,
                        runSpacing: 4,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: isJanAushadhi
                                  ? const Color(0xFFE0F2FE)
                                  : const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.verified_rounded,
                                  color: isJanAushadhi
                                      ? const Color(0xFF0284C7)
                                      : const Color(0xFF16A34A),
                                  size: 11,
                                ),
                                const SizedBox(width: 3),
                                Text(
                                  isJanAushadhi ? 'Jan Aushadhi' : 'Verified',
                                  style: TextStyle(
                                    color: isJanAushadhi
                                        ? const Color(0xFF0284C7)
                                        : const Color(0xFF16A34A),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE0F2FE),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              distText,
                              style: TextStyle(
                                color: hasDistance ? const Color(0xFF0284C7) : const Color(0xFF64748B),
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${pharmacy.medicinesCount} Medicines',
                              style: const TextStyle(
                                color: Color(0xFF475569),
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
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
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on_outlined, color: Color(0xFF94A3B8), size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    pharmacy.address ?? 'Solapur, Maharashtra',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.3),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.access_time_rounded, color: Color(0xFF94A3B8), size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    pharmacy.operatingHours,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 12),
            Row(
              children: [
                if (pharmacy.phone != null && pharmacy.phone!.isNotEmpty) ...[
                  InkWell(
                    onTap: () => _makePhoneCall(pharmacy.phone!),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0FDF4),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFBBF7D0)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.call, color: Color(0xFF16A34A), size: 14),
                          SizedBox(width: 4),
                          Text('Call', style: TextStyle(color: Color(0xFF16A34A), fontSize: 12, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                InkWell(
                  onTap: () => _openDirections(
                    lat: pharmacy.latitude,
                    lon: pharmacy.longitude,
                    name: pharmacy.name,
                    address: pharmacy.address,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.directions_rounded, color: Color(0xFF2563EB), size: 14),
                        SizedBox(width: 4),
                        Text('Directions', style: TextStyle(color: Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => PharmacyDetailsScreen(
                          pharmacy: pharmacy,
                          userLatitude: _userLat,
                          userLongitude: _userLon,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.arrow_forward_rounded, size: 15),
                  label: const Text('View Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // TAB 2: FIND MEDICINES TAB (LAZY LOADED)
  // ==========================================
  Widget _buildMedicineSearchTab() {
    return RefreshIndicator(
      onRefresh: () async {
        await _checkUserLocation();
        await _fetchMedicines();
      },
      color: const Color(0xFF0284C7),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Search & Filter Header
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Field
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x060F172A),
                          blurRadius: 10,
                          offset: Offset(0, 3),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _medicineSearchController,
                      decoration: InputDecoration(
                        hintText: 'Search medicine name, salt, category...',
                        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                        suffixIcon: _medicineSearchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
                                onPressed: () => _medicineSearchController.clear(),
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Category Filter Chips
                  SizedBox(
                    height: 38,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final cat = _categories[index];
                        final isSelected = _selectedCategory == cat;
                        return ChoiceChip(
                          label: Text(
                            cat,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected ? Colors.white : const Color(0xFF475569),
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: const Color(0xFF0284C7),
                          backgroundColor: Colors.white,
                          side: BorderSide(
                            color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedCategory = cat;
                              });
                              _applyLocalMedicineFiltersAndSorting();
                            }
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Sort & Count Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${_displayedMedicines.length} Available Medicines',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF475569),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _sortBy,
                            isDense: true,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF0284C7),
                            ),
                            icon: const Icon(Icons.tune_rounded, size: 16, color: Color(0xFF0284C7)),
                            items: const [
                              DropdownMenuItem(value: 'nearby', child: Text('Sort: Nearby')),
                              DropdownMenuItem(value: 'price_asc', child: Text('Price: Low to High')),
                              DropdownMenuItem(value: 'price_desc', child: Text('Price: High to Low')),
                              DropdownMenuItem(value: 'name', child: Text('Name: A to Z')),
                            ],
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _sortBy = val;
                                });
                                _applyLocalMedicineFiltersAndSorting();
                              }
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Medicines List
          if (_isLoadingMedicines)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF0284C7)),
              ),
            )
          else if (_medicinesErrorMessage != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorRetryView(_medicinesErrorMessage!, _fetchMedicines),
            )
          else if (_displayedMedicines.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildEmptyView('No medicines found matching your criteria.'),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              sliver: SliverList.separated(
                itemCount: _displayedMedicines.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final medicine = _displayedMedicines[index];
                  return _buildMedicineCard(medicine);
                },
              ),
            ),
        ],
      ),
    );
  }

  // ==========================================
  // MEDICINE OFFERING CARD (CLEAN UI, NO GOVT BADGES)
  // ==========================================
  Widget _buildMedicineCard(MedicineModel item) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x06000000),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFDCFCE7)),
                ),
                child: const Icon(
                  Icons.medication_rounded,
                  color: Color(0xFF16A34A),
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF12284C),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '${item.category ?? "General"} • ${item.manufacturer ?? "Approved Manufacturer"}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              // Price Badge (Clean UI: only displayed when valid price exists, no "Govt Supply" badge)
              if (item.priceBadgeText != null)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: Text(
                    item.priceBadgeText!,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0284C7),
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 10),

          // Pharmacy Name & Address
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.local_pharmacy_outlined, size: 15, color: Color(0xFF0284C7)),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${item.pharmacyName ?? "Pharmacy"} • ${item.pharmacyAddress ?? "Solapur"}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF334155),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Availability status & Distance row
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: item.isAvailable ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  item.availabilityText,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: item.isAvailable ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  item.distanceText,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0284C7),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Action Buttons: Call & Directions
          Row(
            children: [
              if (item.pharmacyPhone != null && item.pharmacyPhone!.isNotEmpty) ...[
                InkWell(
                  onTap: () => _makePhoneCall(item.pharmacyPhone!),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.call, color: Color(0xFF16A34A), size: 14),
                        SizedBox(width: 4),
                        Text('Call', style: TextStyle(color: Color(0xFF16A34A), fontSize: 12, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              InkWell(
                onTap: () => _openDirections(
                  lat: item.latitude,
                  lon: item.longitude,
                  name: item.pharmacyName,
                  address: item.pharmacyAddress,
                ),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.directions_rounded, color: Color(0xFF2563EB), size: 14),
                      SizedBox(width: 4),
                      Text('Get Directions', style: TextStyle(color: Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // SHARED ERROR & EMPTY VIEWS
  // ==========================================
  Widget _buildEmptyView(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search_off_rounded, size: 52, color: Color(0xFF94A3B8)),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF475569),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorRetryView(String error, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, size: 48, color: Color(0xFFEF4444)),
            const SizedBox(height: 12),
            Text(
              error,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Color(0xFF334155)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Retry', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}
