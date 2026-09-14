import 'package:flutter_test/flutter_test.dart';

enum PaymentMethod { card, transfer, meetCard, meetCash }

bool isMeetPayment(PaymentMethod m) =>
    m == PaymentMethod.meetCard || m == PaymentMethod.meetCash;

String toApiValue(PaymentMethod m) => switch (m) {
      PaymentMethod.card => '카드',
      PaymentMethod.transfer => '계좌이체',
      PaymentMethod.meetCard => 'meet-card',
      PaymentMethod.meetCash => 'meet-cash',
    };

void main() {
  test('만나서 결제는 Toss WebView를 거치지 않는다', () {
    expect(isMeetPayment(PaymentMethod.meetCard), true);
    expect(isMeetPayment(PaymentMethod.meetCash), true);
    expect(isMeetPayment(PaymentMethod.card), false);
  });

  test('API 전송 결제수단 값', () {
    expect(toApiValue(PaymentMethod.meetCard), 'meet-card');
    expect(toApiValue(PaymentMethod.card), '카드');
  });
}
