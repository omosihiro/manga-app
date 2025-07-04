import 'package:flutter/material.dart';

class LanguageToggle extends StatelessWidget {
  final String current;
  final ValueChanged<String> onChanged;
  
  const LanguageToggle({
    super.key, 
    required this.current, 
    required this.onChanged
  });
  
  @override
  Widget build(BuildContext context) => PopupMenuButton<String>(
        initialValue: current,
        icon: const Icon(Icons.language),
        onSelected: onChanged,
        itemBuilder: (_) => const [
          PopupMenuItem(value: 'ja', child: Text('日本語')),
          PopupMenuItem(value: 'en', child: Text('English')),
        ],
      );
}