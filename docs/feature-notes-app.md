# Simple Notes App — Feature Document

## Overview & Purpose

The Simple Notes App is a lightweight single-page React application that allows a user to create, view, edit, and delete notes. Each note contains a `title` and `content`, and the app persists notes by calling a backend HTTP API under the `/notes` route. There is no authentication in this version; the app assumes an open, single-user or trusted environment.

The purpose of this document is to define the feature scope, expected behavior, and API contract so the frontend and backend can remain aligned.

## Value Proposition

The app provides fast, distraction-free note taking with a minimal learning curve. It focuses on a clear split layout: a list of notes for navigation and an editor for writing, using a modern light theme with blue/cyan accents. The application also provides basic feedback for common failures (such as the backend being unreachable), making it practical for demos and as a starter template for more advanced note products.

## Features & Functionality

### Goals

The primary goals for this version are to support the full CRUD lifecycle of notes, present a clean and responsive UI, and handle basic errors gracefully without introducing user accounts or complex organization features.

### In-scope features (v1)

The following features are included in this version:

The user can create a note by entering a title and/or content and saving it. The user can view notes in a list and select a note to load it into the editor. The user can update an existing note by editing title/content and saving changes. The user can delete a note from the list. The user can refresh the notes list from the backend. The UI provides basic error handling, including a warning banner when the backend cannot be reached and an error banner when API calls fail.

Notes data is treated as objects with at minimum:

- `id` (string or number)
- `title` (string)
- `content` (string)

The current frontend uses optimistic updates for edit and delete: it updates the UI immediately and rolls back if the backend call fails.

There is no authentication; all endpoints are assumed to be accessible without credentials.

### Out-of-scope for this version

The following are explicitly out of scope for this version:

The app does not support authentication, user accounts, or per-user note isolation. It does not support searching, tags, pinning, sorting controls, or folders. It does not support autosave or version history. It does not support rich text editing or attachments. It does not include offline-first behavior or sync conflict resolution. It does not provide a dedicated note detail route or multi-page navigation; it is a single-page layout.

### User stories and acceptance criteria

#### User story 1: Create a note

As a user, I want to create a new note with a title and content so that I can capture information quickly.

Acceptance criteria:

- When the user clicks “New”, the editor switches to “New note” mode and displays empty Title and Content fields.
- When the user clicks “Save” (or submits the form) with a non-empty Title or Content, the app sends a request to create the note.
- After a successful create, the new note appears in the notes list and becomes the selected note in the editor.
- If the create request fails, an error banner is shown and the user remains in a state where they can retry.

#### User story 2: View and select notes

As a user, I want to see a list of my notes and select one so that I can read or edit it.

Acceptance criteria:

- The notes list shows a count of total notes and displays each note’s title and a short preview of content.
- Clicking a note in the list selects it and loads it into the editor.
- If there are no notes, the list shows a “No notes yet” empty state message.

#### User story 3: Edit an existing note

As a user, I want to update an existing note so that I can correct or refine what I wrote.

Acceptance criteria:

- When a note is selected, the editor displays its title and content.
- Clicking “Save” updates the note via the backend and shows a success toast on completion.
- While saving, the save action indicates progress (the UI displays “Saving…”).
- If the update request fails, the UI rolls back the optimistic change and shows an error banner and error toast.

#### User story 4: Delete a note

As a user, I want to delete a note so that I can remove information I no longer need.

Acceptance criteria:

- The list provides a “Delete” action for each note.
- Deleting a note removes it from the list immediately (optimistic remove).
- If the deleted note was selected, the app selects the next available note, or shows an empty editor state when no notes remain.
- If the delete request fails, the removed note reappears (rollback) and an error message is shown.

### Primary user flows

#### Flow A: Add note

The user clicks “New” in the notes list. The editor changes to “New note” mode and shows empty fields. The user enters a title and/or content and clicks “Save” (or submits). The frontend calls `POST /notes`. On success, the note is inserted into the list and becomes selected.

#### Flow B: Edit note

The user selects an existing note from the list. The editor shows “Edit note” and pre-fills the title/content. The user changes text and clicks “Save”. The frontend performs an optimistic update, then calls `PUT /notes/{id}`. On success, a success toast is shown and the note remains selected. On failure, the UI rolls back and shows an error banner/toast.

#### Flow C: Delete note

The user clicks “Delete” on a note in the list. The frontend immediately removes it from the list. The frontend calls `DELETE /notes/{id}`. If the deleted note was selected, the selection moves to the next note or to the empty editor state. On failure, the UI restores the previous list and shows an error banner/toast.

## Architecture & Design

### UI overview (React single-page app)

The frontend is a single-page React app with a split layout:

The left pane is a notes list with a “New” button and delete actions for each list item. The right pane is a note editor that supports “empty”, “create”, and “edit” modes. A top bar provides the app title and a “Refresh” button.

The UI follows a light theme style guide with a modern look and primary accents in `#3b82f6` and success accents in `#06b6d4`. The design uses simple CSS classes (no UI framework) and is responsive: on smaller screens the layout collapses to a single column.

### Data and state behavior (high-level)

The app stores notes in local React state, along with the currently selected note ID and a mode indicator. It fetches the notes list on initial load and provides a manual refresh action. It uses optimistic UI updates for edits and deletes, rolling back on failure.

