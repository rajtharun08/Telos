import {
  INITIAL_ITEMS,
  INITIAL_TRANSACTIONS,
  INITIAL_WALLET,
  INITIAL_LEDGER,
  INITIAL_VERIFICATIONS,
  INITIAL_NOTIFICATIONS,
  DEMO_USERS
} from './mockData';

// Local storage state for mock persistence during session
let mockItems = [...INITIAL_ITEMS];
let mockTransactions = [...INITIAL_TRANSACTIONS];
let mockWallet = { ...INITIAL_WALLET };
let mockLedger = [...INITIAL_LEDGER];
let mockVerifications = [...INITIAL_VERIFICATIONS];
let mockNotifications = [...INITIAL_NOTIFICATIONS];

export const getAuthToken = () => localStorage.getItem('telos_jwt_token');
export const setAuthToken = (token) => localStorage.setItem('telos_jwt_token', token);
export const removeAuthToken = () => localStorage.removeItem('telos_jwt_token');

export async function apiFetch(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(endpoint, { ...options, headers });
    if (!res.ok) {
      // Backend status non-2xx (or Vite proxy connection error) -> fallback to Mock Engine
      return handleMockFallback(endpoint, options);
    }
    return await res.json();
  } catch (err) {
    // Backend unreachable -> route through Mock Engine
    return handleMockFallback(endpoint, options);
  }
}

function handleMockFallback(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  // Auth endpoints
  if (endpoint.includes('/api/auth/login') || endpoint.includes('/api/auth/signup')) {
    const body = JSON.parse(options.body || '{}');
    const user = DEMO_USERS.find(u => u.email === body.email) || DEMO_USERS[0];
    return { token: `dev-jwt-token-${user.id}`, user };
  }
  if (endpoint.includes('/api/me')) {
    const currentUserId = localStorage.getItem('telos_user_id') || 'u-001';
    const user = DEMO_USERS.find(u => u.id === currentUserId) || DEMO_USERS[0];
    return user;
  }

  // Items endpoints
  if (endpoint.includes('/api/items')) {
    if (method === 'GET') {
      const url = new URL(endpoint, 'http://localhost');
      const category = url.searchParams.get('category');
      const mode = url.searchParams.get('mode');
      const radiusKm = parseFloat(url.searchParams.get('radius') || '25');

      let filtered = mockItems.filter(item => (item.distanceKm || 0.5) <= radiusKm);
      if (category && category !== 'ALL') filtered = filtered.filter(i => i.category === category);
      if (mode && mode !== 'ALL') filtered = filtered.filter(i => i.mode === mode);

      // Return filtered items or all mock items if none match
      return filtered.length > 0 ? filtered : mockItems;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newItem = {
        id: `item-${Date.now()}`,
        ...body,
        ownerId: localStorage.getItem('telos_user_id') || 'u-001',
        ownerName: 'Aliya Rahman',
        ownerRating: 4.9,
        state: 'AVAILABLE',
        distanceKm: 0.5,
        lat: 12.9345 + (Math.random() * 0.01 - 0.005),
        lng: 77.6265 + (Math.random() * 0.01 - 0.005),
        coordsUnlocked: true,
        rating: 5.0,
        reviews: 1,
        image: body.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
      };
      mockItems.unshift(newItem);
      return newItem;
    }
  }

  // Transactions endpoints
  if (endpoint.includes('/api/transactions')) {
    if (method === 'GET') {
      return mockTransactions;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const targetItem = mockItems.find(i => i.id === body.itemId) || mockItems[0];
      const newTx = {
        id: `tx-${Date.now().toString().slice(-4)}`,
        itemId: targetItem.id,
        itemTitle: targetItem.title,
        borrowerId: 'u-001',
        borrowerName: 'Aliya Rahman',
        lenderId: targetItem.ownerId,
        lenderName: targetItem.ownerName,
        mode: targetItem.mode,
        state: 'REQUESTED',
        fee: targetItem.price * (body.days || 1),
        deposit: targetItem.deposit || 50,
        days: body.days || 1,
        createdAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + (body.days || 1) * 86400000).toISOString(),
        coordsUnlocked: false,
        pickupToken: Math.floor(100000 + Math.random() * 900000).toString()
      };
      mockTransactions.unshift(newTx);
      // Deduct escrow balance
      const totalEscrow = newTx.fee + newTx.deposit;
      mockWallet.available -= totalEscrow;
      mockWallet.locked += totalEscrow;
      mockLedger.unshift({
        id: `led-${Date.now()}`,
        userId: 'u-001',
        type: 'ESCROW_LOCK',
        label: `Escrow lock for ${newTx.itemTitle}`,
        amount: -totalEscrow,
        at: new Date().toISOString(),
        status: 'LOCKED',
        txId: newTx.id
      });
      return newTx;
    }
  }

  // Wallet
  if (endpoint.includes('/api/wallet/ledger')) return mockLedger;
  if (endpoint.includes('/api/wallet/topups')) {
    const body = JSON.parse(options.body || '{}');
    mockWallet.available += (body.amount || 50);
    mockLedger.unshift({
      id: `led-${Date.now()}`,
      userId: 'u-001',
      type: 'TOPUP',
      label: `Wallet Top-up via Card`,
      amount: (body.amount || 50),
      at: new Date().toISOString(),
      status: 'CLEARED',
      txId: null
    });
    return mockWallet;
  }
  if (endpoint.includes('/api/wallet')) return mockWallet;

  // Handoff & Scanning
  if (endpoint.includes('/handoff/scan')) {
    const body = JSON.parse(options.body || '{}');
    const tx = mockTransactions.find(t => t.id === body.txId || t.pickupToken === body.token);
    if (tx) {
      tx.state = 'ACTIVE';
      tx.coordsUnlocked = true;
      return { status: 'SUCCESS', state: 'ACTIVE', tx };
    }
    return { status: 'SUCCESS', state: 'ACTIVE' };
  }

  // Admin Queue
  if (endpoint.includes('/api/admin/verifications')) {
    if (method === 'GET') return mockVerifications;
    if (method === 'PATCH') {
      const urlParts = endpoint.split('/');
      const id = urlParts[urlParts.length - 1];
      const body = JSON.parse(options.body || '{}');
      const v = mockVerifications.find(item => item.id === id);
      if (v) v.status = body.status;
      return v || { status: body.status || 'APPROVED' };
    }
  }

  // Notifications
  if (endpoint.includes('/api/notifications/read')) {
    mockNotifications.forEach(n => n.unread = false);
    return { success: true };
  }
  if (endpoint.includes('/api/notifications')) return mockNotifications;

  return { success: true };
}
