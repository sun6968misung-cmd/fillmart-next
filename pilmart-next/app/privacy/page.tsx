export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl prose prose-sm">
      <h1>개인정보처리방침</h1>
      <p>필마트는 고객의 개인정보를 소중히 여깁니다.</p>
      <h2>수집하는 개인정보</h2>
      <p>이름, 전화번호, 배송지 주소를 수집합니다. 모든 정보는 브라우저 로컬 스토리지에만 저장되며 서버로 전송되지 않습니다.</p>
      <h2>개인정보 보유기간</h2>
      <p>로그인 세션은 30일 후 자동 만료됩니다. 브라우저 데이터 삭제 시 즉시 파기됩니다.</p>
    </div>
  );
}
