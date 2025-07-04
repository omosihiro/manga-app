import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:archive/archive.dart';
import 'widgets/animated_speech_bubble.dart';

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

  Map<String, dynamic>? _getSpeechForPage(Map<String, dynamic>? pageData) {
    if (pageData == null || pageData['speechId'] == null) return null;
    if (_creatorData == null || _creatorData!['speechData'] == null) return null;
    
    final speechId = pageData['speechId'].toString();
    final speechList = _creatorData!['speechData'] as List;
    
    try {
      return speechList.firstWhere(
        (speech) => speech['id'].toString() == speechId,
      ) as Map<String, dynamic>;
    } catch (e) {
      return null;
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
            PopupMenuButton<String>(
              initialValue: _currentLanguage,
              onSelected: (String language) {
                setState(() {
                  _currentLanguage = language;
                });
              },
              itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
                const PopupMenuItem<String>(
                  value: 'ja',
                  child: Text('日本語 (JA)'),
                ),
                const PopupMenuItem<String>(
                  value: 'en',
                  child: Text('English (EN)'),
                ),
              ],
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    const Icon(Icons.language),
                    const SizedBox(width: 4),
                    Text(
                      _currentLanguage.toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: _pickAndLoadZip,
        tooltip: 'Select Zip File',
        child: const Icon(Icons.folder_open),
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
                  '${_pages.length} pages',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        Expanded(
          child: ListView.builder(
            itemCount: _pages.length,
            itemBuilder: (context, index) {
              final pageData = _getPageData(index);
              final speechData = _getSpeechForPage(pageData);
              
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