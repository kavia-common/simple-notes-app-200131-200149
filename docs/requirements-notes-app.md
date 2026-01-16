# Simple Notes App — Requirements Document

## Overview & Purpose

The Simple Notes App is a lightweight single-page React application that allows a user to create, view, edit, delete, and refresh notes. Each note has a `title` and `content`, and the app persists notes through a backend HTTP API under the `/notes` route. This version has no authentication and is intended for a single-user or trusted environment.

This document defines the application requirements so that the frontend and backend can remain aligned, and so that feature completion can be validated consistently through acceptance criteria.

## Value Proposition

The app provides fast, distraction-free note taking with a minimal learning curve. The user interface emphasizes a simple split layout that supports quick navigation between notes (list on the left) and editing (editor on the right). The app uses a modern light theme with blue/cyan accents and includes user-visible feedback when API calls fail or when the backend cannot be reached.

## Features & Functionality

### Scope

The scope of this version is a basic notes CRUD workflow with a manual refresh action and basic network/API error feedback.

### In scope

The following capabilities are included:

The user can create a new note by entering a title and/or content and saving it. The user can list and browse existing notes, including seeing a count of notes and a short preview. The user can select a note to load it into the editor. The user can edit the selected note and save changes. The user can delete a note from the list. The user can manually refresh the notes list from the backend. The UI displays user-visible status and error messaging when the backend is unreachable or returns errors.

### Out of scope

The following are explicitly not required in this version:

The app does not support authentication, authorization, or per-user note isolation. It does not include search, tags, pinning, folders, or sorting controls beyond the existing list order behavior. It does not provide autosave, version history, collaboration, real-time updates, or offline-first functionality. It does not support rich text, attachments, or note sharing. It does not require multi-page routing; it is a single-page layout.

### Personas and use cases

The key personas are:

A casual user who wants to quickly jot down notes without setup, accounts, or configuration. A developer/demo user who wants a minimal CRUD example application that can be used to validate a backend `/notes` API.

The primary use cases are:

The user starts the app, views the list of notes, selects a note, edits it, and saves changes. The user creates a new note and then continues editing it. The user deletes a note they no longer need. The user presses refresh to re-fetch notes from the backend to reflect current state.

### Functional requirements

#### FR-1: List notes (read/list)

The application must fetch a list of notes from the backend and render them in the notes list. Each list item must display the note title (or an “Untitled” placeholder) and a preview of the note content (or a placeholder).

The application must show an empty state message when there are no notes. The application must show a loading state when notes are being loaded and the app has not yet completed an initial successful load.

#### FR-2: Select a note (read/select)

The user must be able to select a note from the list, which loads the selected note into the editor in “edit” mode. The currently selected note must be visually identifiable in the list.

#### FR-3: Create a note (create)

The user must be able to enter “create” mode via a “New” action. In create mode, the editor must show empty Title and Content fields.

The application must prevent saving a note that has both Title and Content empty after trimming whitespace. The application must create a note by sending a request to the backend and, on success, insert the created note into the list and select it for editing.

#### FR-4: Edit a note (update)

When a note is selected, the user must be able to modify its Title and Content and explicitly save changes.

The application must use an optimistic UI update for edits. It must update the list/editor state immediately and then persist the change via the backend. If the backend update fails, the application must roll back the optimistic changes and present an error message.

The save action must show a saving/progress indicator while the request is in-flight.

#### FR-5: Delete a note (delete)

The user must be able to delete a note via a “Delete” action in the list.

The application must use an optimistic UI update for deletion. It must remove the note from the list immediately and then persist deletion via the backend. If the backend delete fails, the application must roll back the optimistic removal and present an error message.

If the deleted note was selected, the application must update selection to the next available note, or to an empty editor state if none remain.

#### FR-6: Refresh notes list (refresh)

The application must provide a “Refresh” action that re-fetches the notes list from the backend and updates the UI.

On refresh success, the application should keep a sensible selection: if there is no selected note and notes exist, it should select the first; if no notes exist, it should show an empty editor state.

#### FR-7: Error handling and backend reachability feedback

When a backend request fails due to network reachability, the application must treat this as “backend unreachable” and show a warning banner indicating that the backend is not reachable and displaying the resolved API base URL used for `/notes`.

When a backend request fails with a non-2xx response, the application must show an error banner with a meaningful message extracted from the response when available.

The application must display toast notifications for successful create, update, and delete actions, and must also display a toast notification for save/delete failures.

## Architecture & Design

The application is a single-page React application composed of:

A main App shell that owns the notes state, selection state, and UI mode (empty/create/edit). A NotesList component that renders the sidebar list and provides “New” and “Delete” actions. A NoteEditor component that renders controlled Title/Content inputs and provides “Save” and “Cancel” actions.

The app communicates with the backend using an API client module that wraps `fetch` and normalizes error handling, including identifying network failures separately from HTTP status errors. The frontend state includes the currently selected note ID, the list of notes, and transient UI state such as loading, saving, error banners, backend reachability, and toast messages.

## Technical Requirements

### API assumptions and contract (consumed by the frontend)

The frontend assumes a backend that serves JSON endpoints under the `/notes` route.

#### Base URL resolution

The frontend must resolve the API base URL in this order:

1. `REACT_APP_API_BASE`
2. `REACT_APP_BACKEND_URL`
3. If neither is set, the frontend must use same-origin requests (empty base URL), calling `/notes` relative to the frontend origin.

