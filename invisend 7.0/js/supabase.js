// ============================================================
// InviSend — Supabase Configuration & Shared Utilities
// ============================================================

const SUPABASE_URL = 'https://ywxxxciyvqfsvpanqswp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3eHh4Y2l5dnFmc3ZwYW5xc3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MDk0NzAsImV4cCI6MjA5NTE4NTQ3MH0.BqBzmDvx3dN3iEgpUW1VyFThzeC1LNjG5LUUOtHQ00s';
const STORAGE_BUCKET = 'wedding-media';

// ── Supabase REST helpers ────────────────────────────────────

async function sbFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error [${res.status}]: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Invitations ──────────────────────────────────────────────

async function getAllInvitations() {
  return sbFetch('invitations?order=created_at.desc&select=*');
}

async function getInvitationBySlug(slug) {
  const data = await sbFetch(`invitations?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
  return data && data[0] ? data[0] : null;
}

async function createInvitation(payload) {
  return sbFetch('invitations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function updateInvitation(id, payload) {
  return sbFetch(`invitations?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

async function deleteInvitation(id) {
  return sbFetch(`invitations?id=eq.${id}`, {
    method: 'DELETE',
    prefer: 'return=minimal',
  });
}

// ── RSVP ────────────────────────────────────────────────────

async function submitRSVP(payload) {
  return sbFetch('rsvp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getRSVPsBySlug(slug) {
  return sbFetch(`rsvp?invitation_slug=eq.${encodeURIComponent(slug)}&order=created_at.desc&select=*`);
}

// ── Storage Upload ───────────────────────────────────────────

async function uploadFile(file, folder = 'general') {
  const ext = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: file,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage upload failed: ${err}`);
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
}

// ── Slug generator ───────────────────────────────────────────

function generateSlug(coupleName) {
  return coupleName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-') + '-' + Math.random().toString(36).slice(2, 6);
}

// ── Date helpers ─────────────────────────────────────────────

function expiryFromWedding(weddingDate) {
  const d = new Date(weddingDate);
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function isExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
