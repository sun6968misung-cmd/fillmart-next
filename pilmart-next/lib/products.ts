import { Product, ProductOverride } from '@/types';
import { KEYS, lsGet } from '@/lib/storage';

const PRODUCTS: Product[] = [
  // ── 이번주특가 ────────────────────────────────────────────────
  { id:'sale1', name:'국내산 삼겹살 500g',  emoji:'🥩', price:9900,  originalPrice:13900, section:'sale', origin:'국내산 (경북)',    category:'축산/계란',          storage:'냉장보관', unit:'500g',     desc:'국내산 한돈 직송. 두툼하고 쫄깃한 삼겹살.' },
  { id:'sale2', name:'양파 3kg',            emoji:'🧅', price:3900,  originalPrice:5900,  section:'sale', origin:'국산',            category:'야채/채소',           storage:'상온보관', unit:'3kg',      desc:'청정 지역 농가 직송. 아삭하고 달콤한 양파.' },
  { id:'sale3', name:'계란 30구 특란',       emoji:'🥚', price:8900,  originalPrice:10900, section:'sale', origin:'국내산',           category:'축산/계란',          storage:'냉장보관', unit:'30구',     desc:'국내산 신선 특란 30구. 단백질 가득.' },
  { id:'sale4', name:'닭가슴살 1kg',         emoji:'🍗', price:7900,  originalPrice:10500, section:'sale', origin:'국내산',           category:'축산/계란',          storage:'냉장보관', unit:'1kg',      desc:'국내산 냉장 닭가슴살. 고단백 저지방.' },
  { id:'sale5', name:'고등어 2마리',         emoji:'🐟', price:5900,  originalPrice:7900,  section:'sale', origin:'국산',            category:'수산/건어물',        storage:'냉장보관', unit:'2마리',    desc:'국산 당일 손질 고등어. 오메가-3 풍부.' },
  { id:'sale6', name:'국산 두부 2개입',       emoji:'🟨', price:2900,  originalPrice:3900,  section:'sale', origin:'국산콩',           category:'유제품/냉장/냉동',   storage:'냉장보관', unit:'2모',      desc:'국산콩 100% 부드러운 두부.' },

  // ── 야채/채소 ────────────────────────────────────────────────
  { id:'veg1',  name:'양배추 1통',           emoji:'🥬', price:3500,  originalPrice:4500,  section:'fresh', origin:'국산',           category:'야채/채소',           storage:'냉장보관', unit:'1통',      desc:'아삭한 국산 양배추. 겉절이·볶음에 딱.' },
  { id:'veg2',  name:'대파 1단',             emoji:'🌿', price:1900,  originalPrice:2500,  section:'fresh', origin:'국산',           category:'야채/채소',           storage:'냉장보관', unit:'1단',      desc:'향긋한 국산 대파 한 단. 국물 요리 필수.' },
  { id:'veg3',  name:'햇감자 2.5kg',         emoji:'🥔', price:5900,  originalPrice:7900,  section:'fresh', origin:'국산',           category:'야채/채소',           storage:'상온보관', unit:'2.5kg',    desc:'국산 햇감자. 포슬포슬 볶음·찜용.' },
  { id:'veg4',  name:'당근 1kg',             emoji:'🥕', price:2900,  originalPrice:3900,  section:'fresh', origin:'국산',           category:'야채/채소',           storage:'냉장보관', unit:'1kg',      desc:'달콤한 국산 당근. 샐러드·볶음밥 활용.' },
  { id:'veg8',  name:'방울토마토 1kg',        emoji:'🍅', price:4900,  originalPrice:6900,  section:'fresh', origin:'국내산',          category:'야채/채소',           storage:'냉장보관', unit:'1kg',      desc:'국내산 당도 높은 방울토마토. 간식·샐러드용.' },
  { id:'veg9',  name:'시금치 300g',          emoji:'🌱', price:1900,  originalPrice:2900,  section:'fresh', origin:'국산',           category:'야채/채소',           storage:'냉장보관', unit:'300g',     desc:'철분 풍부한 국산 시금치. 나물·된장국용.' },

  // ── 과일 ────────────────────────────────────────────────────
  { id:'veg5',  name:'수박 (소) 1통',         emoji:'🍉', price:12900, originalPrice:16900, section:'fresh', origin:'국내산',          category:'과일',               storage:'냉장보관', unit:'1통',      desc:'국내산 시원한 수박. 여름 제철 과일.' },
  { id:'veg6',  name:'복숭아 1.5kg',         emoji:'🍑', price:8900,  originalPrice:11900, section:'fresh', origin:'국내산',          category:'과일',               storage:'상온보관', unit:'1.5kg',    desc:'국내산 달콤한 복숭아. 직송 신선함.' },
  { id:'veg7',  name:'포도 2kg',             emoji:'🍇', price:9900,  originalPrice:13900, section:'fresh', origin:'국내산',          category:'과일',               storage:'냉장보관', unit:'2kg',      desc:'국내산 달달한 포도. 직송 신선함.' },
  { id:'fruit1', name:'사과 5개입',          emoji:'🍎', price:6900,  originalPrice:8900,  section:'fresh', origin:'국내산 (경북)',    category:'과일',               storage:'냉장보관', unit:'5개',      desc:'경북 직송 꿀사과. 달콤·아삭.' },
  { id:'fruit2', name:'딸기 500g',           emoji:'🍓', price:7900,  originalPrice:9900,  section:'fresh', origin:'국내산',          category:'과일',               storage:'냉장보관', unit:'500g',     desc:'국내산 달콤 딸기. 잼·아이스크림·생과일.' },

  // ── 쌀/잡곡 ─────────────────────────────────────────────────
  { id:'grain1', name:'햇쌀 10kg',           emoji:'🌾', price:29900, originalPrice:38000, section:'fresh', origin:'국내산 (충남)',    category:'쌀/잡곡',            storage:'상온보관', unit:'10kg',     desc:'충남 당진 농협 직송 햇쌀. 윤기나고 찰진 밥.' },
  { id:'grain2', name:'현미 4kg',            emoji:'🌾', price:12900, originalPrice:16900, section:'fresh', origin:'국내산',          category:'쌀/잡곡',            storage:'상온보관', unit:'4kg',      desc:'도정 직후 국내산 현미. 식이섬유 풍부.' },
  { id:'grain3', name:'잡곡 혼합 2kg',       emoji:'🫘', price:9900,  originalPrice:13900, section:'fresh', origin:'국내산',          category:'쌀/잡곡',            storage:'상온보관', unit:'2kg',      desc:'흑미·수수·귀리 혼합 잡곡. 영양 UP.' },

  // ── 축산/계란 ────────────────────────────────────────────────
  { id:'meat1', name:'한우 불고기 300g',      emoji:'🥩', price:16900, originalPrice:21900, section:'fresh', origin:'국내산 (1등급↑)', category:'축산/계란',          storage:'냉장보관', unit:'300g',     desc:'1등급 이상 한우 불고기. 달큰한 양념 직송.' },
  { id:'meat2', name:'돼지 목살 500g',        emoji:'🐷', price:7900,  originalPrice:9900,  section:'fresh', origin:'국내산',          category:'축산/계란',          storage:'냉장보관', unit:'500g',     desc:'국내산 냉장 목살. 삼겹살보다 쫄깃하고 담백.' },
  { id:'meat3', name:'닭볶음탕용 1kg',        emoji:'🍗', price:6900,  originalPrice:8900,  section:'fresh', origin:'국내산',          category:'축산/계란',          storage:'냉장보관', unit:'1kg',      desc:'국내산 닭볶음탕용. 매운 볶음탕 OK.' },
  { id:'meat4', name:'오리 훈제 슬라이스 200g', emoji:'🦆', price:5900, originalPrice:7500, section:'fresh', origin:'국내산',          category:'축산/계란',          storage:'냉장보관', unit:'200g',     desc:'국내산 오리 훈제. 구이·무침 활용.' },

  // ── 수산/건어물 ───────────────────────────────────────────────
  { id:'fish1', name:'오징어 2마리',          emoji:'🦑', price:7900,  originalPrice:9900,  section:'fresh', origin:'국산',           category:'수산/건어물',        storage:'냉장보관', unit:'2마리',    desc:'국산 오징어 2마리. 볶음·찌개·덮밥 활용.' },
  { id:'fish2', name:'생새우 500g',           emoji:'🦐', price:12900, originalPrice:15900, section:'fresh', origin:'국산',           category:'수산/건어물',        storage:'냉장보관', unit:'500g',     desc:'국산 생새우. 구이·볶음·전 최적.' },
  { id:'fish3', name:'손질 고등어 4토막',      emoji:'🐠', price:6900,  originalPrice:8900,  section:'fresh', origin:'국산',           category:'수산/건어물',        storage:'냉장보관', unit:'4토막',    desc:'국산 고등어 손질 완료 4토막. 바로 구이·조림.' },
  { id:'fish4', name:'굴비 선물세트 10마리',   emoji:'🐟', price:24900, originalPrice:32000, section:'fresh', origin:'국산 (영광)',     category:'수산/건어물',        storage:'냉장보관', unit:'10마리',   desc:'영광 굴비 직송. 명절·선물용.' },

  // ── 견과 ─────────────────────────────────────────────────────
  { id:'nut1',  name:'호두 300g',            emoji:'🥜', price:5900,  originalPrice:7900,  section:'fresh', origin:'국내산',          category:'견과',               storage:'상온보관', unit:'300g',     desc:'국내산 알호두. 뇌 건강·간식.' },
  { id:'nut2',  name:'아몬드 250g',          emoji:'🥜', price:4900,  originalPrice:6500,  section:'fresh', origin:'수입 (미국)',      category:'견과',               storage:'상온보관', unit:'250g',     desc:'구운 무염 아몬드. 다이어트 간식 최적.' },
  { id:'nut3',  name:'혼합 견과 30봉',       emoji:'🫙', price:12900, originalPrice:16900, section:'fresh', origin:'혼합',           category:'견과',               storage:'상온보관', unit:'30봉',     desc:'아몬드·호두·캐슈너트 혼합 소포장. 간편 간식.' },

  // ── 고추장/된장/간장류 ─────────────────────────────────────────
  { id:'sauce1', name:'해찬들 고추장 500g',   emoji:'🌶️', price:5900,  originalPrice:7500,  section:'proc', origin:'국내산',          category:'고추장/된장/간장류', storage:'상온보관', unit:'500g',     desc:'CJ 해찬들 100% 국산 고추장. 매콤달콤.' },
  { id:'sauce2', name:'재래식 된장 500g',     emoji:'🫙', price:4900,  originalPrice:6500,  section:'proc', origin:'국내산콩',        category:'고추장/된장/간장류', storage:'상온보관', unit:'500g',     desc:'국산 콩 100% 재래식 된장. 찌개·나물무침.' },
  { id:'sauce3', name:'양조간장 500ml',       emoji:'🫙', price:3900,  originalPrice:5200,  section:'proc', origin:'국내산',          category:'고추장/된장/간장류', storage:'상온보관', unit:'500ml',    desc:'자연 발효 양조간장. 국물·양념 기본.' },

  // ── 양념/소스/육수 ─────────────────────────────────────────────
  { id:'cond1', name:'굴소스 280g',          emoji:'🫙', price:3900,  originalPrice:5200,  section:'proc', origin:'수입',           category:'양념/소스/육수',     storage:'상온보관', unit:'280g',     desc:'이금기 굴소스. 중식·볶음 요리 필수.' },
  { id:'cond2', name:'참기름 160ml',         emoji:'🫒', price:4900,  originalPrice:6500,  section:'proc', origin:'국내산',          category:'양념/소스/육수',     storage:'상온보관', unit:'160ml',    desc:'국산 참깨 100% 참기름. 나물·비빔밥 향미.' },
  { id:'cond3', name:'멸치 육수팩 10개',      emoji:'🐟', price:3500,  originalPrice:4500,  section:'proc', origin:'국산',           category:'양념/소스/육수',     storage:'상온보관', unit:'10개입',   desc:'국산 멸치·다시마 육수팩. 국물 맛 UP.' },

  // ── 식용유/조미료 ──────────────────────────────────────────────
  { id:'oil1',  name:'해바라기유 1.8L',      emoji:'🫙', price:8900,  originalPrice:11500, section:'proc', origin:'수입',           category:'식용유/조미료',      storage:'상온보관', unit:'1.8L',     desc:'고온 안정성 뛰어난 해바라기유. 튀김·볶음.' },
  { id:'oil2',  name:'백설 맛소금 500g',     emoji:'🧂', price:2500,  originalPrice:3200,  section:'proc', origin:'국내산',          category:'식용유/조미료',      storage:'상온보관', unit:'500g',     desc:'감칠맛 더한 CJ 맛소금. 요리 마무리.' },
  { id:'oil3',  name:'올리브유 500ml',       emoji:'🫒', price:9900,  originalPrice:13900, section:'proc', origin:'수입 (스페인)',   category:'식용유/조미료',      storage:'상온보관', unit:'500ml',    desc:'엑스트라 버진 올리브유. 샐러드·파스타.' },

  // ── 밀가루/라면/면 ─────────────────────────────────────────────
  { id:'proc1', name:'신라면 멀티 5개입',    emoji:'🍜', price:4200,  originalPrice:5000,  section:'proc', origin:'국내산',          category:'밀가루/라면/면',     storage:'상온보관', unit:'5개입',    desc:'국민 라면 신라면 5개 묶음. 얼큰한 맛.' },
  { id:'flour1', name:'곰표 중력분 1kg',     emoji:'🌾', price:2500,  originalPrice:3200,  section:'proc', origin:'수입',           category:'밀가루/라면/면',     storage:'상온보관', unit:'1kg',      desc:'다목적 중력분 밀가루. 전·부침개·수제비.' },
  { id:'nood1', name:'소면 900g',           emoji:'🍝', price:3200,  originalPrice:4200,  section:'proc', origin:'국내산',          category:'밀가루/라면/면',     storage:'상온보관', unit:'900g',     desc:'쫄깃한 소면. 국수·잔치국수 활용.' },

  // ── 유제품/냉장/냉동 ───────────────────────────────────────────
  { id:'proc2', name:'부침두부 2개입',       emoji:'⬜', price:2500,  originalPrice:3200,  section:'proc', origin:'국산콩',          category:'유제품/냉장/냉동',   storage:'냉장보관', unit:'2개입',    desc:'국산콩 부침두부 2모. 두부전·된장찌개.' },
  { id:'proc3', name:'사각어묵 400g',        emoji:'🟡', price:3900,  originalPrice:4900,  section:'proc', origin:'국산',           category:'유제품/냉장/냉동',   storage:'냉장보관', unit:'400g',     desc:'사조 사각어묵 400g. 떡볶이·어묵탕.' },
  { id:'proc5', name:'슬라이스 치즈 20장',   emoji:'🧀', price:5900,  originalPrice:7500,  section:'proc', origin:'국내산',          category:'유제품/냉장/냉동',   storage:'냉장보관', unit:'20장',     desc:'서울우유 슬라이스 치즈 20장. 샌드위치·버거.' },
  { id:'proc6', name:'떠먹는 요거트 3개입',  emoji:'🥛', price:3900,  originalPrice:4900,  section:'proc', origin:'국내산',          category:'유제품/냉장/냉동',   storage:'냉장보관', unit:'3개입',    desc:'빙그레 떠먹는 요거트 3개 묶음.' },
  { id:'dairy1', name:'냉동 만두 540g',      emoji:'🥟', price:5900,  originalPrice:7500,  section:'proc', origin:'국내산',          category:'유제품/냉장/냉동',   storage:'냉동보관', unit:'540g',     desc:'풀무원 고기만두 냉동. 군만두·찐만두.' },

  // ── 캔/통조림 ────────────────────────────────────────────────
  { id:'proc4', name:'스팸 클래식 340g',     emoji:'🥫', price:4900,  originalPrice:5900,  section:'proc', origin:'국내산',          category:'캔/통조림',          storage:'상온보관', unit:'340g',     desc:'CJ 스팸 클래식. 밥반찬·도시락 최강.' },
  { id:'can1',  name:'동원 참치 150g×3',    emoji:'🥫', price:5900,  originalPrice:7500,  section:'proc', origin:'원양산',          category:'캔/통조림',          storage:'상온보관', unit:'150g×3',   desc:'동원 참치캔 3개. 주먹밥·김밥·볶음밥.' },
  { id:'can2',  name:'골뱅이 통조림 400g',   emoji:'🐌', price:6900,  originalPrice:8900,  section:'proc', origin:'수입',           category:'캔/통조림',          storage:'상온보관', unit:'400g',     desc:'쫄깃한 골뱅이. 골뱅이소면·안주 활용.' },

  // ── 김/편의식/반찬 ─────────────────────────────────────────────
  { id:'kim1',  name:'도시락 김 15봉',       emoji:'🌿', price:5900,  originalPrice:7500,  section:'proc', origin:'국산',           category:'김/편의식/반찬',     storage:'상온보관', unit:'15봉',     desc:'국산 돌김 도시락 김. 밥반찬·간식.' },
  { id:'rice1', name:'즉석밥 3개입',         emoji:'🍚', price:4200,  originalPrice:5500,  section:'proc', origin:'국내산',          category:'김/편의식/반찬',     storage:'상온보관', unit:'3개입',    desc:'CJ 햇반 즉석밥 3개. 야외·바쁜 아침 필수.' },
  { id:'side1', name:'순창 나물무침 4종 세트', emoji:'🥗', price:7900, originalPrice:10500, section:'proc', origin:'국내산',          category:'김/편의식/반찬',     storage:'냉장보관', unit:'4종',      desc:'시금치·콩나물·고사리·도라지 나물 세트.' },

  // ── 생수/음료 ────────────────────────────────────────────────
  { id:'water1', name:'제주 삼다수 2L×6',   emoji:'💧', price:7900,  originalPrice:9900,  section:'proc', origin:'국내산 (제주)',    category:'생수/음료',          storage:'상온보관', unit:'2L×6',     desc:'제주 화산암반수 삼다수. 깨끗하고 부드러운 물.' },
  { id:'drink1', name:'포카리스웨트 340ml×6', emoji:'🥤', price:6900, originalPrice:8900,  section:'proc', origin:'국내산',          category:'생수/음료',          storage:'상온보관', unit:'340ml×6',  desc:'이온음료 포카리. 운동 후 수분 보충.' },
  { id:'juice1', name:'오렌지 주스 1.8L',   emoji:'🍊', price:5900,  originalPrice:7900,  section:'proc', origin:'수입',           category:'생수/음료',          storage:'냉장보관', unit:'1.8L',     desc:'과즙 100% 오렌지 주스. 아침 식탁 필수.' },

  // ── 커피믹스/티백 ──────────────────────────────────────────────
  { id:'coffee1', name:'맥심 화이트골드 100개', emoji:'☕', price:12900, originalPrice:16900, section:'proc', origin:'국내산',        category:'커피믹스/티백',      storage:'상온보관', unit:'100개',    desc:'맥심 화이트골드 커피믹스 100개입 대용량.' },
  { id:'tea1',  name:'녹차 티백 50개',       emoji:'🍵', price:5900,  originalPrice:7500,  section:'proc', origin:'국내산 (보성)',    category:'커피믹스/티백',      storage:'상온보관', unit:'50개',     desc:'보성 녹차 100% 티백. 카테킨 풍부.' },

  // ── 빵/스낵/안주류 ─────────────────────────────────────────────
  { id:'bread1', name:'식빵 720g',          emoji:'🍞', price:3200,  originalPrice:4200,  section:'proc', origin:'국내산',          category:'빵/스낵/안주류',     storage:'상온보관', unit:'720g',     desc:'촉촉한 식빵. 토스트·샌드위치용.' },
  { id:'snack1', name:'새우깡 90g×3',       emoji:'🍟', price:4500,  originalPrice:5800,  section:'proc', origin:'국내산',          category:'빵/스낵/안주류',     storage:'상온보관', unit:'90g×3',    desc:'농심 새우깡 3봉 묶음. 국민 과자.' },
  { id:'snack2', name:'오징어땅콩 3종 세트', emoji:'🦑', price:5900,  originalPrice:7500,  section:'proc', origin:'국내산',          category:'빵/스낵/안주류',     storage:'상온보관', unit:'3봉',      desc:'바삭한 오징어땅콩 과자. 안주·간식용.' },

  // ── 헬스/건강식품 ──────────────────────────────────────────────
  { id:'health1', name:'비타민C 1000mg 60정', emoji:'💊', price:9900, originalPrice:13900, section:'proc', origin:'국내산',          category:'헬스/건강식품',      storage:'상온보관', unit:'60정',     desc:'고함량 비타민C 1000mg. 면역력·피로회복.' },
  { id:'health2', name:'홍삼 스틱 30포',     emoji:'🌿', price:19900, originalPrice:26900, section:'proc', origin:'국내산 (금산)',    category:'헬스/건강식품',      storage:'상온보관', unit:'30포',     desc:'금산 홍삼 직송 스틱. 피로회복·면역 강화.' },

  // ── 반려동물용품 ────────────────────────────────────────────────
  { id:'pet1',  name:'강아지 사료 1.5kg',   emoji:'🐕', price:18900, originalPrice:24900, section:'proc', origin:'국내산',          category:'반려동물용품',       storage:'상온보관', unit:'1.5kg',    desc:'소고기·연어 혼합 강아지 사료. 소화 쉬운 레시피.' },
  { id:'pet2',  name:'고양이 간식 120g',    emoji:'🐈', price:8900,  originalPrice:11900, section:'proc', origin:'국내산',          category:'반려동물용품',       storage:'상온보관', unit:'120g',     desc:'참치·닭가슴살 고양이 간식. 수분 보충에도 좋음.' },

  // ── 소모품/일회용품 ────────────────────────────────────────────
  { id:'disp1', name:'일회용 위생장갑 100매', emoji:'🧤', price:3900, originalPrice:5200,  section:'kitchen', origin:'국내산',        category:'소모품/일회용품',    storage:'상온보관', unit:'100매',    desc:'얇고 투명한 PE 위생장갑. 식품 조리 필수.' },
  { id:'disp2', name:'롤 위생백 2롤',        emoji:'📦', price:4500,  originalPrice:5900,  section:'kitchen', origin:'국내산',        category:'소모품/일회용품',    storage:'상온보관', unit:'2롤',      desc:'식품용 PE 롤백. 야채·반찬 보관 편리.' },

  // ── 조리도구 ─────────────────────────────────────────────────
  { id:'tool1', name:'실리콘 주걱 3종 세트', emoji:'🥄', price:12900, originalPrice:16900, section:'kitchen', origin:'국내산',        category:'조리도구',           storage:'상온보관', unit:'3종',      desc:'내열 실리콘 주걱·스패츌러·집게 세트.' },
  { id:'tool2', name:'스텐 주방가위',        emoji:'✂️', price:9900,  originalPrice:13900, section:'kitchen', origin:'국내산',        category:'조리도구',           storage:'상온보관', unit:'1개',      desc:'분리형 스텐 주방가위. 세척 간편.' },

  // ── 식기/밀폐용기 ──────────────────────────────────────────────
  { id:'box1',  name:'락앤락 밀폐용기 4p',  emoji:'🫙', price:19900, originalPrice:26900, section:'kitchen', origin:'국내산',        category:'식기/밀폐용기',      storage:'상온보관', unit:'4p 세트',  desc:'락앤락 정품 밀폐용기 4종. 냉장·냉동·전자레인지 OK.' },
  { id:'box2',  name:'유리 밀폐용기 3종',   emoji:'🫙', price:24900, originalPrice:32900, section:'kitchen', origin:'국내산',        category:'식기/밀폐용기',      storage:'상온보관', unit:'3종',      desc:'보로실리케이트 유리 밀폐용기. 환경 호르몬 ZERO.' },

  // ── 주방잡화 ─────────────────────────────────────────────────
  { id:'kitch1', name:'스펀지 수세미 6개',   emoji:'🧽', price:3500,  originalPrice:4900,  section:'living', origin:'국내산',         category:'주방잡화',           storage:'상온보관', unit:'6개',      desc:'거품 풍성한 스펀지 수세미. 그릇·냄비 세척.' },
  { id:'kitch2', name:'주방 세제 1L',        emoji:'🫧', price:4900,  originalPrice:6500,  section:'living', origin:'국내산',         category:'주방잡화',           storage:'상온보관', unit:'1L',       desc:'세균 99.9% 제거 주방 세제. 잔여물 없이 깔끔.' },

  // ── 욕실잡화 ─────────────────────────────────────────────────
  { id:'bath1', name:'케라시스 샴푸 950ml',  emoji:'🧴', price:9900,  originalPrice:13900, section:'living', origin:'국내산',         category:'욕실잡화',           storage:'상온보관', unit:'950ml',    desc:'손상 모발 케어 케라시스 샴푸. 윤기 충전.' },
  { id:'bath2', name:'치약 세트 3개',        emoji:'🪥', price:7900,  originalPrice:10500, section:'living', origin:'국내산',         category:'욕실잡화',           storage:'상온보관', unit:'3개',      desc:'불소 함유 프리미엄 치약 3개입. 충치 예방.' },

  // ── 생활잡화 ─────────────────────────────────────────────────
  { id:'life1', name:'물티슈 100매×3팩',    emoji:'🧻', price:5900,  originalPrice:7900,  section:'living', origin:'국내산',         category:'생활잡화',           storage:'상온보관', unit:'100매×3',  desc:'두껍고 촉촉한 생활 물티슈. 민감 피부용.' },
  { id:'life2', name:'비닐봉투 100매',      emoji:'🛍️', price:2900,  originalPrice:3900,  section:'living', origin:'국내산',         category:'생활잡화',           storage:'상온보관', unit:'100매',    desc:'25L 흰색 비닐봉투. 분리수거·쓰레기통용.' },

  // ── 캠핑용품 ─────────────────────────────────────────────────
  { id:'camp1', name:'부탄가스 4개입',      emoji:'🔥', price:5900,  originalPrice:7900,  section:'living', origin:'국내산',         category:'캠핑용품',           storage:'상온보관', unit:'4개',      desc:'이소부탄 혼합 캠핑 버너 가스. 출력 UP.' },

  // ── 사무/자동차용품 ───────────────────────────────────────────
  { id:'office1', name:'A4 복사용지 500매', emoji:'📄', price:9900,  originalPrice:13900, section:'living', origin:'국내산',         category:'사무/자동차용품',    storage:'상온보관', unit:'500매',    desc:'80g A4 복사용지. 프린터·복사기 호환.' },

  // ── 대용량 농산물 ──────────────────────────────────────────────
  { id:'bulk1', name:'양파 10kg',           emoji:'🧅', price:12900, originalPrice:18900, section:'bulk', origin:'국산',            category:'대용량 농산물',      storage:'상온보관', unit:'10kg',     desc:'농가 직송 양파 10kg 대용량. 업소·가정 공용.' },
  { id:'bulk2', name:'감자 10kg',           emoji:'🥔', price:19900, originalPrice:26900, section:'bulk', origin:'국산',            category:'대용량 농산물',      storage:'상온보관', unit:'10kg',     desc:'포슬포슬 국산 감자 10kg. 찜·볶음·국물.' },

  // ── 대용량 축산물 ──────────────────────────────────────────────
  { id:'bulk3', name:'삼겹살 2kg',          emoji:'🥩', price:32900, originalPrice:42900, section:'bulk', origin:'국내산',          category:'대용량 축산물',      storage:'냉장보관', unit:'2kg',      desc:'국내산 한돈 삼겹살 2kg. 정육점 직송.' },
  { id:'bulk4', name:'닭가슴살 3kg',        emoji:'🍗', price:19900, originalPrice:26900, section:'bulk', origin:'국내산',          category:'대용량 축산물',      storage:'냉장보관', unit:'3kg',      desc:'국내산 냉장 닭가슴살 3kg 대용량.' },

  // ── 대용량 수산물 ──────────────────────────────────────────────
  { id:'bulk5', name:'고등어 10마리',        emoji:'🐟', price:22900, originalPrice:32900, section:'bulk', origin:'국산',           category:'대용량 수산물',      storage:'냉장보관', unit:'10마리',   desc:'국산 손질 고등어 10마리 박스. 업소·명절용.' },

  // ── 대용량 장류/양념 ──────────────────────────────────────────
  { id:'bulk6', name:'고추장 3kg',          emoji:'🌶️', price:18900, originalPrice:24900, section:'bulk', origin:'국내산',          category:'대용량 장류/양념',   storage:'상온보관', unit:'3kg',      desc:'업소용 대용량 고추장 3kg. 식당·급식 최적.' },

  // ── 대용량 냉장/냉동 ─────────────────────────────────────────
  { id:'bulk7', name:'냉동 새우 1kg',       emoji:'🦐', price:19900, originalPrice:26900, section:'bulk', origin:'수입',           category:'대용량 냉장/냉동',   storage:'냉동보관', unit:'1kg',      desc:'손질 냉동 흰다리 새우. 볶음·탕·전 활용.' },

  // ── 대용량 가공식품 ───────────────────────────────────────────
  { id:'bulk8', name:'라면 30개입 박스',    emoji:'🍜', price:24900, originalPrice:32900, section:'bulk', origin:'국내산',          category:'대용량 가공식품',    storage:'상온보관', unit:'30개',     desc:'신라면 30개 박스. 대용량 저렴하게.' },

  // ── 대용량 커피/음료 ─────────────────────────────────────────
  { id:'bulk9', name:'생수 2L×12',         emoji:'💧', price:14900, originalPrice:19900, section:'bulk', origin:'국내산',          category:'대용량 커피/음료',   storage:'상온보관', unit:'2L×12',    desc:'무기물 풍부 생수 12병. 가정·사무실 배송.' },

  // ── 대용량 소모품/세제 ────────────────────────────────────────
  { id:'bulk10', name:'세탁세제 5kg',       emoji:'🫧', price:29900, originalPrice:39900, section:'bulk', origin:'국내산',          category:'대용량 소모품/세제', storage:'상온보관', unit:'5kg',      desc:'업소용 드럼·일반 겸용 세탁세제 5kg.' },

  // ── 대용량 식기/도구 ─────────────────────────────────────────
  { id:'bulk11', name:'종이컵 1000개',      emoji:'🥤', price:19900, originalPrice:26900, section:'bulk', origin:'국내산',          category:'대용량 식기/도구',   storage:'상온보관', unit:'1000개',   desc:'6.5온스 종이컵 1000개. 사무실·행사용.' },
];

