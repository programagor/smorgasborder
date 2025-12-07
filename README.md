# Smorgasborder

Smorgasborder is a collaborative worksheet for aligning preferences, boundaries, and expectations. Multiple people answer templated questions in parallel, compare answers only when they choose to reveal them, and see a calculated "common ground" for each prompt once at least one answer is visible.

## Project Goals
- Deliver a real-time, multi-user worksheet experience that prioritizes respectful disclosure over complex permissioning.
- Support templates (including a "blank" worksheet) and a "spiciness 🌶️" toggle that gates explicit content.
- Keep collaboration fast and resilient by reconciling concurrent edits with server timestamps rather than deep ACL rules.

## User Flow Overview
1. **View bootstrapping**: If a `view` query parameter is absent, the server generates a new view ID tied to a new worksheet and assigns the visitor as the first column.
2. **Template selection**: The toolbar hosts a dropdown backed by DB templates. Selecting a template on a pristine worksheet loads it immediately; if edits exist, show a **Save / Discard / Cancel** dialog first.
3. **Worksheet layout**: Rows represent sections and their questions; columns represent participants. The last column is **Common Ground**, showing the lowest visible rating only when the viewer can see at least one answer in that row.
4. **Visibility controls**: Each answer cell has a "show answer" override. A toolbar control can reveal/hide all answers temporarily. A user always sees their own answers.
5. **Collaboration**: Anyone with access can add sections, questions, and users. New users get a column header with an editable name and a one-click copy of the personalized view link.
6. **Adding participants**: Adding a user creates a new column plus a new view pointing at the same worksheet with clean override/expansion state. Sharing that link lets the new participant fill their column.
7. **Sections**: Sections start collapsed and stay that way until a user expands them. Expansion state is tracked per-view.
8. **Real-time feedback**: Client updates propagate via websockets or polling (target <10s) so remote sessions see answer and name changes quickly, including common-ground recalculations.

## Requirements to Implement
- **Data model**: Worksheet, participant (per-worksheet user), view (worksheet + participant + overrides/expanded sections), section, question (with spicy flag and answer type), template, and answer.
- **Template behavior**: Templates are read-only seed content retrieved from the DB; users may append custom sections/questions to their active worksheet.
- **Answer types**: Support R/Y/G radio, multi-select checkboxes from a predefined list, and optional free-text comments.
- **Conflict handling**: Prefer timestamp-based resolution for low contention (names, overrides, answers), with eventual consistency for concurrent edits.
- **Performance**: Plan for many columns with future horizontal scrolling/virtualization.

## Architecture Blueprint
- **Frontend**: SPA/table UI that persists per-view state (expanded sections, visibility overrides) and supports optimistic updates. Real-time layer via websockets or polling; ensure compatibility with nginx websocket upgrades.
- **Backend**: API endpoints for worksheet fetch/update, template selection, user creation, and override toggles; websocket/SSE channel for live updates and common-ground broadcasts.
- **Database**: Relational store (e.g., PostgreSQL) to track worksheets, participants, views, templates, sections, questions, and answers with timestamps.
- **Sync strategy**: Server timestamps and last-writer-wins for simple fields; server computes common-ground for rows based on visible answers.

## Deployment & Operations Plan
- **Containerization**: Docker Compose stack with app server, PostgreSQL, and nginx reverse proxy handling HTTPS offload and websocket upgrades.
- **Configuration**: Environment template for DB credentials, JWT/secret keys, and TLS settings; nginx configured for static assets and API/websocket routing.
- **Runtime**: Compose profiles for local dev and production; production images built in CI and pulled by compose for deployment.

## CI/CD with GitHub Actions
- Lint, type-check, and test pipelines triggered on PRs and main branch pushes.
- Build and publish versioned container images to a registry on main merges.
- Optional deploy job to run `docker compose pull` and `docker compose up -d` on the target host (self-hosted runner or remote via SSH) after image publication.

## Development & Testing Plan
- **Local dev**: Use Docker Compose to spin up app + DB + nginx. Provide seed templates (including "blank") and fixtures for sample worksheets.
- **Testing**: Unit/API tests for view lookups, override persistence, and common-ground computation; E2E tests covering template switching with unsaved changes, answer reveal flows, and multi-user sync latency.
- **Observability**: Add basic request logging and structured events around worksheet changes to debug synchronization issues.

## Planning Artifacts
- See `TODO.md` for nested tasks and milestones. Keep README and TODO aligned as scope evolves.
