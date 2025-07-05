import 'package:flutter/material.dart';
import 'speech_bubble.dart';

class AnimatedSpeechBubble extends StatefulWidget {
  final Map<String, dynamic> style;
  final String text;
  
  const AnimatedSpeechBubble({
    super.key,
    required this.style,
    required this.text,
  });

  @override
  State<AnimatedSpeechBubble> createState() => _AnimatedSpeechBubbleState();
}

class _AnimatedSpeechBubbleState extends State<AnimatedSpeechBubble>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _setupAnimation();
  }

  void _setupAnimation() {
    // Use new 'anim' property, fallback to old 'animation' property
    final animationType = widget.style['anim'] ?? widget.style['animation'] ?? 'fade';
    
    switch (animationType) {
      case 'fade':
      case 'fadeIn':
        _controller = AnimationController(
          duration: const Duration(milliseconds: 500),
          vsync: this,
        );
        _animation = CurvedAnimation(
          parent: _controller,
          curve: Curves.easeOut,
        );
        break;
        
      case 'slide':
      case 'slideIn':
        _controller = AnimationController(
          duration: const Duration(milliseconds: 400),
          vsync: this,
        );
        _animation = CurvedAnimation(
          parent: _controller,
          curve: Curves.easeOut,
        );
        _slideAnimation = Tween<Offset>(
          begin: const Offset(0, -0.3),
          end: Offset.zero,
        ).animate(_animation);
        break;
        
      case 'bounce':
        _controller = AnimationController(
          duration: const Duration(milliseconds: 600),
          vsync: this,
        );
        _animation = CurvedAnimation(
          parent: _controller,
          curve: Curves.elasticOut,
        );
        _scaleAnimation = Tween<double>(
          begin: 0.3,
          end: 1.0,
        ).animate(_animation);
        break;
        
      case 'zoom':
        _controller = AnimationController(
          duration: const Duration(milliseconds: 300),
          vsync: this,
        );
        _animation = CurvedAnimation(
          parent: _controller,
          curve: Curves.easeOut,
        );
        _scaleAnimation = Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(_animation);
        break;
        
      default: // 'none'
        _controller = AnimationController(
          duration: const Duration(milliseconds: 0),
          vsync: this,
        );
        _animation = AlwaysStoppedAnimation(1.0);
    }

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final animationType = widget.style['animation'] ?? 'fadeIn';
    
    if (animationType == 'none') {
      return SpeechBubble(
        style: widget.style,
        text: widget.text,
      );
    }

    Widget animatedChild = FadeTransition(
      opacity: _animation,
      child: SpeechBubble(
        style: widget.style,
        text: widget.text,
      ),
    );

    switch (animationType) {
      case 'slideIn':
        animatedChild = SlideTransition(
          position: _slideAnimation,
          child: animatedChild,
        );
        break;
        
      case 'bounce':
      case 'zoom':
        animatedChild = ScaleTransition(
          scale: _scaleAnimation,
          child: animatedChild,
        );
        break;
    }

    return animatedChild;
  }
}