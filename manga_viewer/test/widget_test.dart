// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:manga_viewer/main.dart';

void main() {
  testWidgets('Manga viewer shows initial UI', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MyApp());

    // Verify that the app shows the title
    expect(find.text('Manga Viewer'), findsOneWidget);

    // Verify that the empty state message is shown
    expect(find.text('No manga loaded'), findsOneWidget);
    expect(find.text('Tap the button to select a .zip file'), findsOneWidget);

    // Verify that the FAB with folder icon exists
    expect(find.byIcon(Icons.folder_open), findsOneWidget);
    expect(find.byType(FloatingActionButton), findsOneWidget);
  });
}
