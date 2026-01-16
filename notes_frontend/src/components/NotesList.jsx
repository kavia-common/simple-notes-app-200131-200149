import React from 'react';
import './NotesList.css';

// PUBLIC_INTERFACE
export default function NotesList({
  notes,
  selectedId,
  onSelect,
  onCreateNew,
  onDelete,
  isLoading,
}) {
  /** Notes list sidebar with selection and delete controls. */
  return (
    <section className="NotesList" aria-label="Notes list">
      <div className="NotesList-header">
        <div>
          <h2 className="NotesList-title">Notes</h2>
          <p className="NotesList-subtitle">{notes.length} total</p>
        </div>

        <button className="btn btn-primary" type="button" onClick={onCreateNew}>
          New
        </button>
      </div>

      {isLoading ? (
        <div className="NotesList-empty" role="status" aria-live="polite">
          Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <div className="NotesList-empty">
          <div className="NotesList-emptyTitle">No notes yet</div>
          <div className="NotesList-emptyDesc">Create your first note to get started.</div>
        </div>
      ) : (
        <ul className="NotesList-items" role="listbox" aria-label="Notes">
          {notes.map((n) => {
            const isSelected = n.id === selectedId;
            return (
              <li key={n.id} className={`NotesList-item ${isSelected ? 'isSelected' : ''}`}>
                <button
                  type="button"
                  className="NotesList-select"
                  onClick={() => onSelect(n.id)}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  <div className="NotesList-noteTitle">{n.title || 'Untitled'}</div>
                  <div className="NotesList-notePreview">
                    {(n.content || '').trim() ? n.content : '—'}
                  </div>
                </button>

                <button
                  type="button"
                  className="btn btn-danger btn-icon"
                  onClick={() => onDelete(n.id)}
                  aria-label={`Delete note: ${n.title || 'Untitled'}`}
                  title="Delete"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
