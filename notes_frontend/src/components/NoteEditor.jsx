import React, { useEffect, useMemo, useState } from 'react';
import './NoteEditor.css';

function sanitizeDraft(note) {
  return {
    title: note?.title ?? '',
    content: note?.content ?? '',
  };
}

// PUBLIC_INTERFACE
export default function NoteEditor({
  mode, // 'create' | 'edit' | 'empty'
  note,
  onSave,
  onCancel,
  isSaving,
}) {
  /** Editor form for a note. Controlled inputs. */
  const initial = useMemo(() => sanitizeDraft(note), [note]);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);

  useEffect(() => {
    setTitle(initial.title);
    setContent(initial.content);
  }, [initial.title, initial.content]);

  const canSave = title.trim().length > 0 || content.trim().length > 0;

  if (mode === 'empty') {
    return (
      <section className="NoteEditor NoteEditor-empty" aria-label="Note editor">
        <div className="NoteEditor-emptyCard">
          <h2 className="NoteEditor-emptyTitle">Select a note</h2>
          <p className="NoteEditor-emptyDesc">
            Choose a note from the list, or create a new one.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="NoteEditor" aria-label="Note editor">
      <div className="NoteEditor-header">
        <div>
          <h2 className="NoteEditor-title">{mode === 'create' ? 'New note' : 'Edit note'}</h2>
          <p className="NoteEditor-subtitle">
            {mode === 'create' ? 'Draft a new note.' : `Editing note #${note?.id ?? ''}`}
          </p>
        </div>

        <div className="NoteEditor-actions">
          <button className="btn btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            type="button"
            onClick={() => onSave({ title, content })}
            disabled={!canSave || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <form
        className="NoteEditor-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSave || isSaving) return;
          onSave({ title, content });
        }}
      >
        <label className="field">
          <span className="field-label">Title</span>
          <input
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting notes"
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field-label">Content</span>
          <textarea
            className="textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something…"
            rows={12}
          />
        </label>
      </form>
    </section>
  );
}
