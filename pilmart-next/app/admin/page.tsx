'use client';
import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingBag, Settings, KeyRound,
  LogOut, Store, Trash2, Search, RotateCcw, X, ChevronDown,
  Bell, Zap, Plus, Printer, ImageIcon, Upload, Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CATEGORIES = [
  '야채/채소','과일','쌀/잡곡','축산/계란','수산/건어물','유제품/냉장/냉동','견과',
  '고추장/된장/간장류','양념/소스/육수','식용유/조미료','밀가루/라면/면',
  '캔/통조림','김/편의식/반찬','생수/음료','커피믹스/티백','빵/스낵/안주류',
  '헬스/건강식품','반려동물용품','소모품/일회용품','조리도구','식기/밀폐용기',
  '주방잡화','욕실잡화','생활잡화','캠핑용품','사무/자동차용품',
  '대용량 농산물','대용량 축산물','대용량 수산물','대용량 장류/양념',
  '대용량 냉장/냉동','대용량 가공식품','대용량 커피/음료','대용량 소모품/세제','대용량 식기/도구',
];
import { KEYS, lsGet, lsSet, lsRemove } from '@/lib/storage';
import { hashPassword } from '@/lib/crypto';
import { getProducts, getAllProductsAdmin, getProductImage } from '@/lib/products';
import { formatPrice } from '@/lib/utils';
import { Order, Product, ProductOverride, StoreInfo, Notice, FlashSaleConfig, FlashProduct } from '@/types';

type Tab = 'dashboard' | 'orders' | 'products' | 'notices' | 'deals' | 'site' | 'account';
type OrderStatus = '결제완료' | '준비중' | '배송중' | '완료' | '취소';
type OrderWithStatus = Order & { status?: OrderStatus };

