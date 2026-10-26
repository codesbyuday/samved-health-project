import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'dart:typed_data';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'dart:io';

/// Citizen Model - Adjust fields as per your data model
class Citizen {
  final String citizenId;
  final String? name;
  final String? gender;
  final String? dateOfBirth;
  final int? age;
  final String? bloodGroup;
  final String? wardNumber;
  final String? userPhotoUrl;
  final DateTime? createdAt;

  Citizen({
    required this.citizenId,
    this.name,
    this.gender,
    this.dateOfBirth,
    this.age,
    this.bloodGroup,
    this.wardNumber,
    this.userPhotoUrl,
    this.createdAt,
  });
}

/// Health Card Widget - ID-1 Standard (85.60 × 53.98 mm)
class HealthCard extends StatefulWidget {
  final Citizen citizen;
  final String wardName;
  final bool compact;

  const HealthCard({
    super.key,
    required this.citizen,
    required this.wardName,
    this.compact = false,
  });

  @override
  State<HealthCard> createState() => _HealthCardState();
}

class _HealthCardState extends State<HealthCard> {
  final GlobalKey _cardKey = GlobalKey();
  bool _isDownloading = false;
  String? _downloadError;

  // ID-1 Standard Card dimensions
  static const double cardWidthMm = 85.6;
  static const double cardHeightMm = 54.0;

  // Convert mm to logical pixels (approximate for screen)
  static const double mmToPx = 3.78;

