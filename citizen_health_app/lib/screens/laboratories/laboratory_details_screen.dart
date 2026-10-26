import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/laboratory_model.dart';
import '../../services/lab_service.dart';
import 'test_details_screen.dart';

class LaboratoryDetailsScreen extends StatefulWidget {
  final String providerId;
  final double? userLat;
  final double? userLon;
  final LaboratoryModel? initialLab;

  const LaboratoryDetailsScreen({
    super.key,
    required this.providerId,
    this.userLat,
    this.userLon,
    this.initialLab,
  });

  @override
  State<LaboratoryDetailsScreen> createState() => _LaboratoryDetailsScreenState();
}

class _LaboratoryDetailsScreenState extends State<LaboratoryDetailsScreen> {
  final TextEditingController _searchController = TextEditingController();
  LaboratoryModel? _laboratory;
  List<LabTestDetailModel> _allTests = [];
  List<LabTestDetailModel> _filteredTests = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _selectedCategory = 'All';

  @override
  void initState() {
    super.initState();
    _laboratory = widget.initialLab;
    _searchController.addListener(_filterCatalogue);
    _loadLaboratoryProfile();
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterCatalogue);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadLaboratoryProfile() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final lab = await LabService.getLaboratoryProfile(
        widget.providerId,
        latitude: widget.userLat,
        longitude: widget.userLon,
      );

      if (!mounted) return;