const METHOD: Record<string, string> = {
  card: '카드결제', transfer: '계좌이체',
  'meet-card': '만나서(카드)', 'meet-cash': '만나서(현금)',
};
const STATUS_STYLE: Record<string, string> = {
  '결제완료': 'bg-blue-50 text-blue-700',
  '준비중': 'bg-orange-50 text-orange-700',
  '배송중': 'bg-purple-50 text-purple-700',
  '완료': 'bg-green-50 text-green-700',
  '취소': 'bg-red-50 text-red-500',
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');

  const [orders, setOrders] = useState<OrderWithStatus[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({ name: '필마트', phone: '', address: '' });
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');

  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all' | 'online' | 'meet'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [prodModal, setProdModal] = useState({ open: false, id: '', name: '', price: '', original: '', category: '', imageUrl: '', detailImageUrl: '', desc: '', unit: '', origin: '', storage: '', expiryDate: '', productInfo: '', customerServiceNo: '' });
  const [showHidden, setShowHidden] = useState(false);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const detailImgInputRef = useRef<HTMLInputElement>(null);
  const [productSearch, setProductSearch] = useState('');

  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [siteSaved, setSiteSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_FLASH: FlashSaleConfig = { startHour: 9, endHour: 22, products: [] };
  const [flashSale, setFlashSale] = useState<FlashSaleConfig>(DEFAULT_FLASH);
  const [flashSaved, setFlashSaved] = useState(false);
  const [flashForm, setFlashForm] = useState({
    show: false, editIdx: -1,
    name: '', emoji: '', desc: '', imageUrl: '',
    price: 0, originalPrice: 0, maxPerCustomer: '',
    error: '',
  });

  useEffect(() => {
    const raw = lsGet<OrderWithStatus[]>(KEYS.orders, []);
    setOrders([...raw].reverse());
    setProducts(getAllProductsAdmin());
    setNotices(lsGet<Notice[]>(KEYS.notices, []));
    setStoreInfo(lsGet<StoreInfo>(KEYS.storeInfo, { name: '필마트', phone: '', address: '' }));
    setFlashSale(lsGet<FlashSaleConfig>(KEYS.flashSale, DEFAULT_FLASH));
    setLogoUrl(localStorage.getItem(KEYS.logo) || '');
  }, []);

  async function login() {
    const stored = lsGet<string>(KEYS.adminPw, '1234');
    const isHash = /^[0-9a-f]{64}$/.test(stored);
    const canHash = typeof crypto !== 'undefined' && !!crypto.subtle;

    let matches = false;

    if (!isHash) {
      // 평문 저장 — 직접 비교
      matches = pw === stored;
      // 보안 컨텍스트(localhost/HTTPS)에서만 해시로 업그레이드
      if (matches && canHash) {
        try { lsSet(KEYS.adminPw, await hashPassword(pw)); } catch { /* 무시 */ }
      }
    } else if (canHash) {
      // 해시 저장 + 보안 컨텍스트 — 해시 비교
      try { matches = (await hashPassword(pw)) === stored; } catch { matches = false; }
    } else {
      // 해시 저장 + HTTP(비보안 컨텍스트) — crypto.subtle 없음
      // 이 기기 localStorage의 해시를 지우고 평문 기본값으로 리셋
      lsRemove(KEYS.adminPw);
      matches = pw === '1234';
    }

    if (matches) { setAuthed(true); setPwError(false); lsSet(KEYS.adminActive, true); }
    else setPwError(true);
  }

  const totalSales = useMemo(() => orders.reduce((s, o) => s + (o.total || 0), 0), [orders]);
  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.createdAt).toDateString() === today).length;
  }, [orders]);
  const avgOrder = orders.length ? Math.round(totalSales / orders.length) : 0;

  const filteredOrders = useMemo(() => orders.filter(o => {
    const isMeet = o.method === 'meet-card' || o.method === 'meet-cash';
    if (orderFilter === 'online' && isMeet) return false;
    if (orderFilter === 'meet' && !isMeet) return false;
    if (orderSearch && !o.orderId?.includes(orderSearch)) return false;
    return true;
  }), [orders, orderFilter, orderSearch]);

  const visibleProducts = useMemo(() => products.filter(p => !p.hidden), [products]);
  const hiddenProducts = useMemo(() => products.filter(p => p.hidden), [products]);
  const filteredProducts = useMemo(() =>
    productSearch ? visibleProducts.filter(p => p.name.includes(productSearch) || p.category.includes(productSearch)) : visibleProducts,
    [visibleProducts, productSearch]);

  function updateStatus(orderId: string, status: OrderStatus) {
    const raw = lsGet<OrderWithStatus[]>(KEYS.orders, []);
    const next = raw.map(o => o.orderId === orderId ? { ...o, status } : o);
    lsSet(KEYS.orders, next);
    setOrders([...next].reverse());
  }

  function deleteOrder(orderId: string) {
    const next = lsGet<Order[]>(KEYS.orders, []).filter(o => o.orderId !== orderId);
    lsSet(KEYS.orders, next);
    setOrders([...next].reverse());
  }

  function startEdit(p: Product) {
    const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
    const ov = overrides[p.id] ?? {};
    setProdModal({
      open: true, id: p.id, name: p.name, price: String(p.price), original: String(p.originalPrice),
      category: p.category, imageUrl: ov.imageUrl ?? '', detailImageUrl: ov.detailImageUrl ?? p.detailImageUrl ?? '',
      desc: p.desc ?? '', unit: p.unit, origin: p.origin, storage: p.storage,
      expiryDate: p.expiryDate ?? '', productInfo: p.productInfo ?? '', customerServiceNo: p.customerServiceNo ?? '',
    });
  }

  function saveProductEdit() {
    if (!prodModal.id) return;
    const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
    overrides[prodModal.id] = {
      name: prodModal.name, price: Number(prodModal.price), originalPrice: Number(prodModal.original),
      imageUrl: prodModal.imageUrl || undefined, detailImageUrl: prodModal.detailImageUrl || undefined,
      category: prodModal.category,
      desc: prodModal.desc, unit: prodModal.unit, origin: prodModal.origin, storage: prodModal.storage,
      expiryDate: prodModal.expiryDate || undefined,
      productInfo: prodModal.productInfo || undefined,
      customerServiceNo: prodModal.customerServiceNo || undefined,
    };
    lsSet(KEYS.products, overrides);
    setProducts(getAllProductsAdmin());
    notifyProductsChanged();
    setProdModal(m => ({ ...m, open: false }));
  }

  function downloadExcelTemplate() {
    const headers = [
      '상품ID', '상품명', '카테고리', '이모지', '판매가', '정가',
      '규격/단위', '원산지', '보관방법', '소비기한', '상품고시', '소비자상담번호',
      '상품설명', '이미지URL', '상세이미지URL', '섹션',
    ];
    const sample = [{
      '상품ID': 'sample1', '상품명': '예시 상품', '카테고리': '야채/채소', '이모지': '🥬',
      '판매가': 3900, '정가': 4900, '규격/단위': '1kg', '원산지': '국산',
      '보관방법': '냉장보관', '소비기한': '제조일로부터 7일', '상품고시': '농산물',
      '소비자상담번호': '1588-0000', '상품설명': '신선한 상품입니다', '이미지URL': '', '상세이미지URL': '', '섹션': 'fresh',
    }];
    const ws = XLSX.utils.json_to_sheet(sample, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '상품목록');
    XLSX.writeFile(wb, '필마트_상품_템플릿.xlsx');
  }

  function downloadProductsExcel() {
    const rows = products.map(p => ({
      '상품ID': p.id, '상품명': p.name, '카테고리': p.category, '이모지': p.emoji,
      '판매가': p.price, '정가': p.originalPrice, '규격/단위': p.unit,
      '원산지': p.origin, '보관방법': p.storage,
      '소비기한': p.expiryDate ?? '', '상품고시': p.productInfo ?? '',
      '소비자상담번호': p.customerServiceNo ?? '', '상품설명': p.desc ?? '',
      '이미지URL': p.imageUrl ?? '', '상세이미지URL': p.detailImageUrl ?? '', '섹션': p.section,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '상품목록');
    XLSX.writeFile(wb, '필마트_상품목록.xlsx');
  }

  async function handleExcelImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);

      const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
      const existingIds = new Set(products.map(p => p.id));
      const newProducts: Product[] = [];

      for (const row of rows) {
        const id = String(row['상품ID'] ?? '').trim();
        if (!id) continue;

        const override: ProductOverride = {
          name: String(row['상품명'] ?? '').trim() || undefined,
          price: row['판매가'] ? Number(row['판매가']) : undefined,
          originalPrice: row['정가'] ? Number(row['정가']) : undefined,
          category: String(row['카테고리'] ?? '').trim() || undefined,
          unit: String(row['규격/단위'] ?? '').trim() || undefined,
          origin: String(row['원산지'] ?? '').trim() || undefined,
          storage: String(row['보관방법'] ?? '').trim() || undefined,
          expiryDate: String(row['소비기한'] ?? '').trim() || undefined,
          productInfo: String(row['상품고시'] ?? '').trim() || undefined,
          customerServiceNo: String(row['소비자상담번호'] ?? '').trim() || undefined,
          desc: String(row['상품설명'] ?? '').trim() || undefined,
          imageUrl: String(row['이미지URL'] ?? '').trim() || undefined,
          detailImageUrl: String(row['상세이미지URL'] ?? '').trim() || undefined,
        };

        if (existingIds.has(id)) {
          overrides[id] = { ...overrides[id], ...Object.fromEntries(Object.entries(override).filter(([, v]) => v !== undefined)) };
        } else {
          // 신규 상품
          newProducts.push({
            id,
            name: String(row['상품명'] ?? '신규 상품'),
            emoji: String(row['이모지'] ?? '📦'),
            price: Number(row['판매가'] ?? 0),
            originalPrice: Number(row['정가'] ?? 0),
            section: String(row['섹션'] ?? 'fresh'),
            origin: String(row['원산지'] ?? ''),
            category: String(row['카테고리'] ?? '기타'),
            storage: String(row['보관방법'] ?? ''),
            unit: String(row['규격/단위'] ?? ''),
            desc: String(row['상품설명'] ?? ''),
            imageUrl: String(row['이미지URL'] ?? '') || undefined,
            detailImageUrl: String(row['상세이미지URL'] ?? '') || undefined,
            expiryDate: String(row['소비기한'] ?? '') || undefined,
            productInfo: String(row['상품고시'] ?? '') || undefined,
            customerServiceNo: String(row['소비자상담번호'] ?? '') || undefined,
          });
        }
      }

      lsSet(KEYS.products, overrides);
      if (newProducts.length > 0) {
        const existing = lsGet<Product[]>(KEYS.customProducts, []);
        const merged = [...existing.filter(p => !newProducts.find(n => n.id === p.id)), ...newProducts];
        lsSet(KEYS.customProducts, merged);
      }
      setProducts(getAllProductsAdmin());
      notifyProductsChanged();
      alert(`✅ 엑셀 가져오기 완료\n기존 상품 업데이트: ${rows.length - newProducts.length}개\n신규 상품 추가: ${newProducts.length}개`);
    } catch {
      alert('❌ 엑셀 파일을 읽는 중 오류가 발생했습니다. 형식을 확인해주세요.');
    } finally {
      if (excelInputRef.current) excelInputRef.current.value = '';
    }
  }

  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('이미지는 500KB 이하로 올려주세요. (localStorage 용량 제한)');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setProdModal(m => ({ ...m, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
    if (imgInputRef.current) imgInputRef.current.value = '';
  }

  async function handleDetailImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('이미지는 500KB 이하로 올려주세요. (localStorage 용량 제한)');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setProdModal(m => ({ ...m, detailImageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
    if (detailImgInputRef.current) detailImgInputRef.current.value = '';
  }

  function resetProduct(id: string) {
    const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
    delete overrides[id];
    lsSet(KEYS.products, overrides);
    // 엑셀로 추가된 커스텀 상품이면 목록에서 완전 삭제
    const custom = lsGet<Product[]>(KEYS.customProducts, []);
    if (custom.some(p => p.id === id)) {
      lsSet(KEYS.customProducts, custom.filter(p => p.id !== id));
    }
    setProducts(getAllProductsAdmin());
    notifyProductsChanged();
    setProdModal(m => ({ ...m, open: false }));
  }

  function notifyProductsChanged() {
    window.dispatchEvent(new CustomEvent('pilmart:products-changed'));
  }

  function deleteProduct(id: string) {
    if (!window.confirm('이 상품을 삭제할까요?')) return;
    const custom = lsGet<Product[]>(KEYS.customProducts, []);
    const isCustom = custom.some(p => p.id === id);
    if (isCustom) {
      lsSet(KEYS.customProducts, custom.filter(p => p.id !== id));
      const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
      delete overrides[id];
      lsSet(KEYS.products, overrides);
    } else {
      const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
      overrides[id] = { ...overrides[id], hidden: true };
      lsSet(KEYS.products, overrides);
    }
    setProducts(getAllProductsAdmin());
    notifyProductsChanged();
  }

  function deleteAllProducts() {
    const visibleCount = products.filter(p => !p.hidden).length;
    if (!window.confirm(`현재 표시 중인 상품 ${visibleCount}개를 모두 삭제할까요?`)) return;
    const customIds = new Set(lsGet<Product[]>(KEYS.customProducts, []).map(p => p.id));
    lsSet(KEYS.customProducts, []);
    const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
    products.filter(p => !p.hidden).forEach(p => {
      if (customIds.has(p.id)) {
        delete overrides[p.id];
      } else {
        overrides[p.id] = { ...overrides[p.id], hidden: true };
      }
    });
    lsSet(KEYS.products, overrides);
    setProducts(getAllProductsAdmin());
    notifyProductsChanged();
  }

  function restoreProduct(id: string) {
    const overrides = lsGet<Record<string, ProductOverride>>(KEYS.products, {});
    if (overrides[id]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { hidden: _h, ...rest } = overrides[id];
      if (Object.keys(rest).length === 0) delete overrides[id];
      else overrides[id] = rest;
    }
    lsSet(KEYS.products, overrides);
    setProducts(getAllProductsAdmin());
    notifyProductsChanged();
  }

  function addNotice() {
    if (!newNotice.title.trim()) return;
    const n: Notice = { id: Date.now().toString(), ...newNotice, createdAt: Date.now() };
    const next = [n, ...notices];
    setNotices(next);
    lsSet(KEYS.notices, next);
    setNewNotice({ title: '', content: '' });
  }

  function removeNotice(id: string) {
    const next = notices.filter(n => n.id !== id);
    setNotices(next);
    lsSet(KEYS.notices, next);
  }

  function saveFlashTime() {
    lsSet(KEYS.flashSale, flashSale);
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 3000);
  }

  function openFlashForm(idx: number) {
    if (idx === -1) {
      setFlashForm({ show: true, editIdx: -1, name: '', emoji: '', desc: '', imageUrl: '', price: 0, originalPrice: 0, maxPerCustomer: '', error: '' });
    } else {
      const fp = flashSale.products[idx];
      setFlashForm({ show: true, editIdx: idx, name: fp.name, emoji: fp.emoji || '', desc: fp.desc || '', imageUrl: fp.imageUrl || '', price: fp.price, originalPrice: fp.originalPrice, maxPerCustomer: fp.maxPerCustomer ? String(fp.maxPerCustomer) : '', error: '' });
    }
  }

  function saveFlashProductForm() {
    if (!flashForm.name.trim()) { setFlashForm(f => ({ ...f, error: '상품명을 입력해주세요' })); return; }
    if (!flashForm.price) { setFlashForm(f => ({ ...f, error: '특가를 입력해주세요' })); return; }
    const fp: FlashProduct = {
      idx: flashForm.editIdx === -1 ? flashSale.products.length : flashForm.editIdx,
      name: flashForm.name,
      emoji: flashForm.emoji,
      desc: flashForm.desc,
      imageUrl: flashForm.imageUrl,
      price: flashForm.price,
      originalPrice: flashForm.originalPrice,
      maxPerCustomer: flashForm.maxPerCustomer ? Number(flashForm.maxPerCustomer) : 0,
    };
    const nextProducts = flashForm.editIdx === -1
      ? [...flashSale.products, fp]
      : flashSale.products.map((p, i) => i === flashForm.editIdx ? fp : p);
    const next = { ...flashSale, products: nextProducts };
    setFlashSale(next);
    lsSet(KEYS.flashSale, next);
    setFlashForm(f => ({ ...f, show: false }));
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 3000);
  }

  function deleteFlashProduct(idx: number) {
    const next = { ...flashSale, products: flashSale.products.filter((_, i) => i !== idx) };
    setFlashSale(next);
    lsSet(KEYS.flashSale, next);
  }

  function saveStoreInfo() {
    lsSet(KEYS.storeInfo, storeInfo);
    setSiteSaved(true);
    setTimeout(() => setSiteSaved(false), 2000);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      localStorage.setItem(KEYS.logo, url);
      setLogoUrl(url);
      window.dispatchEvent(new Event('pilmart:logo-changed'));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function removeLogo() {
    localStorage.removeItem(KEYS.logo);
    setLogoUrl('');
    window.dispatchEvent(new Event('pilmart:logo-changed'));
  }

  async function changeAdminPw() {
    if (newPw.length < 4) return alert('4자 이상 입력해주세요');
    if (newPw !== newPwConfirm) return alert('비밀번호가 일치하지 않습니다');
    lsSet(KEYS.adminPw, await hashPassword(newPw));
    setNewPw(''); setNewPwConfirm('');
    alert('비밀번호가 변경되었습니다');
  }

  function fmtDate(ts: number) {
    return new Date(ts).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function printOrder(order: OrderWithStatus) {
    const w = window.open('', '_blank', 'width=620,height=820');
    if (!w) return;
    const info = lsGet<{ name: string; phone: string; address: string }>(KEYS.storeInfo, { name: '필마트', phone: '', address: '' });
    const itemRows = (order.items ?? []).map(i => `
      <tr>
        <td>${escapeHtml(i.emoji ?? '')} ${escapeHtml(i.name)}</td>
        <td class="center">${escapeHtml(i.unit ?? '')}</td>
        <td class="center">${i.qty}</td>
        <td class="right">${formatPrice(i.price)}</td>
        <td class="right amount">${formatPrice(i.price * i.qty)}</td>
      </tr>`).join('');

    w.document.write(`<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8">
<title>주문서 · ${order.orderId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Apple SD Gothic Neo','Malgun Gothic',sans-serif; padding: 32px; font-size: 13px; color: #222; }
  h1 { text-align: center; font-size: 22px; font-weight: 900; margin-bottom: 2px; }
  .store-sub { text-align: center; font-size: 11px; color: #888; margin-bottom: 24px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: .05em;
    border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 10px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
  .info-row { display: flex; gap: 8px; font-size: 12px; }
  .info-label { color: #888; min-width: 60px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f5f5f5; text-align: left; padding: 6px 8px; font-size: 11px; color: #555; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; }
  td { padding: 7px 8px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
  .center { text-align: center; }
  .right { text-align: right; }
  .total-row td { border-top: 2px solid #222; border-bottom: none; font-weight: 700; font-size: 14px; padding-top: 10px; }
  .amount { color: #c53030; font-weight: 600; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700;
    background: #ebf8ff; color: #2b6cb0; }
  .footer { text-align: center; color: #aaa; font-size: 11px; margin-top: 28px; padding-top: 14px; border-top: 1px solid #eee; }
  @media print { body { padding: 16px; } button { display: none; } }
</style>
</head><body>
<div style="text-align:right;margin-bottom:12px">
  <button onclick="window.print()" style="padding:6px 16px;background:#c53030;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">🖨 인쇄</button>
</div>
<h1>${escapeHtml(info.name)}</h1>
<p class="store-sub">${escapeHtml([info.phone, info.address].filter(Boolean).join(' · ')) || '주문 확인서'}</p>

<div class="section">
  <div class="section-title">주문 정보</div>
  <div class="info-grid">
    <div class="info-row"><span class="info-label">주문번호</span><span style="font-size:11px;font-family:monospace">${escapeHtml(order.orderId)}</span></div>
    <div class="info-row"><span class="info-label">결제상태</span><span class="status-badge">${escapeHtml(order.status || '결제완료')}</span></div>
    <div class="info-row"><span class="info-label">주문일시</span><span>${new Date(order.createdAt).toLocaleString('ko-KR')}</span></div>
    <div class="info-row"><span class="info-label">결제수단</span><span>${escapeHtml(METHOD[order.method] || order.method)}</span></div>
  </div>
</div>

<div class="section">
  <div class="section-title">주문 상품</div>
  <table>
    <thead><tr>
      <th>상품명</th><th class="center">규격</th><th class="center">수량</th>
      <th class="right">단가</th><th class="right">금액</th>
    </tr></thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td colspan="4">합계</td>
        <td class="right amount">${formatPrice(order.total)}</td>
      </tr>
    </tbody>
  </table>
</div>

<div class="footer">${escapeHtml(info.name)} · 오전 주문 당일 배송 · 감사합니다 🙏</div>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`);
    w.document.close();
  }

  const NAV: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" />, label: '대시보드' },
    { id: 'orders', icon: <Package className="h-4 w-4" />, label: '주문 관리' },
    { id: 'products', icon: <ShoppingBag className="h-4 w-4" />, label: '상품 관리' },
    { id: 'deals', icon: <Zap className="h-4 w-4" />, label: '오늘만 특가' },
    { id: 'notices', icon: <Bell className="h-4 w-4" />, label: '공지사항' },
    { id: 'site', icon: <Store className="h-4 w-4" />, label: '사이트 설정' },
    { id: 'account', icon: <Settings className="h-4 w-4" />, label: '계정/데이터' },
  ];

  const tabTitle: Record<Tab, string> = {
    dashboard: '대시보드', orders: '주문 관리', products: '상품 관리',
    deals: '오늘만 특가', notices: '공지사항', site: '사이트 설정', account: '계정/데이터',
  };

  /* ── 비밀번호 게이트 ── */
  if (!authed) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-1">관리자 로그인</h2>
          <p className="text-sm text-gray-400 mb-6">필마트 관리자 페이지</p>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="비밀번호 입력"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:border-primary mb-3"
            autoFocus
          />
          {pwError && <p className="text-red-500 text-sm mb-3">비밀번호가 올바르지 않습니다</p>}
          <button onClick={login} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors">
            로그인
          </button>
          <p className="text-xs text-gray-300 mt-4">초기 비밀번호: 1234</p>
        </div>
      </div>
    );
  }

  /* ── 메인 레이아웃 ── */
  return (
    <>
    <div className="fixed inset-0 z-[9999] flex bg-gray-50">

      {/* 사이드바 */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-xl font-extrabold text-primary">필마트</p>
          <p className="text-xs text-gray-400 mt-0.5">관리자</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                tab === n.id ? 'bg-blue-50 text-primary font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {n.icon}
              {n.label}
              {n.id === 'orders' && orders.length > 0 && (
                <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-0.5">
          <Link href="/" target="_blank" onClick={() => lsRemove(KEYS.adminActive)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors">
            <Store className="h-4 w-4" /> 쇼핑몰 보기
          </Link>
          <button onClick={() => { setAuthed(false); setPw(''); lsRemove(KEYS.adminActive); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="h-4 w-4" /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-black text-gray-800">{tabTitle[tab]}</h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </p>
          </div>
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />관리자
          </span>
        </header>

        <div className="flex-1 overflow-y-auto">

          {/* ── 대시보드 ── */}
          {tab === 'dashboard' && (
            <div className="p-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: '총 주문', value: `${orders.length}건`, color: 'text-gray-800' },
                  { label: '오늘 주문', value: `${todayCount}건`, color: 'text-gray-800' },
                  { label: '총 매출', value: formatPrice(totalSales), color: 'text-primary' },
                  { label: '평균 주문금액', value: formatPrice(avgOrder), color: 'text-gray-800' },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium mb-2">{c.label}</p>
                    <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-gray-700">최근 주문</h3>
                  <button onClick={() => setTab('orders')} className="text-xs text-primary font-semibold hover:underline">
                    전체 보기 →
                  </button>
                </div>
                {orders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">주문 내역이 없습니다</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2 font-medium">주문번호</th>
                        <th className="text-left pb-2 font-medium">주문자</th>
                        <th className="text-left pb-2 font-medium">날짜</th>
                        <th className="text-left pb-2 font-medium">결제수단</th>
                        <th className="text-right pb-2 font-medium">금액</th>
                        <th className="text-center pb-2 font-medium">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 7).map(o => (
                        <tr key={o.orderId} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 font-mono text-xs text-gray-700">{o.orderId?.slice(0, 14)}…</td>
                          <td className="py-2.5 text-xs text-gray-700 font-medium">{o.customerName || '-'}</td>
                          <td className="py-2.5 text-xs text-gray-500">{fmtDate(o.createdAt)}</td>
                          <td className="py-2.5 text-xs text-gray-500">{METHOD[o.method] || o.method}</td>
                          <td className="py-2.5 text-right font-bold text-primary">{formatPrice(o.total)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[o.status || '결제완료']}`}>
                              {o.status || '결제완료'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── 주문 관리 ── */}
          {tab === 'orders' && (
            <div className="p-8">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                  {(['all', 'online', 'meet'] as const).map((f, i) => (
                    <button key={f} onClick={() => setOrderFilter(f)}
                      className={`px-4 py-2 text-sm font-semibold transition-colors ${i > 0 ? 'border-l border-gray-200' : ''} ${orderFilter === f ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                      {f === 'all' ? '전체' : f === 'online' ? '온라인결제' : '만나서결제'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                    placeholder="주문번호 검색..."
                    className="border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary bg-white w-52" />
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-sm text-gray-400">{filteredOrders.length}건</span>
                  <button onClick={() => { if (confirm('모든 주문을 삭제하시겠습니까?')) { lsSet(KEYS.orders, []); setOrders([]); } }}
                    className="text-sm text-red-400 hover:text-red-600 font-medium flex items-center gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> 전체 삭제
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                  <Package className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400">주문 내역이 없습니다</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs text-gray-500 font-medium">
                        <th className="text-left px-5 py-3">주문번호</th>
                        <th className="text-left px-5 py-3">주문자</th>
                        <th className="text-left px-5 py-3">주문일시</th>
                        <th className="text-left px-5 py-3">결제수단</th>
                        <th className="text-right px-5 py-3">금액</th>
                        <th className="text-center px-5 py-3">상태</th>
                        <th className="text-center px-5 py-3">상품</th>
                        <th className="text-center px-5 py-3">인쇄</th>
                        <th className="text-center px-5 py-3">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <Fragment key={order.orderId}>
                          <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-gray-700">{order.orderId?.slice(0, 16)}…</td>
                            <td className="px-5 py-3 text-xs text-gray-700 font-medium">{order.customerName || '-'}</td>
                            <td className="px-5 py-3 text-xs text-gray-500">{fmtDate(order.createdAt)}</td>
                            <td className="px-5 py-3 text-xs text-gray-600">{METHOD[order.method] || order.method}</td>
                            <td className="px-5 py-3 text-right font-bold text-primary">{formatPrice(order.total)}</td>
                            <td className="px-5 py-3 text-center">
                              <select
                                value={order.status || '결제완료'}
                                onChange={e => updateStatus(order.orderId, e.target.value as OrderStatus)}
                                className={`text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none cursor-pointer ${STATUS_STYLE[order.status || '결제완료']}`}>
                                {['결제완료', '준비중', '배송중', '완료', '취소'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {order.items?.length > 0 ? (
                                <button onClick={() => setExpanded(e => ({ ...e, [order.orderId]: !e[order.orderId] }))}
                                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 mx-auto">
                                  {expanded[order.orderId] ? '접기' : `${order.items.length}개`}
                                  <ChevronDown className={`h-3 w-3 transition-transform ${expanded[order.orderId] ? 'rotate-180' : ''}`} />
                                </button>
                              ) : <span className="text-xs text-gray-300">-</span>}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button onClick={() => printOrder(order)}
                                className="text-gray-300 hover:text-blue-500 transition-colors" title="인쇄">
                                <Printer className="h-3.5 w-3.5" />
                              </button>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button onClick={() => deleteOrder(order.orderId)}
                                className="text-gray-300 hover:text-red-500 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                          {expanded[order.orderId] && order.items?.length > 0 && (
                            <tr className="bg-blue-50/30 border-b border-gray-50">
                              <td colSpan={9} className="px-8 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {order.items.map(item => (
                                    <div key={item.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 text-xs">
                                      <span>{item.emoji}</span>
                                      <span className="text-gray-700 font-medium">{item.name}</span>
                                      <span className="text-gray-400">×{item.qty}</span>
                                      <span className="text-primary font-bold">{formatPrice(item.price * item.qty)}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── 상품 관리 ── */}
          {tab === 'products' && (
            <div className="p-8">
              {/* 엑셀 업로드/다운로드 안내 */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5">
                <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5" /> 엑셀로 상품 일괄 관리
                </p>
                <p className="text-xs text-blue-600 mb-3">템플릿을 다운로드하고, 상품 정보를 작성한 뒤 엑셀 업로드로 한번에 등록·수정합니다.</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={downloadExcelTemplate}
                    className="flex items-center gap-1.5 text-xs font-semibold border border-blue-300 text-blue-700 bg-white px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <Download className="h-3.5 w-3.5" /> 빈 템플릿 다운로드
                  </button>
                  <button onClick={downloadProductsExcel}
                    className="flex items-center gap-1.5 text-xs font-semibold border border-blue-300 text-blue-700 bg-white px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                    <Download className="h-3.5 w-3.5" /> 현재 상품 목록 다운로드
                  </button>
                  <label className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                    <Upload className="h-3.5 w-3.5" /> 엑셀 업로드 (가져오기)
                    <input ref={excelInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
                  </label>
                </div>
                <p className="text-[11px] text-blue-400 mt-2">※ 상품ID가 기존 상품과 일치하면 수정, 없으면 신규 등록됩니다. 이미지는 URL로 입력하세요.</p>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                    placeholder="상품명/카테고리 검색..."
                    className="border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary bg-white w-64" />
                </div>
                <span className="text-sm text-gray-400 ml-auto">{filteredProducts.length}개 상품</span>
                {visibleProducts.length > 0 && (
                  <button onClick={deleteAllProducts}
                    className="flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-500 bg-white px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> 전체 삭제
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-xs text-gray-500 font-medium">
                      <th className="text-left px-4 py-3 w-16">이미지</th>
                      <th className="text-left px-4 py-3">상품명</th>
                      <th className="text-left px-4 py-3">카테고리</th>
                      <th className="text-right px-4 py-3">정가</th>
                      <th className="text-right px-4 py-3">판매가</th>
                      <th className="text-center px-4 py-3">할인율</th>
                      <th className="text-center px-4 py-3">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => {
                      const img = getProductImage(p.id);
                      const hasOverride = !!lsGet<Record<string, object>>(KEYS.products, {})[p.id];
                      return (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2.5">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                              {img ? (
                                <img src={img} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">{p.emoji}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-gray-800 truncate max-w-[180px]">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.unit}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.category}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="text-xs text-gray-400 line-through">{p.originalPrice.toLocaleString('ko-KR')}원</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="font-bold text-gray-800">{p.price.toLocaleString('ko-KR')}원</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="text-xs font-bold text-primary bg-red-50 px-2 py-0.5 rounded-full">
                              {Math.round((1 - p.price / p.originalPrice) * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => startEdit(p)}
                                className="text-xs bg-primary text-white font-semibold px-2.5 py-1 rounded-lg hover:bg-primary/90 transition-colors">
                                수정
                              </button>
                              {hasOverride && (
                                <button onClick={() => resetProduct(p.id)} title="초기화"
                                  className="text-xs text-orange-500 border border-orange-200 px-2 py-1 rounded-lg hover:bg-orange-50 transition-colors">
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                              )}
                              <button onClick={() => deleteProduct(p.id)} title="삭제"
                                className="text-xs text-red-400 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* 숨겨진 상품 섹션 */}
              {hiddenProducts.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowHidden(h => !h)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    숨겨진 상품 {hiddenProducts.length}개
                    <span className="text-xs text-gray-400">{showHidden ? '▲ 닫기' : '▼ 목록 보기'}</span>
                  </button>
                  {showHidden && (
                    <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-red-100 border-b border-red-200">
                          <tr className="text-xs text-red-500 font-medium">
                            <th className="text-left px-4 py-2.5">상품명</th>
                            <th className="text-left px-4 py-2.5">카테고리</th>
                            <th className="text-center px-4 py-2.5">복원</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hiddenProducts.map(p => (
                            <tr key={p.id} className="border-b border-red-100 last:border-0">
                              <td className="px-4 py-2.5">
                                <p className="text-gray-500 line-through truncate max-w-[200px]">{p.name}</p>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="text-xs text-gray-400 bg-red-100 px-2 py-0.5 rounded-full">{p.category}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => restoreProduct(p.id)}
                                  className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50 transition-colors font-semibold">
                                  복원
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3 text-center">※ 변경된 내용은 쇼핑몰에 즉시 반영됩니다</p>
            </div>
          )}

          {/* ── 오늘만 특가 ── */}
          {tab === 'deals' && (
            <div className="p-8 max-w-3xl">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                {/* 헤더 */}
                <div className="mb-1">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                    오늘 하루특가 관리
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">홈에 표시되는 시간 한정 특가 상품을 관리합니다.</p>
                </div>

                {/* 시간 설정 */}
                <div className="flex items-center gap-3 mt-4 mb-5 p-3 bg-gray-50 rounded-xl flex-wrap">
                  <span className="text-sm text-gray-600 font-medium flex-shrink-0">판매 시간</span>
                  <select
                    value={flashSale.startHour}
                    onChange={e => setFlashSale(f => ({ ...f, startHour: Number(e.target.value) }))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{h}시</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-400">~</span>
                  <select
                    value={flashSale.endHour}
                    onChange={e => setFlashSale(f => ({ ...f, endHour: Number(e.target.value) }))}
                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{h}시</option>
                    ))}
                  </select>
                  <button
                    onClick={saveFlashTime}
                    className="ml-auto bg-primary text-white font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-primary/90 transition-colors flex-shrink-0"
                  >
                    저장
                  </button>
                </div>

                {/* 상품 목록 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    하루특가 상품 <span className="text-primary">({flashSale.products.length}개)</span>
                  </p>
                  <button
                    onClick={() => openFlashForm(-1)}
                    className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Plus className="h-3 w-3" /> 상품 추가
                  </button>
                </div>

                {/* 상품 편집 폼 */}
                {flashForm.show && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-600 mb-3">
                      {flashForm.editIdx === -1 ? '새 하루특가 상품 추가' : '상품 편집'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500 font-medium block mb-1">상품명 <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          value={flashForm.name}
                          onChange={e => setFlashForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="국내산 삼겹살 500g"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">이모지</label>
                        <input
                          type="text"
                          value={flashForm.emoji}
                          onChange={e => setFlashForm(f => ({ ...f, emoji: e.target.value }))}
                          placeholder="🥩"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">짧은 설명</label>
                        <input
                          type="text"
                          value={flashForm.desc}
                          onChange={e => setFlashForm(f => ({ ...f, desc: e.target.value }))}
                          placeholder="오늘만 특별할인!"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">특가 (원) <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          value={flashForm.price || ''}
                          onChange={e => setFlashForm(f => ({ ...f, price: Number(e.target.value) }))}
                          placeholder="9900"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">정가 (원, 할인율 표시용)</label>
                        <input
                          type="number"
                          value={flashForm.originalPrice || ''}
                          onChange={e => setFlashForm(f => ({ ...f, originalPrice: Number(e.target.value) }))}
                          placeholder="13900"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">1인 구매 한도 (개)</label>
                        <input
                          type="number"
                          value={flashForm.maxPerCustomer}
                          onChange={e => setFlashForm(f => ({ ...f, maxPerCustomer: e.target.value }))}
                          placeholder="비워두면 무제한"
                          min={1}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">비워두면 수량 제한 없음</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium block mb-1">이미지 URL (선택)</label>
                        <input
                          type="text"
                          value={flashForm.imageUrl}
                          onChange={e => setFlashForm(f => ({ ...f, imageUrl: e.target.value }))}
                          placeholder="https://..."
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    {flashForm.error && <p className="text-red-400 text-xs mt-2">{flashForm.error}</p>}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={saveFlashProductForm}
                        className="flex-1 bg-primary text-white font-bold py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setFlashForm(f => ({ ...f, show: false }))}
                        className="flex-1 border border-gray-200 text-gray-500 font-semibold py-2 rounded-lg text-sm hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 빈 상태 */}
                {flashSale.products.length === 0 && !flashForm.show && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Zap className="h-6 w-6 text-gray-200 mx-auto mb-2" />
                    등록된 하루특가 상품이 없습니다
                  </div>
                )}

                {/* 상품 목록 */}
                <div className="divide-y divide-gray-50">
                  {flashSale.products.map((fp, i) => {
                    const discount = fp.originalPrice > 0 ? Math.round((1 - fp.price / fp.originalPrice) * 100) : 0;
                    return (
                      <div key={i} className="py-3 flex items-center gap-3">
                        <span className="text-xl flex-shrink-0">{fp.emoji || '⚡'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{fp.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-bold text-primary">{fp.price.toLocaleString('ko-KR')}원</span>
                            {fp.originalPrice > 0 && (
                              <span className="ml-1.5 line-through text-gray-300">{fp.originalPrice.toLocaleString('ko-KR')}원</span>
                            )}
                            {discount > 0 && <span className="ml-1.5 text-primary font-bold">{discount}% 할인</span>}
                            {fp.maxPerCustomer ? <span className="ml-2 text-gray-400">· 1인 최대 {fp.maxPerCustomer}개</span> : null}
                          </p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => openFlashForm(i)}
                            className="text-xs text-primary font-semibold border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => deleteFlashProduct(i)}
                            className="text-xs text-red-400 font-semibold border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {flashSaved && (
                  <p className="text-green-600 text-sm font-medium mt-3">
                    ✓ 저장되었습니다. 홈 새로고침 시 반영됩니다.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── 공지사항 ── */}
          {tab === 'notices' && (
            <div className="p-8 max-w-2xl space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">공지 등록</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">제목</label>
                    <input value={newNotice.title} onChange={e => setNewNotice(n => ({ ...n, title: e.target.value }))}
                      placeholder="공지 제목"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">내용</label>
                    <textarea value={newNotice.content} onChange={e => setNewNotice(n => ({ ...n, content: e.target.value }))}
                      placeholder="공지 내용"
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
                  </div>
                </div>
                <button onClick={addNotice}
                  className="mt-3 bg-primary text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                  등록
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-800">공지 목록 ({notices.length})</h3>
                </div>
                {notices.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">등록된 공지가 없습니다</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs text-gray-500 font-medium">
                        <th className="text-left px-5 py-3">제목</th>
                        <th className="text-left px-5 py-3">날짜</th>
                        <th className="text-center px-5 py-3">삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notices.map(n => (
                        <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium text-gray-800">{n.title}</td>
                          <td className="px-5 py-3 text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => removeNotice(n.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── 사이트 설정 ── */}
          {tab === 'site' && (
            <div className="p-8 max-w-2xl space-y-6">
              {/* 로고 업로드 */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">쇼핑몰 로고</h3>
                <p className="text-xs text-gray-400 mb-4">PNG·JPG·SVG 파일을 업로드하면 사이트 전체에 적용됩니다.</p>
                <div className="flex items-center gap-4">
                  <img
                    src={logoUrl || '/logo.png'}
                    alt="로고 미리보기"
                    className="h-12 w-12 object-contain rounded-lg border border-gray-100 bg-gray-50"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                      파일 선택
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    {logoUrl && (
                      <button
                        onClick={removeLogo}
                        className="text-sm font-medium text-red-400 border border-red-200 px-4 py-2 rounded-xl hover:text-red-600 hover:border-red-400 transition-colors">
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">매장 정보</h3>
                <p className="text-xs text-gray-400 mb-5">푸터에 표시되는 매장 정보입니다.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: '상호명', key: 'name', placeholder: '필마트' },
                    { label: '전화번호', key: 'phone', placeholder: '054-000-0000' },
                    { label: '영업시간', key: 'hours', placeholder: '오전 9시 ~ 오후 10시' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-500 font-medium block mb-1">{f.label}</label>
                      <input type="text"
                        value={(storeInfo as unknown as Record<string, string>)[f.key] || ''}
                        onChange={e => setStoreInfo(s => ({ ...s, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-500 font-medium block mb-1">주소</label>
                    <input type="text"
                      value={storeInfo.address}
                      onChange={e => setStoreInfo(s => ({ ...s, address: e.target.value }))}
                      placeholder="경북 구미시 인의동 485번지"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <button onClick={saveStoreInfo}
                  className={`mt-4 font-bold px-5 py-2 rounded-xl text-sm transition-colors ${siteSaved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90'}`}>
                  {siteSaved ? '✓ 저장됨' : '저장'}
                </button>
              </div>
            </div>
          )}

          {/* ── 계정/데이터 ── */}
          {tab === 'account' && (
            <div className="p-8 max-w-2xl space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">관리자 비밀번호 변경</h3>
                <p className="text-xs text-gray-400 mb-5">초기 비밀번호: 1234</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">새 비밀번호</label>
                    <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                      placeholder="4자 이상"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">비밀번호 확인</label>
                    <input type="password" value={newPwConfirm} onChange={e => setNewPwConfirm(e.target.value)}
                      placeholder="비밀번호 재입력"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <button onClick={changeAdminPw}
                  className="mt-4 bg-primary text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-primary/90 transition-colors">
                  변경
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-1">데이터 초기화</h3>
                <p className="text-xs text-gray-400 mb-5">
                  선택한 데이터를 삭제합니다. <span className="text-red-400 font-semibold">복구할 수 없습니다.</span>
                </p>
                <div className="divide-y divide-gray-50">
                  {([
                    { label: '주문 내역 삭제', key: KEYS.orders, desc: `현재 ${orders.length}건`, onDelete: () => setOrders([]) },
                    { label: '상품 수정 초기화', key: KEYS.products, desc: '수정·삭제된 상품 모두 원래대로', onDelete: () => { lsRemove(KEYS.customProducts); setProducts(getAllProductsAdmin()); notifyProductsChanged(); } },
                    { label: '공지사항 삭제', key: KEYS.notices, desc: `현재 ${notices.length}건`, onDelete: () => setNotices([]) },
                    { label: '오늘 특가 설정 초기화', key: KEYS.flashSale, desc: `특가 상품 ${flashSale.products.length}개 포함`, onDelete: () => setFlashSale(DEFAULT_FLASH) },
                    { label: '매장 정보 초기화', key: KEYS.storeInfo, desc: '상호명·전화번호·주소 초기화', onDelete: () => setStoreInfo({ name: '필마트', phone: '', address: '' }) },
                    { label: '회원 세션 종료', key: KEYS.session, desc: '현재 로그인 세션만 삭제', onDelete: () => {} },
                    { label: '회원 계정 전체 삭제', key: KEYS.users, desc: '가입된 모든 회원 데이터 삭제', onDelete: () => {}, danger: true },
                  ] as Array<{ label: string; key: string; desc: string; onDelete: () => void; danger?: boolean }>).map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div>
                        <p className={`text-sm font-medium ${item.danger ? 'text-red-600' : 'text-gray-700'}`}>{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`${item.label} 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                            lsRemove(item.key);
                            item.onDelete();
                          }
                        }}
                        className={`text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors ${
                          item.danger
                            ? 'text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500'
                            : 'text-red-400 hover:text-red-600 border-red-200 hover:border-red-400'
                        }`}>
                        초기화
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>

    {/* ── 상품 편집 모달 ── */}
    {prodModal.open && (
      <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="font-bold text-gray-800">상품 수정</h2>
            <button onClick={() => setProdModal(m => ({ ...m, open: false }))}
              className="text-gray-400 hover:text-gray-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* 이미지 + URL */}
            <div className="flex gap-4 items-start">
              <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                {prodModal.imageUrl || getProductImage(prodModal.id) ? (
                  <img
                    src={prodModal.imageUrl || getProductImage(prodModal.id)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {products.find(p => p.id === prodModal.id)?.emoji}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">이미지 URL</label>
                <div className="flex gap-2">
                  <input
                    value={prodModal.imageUrl}
                    onChange={e => setProdModal(m => ({ ...m, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                  {prodModal.imageUrl && (
                    <button onClick={() => setProdModal(m => ({ ...m, imageUrl: '' }))}
                      className="text-gray-400 hover:text-red-500 px-2">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <label className="flex items-center gap-1 text-[11px] text-primary font-semibold cursor-pointer hover:underline">
                    <Upload className="h-3 w-3" /> 파일에서 업로드 (500KB 이하)
                    <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                  </label>
                  <span className="text-[11px] text-gray-400">· 또는 URL 직접 입력</span>
                </div>
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> 비우면 기본 이미지로 복원됩니다
                </p>
              </div>
            </div>

            {/* 상품명 + 카테고리 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">상품명</label>
                <input value={prodModal.name} onChange={e => setProdModal(m => ({ ...m, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">카테고리</label>
                <select value={prodModal.category} onChange={e => setProdModal(m => ({ ...m, category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* 가격 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">판매가 (원)</label>
                <input type="number" value={prodModal.price} onChange={e => setProdModal(m => ({ ...m, price: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-right" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">정가 (원)</label>
                <input type="number" value={prodModal.original} onChange={e => setProdModal(m => ({ ...m, original: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-right" />
              </div>
            </div>

            {/* 단위/원산지/보관 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">규격/단위</label>
                <input value={prodModal.unit} onChange={e => setProdModal(m => ({ ...m, unit: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">원산지</label>
                <input value={prodModal.origin} onChange={e => setProdModal(m => ({ ...m, origin: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">보관방법</label>
                <input value={prodModal.storage} onChange={e => setProdModal(m => ({ ...m, storage: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            {/* 소비기한 / 소비자상담번호 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">소비기한</label>
                <input value={prodModal.expiryDate} onChange={e => setProdModal(m => ({ ...m, expiryDate: e.target.value }))}
                  placeholder="예: 제조일로부터 7일"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 block">소비자상담 관련번호</label>
                <input value={prodModal.customerServiceNo} onChange={e => setProdModal(m => ({ ...m, customerServiceNo: e.target.value }))}
                  placeholder="예: 1588-0000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>

            {/* 상품고시 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 block">상품고시 (제품 유형/정보 고시)</label>
              <input value={prodModal.productInfo} onChange={e => setProdModal(m => ({ ...m, productInfo: e.target.value }))}
                placeholder="예: 농산물 / 가공식품 / 축산물 등"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>

            {/* 상품 설명 */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 block">상품 설명</label>
              <textarea value={prodModal.desc} onChange={e => setProdModal(m => ({ ...m, desc: e.target.value }))}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none" />
            </div>

            {/* 상세페이지 하단이미지 */}
            <div className="space-y-1.5 border-t border-gray-100 pt-5">
              <label className="text-xs font-semibold text-gray-500 block">상세페이지 하단이미지</label>
              <p className="text-[11px] text-gray-400">상품정보 탭에 표시되는 상세 설명 이미지입니다. (긴 배너 이미지 권장)</p>
              <div className="flex gap-2">
                <input
                  value={prodModal.detailImageUrl}
                  onChange={e => setProdModal(m => ({ ...m, detailImageUrl: e.target.value }))}
                  placeholder="https://example.com/detail.jpg"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                {prodModal.detailImageUrl && (
                  <button onClick={() => setProdModal(m => ({ ...m, detailImageUrl: '' }))}
                    className="text-gray-400 hover:text-red-500 px-2">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[11px] text-primary font-semibold cursor-pointer hover:underline">
                  <Upload className="h-3 w-3" /> 파일에서 업로드 (500KB 이하)
                  <input ref={detailImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleDetailImageFileUpload} />
                </label>
                <span className="text-[11px] text-gray-400">· 또는 URL 직접 입력</span>
              </div>
              {prodModal.detailImageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 max-h-48">
                  <img
                    src={prodModal.detailImageUrl}
                    alt="상세이미지 미리보기"
                    className="w-full object-contain"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <button onClick={() => resetProduct(prodModal.id)}
              className="flex items-center gap-1.5 text-orange-500 text-sm font-medium hover:text-orange-700 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> 기본값으로 초기화
            </button>
            <div className="flex gap-2">
              <button onClick={() => setProdModal(m => ({ ...m, open: false }))}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={saveProductEdit}
                className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors">
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
