import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('WebP Image Tests', () {
  testWidgets('WebP image loads without exception', (WidgetTester tester) async {
    // Build a simple app with an Image widget loading a WebP from assets
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Image.asset(
              'assets/test_1x1.webp',
              width: 50,
              height: 50,
            ),
          ),
        ),
      ),
    );

    // Allow image to load
    await tester.pump();

    // Verify the Image widget exists and didn't throw an exception
    expect(find.byType(Image), findsOneWidget);
    
    // Verify no error widgets were created
    expect(find.byType(ErrorWidget), findsNothing);
    
    // Get the Image widget and verify it has the correct properties
    final Image imageWidget = tester.widget(find.byType(Image));
    expect(imageWidget.width, 50);
    expect(imageWidget.height, 50);
    
    // Verify the image provider is an AssetImage with correct path
    final AssetImage imageProvider = imageWidget.image as AssetImage;
    expect(imageProvider.assetName, 'assets/test_1x1.webp');
  });

  testWidgets('WebP image with memory data', (WidgetTester tester) async {
    // Create a minimal WebP image in memory
    final webpBytes = base64Decode('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/v56AAAA');
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Image.memory(
              webpBytes,
              width: 50,
              height: 50,
            ),
          ),
        ),
      ),
    );

    await tester.pump();

    // Verify the Image widget exists
    expect(find.byType(Image), findsOneWidget);
    
    // Verify no error widgets were created
    expect(find.byType(ErrorWidget), findsNothing);
    
    // Get the Image widget and verify it has the correct properties
    final Image imageWidget = tester.widget(find.byType(Image));
    expect(imageWidget.width, 50);
    expect(imageWidget.height, 50);
    
    // Verify the image provider is a MemoryImage
    expect(imageWidget.image, isA<MemoryImage>());
  });

  testWidgets('WebP image handles different sizes', (WidgetTester tester) async {
    final webpBytes = base64Decode('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/v56AAAA');
    
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Column(
            children: [
              Image.memory(webpBytes, width: 10, height: 10),
              Image.memory(webpBytes, width: 100, height: 100),
              Image.memory(webpBytes, fit: BoxFit.cover),
            ],
          ),
        ),
      ),
    );

    await tester.pump();

    // Should find 3 Image widgets
    expect(find.byType(Image), findsNWidgets(3));
    
    // All should load without errors
    expect(find.byType(ErrorWidget), findsNothing);
  });
  });
}