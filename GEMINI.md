# Spread-Spends Engineering & Agent Guidelines

## 1. EGM Session Workspace Isolation Policy (Mandatory)

To prevent overwriting artifacts across concurrent or sequential Elephant & Goldfish Model (EGM) sessions:

- **Isolated Task Directories**: Every EGM workflow session (`/egm-brainstorm`, `/egm-draft`, review swarms) must maintain its artifacts inside an isolated, task-specific directory under `docs/designs/<task-slug>/`:
  - `docs/designs/<task-slug>/concepts_brief.md`
  - `docs/designs/<task-slug>/design_draft.md`
  - `docs/designs/<task-slug>/<review_reports>.md`
- **Root Artifact Handling**: If a harness or skill expects or writes to `./concepts_brief.md` or `./design_draft.md` in the repository root, agents must immediately persist and mirror the artifact to its canonical location under `docs/designs/<task-slug>/`. Never overwrite an active discussion without maintaining task directory isolation.
- **Task Slugs**: Use kebab-case descriptive feature slugs (e.g., `member-soft-delete-sync`, `floating-add-expense-button`, `minimalist-ui-overhaul`).

---

## 2. Technical Stack & Execution Invariants

- **Package Manager & Runtime**: Bun is the primary package manager and runtime.
  - Development server: `bun run dev`
  - Testing: `bun test`
  - Production build: `bun run build`
- **Python Agentic Workflows**: Strictly adhere to `uv` (`uv run`, `uv add`, etc.) for any Python-based scripts. Never invoke global `pip` or system `python`.
- **Decentralized Client-Side Architecture**:
  - Zero backend servers or databases. All data persistence resides in user-owned Google Sheets spreadsheets via Google Drive and Sheets REST APIs.
  - Per-member expense tabs (`Exp_<email>`) prevent concurrent write contention; rollups are calculated dynamically in `All_Expenses` via `VSTACK`.
  - Financial amounts are computed in integer cents to guarantee penny conservation without floating-point accumulation errors.
- **Auditability & Soft Deletions**: Financial records, tabs, and member records must never be hard-deleted from spreadsheets. Use status markers (`DELETED`, `INACTIVE`) and preserve edit history.
