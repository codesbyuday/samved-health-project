import {
  alerts as mockAlerts,
  auth_users as mockAuthUsers,
  health_records as mockHealthRecords,
  initialOrders as mockOrders,
  medicines as mockMedicines,
  notifications as mockNotifications,
  pharmacy_medicine_stock as mockStock,
  provider as mockProviders,
} from '../data/mockData';

const SESSION_STORAGE_KEY = 'pharma-dashboard-session';

function getEnv(key, fallback = "") {
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  try {
    if (typeof import.meta !== "undefined" && import.meta?.env?.[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}
  try {
    if (typeof process !== "undefined" && process.env) {
      const nextKey = `NEXT_PUBLIC_${key.replace("VITE_", "")}`;
      if (process.env[nextKey]) return process.env[nextKey];
    }
  } catch (e) {}
  return fallback;
}

const tableConfig = {
  provider: getEnv("VITE_SUPABASE_PROVIDER_TABLE", "provider"),
  medicines: getEnv("VITE_SUPABASE_MEDICINES_TABLE", "medicines"),
  stock: getEnv("VITE_SUPABASE_STOCK_TABLE", "pharmacy_medicine_stock"),
  healthRecords: getEnv("VITE_SUPABASE_HEALTH_RECORDS_TABLE", "health_records"),
  alerts: getEnv("VITE_SUPABASE_ALERTS_TABLE", "alerts"),
  notifications: getEnv("VITE_SUPABASE_NOTIFICATIONS_TABLE", "notifications"),
  orders: getEnv("VITE_SUPABASE_ORDERS_TABLE", "orders"),
  sales: getEnv("VITE_SUPABASE_SALES_TABLE", "sales_records"),
};

const supabaseConfig = {
  url:
    (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    (typeof process !== "undefined" && process.env && process.env.VITE_SUPABASE_URL) ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_SUPABASE_URL) ||
    "https://yxknckhlzcjybjbdqnbg.supabase.co",
  anonKey:
    (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    (typeof process !== "undefined" && process.env && process.env.VITE_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a25ja2hsemNqeWJqYmRxbmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTY4MTYsImV4cCI6MjA4ODg5MjgxNn0.MA64InqN_hkdrLHPDP3WCigPkTJFlk-mhKEdNa5MPSk",
};

let mockState = {
  medicines: cloneRows(mockMedicines),
  stock: cloneRows(mockStock),
  healthRecords: cloneRows(mockHealthRecords),
  alerts: cloneRows(mockAlerts),
  notifications: cloneRows(mockNotifications),
  orders: cloneRows(mockOrders),
  providers: cloneRows(mockProviders),
};

function cloneRows(rows) {
  return JSON.parse(JSON.stringify(rows));
}

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

function saveSession(session) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function readSession() {
  const storage = getLocalStorage();

  if (!storage) {
    return null;
  }

  const value = storage.getItem(SESSION_STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    storage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function clearSession() {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(SESSION_STORAGE_KEY);
}

export function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

function buildHeaders(token, extraHeaders = {}) {
  const authToken = token || supabaseConfig.anonKey;

  return {
    apikey: supabaseConfig.anonKey,
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || 'Database request failed';
    throw new Error(message);
  }

  return data;
}

async function restRequest(path, { method = 'GET', token, body, headers } = {}) {
  const response = await fetch(`${supabaseConfig.url}${path}`, {
    method,
    headers: buildHeaders(token, headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
}

async function selectRows(table, { filters = {}, select = '*', order, token } = {}) {
  const url = new URL(`${supabaseConfig.url}/rest/v1/${table}`);
  url.searchParams.set('select', select);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, `eq.${value}`);
    }
  });

  if (order?.column) {
    url.searchParams.set('order', `${order.column}.${order.ascending === false ? 'desc' : 'asc'}`);
  }

  const response = await fetch(url.toString(), {
    headers: buildHeaders(token),
  });

  return parseResponse(response);
}

async function insertRow(table, payload, token) {
  return restRequest(`/rest/v1/${table}`, {
    method: 'POST',
    token,
    body: payload,
    headers: { Prefer: 'return=representation' },
  });
}

async function updateRows(table, filters, payload, token) {
  const url = new URL(`${supabaseConfig.url}/rest/v1/${table}`);
  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, `eq.${value}`);
  });

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: buildHeaders(token, { Prefer: 'return=representation' }),
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

async function deleteRows(table, filters, token) {
  const url = new URL(`${supabaseConfig.url}/rest/v1/${table}`);
  Object.entries(filters).forEach(([key, value]) => {
    url.searchParams.set(key, `eq.${value}`);
  });

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: buildHeaders(token, { Prefer: 'return=representation' }),
  });

  return parseResponse(response);
}

async function findProviderProfile(session) {
  const candidates = [
    ['provider_id', session?.user?.user_metadata?.provider_id],
    ['auth_user_id', session?.user?.id],
    ['user_id', session?.user?.id],
    ['email', session?.user?.email],
  ].filter(([, value]) => Boolean(value));

  for (const [key, value] of candidates) {
    try {
      const rows = await selectRows(tableConfig.provider, {
        filters: { [key]: value },
        token: session.access_token,
      });

      if (rows.length > 0) {
        return rows[0];
      }
    } catch {
      // Some schemas may not expose every linking column; continue trying.
    }
  }

  throw new Error(
    'Authenticated successfully, but no matching provider row was found. Add a provider row linked by provider_id, auth_user_id, user_id, or email.'
  );
}

function buildMockSession(foundUser, profile) {
  return {
    mode: 'mock',
    access_token: 'mock-access-token',
    user: {
      id: foundUser.id,
      email: foundUser.email,
      user_metadata: {
        provider_id: foundUser.provider_id,
      },
    },
    profile,
  };
}

export async function restoreSession() {
  const saved = readSession();

  if (!saved) {
    return null;
  }

  if (saved.mode === 'mock' || !isSupabaseConfigured()) {
    return saved;
  }

  try {
    const profile = await findProviderProfile(saved);
    return { ...saved, profile };
  } catch {
    return saved;
  }
}

export async function signIn(email, password) {
  const mockUser = mockAuthUsers.find((user) => user.email === email && user.password === password);

  if (isSupabaseConfigured()) {
    try {
      const session = await restRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email, password },
      });

      try {
        const profile = await findProviderProfile(session);
        const payload = { ...session, profile };
        saveSession(payload);
        return payload;
      } catch (profileErr) {
        if (mockUser) {
          const profile = mockState.providers.find((item) => item.provider_id === mockUser.provider_id);
          const session = buildMockSession(mockUser, profile);
          saveSession(session);
          return session;
        }
        throw profileErr;
      }
    } catch (authError) {
      if (mockUser) {
        const profile = mockState.providers.find((item) => item.provider_id === mockUser.provider_id);
        const session = buildMockSession(mockUser, profile);
        saveSession(session);
        return session;
      }
      throw authError;
    }
  }

  if (!mockUser) {
    throw new Error('Invalid credentials');
  }

  const profile = mockState.providers.find((item) => item.provider_id === mockUser.provider_id);
  const session = buildMockSession(mockUser, profile);
  saveSession(session);
  return session;
}

