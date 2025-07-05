import 'package:flutter/material.dart';

// Helper function to parse color strings
Color parseColor(String c) {
  // Handle hex colors
  if (c.startsWith('#')) {
    return HexColor(c);
  }
  
  // Handle color names (case-insensitive)
  final colorMap = {
    'WHITE': Colors.white,
    'BLACK': Colors.black,
    'RED': Colors.red,
    'BLUE': Colors.blue,
    'GREEN': Colors.green,
    'YELLOW': Colors.yellow,
    'CYAN': Colors.cyan,
    'MAGENTA': Colors.purple,
    'GRAY': Colors.grey,
    'GREY': Colors.grey,
  };
  
  final upperColor = c.toUpperCase();
  return colorMap[upperColor] ?? Colors.white;
}

class SpeechBubble extends StatefulWidget {
  final Map<String, dynamic> style;
  final String text;
  
  const SpeechBubble({
    super.key, 
    required this.style, 
    required this.text
  });

  @override
  State<SpeechBubble> createState() => _SpeechBubbleState();
}

class _SpeechBubbleState extends State<SpeechBubble> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    
    final anim = widget.style['anim'] ?? 'none';
    _controller = AnimationController(
      duration: _getAnimationDuration(anim),
      vsync: this,
    );

    _animation = _createAnimation(anim);
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Duration _getAnimationDuration(String anim) {
    switch (anim) {
      case 'fade':
        return const Duration(milliseconds: 500);
      case 'slide':
        return const Duration(milliseconds: 400);
      case 'bounce':
        return const Duration(milliseconds: 600);
      case 'zoom':
        return const Duration(milliseconds: 300);
      case 'none':
      default:
        return const Duration(milliseconds: 0);
    }
  }

  Animation<double> _createAnimation(String anim) {
    switch (anim) {
      case 'fade':
        return Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(parent: _controller, curve: Curves.easeOut),
        );
      case 'slide':
        return Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(parent: _controller, curve: Curves.easeOut),
        );
      case 'bounce':
        return Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
        );
      case 'zoom':
        return Tween<double>(begin: 0.0, end: 1.0).animate(
          CurvedAnimation(parent: _controller, curve: Curves.easeOut),
        );
      case 'none':
      default:
        return Tween<double>(begin: 1.0, end: 1.0).animate(_controller);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shape = widget.style['shape'] ?? 'rounded';
    final size = widget.style['size'] ?? 'medium';
    final bg = widget.style['color'] ?? '#ffffff';
    final borderColor = widget.style['borderColor'] ?? '#000000';
    final tail = widget.style['tail'] ?? 'left';
    final anim = widget.style['anim'] ?? 'none';

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
        widget.text,
        style: TextStyle(
          fontSize: config['fontSize'],
          color: Colors.black,
        ),
      ),
    );

    // Add tail decorations for specific shapes
    Widget bubbleWithTail;
    if (shape == 'cloud' || shape == 'thought') {
      bubbleWithTail = Stack(
        clipBehavior: Clip.none,
        children: [
          bubble,
          if (shape == 'cloud') ..._getCloudTail(bg, borderColor),
          if (shape == 'thought') ..._getThoughtTail(bg, borderColor),
        ],
      );
    } else if (shape == 'sharp') {
      bubbleWithTail = Stack(
        clipBehavior: Clip.none,
        children: [
          bubble,
          _getSharpTail(bg, borderColor),
        ],
      );
    } else if (shape == 'rounded') {
      bubbleWithTail = Stack(
        clipBehavior: Clip.none,
        children: [
          bubble,
          _getRoundedTail(bg, borderColor),
        ],
      );
    } else {
      bubbleWithTail = bubble;
    }

    // Apply animation based on type
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        switch (anim) {
          case 'fade':
            return Opacity(
              opacity: _animation.value,
              child: bubbleWithTail,
            );
          case 'slide':
            return Opacity(
              opacity: _animation.value,
              child: Transform.translate(
                offset: Offset(0, -20 * (1 - _animation.value)),
                child: bubbleWithTail,
              ),
            );
          case 'bounce':
          case 'zoom':
            return Transform.scale(
              scale: _animation.value,
              child: Opacity(
                opacity: _animation.value > 0.3 ? 1.0 : _animation.value / 0.3,
                child: bubbleWithTail,
              ),
            );
          case 'none':
          default:
            return bubbleWithTail;
        }
      },
    );
  }

  BoxDecoration _getBubbleDecoration(String shape, String bg, String borderColor) {
    switch (shape) {
      case 'rounded':
        return BoxDecoration(
          color: parseColor(bg),
          border: Border.all(color: parseColor(borderColor), width: 2),
          borderRadius: BorderRadius.circular(16),
        );
      case 'cloud':
        return BoxDecoration(
          color: parseColor(bg),
          border: Border.all(color: parseColor(borderColor), width: 2),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.elliptical(50, 40),
            topRight: Radius.elliptical(40, 50),
            bottomLeft: Radius.elliptical(50, 40),
            bottomRight: Radius.elliptical(40, 50),
          ),
        );
      case 'sharp':
        return BoxDecoration(
          color: parseColor(bg),
          border: Border.all(color: parseColor(borderColor), width: 2),
          borderRadius: BorderRadius.circular(4),
        );
      case 'thought':
        return BoxDecoration(
          color: parseColor(bg),
          border: Border.all(color: parseColor(borderColor), width: 2),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.elliptical(50, 40),
            topRight: Radius.elliptical(40, 50),
            bottomLeft: Radius.elliptical(50, 40),
            bottomRight: Radius.elliptical(40, 50),
          ),
        );
      default:
        return BoxDecoration(
          color: parseColor(bg),
          border: Border.all(color: parseColor(borderColor), width: 2),
          borderRadius: BorderRadius.circular(16),
        );
    }
  }

  List<Widget> _getCloudTail(String bg, String borderColor) {
    final isRight = widget.style['tail'] == 'right';
    return [
      Positioned(
        bottom: -10,
        left: isRight ? null : 20,
        right: isRight ? 20 : null,
        child: Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: parseColor(bg),
            border: Border.all(color: parseColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
      Positioned(
        bottom: -15,
        left: isRight ? null : 10,
        right: isRight ? 10 : null,
        child: Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: parseColor(bg),
            border: Border.all(color: parseColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
    ];
  }

  List<Widget> _getThoughtTail(String bg, String borderColor) {
    final isRight = widget.style['tail'] == 'right';
    return [
      Positioned(
        bottom: -12,
        left: isRight ? null : 20,
        right: isRight ? 20 : null,
        child: Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: parseColor(bg),
            border: Border.all(color: parseColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
      Positioned(
        bottom: -20,
        left: isRight ? null : 15,
        right: isRight ? 15 : null,
        child: Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: parseColor(bg),
            border: Border.all(color: parseColor(borderColor), width: 2),
            shape: BoxShape.circle,
          ),
        ),
      ),
    ];
  }

  Widget _getRoundedTail(String bg, String borderColor) {
    final isRight = widget.style['tail'] == 'right';
    return Positioned(
      bottom: -8,
      left: isRight ? null : 20,
      right: isRight ? 20 : null,
      child: CustomPaint(
        size: const Size(16, 8),
        painter: TrianglePainter(
          fillColor: parseColor(bg),
          borderColor: parseColor(borderColor),
        ),
      ),
    );
  }

  Widget _getSharpTail(String bg, String borderColor) {
    final isRight = widget.style['tail'] == 'right';
    return Positioned(
      bottom: -10,
      left: isRight ? null : 20,
      right: isRight ? 20 : null,
      child: CustomPaint(
        size: const Size(20, 10),
        painter: TrianglePainter(
          fillColor: parseColor(bg),
          borderColor: parseColor(borderColor),
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

// HexColor utility class for parsing hex color strings
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