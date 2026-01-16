/**
 * API client for the Notes backend.
 *
 * Base URL resolution order:
 *  - REACT_APP_API_BASE
 *  - REACT_APP_BACKEND_URL
 *  - fallback to same-origin (empty string)
 *
 * Endpoints are expected under: `${baseUrl}/notes`
 */

/** Normalize fetch errors into a consistent shape */
function normalizeError(error) {
  if (error?.name === 'AbortError') {
    return { message: 'Request was cancelled.', isNetworkError: false };
  }
  if (error?.isNetworkError) return error;
  return { message: error?.message || 'Unexpected error.', isNetworkError: false };
}

/** Resolve backend base URL from environment. */
function getApiBaseUrl() {
  const envBase =
    (process.env.REACT_APP_API_BASE || '').trim() ||
    (process.env.REACT_APP_BACKEND_URL || '').trim();

  // If unset, use same-origin to support reverse proxy setups.
  return envBase;
}

const API_BASE_URL = getApiBaseUrl();

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  let res;

  try {
    res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : null),
        ...(options.headers || {}),
      },
    });
  } catch (e) {
    const err = normalizeError(e);
    return Promise.reject({
      ...err,
      message:
        'Backend API is not reachable. Check that the backend service is running and the API base URL is correct.',
      isNetworkError: true,
    });
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data = null;
  if (res.status !== 204) {
    try {
      data = isJson ? await res.json() : await res.text();
    } catch (e) {
      data = null;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${res.status}.`;

    return Promise.reject({ message: msg, status: res.status, isNetworkError: false });
  }

  return data;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch list of notes. Returns array of {id, title, content}. */
  return request('/notes', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function createNote(payload) {
  /** Create a note. Payload: {title, content}. Returns created note. */
  return request('/notes', { method: 'POST', body: JSON.stringify(payload) });
}

// PUBLIC_INTERFACE
export async function updateNote(id, payload) {
  /** Update a note. Payload: {title, content}. Returns updated note. */
  return request(`/notes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note by id. */
  return request(`/notes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// PUBLIC_INTERFACE
export async function checkBackendReachable() {
  /**
   * Best-effort reachability check: attempts GET /notes.
   * Returns true if reachable, false otherwise.
   */
  try {
    await listNotes();
    return true;
  } catch (e) {
    return false;
  }
}

// PUBLIC_INTERFACE
export function getResolvedApiBaseUrl() {
  /** Returns the resolved API base URL used by the client (may be empty string). */
  return API_BASE_URL;
}