The app performs a best-effort backend reachability check by attempting to call `GET /notes`. When unreachable, it shows a warning banner including the resolved API base URL.

## Technical Requirements

### API endpoints expected by the frontend

The frontend expects the backend to expose JSON HTTP endpoints at `/notes` under a configurable base URL.

#### Base URL resolution

The frontend resolves the base URL in this order:

1. `REACT_APP_API_BASE`
2. `REACT_APP_BACKEND_URL`
3. If neither is set, it uses same-origin requests (empty base URL), meaning it will call `/notes` relative to the frontend origin.

#### Endpoints

##### List notes

- Method: `GET`
- Path: `/notes`
- Success response: `200 OK` with JSON array of notes

Example response:

```json
[
  { "id": 1, "title": "Groceries", "content": "Milk\nEggs\nBread" },
  { "id": 2, "title": "Meeting notes", "content": "Follow up with design team." }
]
```

##### Create note

- Method: `POST`
- Path: `/notes`
- Request body: JSON note payload with `title` and `content`
- Success response: `200 OK` or `201 Created` with created note object

Example request:

```json
{ "title": "New note", "content": "Hello world" }
```

Example response:

```json
{ "id": 3, "title": "New note", "content": "Hello world" }
```

##### Update note

- Method: `PUT`
- Path: `/notes/{id}`
- Request body: JSON note payload with `title` and `content`
- Success response: `200 OK` with updated note object

Example request:

```json
{ "title": "Updated title", "content": "Updated content" }
```

Example response:

```json
{ "id": 3, "title": "Updated title", "content": "Updated content" }
```

##### Delete note

- Method: `DELETE`
- Path: `/notes/{id}`
- Success response: `204 No Content` (preferred) or `200 OK`

### Error handling expectations

If the backend is unreachable (network failure), the frontend treats it as a network error and displays a warning banner indicating that the backend is not reachable. For non-2xx responses, the frontend expects either:

- a JSON response containing `detail` or `message`, or
- a plain text response body.

The frontend uses that message to display an error banner/toast.

## Configuration & Setup

### Frontend environment variables

The frontend uses the following environment variables. Only the first two are used by the API client logic today, but the full set may be available in the container environment.

#### Variables used by the current frontend implementation

- `REACT_APP_API_BASE`: Base URL for the notes backend. Example: `http://localhost:8000`.
- `REACT_APP_BACKEND_URL`: Alternate name for the backend base URL. Used only if `REACT_APP_API_BASE` is unset.

Example `.env` values:

```dotenv
REACT_APP_API_BASE=http://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
```

#### Other container environment variables (may be present)

The container environment may include:

`REACT_APP_FRONTEND_URL`, `REACT_APP_WS_URL`, `REACT_APP_NODE_ENV`, `REACT_APP_NEXT_TELEMETRY_DISABLED`, `REACT_APP_ENABLE_SOURCE_MAPS`, `REACT_APP_PORT`, `REACT_APP_TRUST_PROXY`, `REACT_APP_LOG_LEVEL`, `REACT_APP_HEALTHCHECK_PATH`, `REACT_APP_FEATURE_FLAGS`, `REACT_APP_EXPERIMENTS_ENABLED`.

These keys are not currently referenced by the React code described in this document but may be used by the runtime/deployment environment.

## Usage Examples

### Create and edit notes via the UI

The user opens the app, clicks “New”, types a title/content, and clicks “Save”. The newly created note appears in the list and is selected. The user can then modify the text and click “Save” again to update.

### Example curl requests (backend contract validation)

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
  -d '{"title":"Sample (updated)","content":"Hello again"}'
```

Delete note:

```bash
curl -s -X DELETE http://localhost:8000/notes/1
```

## Limitations & Assumptions

This version assumes the backend is available and implements the `/notes` CRUD endpoints with JSON payloads and stable `id` values. The UI does not handle concurrent edits from multiple clients beyond basic refresh behavior. Notes are not organized or searchable, and there is no authentication, authorization, or privacy model. The editor treats whitespace-only content as empty when determining whether “Save” is allowed.

## Success Metrics & Future Enhancements

### Non-functional requirements

Performance expectations are modest: the UI should load quickly, and basic CRUD operations should feel immediate; optimistic updates are used to keep the UI responsive. The layout must be responsive and usable on smaller screens; the current design collapses from a two-column layout into a single column on narrower viewports. Accessibility expectations include keyboard operability and appropriate announcements for status and errors; the current UI uses `aria-live` for loading and toast/status messaging and uses semantic labels for list and editor sections.

### Future enhancements

Search would allow users to filter notes by title/content. Pinning would reduce friction for frequently used notes. Tags would improve organization without introducing complex folder structures. Autosave would reduce the chance of losing edits and could be paired with an “unsaved changes” indicator.

### Release checklist

Before releasing this version:

The backend endpoints must exist and match the payload/response expectations documented here. The frontend must be configured with the correct API base URL for the target environment. The app should be verified on desktop and mobile widths to confirm the responsive layout behavior. Basic accessibility checks should be performed, including keyboard navigation and reading of banners/toasts in a screen reader. Manual smoke tests should confirm that create, list, edit, delete, and refresh all work against the deployed backend, including handling a simulated backend outage.
