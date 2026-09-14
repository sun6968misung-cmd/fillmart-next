import 'dart:async';
import 'package:flutter/material.dart';

class HeroBanner extends StatefulWidget {
  const HeroBanner({super.key});

  @override
  State<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<HeroBanner> {
  final _controller = PageController();
  int _current = 0;
  Timer? _timer;

  static const _banners = [
    _BannerData(color: Color(0xFF1B2A5E), label: '신선한 야채·과일\n매일 새벽 직송'),
    _BannerData(color: Color(0xFF2E7D32), label: '이번 주 특가\n최대 30% 할인'),
    _BannerData(color: Color(0xFFE53935), label: '주문하면 당일 배송\n오전 11시 마감'),
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) {
      final next = (_current + 1) % _banners.length;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 180,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: _banners.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (ctx, i) => Container(
              color: _banners[i].color,
              alignment: Alignment.center,
              child: Text(
                _banners[i].label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 8,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _banners.length,
                (i) => Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i == _current ? Colors.white : Colors.white38,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BannerData {
  const _BannerData({required this.color, required this.label});
  final Color color;
  final String label;
}