export async function signOut() {
  clearSession();
}

export async function updateProviderProfile(providerId, values, session) {
  if (!isSupabaseConfigured() || session?.mode === 'mock') {
    mockState.providers = mockState.providers.map((item) =>
      item.provider_id === providerId ? { ...item, ...values } : item
    );

    const updated = mockState.providers.find((item) => item.provider_id === providerId);
    const currentSession = readSession();
    if (currentSession) {
      saveSession({ ...currentSession, profile: updated });
    }

    return updated;
  }

  const rows = await updateRows(tableConfig.provider, { provider_id: providerId }, values, session.access_token);
  const updated = rows[0];
  saveSession({ ...session, profile: updated });
  return updated;
}

function deriveSalesData(orders, medicines) {
  return orders
    .filter((order) => order.status === 'Completed')
    .map((order) => ({
      sale_id: order.order_id,
      date: order.completed_at || order.order_time?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      qty: order.quantity,
      citizen: order.citizen_id,
      med:
        medicines.find((medicine) => medicine.medicine_id === order.medicine_id)?.name ||
        order.medicine_name ||
        'Unknown',
    }));
}

export async function fetchAppData(session, providerId) {
  if (!isSupabaseConfigured() || session?.mode === 'mock') {
    return {
      medicines: cloneRows(mockState.medicines),
      stock: cloneRows(mockState.stock.filter((item) => !providerId || item.provider_id === providerId)),
      healthRecords: cloneRows(mockState.healthRecords),
      alerts: cloneRows(mockState.alerts),
      notifications: cloneRows(mockState.notifications),
      orders: cloneRows(mockState.orders),
      sales: deriveSalesData(mockState.orders, mockState.medicines),
    };
  }

  try {
    const [medicines, stock, healthRecords, alerts, notifications, orders, salesResult] = await Promise.all([
      selectRows(tableConfig.medicines, { token: session.access_token, order: { column: 'name' } }),
      selectRows(tableConfig.stock, {
        token: session.access_token,
        filters: providerId ? { provider_id: providerId } : {},
        order: { column: 'last_updated', ascending: false },
      }),
      selectRows(tableConfig.healthRecords, {
        token: session.access_token,
        order: { column: 'visit_date', ascending: false },
      }),
      selectRows(tableConfig.alerts, {
        token: session.access_token,
        order: { column: 'date', ascending: false },
      }),
      selectRows(tableConfig.notifications, {
        token: session.access_token,
        order: { column: 'id', ascending: false },
      }).catch(() => []),
      selectRows(tableConfig.orders, {
        token: session.access_token,
        order: { column: 'order_time', ascending: false },
      }),
      selectRows(tableConfig.sales, {
        token: session.access_token,
        order: { column: 'date', ascending: false },
      }).catch(() => null),
    ]);

    return {
      medicines,
      stock,
      healthRecords,
      alerts,
      notifications,
      orders,
      sales: salesResult || deriveSalesData(orders, medicines),
    };
  } catch {
    return {
      medicines: cloneRows(mockState.medicines),
      stock: cloneRows(mockState.stock.filter((item) => !providerId || item.provider_id === providerId)),
      healthRecords: cloneRows(mockState.healthRecords),
      alerts: cloneRows(mockState.alerts),
      notifications: cloneRows(mockState.notifications),
      orders: cloneRows(mockState.orders),
      sales: deriveSalesData(mockState.orders, mockState.medicines),
    };
  }
}

