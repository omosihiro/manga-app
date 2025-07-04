import 'package:flutter/material.dart';

class SpeechBubble extends StatelessWidget {
  final Map<String, dynamic> style;
  final String text;
  
  const SpeechBubble({
    super.key, 
    required this.style, 
    required this.text
  });

  @override
  Widget build(BuildContext context) {
    final shape = style['shape'] ?? 'rounded';
    final size = style['size'] ?? 'medium';
    final bg = style['color'] ?? '#ffffff';
    final borderColor = style['borderColor'] ?? '#000000';

    // Define size properties
    final sizeConfig = {
      'small': {'fontSize': 12.0, 'padding': 8.0, 'maxWidth': 200.0},
      'medium': {'fontSize': 14.0, 'padding': 12.0, 'maxWidth': 300.0},
      'large': {'fontSize': 16.0, 'padding': 16.0, 'maxWidth': 400.0},
    };

    final config = sizeConfig[size]!;

    Widget bubble = Container(
      padding: EdgeInsets.all(config['padding']!),
      constraints: BoxConstraints(maxWidth: config['maxWidth']!),
      decoration: _getBubbleDecoration(shape, bg, borderColor),
      child: Text(
        text,
        style: TextStyle(
          fontSize: config['fontSize'],
          color: Colors.black,
        ),
      ),
    );

    // Add tail decorations for specific shapes
    if (shape == 'cloud' || shape == 'thought') {
      return Stack(
        clipBehavior: Clip.none,
        children: [
          bubble,
          if (shape == 'cloud') ..._getCloudTail(bg, borderColor),
          if (shape == 'thought') ..._getThoughtTail(bg, borderColor),
        ],
      );
    } else if (shape == 'sharp') {
      return Stack(
        clipBehavior: Clip.none,
        children: [
          bubble,
          _getSharpTail(bg, borderColor),
        ],
      );
    }

    return bubble;
  }

  BoxDecoration _getBubbleDecoration(String shape, String bg, String borderColor) {
    switch (shape) {
      case 'rounded':
        return BoxDecoration(
          color: HexColor(bg),
          border: Border.all(color: HexColor(borderColor), width: 2),
          borderRadius: BorderRadius.circular(16),
        );
      case 'cloud':
        return BoxDecoration(
          color: HexColor(bg),
          border: Border.all(color: HexColor(borderColor), width: 2),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.elliptical(50, 40),
            topRight: Radius.elliptical(40, 50),
            bottomLeft: Radius.elliptical(50, 40),
            bottomRight: Radius.elliptical(40, 50),
          ),
        );
      case 'sharp':
        return BoxDecoration(
          color: HexColor(bg),
          border: Border.all(color: HexColor(borderColor), width: 2),
          borderRadius: BorderRadius.circular(4),
        );
      case 'thought':
        return BoxDecoration(
          color: HexColor(bg),
          border: Border.all(color: HexColor(borderColor), width: 2),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.elliptical(50, 40),
            topRight: Radius.elliptical(40, 50),
            bottomLeft: Radius.elliptical(50, 40),
            bottomRight: Radius.elliptical(40, 50),
          ),
        );
      default:
        return BoxDecoration(
          color: HexColor(bg),
          border: Border.all(color: HexColor(borderColor), width: 2),
          borderRadius: BorderRadius.circular(16),
        );
    }
  }

  List<Widget> _getCloudTail(String bg, String borderColor) {
    return [
      Positioned(
        bottom: -10,
        left: 20,
        child: Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: HexColor(bg),
            border: Border.all(color: HexColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
      Positioned(
        bottom: -15,
        left: 10,
        child: Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: HexColor(bg),
            border: Border.all(color: HexColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
    ];
  }

  List<Widget> _getThoughtTail(String bg, String borderColor) {
    return [
      Positioned(
        bottom: -12,
        left: 20,
        child: Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: HexColor(bg),
            border: Border.all(color: HexColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
      Positioned(
        bottom: -20,
        left: 15,
        child: Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: HexColor(bg),
            border: Border.all(color: HexColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
    ];
  }

  Widget _getSharpTail(String bg, String borderColor) {
    return Positioned(
      bottom: -10,
      left: 20,
      child: CustomPaint(
        size: const Size(20, 10),
        painter: TrianglePainter(
          fillColor: HexColor(bg),
          borderColor: HexColor(borderColor),
        ),
      ),
    );
  }
}

// Custom painter for the sharp tail triangle
class TrianglePainter extends CustomPainter {
  final Color fillColor;
  final Color borderColor;

  TrianglePainter({required this.fillColor, required this.borderColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = fillColor
      ..style = PaintingStyle.fill;

    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    final path = Path()
      ..moveTo(size.width / 2, size.height)
      ..lineTo(0, 0)
      ..lineTo(size.width, 0)
      ..close();

    canvas.drawPath(path, paint);
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// HexColor utility class
class HexColor extends Color {
  static int _getColorFromHex(String hexColor) {
    hexColor = hexColor.toUpperCase().replaceAll('#', '');
    if (hexColor.length == 6) {
      hexColor = 'FF$hexColor';
    }
    return int.parse(hexColor, radix: 16);
  }

  HexColor(final String hexColor) : super(_getColorFromHex(hexColor));
}