const PRODUCT_IMAGES: Record<string, string> = {
  // 이번주특가
  'sale1':'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&h=400&q=80',
  'sale2':'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&h=400&q=80',
  'sale3':'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=400&h=400&q=80',
  'sale4':'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&h=400&q=80',
  'sale5':'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&h=400&q=80',
  'sale6':'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=400&q=80',
  // 야채/채소
  'veg1' :'https://images.unsplash.com/photo-1568158879083-c42860933ed7?auto=format&fit=crop&w=400&h=400&q=80',
  'veg2' :'https://images.unsplash.com/photo-1604866830893-c13cafa515d5?auto=format&fit=crop&w=400&h=400&q=80',
  'veg3' :'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=400&h=400&q=80',
  'veg4' :'https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=400&h=400&q=80',
  'veg8' :'https://images.unsplash.com/photo-1524593166156-312f362cada0?auto=format&fit=crop&w=400&h=400&q=80',
  'veg9' :'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80',
  // 과일
  'veg5' :'https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=400&h=400&q=80',
  'veg6' :'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&h=400&q=80',
  'veg7' :'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=400&h=400&q=80',
  'fruit1':'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=400&h=400&q=80',
  'fruit2':'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=400&h=400&q=80',
  // 쌀/잡곡
  'grain1':'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&h=400&q=80',
  'grain2':'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=400&h=400&q=80',
  'grain3':'https://images.unsplash.com/photo-1567608346765-a935af9d7b0e?auto=format&fit=crop&w=400&h=400&q=80',
  // 축산/계란
  'meat1':'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=400&h=400&q=80',
  'meat2':'https://images.unsplash.com/photo-1574691250077-03a929faece5?auto=format&fit=crop&w=400&h=400&q=80',
  'meat3':'https://images.unsplash.com/photo-1481671703460-040cb8a2d909?auto=format&fit=crop&w=400&h=400&q=80',
  'meat4':'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&h=400&q=80',
  // 수산/건어물
  'fish1':'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?auto=format&fit=crop&w=400&h=400&q=80',
  'fish2':'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&h=400&q=80',
  'fish3':'https://images.unsplash.com/photo-1535473895227-bdecb20fb157?auto=format&fit=crop&w=400&h=400&q=80',
  'fish4':'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&h=400&q=80',
  // 견과
  'nut1' :'https://images.unsplash.com/photo-1594819047050-99defca82545?auto=format&fit=crop&w=400&h=400&q=80',
  'nut2' :'https://images.unsplash.com/photo-1574856344991-aaa31b6f4f6b?auto=format&fit=crop&w=400&h=400&q=80',
  'nut3' :'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?auto=format&fit=crop&w=400&h=400&q=80',
  // 고추장/된장/간장류
  'sauce1':'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=400&h=400&q=80',
  'sauce2':'https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=400&h=400&q=80',
  'sauce3':'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&h=400&q=80',
  // 양념/소스/육수
  'cond1':'https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=400&h=400&q=80',
  'cond2':'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&h=400&q=80',
  'cond3':'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&h=400&q=80',
  // 식용유/조미료
  'oil1' :'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&h=400&q=80',
  'oil2' :'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=400&h=400&q=80',
  'oil3' :'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&h=400&q=80',
  // 밀가루/라면/면
  'proc1':'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=400&q=80',
  'flour1':'https://images.unsplash.com/photo-1597484662973-a8e43c09c9e6?auto=format&fit=crop&w=400&h=400&q=80',
  'nood1':'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=400&q=80',
  // 유제품/냉장/냉동
  'proc2':'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=400&q=80',
  'proc3':'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=400&h=400&q=80',
  'proc5':'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?auto=format&fit=crop&w=400&h=400&q=80',
  'proc6':'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&h=400&q=80',
  'dairy1':'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&h=400&q=80',
  // 캔/통조림
  'proc4':'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=400&q=80',
  'can1' :'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=400&h=400&q=80',
  'can2' :'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=400&h=400&q=80',
  // 김/편의식/반찬
  'kim1' :'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=400&q=80',
  'rice1':'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&h=400&q=80',
  'side1':'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&h=400&q=80',
  // 생수/음료
  'water1':'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&h=400&q=80',
  'drink1':'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&h=400&q=80',
  'juice1':'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=400&h=400&q=80',
  // 커피믹스/티백
  'coffee1':'https://images.unsplash.com/photo-1534040385115-33dcb3acba5b?auto=format&fit=crop&w=400&h=400&q=80',
  'tea1' :'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=400&h=400&q=80',
  // 빵/스낵/안주류
  'bread1':'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=400&q=80',
  'snack1':'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&h=400&q=80',
  'snack2':'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=400&h=400&q=80',
  // 헬스/건강식품
  'health1':'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=400&h=400&q=80',
  'health2':'https://images.unsplash.com/photo-1515446134809-993c501ca304?auto=format&fit=crop&w=400&h=400&q=80',
  // 반려동물
  'pet1' :'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&h=400&q=80',
  'pet2' :'https://images.unsplash.com/photo-1548366086-7f1b76106622?auto=format&fit=crop&w=400&h=400&q=80',
  // 소모품/일회용품
  'disp1':'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=400&h=400&q=80',
  'disp2':'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=400&q=80',
  // 조리도구
  'tool1':'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&h=400&q=80',
  'tool2':'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&h=400&q=80',
  // 식기/밀폐용기
  'box1' :'https://images.unsplash.com/photo-1584863231364-2edc166de576?auto=format&fit=crop&w=400&h=400&q=80',
  'box2' :'https://images.unsplash.com/photo-1584863231364-2edc166de576?auto=format&fit=crop&w=400&h=400&q=80',
  // 주방잡화
  'kitch1':'https://images.unsplash.com/photo-1585664811087-47f65abbad64?auto=format&fit=crop&w=400&h=400&q=80',
  'kitch2':'https://images.unsplash.com/photo-1585664811087-47f65abbad64?auto=format&fit=crop&w=400&h=400&q=80',
  // 욕실잡화
  'bath1':'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=400&h=400&q=80',
  'bath2':'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=400&h=400&q=80',
  // 생활잡화
  'life1':'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=400&h=400&q=80',
  'life2':'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&h=400&q=80',
  // 캠핑
  'camp1':'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&h=400&q=80',
  // 사무
  'office1':'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&h=400&q=80',
  // 대용량
  'bulk1':'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk2':'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk3':'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk4':'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk5':'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk6':'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk7':'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk8':'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk9':'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk10':'https://images.unsplash.com/photo-1585664811087-47f65abbad64?auto=format&fit=crop&w=400&h=400&q=80',
  'bulk11':'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&h=400&q=80',
};

const OVERRIDE_KEYS: (keyof ProductOverride)[] = [
  'name', 'price', 'originalPrice', 'imageUrl', 'detailImageUrl',
  'category', 'desc', 'unit', 'origin', 'storage',
  'expiryDate', 'productInfo', 'customerServiceNo', 'hidden', 'taxType',
];

function applyOverride(p: Product, ov: ProductOverride | undefined): Product {
  if (!ov) return p;
  const result = { ...p };
  OVERRIDE_KEYS.forEach(k => { if (k in ov) (result as Record<string, unknown>)[k] = ov[k]; });
  return result;
}

export function getProductImage(id: string): string {
  const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
  return overrides[id]?.imageUrl ?? PRODUCT_IMAGES[id] ?? '';
}

function buildProductList(): Product[] {
  const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
  const custom = lsGet<Product[]>(KEYS.customProducts, []);
  return [
    ...PRODUCTS.map(p => applyOverride(p, overrides[p.id])),
    ...custom.map(p => applyOverride(p, overrides[p.id])),
  ];
}

export function getProducts(): Product[] {
  return buildProductList().filter(p => !p.hidden);
}

export function getAllProductsAdmin(): Product[] {
  return buildProductList();
}