export async function addInventoryItem(payload, session) {
  if (!isSupabaseConfigured() || session?.mode === 'mock') {
    const nextItem = {
      ...payload,
      stock_id: `stock-${Date.now()}`,
    };
    mockState.stock = [nextItem, ...mockState.stock];
    return nextItem;
  }

  const rows = await insertRow(tableConfig.stock, payload, session.access_token);
  return rows[0];
}

export async function updateInventoryItem(stockId, values, session) {
  if (!isSupabaseConfigured() || session?.mode === 'mock') {
    mockState.stock = mockState.stock.map((item) =>
      item.stock_id === stockId ? { ...item, ...values } : item
    );
    return mockState.stock.find((item) => item.stock_id === stockId);
  }

  const rows = await updateRows(tableConfig.stock, { stock_id: stockId }, values, session.access_token);
  return rows[0];
}

export async function removeInventoryItem(stockId, session) {
  if (!isSupabaseConfigured() || session?.mode === 'mock') {
    mockState.stock = mockState.stock.filter((item) => item.stock_id !== stockId);
    return;
  }

  await deleteRows(tableConfig.stock, { stock_id: stockId }, session.access_token);
}

export async function markPrescriptionVerified(recordId, session) {
  if (!isSupabaseConfigured() || session?.mode === 'mock') {
    mockState.healthRecords = mockState.healthRecords.map((item) =>
      item.record_id === recordId ? { ...item, verified: true } : item
    );
    return mockState.healthRecords.find((item) => item.record_id === recordId);
  }

  const rows = await updateRows(
    tableConfig.healthRecords,
    { record_id: recordId },
    { verified: true },
    session.access_token
  );

  return rows[0];
}

export async function updateOrderStatus(orderId, status, session) {
  const updates = {
    status,
    completed_at: status === 'Completed' ? new Date().toISOString().slice(0, 10) : undefined,
  };

  if (!isSupabaseConfigured() || session?.mode === 'mock') {
    mockState.orders = mockState.orders.map((item) =>
      item.order_id === orderId ? { ...item, ...updates } : item
    );
    return mockState.orders.find((item) => item.order_id === orderId);
  }

  const rows = await updateRows(tableConfig.orders, { order_id: orderId }, updates, session.access_token);
  return rows[0];
}
