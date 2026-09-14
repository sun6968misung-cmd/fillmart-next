import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
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
    _BannerData(
      bgColor: Color(0xFF1B3A2F),
      badge: '🥬 이번주특가',
      badgeColor: Color(0xFF2E7D32),
      title: '신선한 야채·과일을\n농가에서 직송',
      subtitle: '산지 직거래로 더 신선하게, 더 저렴하게',
      imageUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3J7JEDYlIoXyMV3Otxzd3ftY0L3/hf_20260910_021507_ba76a9f5-22fd-48b6-af22-972df27c5e1c.png',
    ),
    _BannerData(
      bgColor: Color(0xFF3B1F1F),
      badge: '🌶️ 양념/소스 특가',
      badgeColor: Color(0xFFB71C1C),
      title: '가게·업소용\n소스·양념 한정 할인',
      subtitle: '고추장·된장·간장부터 업소용 대용량까지',
      imageUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3J7JEDYlIoXyMV3Otxzd3ftY0L3/hf_20260910_021507_a627e31a-2ea2-48c9-b503-c9f21c826e92.png',
    ),
    _BannerData(
      bgColor: Color(0xFF2C1A0E),
      badge: '🥩 축산/계란',
      badgeColor: Color(0xFF6D4C41),
      title: '국내산 한우·삼겹살\n당일 직송',
      subtitle: '냉장 상태 그대로 오늘 주문, 오늘 배송',
      imageUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3J7JEDYlIoXyMV3Otxzd3ftY0L3/hf_20260910_021507_7b8fdca0-3f02-4c9d-801e-fd6201b4984f.png',
    ),
    _BannerData(
      bgColor: Color(0xFF0D2B3E),
      badge: '🐟 수산/건어물',
      badgeColor: Color(0xFF01579B),
      title: '싱싱한 수산물\n산지 당일 직송',
      subtitle: '오후 3시 이전 주문 시 당일 배송 보장',
      imageUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3J7JEDYlIoXyMV3Otxzd3ftY0L3/hf_20260910_021507_ad203c0e-e4a3-483e-aef6-a00c9e593a20.png',
    ),
    _BannerData(
      bgColor: Color(0xFF2E2000),
      badge: '🌾 쌀/잡곡',
      badgeColor: Color(0xFFF57F17),
      title: '햇쌀·잡곡\n대용량 특가',
      subtitle: '충남 당진 농협 직송 햇쌀, 지금 특가 중',
      imageUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3J7JEDYlIoXyMV3Otxzd3ftY0L3/hf_20260910_021507_43d30500-5188-4286-9f50-fd91a9946b7c.png',
    ),
    _BannerData(
      bgColor: Color(0xFF1B2A5E),
      badge: '🎉 첫 구매 혜택',
      badgeColor: Color(0xFF1B2A5E),
      title: '첫 주문 고객에게\n5,000원 쿠폰 증정',
      subtitle: '가입 후 첫 구매 시 자동 적용',
      imageUrl: 'https://d8j0ntlcm91z4.cloudfront.net/user_3J7JEDYlIoXyMV3Otxzd3ftY0L3/hf_20260910_021507_ac304965-298c-4183-9167-a6081e0e5c35.png',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
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
      height: 200,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            itemCount: _banners.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (ctx, i) => _BannerSlide(data: _banners[i]),
          ),
          Positioned(
            bottom: 10,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ...List.generate(
                  _banners.length,
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: i == _current ? 16 : 6,
                    height: 6,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      color: i == _current
                          ? Colors.white.withValues(alpha: 0.95)
                          : Colors.white.withValues(alpha: 0.5),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${_current + 1}/${_banners.length}',
                  style: const TextStyle(
                      color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BannerSlide extends StatelessWidget {
  const _BannerSlide({required this.data});
  final _BannerData data;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Container(color: data.bgColor),
        Positioned(
          right: 0,
          top: 0,
          bottom: 0,
          width: MediaQuery.of(context).size.width * 0.52,
          child: CachedNetworkImage(
            imageUrl: data.imageUrl,
            fit: BoxFit.cover,
            fadeInDuration: const Duration(milliseconds: 200),
            errorWidget: (_, __, ___) => const SizedBox.shrink(),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [
                data.bgColor,
                data.bgColor.withValues(alpha: 0.85),
                data.bgColor.withValues(alpha: 0.2),
                Colors.transparent,
              ],
              stops: const [0.0, 0.45, 0.65, 1.0],
            ),
          ),
        ),
        Positioned(
          left: 20,
          top: 0,
          bottom: 0,
          width: MediaQuery.of(context).size.width * 0.6,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: data.badgeColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  data.badge,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                data.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                data.subtitle,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8), fontSize: 11),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _BannerData {
  const _BannerData({
    required this.bgColor,
    required this.badge,
    required this.badgeColor,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
  });

  final Color bgColor;
  final String badge;
  final Color badgeColor;
  final String title;
  final String subtitle;
  final String imageUrl;
}
