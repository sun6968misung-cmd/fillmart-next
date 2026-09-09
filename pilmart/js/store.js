const TOSS_CLIENT_KEY = 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';

document.addEventListener('alpine:init', () => {

  // ── 장바구니 스토어 ────────────────────────────────────────────────
  Alpine.store('cart', {
    open: false,
    items: [],

    init() {
      try {
        const saved = localStorage.getItem('pilmart_cart');
        if (saved) this.items = JSON.parse(saved);
      } catch { this.items = []; }
    },

    persist() {
      localStorage.setItem('pilmart_cart', JSON.stringify(this.items));
    },

    get count() { return this.items.reduce((s, i) => s + i.qty, 0); },
    get total()  { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },
    get totalFormatted() { return this.total.toLocaleString('ko-KR'); },

    addToCart(product) {
      const existing = this.items.find(i => i.id === product.id);
      if (existing) { existing.qty++; }
      else { this.items.push({ ...product, qty: 1 }); }
      this.persist();
      this.open = true;
    },

    updateQty(id, delta) {
      const item = this.items.find(i => i.id === id);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) this.items = this.items.filter(i => i.id !== id);
      this.persist();
    },

    removeItem(id) {
      this.items = this.items.filter(i => i.id !== id);
      this.persist();
    },

    clearCart() {
      this.items = [];
      localStorage.removeItem('pilmart_cart');
    },

    goCheckout() {
      if (this.count === 0) { alert('장바구니가 비어 있습니다.'); return; }
      if (this.total < 100000) {
        alert('최소 주문금액은 100,000원입니다.\n' + (100000 - this.total).toLocaleString('ko-KR') + '원 더 담아주세요.');
        return;
      }
      const session = JSON.parse(localStorage.getItem('pilmart_session') || 'null');
      if (!session) {
        window.location.href = 'auth.html?redirect=checkout.html';
        return;
      }
      window.location.href = 'checkout.html';
    }
  });

  // ── 찜 스토어 ─────────────────────────────────────────────────────
  Alpine.store('wishlist', {
    ids: [],

    init() {
      try {
        const saved = localStorage.getItem('pilmart_wishlist');
        if (saved) this.ids = JSON.parse(saved);
      } catch { this.ids = []; }
    },

    persist() {
      localStorage.setItem('pilmart_wishlist', JSON.stringify(this.ids));
    },

    has(id) { return this.ids.includes(id); },

    toggle(id) {
      if (this.has(id)) {
        this.ids = this.ids.filter(x => x !== id);
      } else {
        this.ids.push(id);
      }
      this.persist();
    },

    get count() { return this.ids.length; }
  });

  // ── 인증 스토어 ───────────────────────────────────────────────────
  Alpine.store('auth', {
    user: null,

    init() {
      try {
        const raw = localStorage.getItem('pilmart_session');
        if (raw) {
          const session = JSON.parse(raw);
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (session.loginAt && Date.now() - session.loginAt > thirtyDays) {
            localStorage.removeItem('pilmart_session');
          } else {
            this.user = session;
          }
        }
      } catch { this.user = null; }
    },

    get isLoggedIn() { return !!this.user; },

    logout() {
      localStorage.removeItem('pilmart_session');
      this.user = null;
      window.location.href = 'index.html';
    }
  });
});

function fmt(n) {
  return Number(n).toLocaleString('ko-KR') + '원';
}

function applyCustomLogo() {
  const url = localStorage.getItem('pilmart_logo');
  if (!url) return;
  document.querySelectorAll('img[alt="FILLMART"]').forEach(img => {
    img.src = url;
  });
}

document.addEventListener('DOMContentLoaded', applyCustomLogo);
window.addEventListener('pilmart:logo-changed', applyCustomLogo);

async function requestTossPayment(method, orderInfo) {
  const tossPayments = TossPayments(TOSS_CLIENT_KEY);
  const base = window.location.origin === 'null' ? 'http://localhost:8080' : window.location.origin;
  const path = window.location.pathname.replace(/\/[^/]*$/, '');
  await tossPayments.requestPayment(method, {
    ...orderInfo,
    successUrl: `${base}${path}/success.html`,
    failUrl:    `${base}${path}/fail.html`,
  });
}