#### Endpoints

The backend must support the following endpoints:

- `GET /notes` returns an array of notes.
- `POST /notes` accepts `{ "title": "...", "content": "..." }` and returns the created note including `id`.
- `PUT /notes/{id}` accepts `{ "title": "...", "content": "..." }` and returns the updated note including `id`.
- `DELETE /notes/{id}` returns `204 No Content` (preferred) or a `200 OK`.

A note object must have:

- `id` (string or number)
- `title` (string, possibly empty)
- `content` (string, possibly empty)

### Error response expectations

For non-2xx responses, the backend should ideally return either:

A JSON body containing `detail` or `message`, or a plain text response body. The frontend will use this content as the error message presented to the user.

For network failures (backend unreachable), the frontend will show a standardized message indicating the backend is not reachable.

## Configuration & Setup

### Frontend environment variables

The container environment defines the following variables, but only a subset is used by the current frontend code.

#### Variables used by the frontend code today

The application must support:

- `REACT_APP_API_BASE`: The base URL for backend API requests.
- `REACT_APP_BACKEND_URL`: Alternate base URL used only when `REACT_APP_API_BASE` is unset.

If both are unset, the app must call the backend at same-origin paths (for example, `/notes`).

#### Variables present in the container environment (not referenced by the current React code)

The container environment may define:

`REACT_APP_FRONTEND_URL`, `REACT_APP_WS_URL`, `REACT_APP_NODE_ENV`, `REACT_APP_NEXT_TELEMETRY_DISABLED`, `REACT_APP_ENABLE_SOURCE_MAPS`, `REACT_APP_PORT`, `REACT_APP_TRUST_PROXY`, `REACT_APP_LOG_LEVEL`, `REACT_APP_HEALTHCHECK_PATH`, `REACT_APP_FEATURE_FLAGS`, `REACT_APP_EXPERIMENTS_ENABLED`.

These are not requirements for the app’s current behavior, but they may be required by deployment/runtime tooling.

## Usage Examples

### Example user flow: create → edit → delete

The user clicks “New” and enters a title and/or content. The user clicks “Save” to create the note. The created note appears in the list and is selected. The user edits the note and clicks “Save” again to persist updates. The user can then delete the note using the “Delete” action in the list.

### Example backend contract validation (curl)

List notes:

```bash
curl -s http://localhost:8000/notes
```

Create note:

```bash
curl -s -X POST http://localhost:8000/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"Sample","content":"Hello"}'
```

Update note:

```bash
curl -s -X PUT http://localhost:8000/notes/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated","content":"Hello again"}'
```

Delete note:

```bash
curl -s -X DELETE http://localhost:8000/notes/1
```

## Limitations & Assumptions

This version assumes the backend `/notes` API is available and returns stable `id` values. The app does not handle concurrent edits from multiple clients beyond providing a manual refresh. It assumes a trusted environment with no authentication. It does not provide offline behavior; without backend connectivity, CRUD operations are expected to fail and show user-visible errors.

The editor requires that at least one of Title or Content be non-empty after trimming to enable saving, and this behavior is considered required for this version.

## Success Metrics & Future Enhancements

### Acceptance criteria

The implementation is considered complete when all criteria below are met.

#### AC-1: Create

When the user clicks “New”, the editor enters “New note” mode with empty Title and Content fields. When the user clicks “Save” and either Title or Content is non-empty after trimming, the app sends `POST /notes` and, on success, the new note appears in the list and becomes selected.

If the create request fails, an error banner is shown and the user can retry without losing the entered draft content.

#### AC-2: List and initial load

On application load, the app calls `GET /notes` and renders the list. If notes exist and there is no prior selection, the first note becomes selected. If no notes exist, the list shows an empty state and the editor shows the empty editor state.

#### AC-3: Select

Clicking a note in the list selects it and loads its title/content into the editor. The selected note is visually distinguishable in the list.

#### AC-4: Edit

When the user edits a selected note and clicks “Save”, the app sends `PUT /notes/{id}`. The UI indicates progress while saving. On success, a success toast is displayed. On failure, the app rolls back optimistic changes and displays both an error banner and an error toast.

#### AC-5: Delete

When the user deletes a note, it is removed from the list immediately and `DELETE /notes/{id}` is sent. On success, a success toast is displayed. On failure, the deleted note reappears in the list and an error banner/toast is shown.

If the deleted note was selected, the app selects the next available note; if none remain, the editor shows the empty editor state.

#### AC-6: Refresh

When the user clicks “Refresh”, the app re-fetches notes using `GET /notes` and updates the list. The app maintains a sensible selection after refresh according to the implemented selection rules.

#### AC-7: Backend reachability and error messaging

If the backend is unreachable (network failure), the UI shows a warning banner indicating the backend is not reachable and displays the resolved API base URL used for `/notes`. For HTTP errors, the UI shows an error banner using a message derived from the response (`detail`, `message`, or text body when available).

### Non-functional requirements

The app must feel responsive for typical small note lists by using optimistic updates for edit and delete. The UI must remain usable on smaller screen widths by collapsing the split layout into a single-column layout.

The app must support keyboard operability for primary actions and must provide screen-reader friendly announcements for loading and toast/status changes using live regions where appropriate.

The app must handle errors without breaking the UI state. After a failed API request, the user must remain able to retry actions (save, delete, refresh) without needing a full page reload.
