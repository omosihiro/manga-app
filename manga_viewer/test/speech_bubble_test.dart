import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:manga_viewer/widgets/speech_bubble.dart';

void main() {
  group('SpeechBubble', () {
    testWidgets('renders with default style', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SpeechBubble(
              style: {},
              text: 'Hello',
            ),
          ),
        ),
      );

      expect(find.text('Hello'), findsOneWidget);
    });

    testWidgets('applies tail direction from style', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SpeechBubble(
              style: {'tail': 'right'},
              text: 'Right tail',
            ),
          ),
        ),
      );

      // Pump to allow animations to complete
      await tester.pumpAndSettle();
      expect(find.text('Right tail'), findsOneWidget);
    });

    testWidgets('applies animation style', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: SpeechBubble(
              style: {'anim': 'zoom'},
              text: 'Zoom animation',
            ),
          ),
        ),
      );

      // Initial state - animation starting
      await tester.pump();
      expect(find.text('Zoom animation'), findsOneWidget);

      // Complete animation
      await tester.pumpAndSettle();
      expect(find.text('Zoom animation'), findsOneWidget);
    });

    testWidgets('handles different shapes', (WidgetTester tester) async {
      final shapes = ['rounded', 'cloud', 'sharp', 'thought'];
      
      for (final shape in shapes) {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: SpeechBubble(
                style: {'shape': shape},
                text: '$shape shape',
              ),
            ),
          ),
        );

        await tester.pumpAndSettle();
        expect(find.text('$shape shape'), findsOneWidget);
      }
    });

    testWidgets('handles different animations', (WidgetTester tester) async {
      final animations = ['none', 'fade', 'slide', 'bounce', 'zoom'];
      
      for (final anim in animations) {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: SpeechBubble(
                style: {'anim': anim},
                text: '$anim animation',
              ),
            ),
          ),
        );

        if (anim == 'none') {
          // No animation, should be visible immediately
          expect(find.text('$anim animation'), findsOneWidget);
        } else {
          // Start animation
          await tester.pump();
          expect(find.text('$anim animation'), findsOneWidget);
          
          // Complete animation
          await tester.pumpAndSettle();
          expect(find.text('$anim animation'), findsOneWidget);
        }
      }
    });
  });
}