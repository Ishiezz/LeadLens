const BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

async function apiFetch(path, opts = {}) {
  const res  = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = Object.assign(new Error(data.error || 'API error'), { data, status: res.status });
    throw err;
  }
  return data;
}

export const api = {
  // Chat
  startSession : (lead_type)          => apiFetch('/chat/start',   { method: 'POST', body: JSON.stringify({ lead_type }) }),
  sendMessage  : (session_id, value)  => apiFetch('/chat/message', { method: 'POST', body: JSON.stringify({ session_id, value }) }),
  getSession   : (id)                 => apiFetch(`/chat/session/${id}`),

  // Leads
  getLeads     : (params = {})        => apiFetch(`/leads?${new URLSearchParams(params)}`),
  getLead      : (type, id)           => apiFetch(`/leads/${type}/${id}`),
  updateNotes  : (type, id, notes)    => apiFetch(`/leads/${type}/${id}/notes`, {
    method: 'PATCH',
    body: JSON.stringify({ internal_notes: notes }),
  }),

  // Dashboard
  getDashboard : ()                   => apiFetch('/dashboard/stats'),
};
