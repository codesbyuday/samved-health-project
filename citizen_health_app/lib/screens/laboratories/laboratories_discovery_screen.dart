import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/laboratory_model.dart';
import '../../services/lab_service.dart';
import 'laboratory_details_screen.dart';
import 'test_details_screen.dart';

class LaboratoriesDiscoveryScreen extends StatefulWidget {
  const LaboratoriesDiscoveryScreen({super.key});

  @override
  State<LaboratoriesDiscoveryScreen> createState() => _LaboratoriesDiscoveryScreenState();
}

class _LaboratoriesDiscoveryScreenState extends State<LaboratoriesDiscoveryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _labSearchController = TextEditingController();
  final TextEditingController _testSearchController = TextEditingController();
  Timer? _debounceTimer;

  // Location state
  double? _userLat;
  double? _userLon;
  bool _isLocationAvailable = false;
  bool _isCheckingLocation = false;
  String? _locationStatusMessage;
  bool _isPermanentlyDenied = false;
  bool _isGpsDisabled = false;

  // Laboratories tab state
  List<LaboratoryModel> _allLabs = [];
  List<LaboratoryModel> _filteredLabs = [];
  bool _isLoadingLabs = true;
  String? _labsErrorMessage;

  // Test search tab state
  List<LabTestDetailModel> _testResults = [];
  bool _isLoadingTests = false;
  bool _hasLoadedTests = false; // Lazy loading Tab 2
  String? _testsErrorMessage;
  String _selectedCategory = 'All';
  String _sortBy = 'price'; // 'price' or 'nearby'

  final List<String> _categories = [
    'All',
    'Hematology',
    'Biochemistry',
    'Serology',
    'Radiology',
    'Microbiology',
    'Cardiology',
    'Endocrinology',
    'Pathology',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    // Lazy load Tab 2 when user switches to it
    _tabController.addListener(_onTabChanged);

    _labSearchController.addListener(_onLabSearchChanged);
    _testSearchController.addListener(_onTestSearchInputChanged);

    // Initial load: fetch user location and load Tab 1 labs
    _initData();
  }

  void _onTabChanged() {
    if (_tabController.index == 1 && !_hasLoadedTests && !_isLoadingTests) {
      _hasLoadedTests = true;
      _executeTestSearch();
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    _debounceTimer?.cancel();
    _labSearchController.removeListener(_onLabSearchChanged);
    _labSearchController.dispose();
    _testSearchController.removeListener(_onTestSearchInputChanged);
    _testSearchController.dispose();
    super.dispose();
  }

  Future<void> _initData() async {
    // 1. Check location concurrently
    _checkUserLocation();
    // 2. Load laboratories for Tab 1 immediately
    _loadLaboratories();
  }

  /// Robust location fetcher for Android physical devices
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
          _locationStatusMessage = 'Location permission is permanently denied in settings.';
          _isCheckingLocation = false;
        });
        return;
      }

      // 3. FAST PATH: Check last known position first (instant on Android without satellite wait)
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

      // 4. FRESH GPS PATH: Get fresh location using balanced/medium accuracy
      // (Medium accuracy works with both Approximate and Precise permissions and works indoors)
      try {
        final freshPosition = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 12),
        );
        position = freshPosition;
      } catch (_) {
        // If medium accuracy timed out, try low accuracy as fallback
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

  /// Recalculates distances locally across loaded labs and test results
  void _updateDistancesForAllItems() {
    if (_userLat == null || _userLon == null) return;

    // Update laboratories
    for (int i = 0; i < _allLabs.length; i++) {
      final lab = _allLabs[i];
      if (lab.latitude != null && lab.longitude != null) {
        final dist = LabService.calculateDistance(
          _userLat!,
          _userLon!,
          lab.latitude!,
          lab.longitude!,
        );
        _allLabs[i] = lab.copyWith(distanceKm: dist);
      }
    }

    _onLabSearchChanged();

    // Update test results
    if (_testResults.isNotEmpty) {
      for (int i = 0; i < _testResults.length; i++) {
        final t = _testResults[i];
        if (t.latitude != null && t.longitude != null) {
          final dist = LabService.calculateDistance(
            _userLat!,
            _userLon!,
            t.latitude!,
            t.longitude!,
          );
          _testResults[i] = t.copyWith(distanceKm: dist);
        }
      }

      if (_sortBy == 'nearby') {
        _testResults.sort((a, b) => (a.distanceKm ?? 999999).compareTo(b.distanceKm ?? 999999));
      } else if (_sortBy == 'price_desc') {
        _testResults.sort((a, b) => (b.price > 0 ? b.price : -1).compareTo(a.price > 0 ? a.price : -1));
      } else {
        _testResults.sort((a, b) => (a.price > 0 ? a.price : 999999).compareTo(b.price > 0 ? b.price : 999999));
      }
    }

    if (mounted) setState(() {});
  }

  Future<void> _loadLaboratories() async {
    setState(() {
      _isLoadingLabs = true;
      _labsErrorMessage = null;
    });

    try {
      final labs = await LabService.getLaboratories(
        latitude: _userLat,
        longitude: _userLon,
      );

      if (!mounted) return;
      setState(() {
        _allLabs = labs;
        _isLoadingLabs = false;
      });
      _onLabSearchChanged();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingLabs = false;
        _labsErrorMessage = 'Unable to fetch laboratories: $e';
      });
    }
  }

  void _onLabSearchChanged() {
    final query = _labSearchController.text.trim().toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredLabs = List.from(_allLabs);
      } else {
        _filteredLabs = _allLabs.where((lab) {
          final name = lab.name.toLowerCase();
          final addr = (lab.address ?? '').toLowerCase();
          return name.contains(query) || addr.contains(query);
        }).toList();
      }

      if (_userLat != null && _userLon != null) {
        _filteredLabs.sort((a, b) => (a.distanceKm ?? 999999).compareTo(b.distanceKm ?? 999999));
      }
    });
  }

  void _onTestSearchInputChanged() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      _executeTestSearch();
    });
  }

  Future<void> _executeTestSearch() async {
    if (!mounted) return;
    setState(() {
      _isLoadingTests = true;
      _testsErrorMessage = null;
    });

    try {
      final query = _testSearchController.text.trim();
      final results = await LabService.searchTests(
        query: query.isNotEmpty ? query : null,
        category: _selectedCategory,
        sortBy: _sortBy,
        latitude: _userLat,
        longitude: _userLon,
      );

      if (!mounted) return;
      setState(() {
        _testResults = results;
        _isLoadingTests = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingTests = false;
        _testsErrorMessage = 'Error searching tests: $e';
      });
    }
  }

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
        : Uri.encodeComponent('${name ?? "Diagnostic Center"}, ${address ?? "Solapur"}');

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
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open Google Maps'),
          ),
        );
      }
    }
  }

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
          'Laboratories & Lab Tests',
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
                        Icon(Icons.apartment_rounded, size: 15),
                        SizedBox(width: 5),
                        Text('Diagnostic Centers'),
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
                        Icon(Icons.biotech_rounded, size: 15),
                        SizedBox(width: 5),
                        Text('Search Lab Tests'),
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
                _buildLaboratoriesTab(),
                _buildTestSearchTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

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
              onPressed: () {
                _checkUserLocation();
              },
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
  // TAB 1: LABORATORIES DISCOVERY (LAZY LOADED)
  // ==========================================
  Widget _buildLaboratoriesTab() {
    return RefreshIndicator(
      onRefresh: () async {
        await _checkUserLocation();
        await _loadLaboratories();
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
                      controller: _labSearchController,
                      decoration: InputDecoration(
                        hintText: 'Search laboratories by name or area...',
                        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                        suffixIcon: _labSearchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
                                onPressed: () => _labSearchController.clear(),
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
                        '${_filteredLabs.length} Diagnostic Centers',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF475569),
                        ),
                      ),
                      if (_isLocationAvailable)
                        const Text(
                          'Sorted by proximity',
                          style: TextStyle(fontSize: 11, color: Color(0xFF0284C7), fontWeight: FontWeight.w600),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                ],
              ),
            ),
          ),

          if (_isLoadingLabs)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF0284C7)),
              ),
            )
          else if (_labsErrorMessage != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorRetryView(_labsErrorMessage!, _loadLaboratories),
            )
          else if (_filteredLabs.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildEmptyView('No laboratories found matching your search.'),
            )
          else
            // Virtualized lazy loading of laboratory cards
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              sliver: SliverList.separated(
                itemCount: _filteredLabs.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final lab = _filteredLabs[index];
                  return _buildLaboratoryCard(lab);
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLaboratoryCard(LaboratoryModel lab) {
    final hasDistance = lab.distanceKm != null;
    final distText = hasDistance ? '${lab.distanceKm!.toStringAsFixed(1)} km away' : 'Distance N/A';

    return Container(
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
                child: const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      lab.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF12284C),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    // Wrap ensures badges never cause pixel overflow on small screens
                    Wrap(
                      spacing: 5,
                      runSpacing: 4,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified_rounded, color: Color(0xFF16A34A), size: 11),
                              SizedBox(width: 3),
                              Text('Verified', style: TextStyle(color: Color(0xFF16A34A), fontSize: 10, fontWeight: FontWeight.w700)),
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
                            '${lab.testsCount} Tests',
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
                  lab.address ?? 'Solapur, Maharashtra',
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
                  lab.operatingHours,
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
              if (lab.phone != null && lab.phone!.isNotEmpty) ...[
                InkWell(
                  onTap: () => _makePhoneCall(lab.phone!),
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
                  lat: lab.latitude,
                  lon: lab.longitude,
                  name: lab.name,
                  address: lab.address,
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
                      builder: (context) => LaboratoryDetailsScreen(
                        providerId: lab.providerId,
                        userLat: _userLat,
                        userLon: _userLon,
                        initialLab: lab,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.arrow_forward_rounded, size: 15),
                label: const Text('Catalogue', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================
  // TAB 2: GLOBAL TEST SEARCH (VIRTUALIZED LAZY LOADING)
  // ==========================================
  Widget _buildTestSearchTab() {
    return RefreshIndicator(
      onRefresh: () async {
        await _checkUserLocation();
        await _executeTestSearch();
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
                  // Search Input
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
                      controller: _testSearchController,
                      decoration: InputDecoration(
                        hintText: 'Search test (e.g. CBC, Dengue, Blood Sugar)...',
                        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.biotech_rounded, color: Color(0xFF0284C7), size: 22),
                        suffixIcon: _testSearchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
                                onPressed: () {
                                  _testSearchController.clear();
                                  _executeTestSearch();
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Category Chips
                  SizedBox(
                    height: 34,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final cat = _categories[index];
                        final isSelected = cat == _selectedCategory;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedCategory = cat;
                            });
                            _executeTestSearch();
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF0284C7) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Text(
                              cat,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: isSelected ? Colors.white : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Sorting Controls (Price: Low to High, Price: High to Low, Nearby)
                  Row(
                    children: [
                      const Text(
                        'Sort by:',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: [
                              _buildSortButton('Price: Low to High', 'price', Icons.arrow_upward_rounded),
                              const SizedBox(width: 6),
                              _buildSortButton('Price: High to Low', 'price_desc', Icons.arrow_downward_rounded),
                              const SizedBox(width: 6),
                              _buildSortButton('Nearby', 'nearby', Icons.near_me_rounded),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (!_isLoadingTests && _testsErrorMessage == null && _testResults.isNotEmpty)
                    Text(
                      'Found ${_testResults.length} matching test offerings',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                    ),
                  const SizedBox(height: 4),
                ],
              ),
            ),
          ),

          // Virtualized lazy loading of test result cards
          if (_isLoadingTests)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF0284C7)),
              ),
            )
          else if (_testsErrorMessage != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildErrorRetryView(_testsErrorMessage!, _executeTestSearch),
            )
          else if (_testResults.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildEmptyView('No matching diagnostic tests found across laboratories.'),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              sliver: SliverList.separated(
                itemCount: _testResults.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final test = _testResults[index];
                  return _buildTestResultCard(test);
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSortButton(String label, String value, IconData icon) {
    final isSelected = _sortBy == value;
    return GestureDetector(
      onTap: () {
        if (value == 'nearby' && !_isLocationAvailable) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Location access is required for nearby sorting.'),
              action: SnackBarAction(
                label: 'Enable',
                onPressed: () async {
                  await _checkUserLocation();
                  _executeTestSearch();
                },
              ),
            ),
          );
        }
        setState(() {
          _sortBy = value;
        });
        _executeTestSearch();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE0F2FE) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF64748B)),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? const Color(0xFF0284C7) : const Color(0xFF475569),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTestResultCard(LabTestDetailModel test) {
    final hasDistance = test.distanceKm != null;
    final distText = hasDistance ? '${test.distanceKm!.toStringAsFixed(1)} km' : 'N/A';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060F172A),
            blurRadius: 10,
            offset: Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Test Name & Price Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        test.testCategory.toUpperCase(),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      test.testName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF12284C),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    test.price > 0 ? '₹${test.price}' : 'Price N/A',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0284C7),
                    ),
                  ),
                  const Text('at this lab', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 10),

          // Laboratory Info Row
          InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => LaboratoryDetailsScreen(
                    providerId: test.providerId,
                    userLat: _userLat,
                    userLon: _userLon,
                  ),
                ),
              );
            },
            borderRadius: BorderRadius.circular(8),
            child: Row(
              children: [
                const Icon(Icons.local_hospital_rounded, size: 16, color: Color(0xFF0284C7)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    test.laboratoryName ?? 'Diagnostic Laboratory',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1E293B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.location_on_rounded, size: 11, color: Color(0xFF0284C7)),
                      const SizedBox(width: 2),
                      Text(
                        distText,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: hasDistance ? const Color(0xFF0284C7) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Protocol Details Row - protected from overflow
          Row(
            children: [
              const Icon(Icons.schedule_rounded, size: 13, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Flexible(
                flex: 3,
                child: Text(
                  'Report: ${test.turnaroundTime ?? "Same day"}',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.science_outlined, size: 13, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Expanded(
                flex: 4,
                child: Text(
                  test.sampleType ?? 'Blood Sample',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Actions
          Row(
            children: [
              TextButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => LaboratoryDetailsScreen(
                        providerId: test.providerId,
                        userLat: _userLat,
                        userLon: _userLon,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.apartment_rounded, size: 14, color: Color(0xFF475569)),
                label: const Text('Lab', style: TextStyle(color: Color(0xFF475569), fontSize: 12, fontWeight: FontWeight.w600)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
              const SizedBox(width: 4),
              TextButton.icon(
                onPressed: () => _openDirections(
                  lat: test.latitude,
                  lon: test.longitude,
                  name: test.laboratoryName,
                  address: test.laboratoryAddress,
                ),
                icon: const Icon(Icons.directions_rounded, size: 14, color: Color(0xFF2563EB)),
                label: const Text('Directions', style: TextStyle(color: Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.w600)),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => TestDetailsScreen(
                        test: test,
                        userLat: _userLat,
                        userLon: _userLon,
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.visibility_outlined, size: 14),
                label: const Text('Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyView(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.search_off_rounded, color: Color(0xFF94A3B8), size: 48),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorRetryView(String error, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 30),
        child: Column(
          children: [
            const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 40),
            const SizedBox(height: 10),
            Text(error, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7), foregroundColor: Colors.white),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
