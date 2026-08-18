const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "gfacbt_session_token";

export const tokenStore = {
  get: () => {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore (private mode, etc.) */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      "Could not reach the server. Please check your connection and try again.",
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response
  }

  if (!res.ok) {
    if (res.status === 401) tokenStore.clear();
    throw new Error(
      (data && data.message) || `Request failed (${res.status}).`,
    );
  }

  if (data && data.token) tokenStore.set(data.token);

  return data;
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  del: (path) => request(path, { method: "DELETE" }),
};

// ── Student auth endpoints ─────────────────────────────────────────────
export const studentAuthApi = {
  register: (payload) => api.post("/auth/student/register", payload),
  login: (payload) => api.post("/auth/student/login", payload),
  setupPassword: (payload) => api.post("/auth/student/setup-password", payload),
  forgotPassword: (email) =>
    api.post("/auth/student/forgot-password", { email }),
  verifyResetCode: (email, code) =>
    api.post("/auth/student/verify-reset-code", { email, code }),
  resetPassword: (payload) => api.post("/auth/student/reset-password", payload),
  logout: () =>
    api.post("/auth/student/logout").finally(() => tokenStore.clear()),
  me: () => api.get("/auth/student/me"),
  updateMe: (payload) => api.put("/auth/student/me", payload),
};

// ── Admin auth endpoints ────────────────────────────────────────────────
export const adminAuthApi = {
  login: (payload) => api.post("/auth/admin/login", payload),
  setupPassword: (payload) => api.post("/auth/admin/setup-password", payload),
  forgotPassword: (email) => api.post("/auth/admin/forgot-password", { email }),
  verifyResetCode: (email, code) =>
    api.post("/auth/admin/verify-reset-code", { email, code }),
  resetPassword: (payload) => api.post("/auth/admin/reset-password", payload),
  logout: () =>
    api.post("/auth/admin/logout").finally(() => tokenStore.clear()),
  me: () => api.get("/auth/admin/me"),
  updateMe: (payload) => api.put("/auth/admin/me", payload),
};

// ── Admin management endpoints (superadmin only) ────────────────────────
export const adminApi = {
  getAll: () => api.get("/admins"),
  get: (id) => api.get(`/admins/${id}`),
  create: (payload) => api.post("/admins", payload),
  update: (id, payload) => api.put(`/admins/${id}`, payload),
  remove: (id) => api.del(`/admins/${id}`),
  resetPassword: (id) => api.post(`/admins/${id}/reset-password`),
};

// ── Student management endpoints (admin/teacher side) ───────────────────
export const studentApi = {
  getAll: (params = {}) => api.get(`/students${toQuery(params)}`),
  get: (id) => api.get(`/students/${id}`),
  create: (payload) => api.post("/students", payload),
  update: (id, payload) => api.put(`/students/${id}`, payload),
  remove: (id) => api.del(`/students/${id}`),
  resetPassword: (id) => api.post(`/students/${id}/reset-password`),
};

// ── Exam endpoints ────────────────────────────────────────────────────
export const examApi = {
  getAll: (params = {}) => api.get(`/exams${toQuery(params)}`),
  get: (id) => api.get(`/exams/${id}`),
  create: (payload) => api.post("/exams", payload),
  update: (id, payload) => api.put(`/exams/${id}`, payload),
  remove: (id) => api.del(`/exams/${id}`),
  generateCodes: (id) => api.post(`/exams/${id}/generate-codes`, {}),
  getCodes: (id) => api.get(`/exams/${id}/codes`),
  verifyIdentity: (id, payload) =>
    api.post(`/exams/${id}/verify-identity`, payload), // { identifier, code }
};

// ── Question endpoints ───────────────────────────────────────────────
export const questionApi = {
  getByExam: (examId) => api.get(`/questions${toQuery({ examId })}`),
  create: (payload) => api.post("/questions", payload),
  update: (id, payload) => api.put(`/questions/${id}`, payload),
  remove: (id) => api.del(`/questions/${id}`),
};

// ── Result endpoints ──────────────────────────────────────────────────
export const resultApi = {
  submit: (payload) => api.post("/results/submit", payload),
  getAll: (params = {}) => api.get(`/results${toQuery(params)}`),
  get: (id) => api.get(`/results/${id}`),
  grade: (id, grades) => api.put(`/results/${id}/grade`, { grades }),
  updateCA: (id, caScores) => api.put(`/results/${id}/ca`, { caScores }),
};

// ── Subject endpoints (admin-managed list of subjects the school offers) ──
export const subjectApi = {
  getAll: () => api.get("/subjects"),
  create: (name) => api.post("/subjects", { name }),
  remove: (id) => api.del(`/subjects/${id}`),
};

// ── CA settings endpoints (configurable CA columns, superadmin-managed) ──
export const caSettingApi = {
  get: () => api.get("/ca-settings"),
  update: (items) => api.put("/ca-settings", { items }),
};

function toQuery(params) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  const qs = new URLSearchParams(entries).toString();
  return `?${qs}`;
}
