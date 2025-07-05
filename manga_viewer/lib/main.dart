import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:archive/archive.dart';
import 'widgets/animated_speech_bubble.dart';
import 'widgets/language_toggle.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Manga Viewer',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const MangaViewer(),
    );
  }
}

class MangaViewer extends StatefulWidget {
  const MangaViewer({super.key});

  @override
  State<MangaViewer> createState() => _MangaViewerState();
}

class _MangaViewerState extends State<MangaViewer> {
  List<Uint8List> _pages = [];
  Map<String, dynamic>? _creatorData;
  bool _isLoading = false;
  String? _error;
  String _currentLanguage = 'ja';
  final ScrollController _scrollController = ScrollController();
  int _currentRow = 0;
  double _sweetSpot = 600;
  int _delayRows = 0; // Number of rows to delay per page index
  List<Map<String, dynamic>> _sections = [];
  double _itemHeight = 0; // Will be calculated based on screen

  Future<void> _pickAndLoadZip() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _pages.clear();
      _creatorData = null;
    });

    try {
      // Pick a zip file
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['zip'],
      );

      if (result != null && result.files.single.path != null) {
        final File file = File(result.files.single.path!);
        final bytes = await file.readAsBytes();
        
        // Decode the archive
        final archive = ZipDecoder().decodeBytes(bytes);
        
        // Find and parse creator.json
        for (final file in archive) {
          if (file.name == 'creator.json' && file.isFile) {
            final content = utf8.decode(file.content as List<int>);
            _creatorData = json.decode(content);
            break;
          }
        }

        // Extract page images
        final List<Uint8List> pages = [];
        final imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        
        for (final file in archive) {
          if (file.isFile && 
              file.name.startsWith('panels/') &&
              imageExtensions.any((ext) => file.name.toLowerCase().endsWith(ext))) {
            pages.add(file.content as Uint8List);
          }
        }

        // Sort pages by filename
        pages.sort((a, b) {
          // This is a simplified sort - in production you'd want to extract
          // and compare the actual filenames from the archive
          return 0;
        });

        setState(() {
          _pages = pages;
          _isLoading = false;
          _currentRow = 0;
          // Get sweetSpot from creator data
          _sweetSpot = (_creatorData?['sweetSpot'] ?? 600).toDouble();
          // Get delayRows from creator data
          _delayRows = _creatorData?['delayRows'] ?? 0;
          // Get sections from creator data
          _sections = List<Map<String, dynamic>>.from(_creatorData?['sections'] ?? [
            {'name': 'Start', 'startIndex': 0},
            {'name': 'Normal', 'startIndex': 0},
            {'name': 'Big', 'startIndex': 0}
          ]);
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading zip: $e';
        _isLoading = false;
      });
    }
  }

  Map<String, dynamic>? _getPageData(int index) {
    if (_creatorData == null || _creatorData!['pages'] == null) return null;
    final pages = _creatorData!['pages'] as List;
    if (index >= pages.length) return null;
    return pages[index] as Map<String, dynamic>;
  }

  Map<String, dynamic>? _getSpeechForPage(Map<String, dynamic>? pageData, int pageIndex) {
    if (pageData == null || pageData['speechId'] == null) return null;
    if (_creatorData == null || _creatorData!['speechData'] == null) return null;
    
    final speechId = pageData['speechId'].toString();
    final speechList = _creatorData!['speechData'] as List;
    
    try {
      // Find all speeches with matching ID
      final matchingSpeech = speechList.where(
        (speech) => speech['id'].toString() == speechId,
      ).toList();
      
      if (matchingSpeech.isEmpty) return null;
      
      // Calculate effective row for this page
      // effectiveRow = max(0, _currentRow - pageIndex * _delayRows)
      final effectiveRow = (_currentRow - pageIndex * _delayRows).clamp(0, double.infinity).toInt();
      
      // Return the speech at effective row index (cycling if necessary)
      return matchingSpeech[effectiveRow % matchingSpeech.length] as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      final idx = (_scrollController.offset / _sweetSpot).floor();
      if (idx != _currentRow) {
        setState(() => _currentRow = idx);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToSection(int sectionIndex) {
    if (sectionIndex >= 0 && sectionIndex < _sections.length) {
      final startIndex = _sections[sectionIndex]['startIndex'] as int;
      if (startIndex < _pages.length) {
        // Calculate approximate item height based on screen width
        final screenWidth = MediaQuery.of(context).size.width;
        final imageAspectRatio = 0.7; // Typical manga page ratio
        final estimatedHeight = screenWidth / imageAspectRatio + 100; // Add padding
        
        _scrollController.animateTo(
          startIndex * estimatedHeight,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manga Viewer'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          if (_creatorData != null)
            LanguageToggle(
              current: _currentLanguage,
              onChanged: (String language) {
                setState(() {
                  _currentLanguage = language;
                });
              },
            ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: _pages.isNotEmpty ? _buildBottomNavBar() : null,
      floatingActionButton: FloatingActionButton(
        onPressed: _pickAndLoadZip,
        tooltip: 'Select Zip File',
        child: const Icon(Icons.folder_open),
      ),
    );
  }

  Widget _buildBottomNavBar() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: _sections.asMap().entries.map((entry) {
              final index = entry.key;
              final section = entry.value;
              final name = section['name'] as String;
              final startIdx = section['startIndex'] as int;
              final isEnabled = startIdx < _pages.length;
              
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ElevatedButton(
                    onPressed: isEnabled ? () => _scrollToSection(index) : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Theme.of(context).colorScheme.onPrimary,
                      disabledBackgroundColor: Theme.of(context).colorScheme.surfaceVariant,
                      disabledForegroundColor: Theme.of(context).colorScheme.onSurfaceVariant,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (isEnabled)
                          Text(
                            'Page ${startIdx + 1}',
                            style: TextStyle(
                              fontSize: 11,
                              color: Theme.of(context).colorScheme.onPrimary.withOpacity(0.8),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _pickAndLoadZip,
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (_pages.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.book, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No manga loaded',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
            SizedBox(height: 8),
            Text(
              'Tap the button to select a .zip file',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        if (_creatorData != null)
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.surfaceVariant,
            child: Row(
              children: [
                Text(
                  'Title: ${_creatorData!['title'] ?? 'Untitled'}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                Text(
                  '${_pages.length} pages | Sweet: ${_sweetSpot.toInt()}px | Row: $_currentRow | Delay: $_delayRows',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            itemCount: _pages.length,
            itemBuilder: (context, index) {
              final pageData = _getPageData(index);
              final speechData = _getSpeechForPage(pageData, index);
              
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Stack(
                  children: [
                    Image.memory(
                      _pages[index],
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          height: 200,
                          color: Colors.grey[300],
                          child: const Center(
                            child: Icon(Icons.broken_image, size: 48),
                          ),
                        );
                      },
                    ),
                    if (speechData != null && pageData != null)
                      Positioned(
                        left: (pageData['speechPos']?['x'] ?? 20).toDouble(),
                        top: (pageData['speechPos']?['y'] ?? 20).toDouble(),
                        child: AnimatedSpeechBubble(
                          style: pageData['speechStyle'] ?? {},
                          text: speechData[_currentLanguage] ?? 
                                speechData['ja'] ?? 
                                speechData['en'] ?? '',
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}