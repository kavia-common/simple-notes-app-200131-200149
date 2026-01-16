import React, { useEffect, useMemo, useRef, useState } from 'react';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import {
  checkBackendReachable,
  createNote,
  deleteNote,
  getResolvedApiBaseUrl,
  listNotes,
  updateNote,
} from './api/client';
import './styles.css';
import './App.css';

function sortNotesStable(notes) {
  // Keep stable order: newest first if IDs are numeric-like, otherwise preserve as received.
  const allNumeric = notes.every((n) => String(n.id).match(/^\d+$/));
  if (!allNumeric) return notes;
  return [...notes].sort((a, b) => Number(b.id) - Number(a.id));
}

function findById(notes, id) {
  return notes.find((n) => n.id === id) || null;
}

function makeToast(title, message, kind) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    message,
    kind, // 'success' | 'error'
  };
}

// PUBLIC_INTERFACE
function App() {
  /** Single-page Notes app (CRUD) wired to backend /notes endpoints. */
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [mode, setMode] = useState('empty'); // 'empty' | 'create' | 'edit'
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [errorBanner, setErrorBanner] = useState(null);
  const [backendReachable, setBackendReachable] = useState(true);

  const [toasts, setToasts] = useState([]);

  const lastLoadedRef = useRef(false);

  const selectedNote = useMemo(() => findById(notes, selectedId), [notes, selectedId]);

  const apiBase = useMemo(() => getResolvedApiBaseUrl(), []);

  const pushToast = (toast) => {
    setToasts((prev) => [toast, ...prev].slice(0, 3));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3200);
  };

  const loadNotes = async () => {
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const data = await listNotes();
      const normalized = Array.isArray(data) ? data : [];
      const sorted = sortNotesStable(normalized);
      setNotes(sorted);

      // If nothing selected yet, select first.
      if (!selectedId && sorted.length > 0) {
        setSelectedId(sorted[0].id);
        setMode('edit');
      } else if (sorted.length === 0) {
        setSelectedId(null);
        setMode('empty');
      }

      setBackendReachable(true);
      lastLoadedRef.current = true;
    } catch (e) {
      setBackendReachable(!e?.isNetworkError ? true : false);
      setErrorBanner(e?.message || 'Failed to load notes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load + reachability check.
    loadNotes();
    checkBackendReachable().then((ok) => setBackendReachable(ok));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    if (selectedNote) setMode('edit');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const handleCreateNew = () => {
    setSelectedId(null);
    setMode('create');
    setErrorBanner(null);
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    setMode('edit');
    setErrorBanner(null);
  };

  const handleCancel = () => {
    if (selectedId) {
      setMode('edit');
      return;
    }
    if (notes.length > 0) {
      setSelectedId(notes[0].id);
      setMode('edit');
    } else {
      setMode('empty');
    }
  };

  const handleSave = async ({ title, content }) => {
    setIsSaving(true);
    setErrorBanner(null);

    const trimmed = { title: title.trim(), content: content.trim() };
    const isEdit = mode === 'edit' && selectedId != null;

    // Optimistic update
    let rollback = null;

    try {
      if (isEdit) {
        const prev = selectedNote;
        if (prev) {
          rollback = () => {
            setNotes((cur) => cur.map((n) => (n.id === prev.id ? prev : n)));
          };
          setNotes((cur) =>
            cur.map((n) => (n.id === prev.id ? { ...n, ...trimmed } : n))
          );
        }

        const updated = await updateNote(selectedId, trimmed);
        setNotes((cur) => cur.map((n) => (n.id === selectedId ? updated : n)));
        pushToast(makeToast('Saved', 'Note updated successfully.', 'success'));
      } else {
        // create
        const created = await createNote(trimmed);
        setNotes((cur) => [created, ...cur]);
        setSelectedId(created.id);
        setMode('edit');
        pushToast(makeToast('Created', 'Note created successfully.', 'success'));
      }

      setBackendReachable(true);
    } catch (e) {
      if (rollback) rollback();
      setBackendReachable(!e?.isNetworkError ? true : false);
      setErrorBanner(e?.message || 'Failed to save note.');
      pushToast(makeToast('Error', e?.message || 'Failed to save.', 'error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setErrorBanner(null);

    const prevNotes = notes;
    const wasSelected = selectedId === id;

    // Optimistic remove
    const next = prevNotes.filter((n) => n.id !== id);
    setNotes(next);

    if (wasSelected) {
      setSelectedId(next[0]?.id ?? null);
      setMode(next.length > 0 ? 'edit' : 'empty');
    }

    try {
      await deleteNote(id);
      pushToast(makeToast('Deleted', 'Note deleted.', 'success'));
      setBackendReachable(true);
    } catch (e) {
      // Rollback
      setNotes(prevNotes);
      if (wasSelected) {
        setSelectedId(id);
        setMode('edit');
      }
      setBackendReachable(!e?.isNetworkError ? true : false);
      setErrorBanner(e?.message || 'Failed to delete note.');
      pushToast(makeToast('Error', e?.message || 'Failed to delete.', 'error'));
    }
  };

  const editorMode = mode === 'create' ? 'create' : selectedNote ? 'edit' : 'empty';

  return (
    <div className="AppShell">
      <header className="TopBar">
        <div className="TopBar-inner container">
          <div className="Brand">
            <div className="Brand-mark" aria-hidden="true" />
            <div>
              <div className="Brand-title">Notes</div>
              <div className="Brand-subtitle">Simple CRUD notes app</div>
            </div>
          </div>

          <div className="TopBar-actions">
            <button className="btn btn-secondary" type="button" onClick={loadNotes}>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="container Main">
        {!backendReachable && (
          <div className="banner banner-warning" role="status" aria-live="polite">
            <strong>Backend not reachable.</strong> This UI expects a backend API at{' '}
            <code>{(apiBase || '(same origin)') + '/notes'}</code>. Start the backend service
            or set <code>REACT_APP_API_BASE</code> (or <code>REACT_APP_BACKEND_URL</code>).
          </div>
        )}

        {errorBanner && (
          <div className="banner banner-error" role="alert">
            {errorBanner}
          </div>
        )}

        <div className="Layout card">
          <div className="Pane Pane-left">
            <NotesList
              notes={notes}
              selectedId={selectedId}
              onSelect={handleSelect}
              onCreateNew={handleCreateNew}
              onDelete={handleDelete}
              isLoading={isLoading && !lastLoadedRef.current}
            />
          </div>

          <div className="Pane Pane-right">
            <NoteEditor
              mode={editorMode}
              note={editorMode === 'edit' ? selectedNote : null}
              onSave={handleSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          </div>
        </div>
      </main>

      <div className="toastHost" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast ${t.kind === 'success' ? 'toast-success' : 'toast-error'}`}
            role="status"
          >
            <p className="toast-title">{t.title}</p>
            <p className="toast-msg">{t.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