  late double _cardWidth;
  late double _cardHeight;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _cardWidth = cardWidthMm * mmToPx;
    _cardHeight = cardHeightMm * mmToPx;
  }

  /// Calculate age from date of birth
  int? _calculateAge() {
    if (widget.citizen.dateOfBirth != null) {
      final dob = DateTime.parse(widget.citizen.dateOfBirth!);
      final today = DateTime.now();
      int age = today.year - dob.year;
      if (today.month < dob.month ||
          (today.month == dob.month && today.day < dob.day)) {
        age--;
      }
      return age;
    }
    return widget.citizen.age;
  }

  /// Format date as DD MMM YYYY
  String _formatDate(DateTime? date) {
    if (date == null) {
      date = DateTime.now();
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day.toString().padLeft(2, '0')} ${months[date.month - 1]} ${date.year}';
  }

  /// Get avatar image path based on gender
  String _getAvatarImage() {
    if (widget.citizen.gender?.toLowerCase() == 'female') {
      return 'assets/images/female-avatar.jpeg';
    }
    return 'assets/images/male-avatar.jpeg';
  }

  /// Get verification URL for QR code
  String get _verificationUrl {
    // Replace with your actual domain
    return 'https://your-domain.com/citizen/${widget.citizen.citizenId}/verify';
  }

  /// Download health card as PDF
  Future<void> _downloadPdf() async {
    if (_isDownloading) return;

    setState(() {
      _isDownloading = true;
      _downloadError = null;
    });

    try {
      // 🔥 Ensure widget is rendered
      await Future.delayed(const Duration(milliseconds: 300));

      final boundary = _cardKey.currentContext?.findRenderObject();

      if (boundary == null || boundary is! RenderRepaintBoundary) {
        throw Exception("Card not ready for capture");
      }

      // 🔥 VERY SAFE pixel ratio
      final image = await boundary.toImage(pixelRatio: 1.8);

      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);

      if (byteData == null) {
        throw Exception("Image conversion failed");
      }

      final pngBytes = byteData.buffer.asUint8List();

      // 🔥 Create PDF
      final pdf = pw.Document();

      final imageProvider = pw.MemoryImage(pngBytes);

      pdf.addPage(
        pw.Page(
          pageFormat: const PdfPageFormat(
            85.6 * PdfPageFormat.mm,
            54 * PdfPageFormat.mm,
          ),
          build: (context) {
            return pw.Center(
              child: pw.Image(imageProvider),
            );
          },
        ),
      );

      // 🔥 Save file
      final directory = Directory('/storage/emulated/0/Download');

      if (!await directory.exists()) {
        await directory.create(recursive: true);
      }

      final file = File(
        '${directory.path}/HealthCard_${widget.citizen.citizenId}.pdf',
      );

      await file.writeAsBytes(await pdf.save());

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Saved: ${file.path}'),
            backgroundColor: Colors.green,
          ),
        );
      }

    } catch (e) {
      debugPrint("PDF ERROR: $e");

      if (!mounted) return;
      setState(() {
        _downloadError = "Download failed. Try again.";
      });

    } finally {
      if (!mounted) return;
      setState(() {
        _isDownloading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final age = _calculateAge();
    final issueDate = _formatDate(widget.citizen.createdAt);
    final printDate = _formatDate(DateTime.now());

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // ═══════════════════════════════════════
        // THE CARD (ID-1 Standard: 86 × 54 mm)
        // ════════════════════════════════════════
        RepaintBoundary(
          key: _cardKey,
          child: Container(
            width: _cardWidth,
            height: _cardHeight,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFeef4ff), Color(0xFFf8fbff), Color(0xFFe8f5ee)],
                stops: [0.0, 0.45, 1.0],
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFc8d8e8), width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                children: [
                  // ── Subtle background watermark ──
                  Positioned.fill(
                    child: Center(
                      child: Transform.rotate(
                        angle: -0.5236, // -30 degrees in radians
                        child: Text(
                          'SMC HEALTH',
                          style: TextStyle(
                            fontSize: _cardWidth * 0.09,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF1e40af).withOpacity(0.04),
                            letterSpacing: 3,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Main content column
                  Column(
                    children: [
                      // ══ HEADER ══
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [Color(0xFF1a3a6b), Color(0xFF1e4d8c), Color(0xFF1a5c38)],
                            stops: [0.0, 0.6, 1.0],
                          ),
                        ),
                        child: Row(
                          children: [
                            // Logo
                            Container(
                              width: 32,
                              height: 32,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withOpacity(0.6), width: 2),
                                color: Colors.white,
                              ),
                              child: ClipOval(
                                child: Image.asset(
                                  'assets/images/xmc_logo.png',
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) {
                                    return const Icon(Icons.account_balance, size: 20, color: Color(0xFF1e40af));
                                  },
                                ),
                              ),
                            ),
                            // Title
                            Expanded(
                              child: Column(
                                children: [
                                  Text(
                                    'Solapur Municipal Corporation',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: _cardWidth * 0.038,
                                      fontWeight: FontWeight.w700,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    'Citizen Health Card',
                                    style: TextStyle(
                                      color: const Color(0xFF7edd9c),
                                      fontSize: _cardWidth * 0.026,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 32), // Balance the logo
                          ],
                        ),
                      ),

                      // ══ STRIPE ══
                      Row(
                        children: [
                          Expanded(flex: 3, child: Container(height: 2, color: const Color(0xFF16a34a))),
                          Expanded(flex: 1, child: Container(height: 2, color: const Color(0xFF2563eb))),
                        ],
                      ),

                      // ══ BODY - 3 Column Grid ══
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                          child: Row(
                            children: [
                              // Photo Column (23%)
                              Expanded(
                                flex: 23,
                                child: Center(
                                  child: AspectRatio(
                                    aspectRatio: 4 / 5,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: const Color(0xFF94a3b8)),
                                      ),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: widget.citizen.userPhotoUrl != null
                                            ? Image.network(
                                                widget.citizen.userPhotoUrl!,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error, stackTrace) {
                                                  return Image.asset(
                                                    _getAvatarImage(),
                                                    fit: BoxFit.cover,
                                                  );
                                                },
                                              )
                                            : Image.asset(
                                                _getAvatarImage(),
                                                fit: BoxFit.cover,
                                              ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),

                              const SizedBox(width: 5),

                              // Details Column (50%)
                              Expanded(
                                flex: 50,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Name
                                    _buildDetailRow(
                                      label: 'Name:',
                                      value: widget.citizen.name ?? 'N/A',
                                      valueBold: true,
                                      valueSize: _cardWidth * 0.032,
                                    ),
                                    const SizedBox(height: 2),

                                    // Age / Gender
                                    _buildDetailRow(
                                      label: 'Age/Gender:',
                                      value: '${age ?? 'N/A'} / ${widget.citizen.gender?.substring(0, 1) ?? '?'}',
                                    ),
                                    const SizedBox(height: 2),

                                    // Blood Group
                                    _buildDetailRow(
                                      label: 'Blood:',
                                      value: widget.citizen.bloodGroup ?? 'N/A',
                                    ),
                                    const SizedBox(height: 2),

                                    // Ward
                                    _buildDetailRow(
                                      label: 'Ward:',
                                      value: widget.wardName,
                                    ),
                                    const SizedBox(height: 2),

                                    // Health ID
                                    Container(
                                      margin: const EdgeInsets.only(top: 2),
                                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF1e40af).withOpacity(0.08),
                                        borderRadius: BorderRadius.circular(3),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            'Health ID: ',
                                            style: TextStyle(
                                              color: const Color(0xFF1e40af),
                                              fontSize: _cardWidth * 0.027,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          Text(
                                            widget.citizen.citizenId,
                                            style: TextStyle(
                                              color: const Color(0xFF1e3a8a),
                                              fontSize: _cardWidth * 0.028,
                                              fontWeight: FontWeight.w800,
                                              fontFamily: 'Courier',
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    // Issue Date
                                    Padding(
                                      padding: const EdgeInsets.only(top: 2),
                                      child: Text(
                                        'Issue: $issueDate',
                                        style: TextStyle(
                                          fontSize: _cardWidth * 0.022,
                                          color: const Color(0xFF64748b),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(width: 5),

                              // QR Code Column (27%)
                              Expanded(
                                flex: 27,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    // QR Code
                                    Container(
                                      padding: const EdgeInsets.all(3),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: const Color(0xFFcbd5e1)),
                                      ),
                                      child: QrImageView(
                                        data: _verificationUrl,
                                        version: QrVersions.auto,
                                        size: _cardWidth * 0.17,
                                        errorCorrectionLevel: QrErrorCorrectLevel.M,
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      'Scan for Records',
                                      style: TextStyle(
                                        fontSize: _cardWidth * 0.02,
                                        color: const Color(0xFF64748b),
                                        fontWeight: FontWeight.w500,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // ══ FOOTER STRIPE ══
                      Row(
                        children: [
                          Expanded(child: Container(height: 2, color: const Color(0xFF16a34a))),
                          Expanded(child: Container(height: 2, color: const Color(0xFF2563eb))),
                          Expanded(child: Container(height: 2, color: const Color(0xFF16a34a))),
                        ],
                      ),

                      // ══ FOOTER ══
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [Color(0xFF1a3a6b), Color(0xFF1e4d8c), Color(0xFF1a5c38)],
                            stops: [0.0, 0.6, 1.0],
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Print: $printDate',
                              style: TextStyle(
                                fontSize: _cardWidth * 0.02,
                                color: Colors.white.withOpacity(0.85),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              'Scan QR for health records',
                              style: TextStyle(
                                fontSize: _cardWidth * 0.018,
                                color: Colors.white.withOpacity(0.7),
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: 20),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
          child: GestureDetector(
            onTap: _isDownloading ? null : _downloadPdf,
            child: Opacity(
              opacity: _isDownloading ? 0.75 : 1,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF1565C0),
                      Color(0xFF42A5F5),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _isDownloading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Icon(
                            Icons.download_rounded,
                            color: Colors.white,
                          ),
                    const SizedBox(width: 10),
                    Text(
                      _isDownloading
                          ? 'Generating PDF...'
                          : 'Download Health Card (PDF)',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            "Save your health card for offline access",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 13,
            ),
          ),
        ),

        // Error message
        if (_downloadError != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _downloadError!,
              style: const TextStyle(color: Colors.red, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ),
      ],
    );
  }

  /// Helper to build detail rows
  Widget _buildDetailRow({
    required String label,
    required String value,
    bool valueBold = false,
    double? valueSize,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        SizedBox(
          width: _cardWidth * 0.12,
          child: Text(
            label,
            style: TextStyle(
              color: const Color(0xFF1e40af),
              fontSize: _cardWidth * 0.027,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              color: const Color(0xFF374151),
              fontSize: valueSize ?? _cardWidth * 0.029,
              fontWeight: valueBold ? FontWeight.w700 : FontWeight.normal,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLE
// ═══════════════════════════════════════════════════════════════════════════

/*
class HealthCardScreen extends StatelessWidget {
  const HealthCardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Example citizen data
    final citizen = Citizen(
      citizenId: 'SMC-2024-001234',
      name: 'John Doe',
      gender: 'Male',
      dateOfBirth: '1990-05-15',
      bloodGroup: 'B+',
      wardNumber: '12',
      userPhotoUrl: null, // Or provide URL
      createdAt: DateTime(2024, 1, 15),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Health Card'),
        backgroundColor: const Color(0xFF1e40af),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: HealthCard(
            citizen: citizen,
            wardName: 'Ward 12 - Market Area',
          ),
        ),
      ),
    );
  }
}
*/


// ═══════════════════════════════════════════════════════════════════════════
// REQUIRED DEPENDENCIES - Add to pubspec.yaml
// ═══════════════════════════════════════════════════════════════════════════

/*
dependencies:
  flutter:
    sdk: flutter
  qr_flutter: ^4.1.0           # For QR code generation
  pdf: ^3.10.8                 # For PDF creation
  path_provider: ^2.1.2        # For file saving

assets:
  - assets/images/solapur-logo.jpg
  - assets/images/male-avatar.jpg
  - assets/images/female-avatar.jpg
*/