      if (lab != null) {
        setState(() {
          _laboratory = lab;
          _allTests = lab.tests;
          _isLoading = false;
        });
        _filterCatalogue();
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Could not load laboratory profile. Please try again.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Error loading laboratory details: $e';
      });
    }
  }

  void _filterCatalogue() {
    final query = _searchController.text.trim().toLowerCase();
    setState(() {
      _filteredTests = _allTests.where((test) {
        final matchesCat = _selectedCategory == 'All' ||
            test.testCategory.toLowerCase() == _selectedCategory.toLowerCase();

        final matchesQuery = query.isEmpty ||
            test.testName.toLowerCase().contains(query) ||
            test.testCategory.toLowerCase().contains(query) ||
            (test.description?.toLowerCase().contains(query) ?? false);

        return matchesCat && matchesQuery;
      }).toList();
    });
  }

  Set<String> _extractCategories() {
    final set = <String>{'All'};
    for (var t in _allTests) {
      if (t.testCategory.trim().isNotEmpty) {
        set.add(t.testCategory.trim());
      }
    }
    return set;
  }

  Future<void> _launchUrlHelper(String urlStr) async {
    final uri = Uri.parse(urlStr);
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
        title: Text(
          _laboratory?.name ?? 'Laboratory Details',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF12284C),
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)))
          : _errorMessage != null
              ? _buildErrorView()
              : _buildLazyContentView(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444), size: 48),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'An error occurred',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 18),
            ElevatedButton.icon(
              onPressed: _loadLaboratoryProfile,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Uses CustomScrollView with SliverList for true lazy loading and optimal memory usage
  Widget _buildLazyContentView() {
    final lab = _laboratory;
    if (lab == null) return const SizedBox.shrink();

    final hasDistance = lab.distanceKm != null;
    final distText = hasDistance ? '${lab.distanceKm!.toStringAsFixed(1)} km away' : 'Distance N/A';
    final categories = _extractCategories().toList();

    return RefreshIndicator(
      onRefresh: _loadLaboratoryProfile,
      color: const Color(0xFF0284C7),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            sliver: SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Laboratory Profile Header Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A0F172A),
                          blurRadius: 16,
                          offset: Offset(0, 6),
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
                              height: 52,
                              width: 52,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                                ),
                                borderRadius: BorderRadius.circular(15),
                              ),
                              child: const Icon(
                                Icons.local_hospital_rounded,
                                color: Colors.white,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    lab.name,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF12284C),
                                      height: 1.2,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 6),
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 4,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDCFCE7),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.verified_rounded, color: Color(0xFF16A34A), size: 12),
                                            SizedBox(width: 3),
                                            Text(
                                              'Verified',
                                              style: TextStyle(
                                                color: Color(0xFF16A34A),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE0F2FE),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          distText,
                                          style: TextStyle(
                                            color: hasDistance ? const Color(0xFF0284C7) : const Color(0xFF64748B),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
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
                        const SizedBox(height: 14),
                        const Divider(color: Color(0xFFF1F5F9), height: 1),
                        const SizedBox(height: 12),

                        // Address
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.location_on_outlined, color: Color(0xFF64748B), size: 17),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                lab.address ?? 'Solapur Municipal Corporation',
                                style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Operating hours
                        Row(
                          children: [
                            const Icon(Icons.access_time_rounded, color: Color(0xFF64748B), size: 17),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Hours: ${lab.operatingHours}',
                                style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        if (lab.license != null && lab.license!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.badge_outlined, color: Color(0xFF64748B), size: 17),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'License: ${lab.license}',
                                  style: const TextStyle(fontSize: 13, color: Color(0xFF475569)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 14),

                        // Get Directions Primary Button
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () => _openDirections(
                              lat: lab.latitude,
                              lon: lab.longitude,
                              name: lab.name,
                              address: lab.address,
                            ),
                            icon: const Icon(Icons.directions_rounded, size: 18),
                            label: const Text(
                              'Get Directions',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0284C7),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),

                        // Call and Email Action Buttons
                        Row(
                          children: [
                            if (lab.phone != null && lab.phone!.isNotEmpty)
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => _launchUrlHelper('tel:${lab.phone}'),
                                  icon: const Icon(Icons.call_rounded, size: 15, color: Color(0xFF0284C7)),
                                  label: const FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      'Call Lab',
                                      style: TextStyle(color: Color(0xFF0284C7), fontSize: 13, fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Color(0xFFBAE6FD)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                  ),
                                ),
                              ),
                            if (lab.phone != null && lab.email != null) const SizedBox(width: 10),
                            if (lab.email != null && lab.email!.isNotEmpty)
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => _launchUrlHelper('mailto:${lab.email}'),
                                  icon: const Icon(Icons.mail_outline_rounded, size: 15, color: Color(0xFF64748B)),
                                  label: const FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      'Email',
                                      style: TextStyle(color: Color(0xFF475569), fontSize: 13, fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),

                  // Diagnostic Test Catalogue Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.menu_book_rounded, color: Color(0xFF0284C7), size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Diagnostic Test Catalogue',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF12284C),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE0F2FE),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          '${_filteredTests.length} Tests',
                          style: const TextStyle(
                            color: Color(0xFF0284C7),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Search Bar for Catalogue
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        hintText: 'Search test name, category...',
                        hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
                                onPressed: () => _searchController.clear(),
                              )
                            : null,
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Category Filter Chips
                  if (categories.length > 2)
                    SizedBox(
                      height: 34,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final cat = categories[index];
                          final isSelected = cat == _selectedCategory;
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedCategory = cat;
                              });
                              _filterCatalogue();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
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
                ],
              ),
            ),
          ),

          // Lazy Loaded Virtualized List of Test Cards
          if (_filteredTests.isEmpty)
            SliverToBoxAdapter(child: _buildEmptyCatalogueView())
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              sliver: SliverList.separated(
                itemCount: _filteredTests.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final test = _filteredTests[index];
                  return _buildTestCard(test);
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTestCard(LabTestDetailModel test) {
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
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
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      test.testName,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
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
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0284C7),
                    ),
                  ),
                  const Text(
                    'per test',
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (test.description != null && test.description!.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              test.description!,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF64748B),
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFF8FAFC)),
          const SizedBox(height: 10),

          // Bottom protocol & details row - EXPANDED to completely prevent overflow
          Row(
            children: [
              const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  test.turnaroundTime ?? 'Within 6-12 hours',
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: () {
                  final enrichedTest = test.copyWith(
                    laboratoryName: _laboratory?.name,
                    laboratoryAddress: _laboratory?.address,
                    laboratoryPhone: _laboratory?.phone,
                    latitude: _laboratory?.latitude,
                    longitude: _laboratory?.longitude,
                    distanceKm: _laboratory?.distanceKm,
                  );
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => TestDetailsScreen(
                        test: enrichedTest,
                        userLat: widget.userLat,
                        userLon: widget.userLon,
                      ),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(8),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Protocol Details',
                        style: TextStyle(
                          color: Color(0xFF0284C7),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.arrow_forward_ios_rounded, size: 11, color: Color(0xFF0284C7)),
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

  Widget _buildEmptyCatalogueView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            const Icon(Icons.search_off_rounded, color: Color(0xFF94A3B8), size: 48),
            const SizedBox(height: 12),
            const Text(
              'No tests match your filter',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Try searching for another test or change the category filter.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () {
                _searchController.clear();
                setState(() {
                  _selectedCategory = 'All';
                });
                _filterCatalogue();
              },
              child: const Text('Reset Filters', style: TextStyle(color: Color(0xFF0284C7))),
            ),
          ],
        ),
      ),
    );
  }
}
