# NotesNest backend map

Where everything lives in `backend/`, what each part does, and how to do common jobs.
Use this as a lookup: find the thing you want to change, see where it goes and which command applies it.

> The code is the source of truth. If this map and the code disagree, trust the code and fix the map.

---

## Contents
1. [What the backend is](#1-what-the-backend-is)
2. [Folder map](#2-folder-map)
3. [How a request flows](#3-how-a-request-flows)
4. [Data model](#4-data-model)
5. [API reference](#5-api-reference)
6. [Content: what goes where](#6-content-what-goes-where)
7. [The `manage.py` commands](#7-the-managepy-commands)
8. [Configuration](#8-configuration)
9. [File storage](#9-file-storage)
10. [Database and migrations](#10-database-and-migrations)
11. [Tests and code quality](#11-tests-and-code-quality)
12. [Deployment](#12-deployment)
13. ["I want to..." cookbook](#13-i-want-to-cookbook)
14. [Troubleshooting](#14-troubleshooting)
15. [Gotchas](#15-gotchas)

---

## 1. What the backend is
A small **read-only** FastAPI service. There is no login and no upload endpoint: students can only list and open things.
All content is added by the owner from their own machine using files plus `python -m app.manage sync`.

- **Framework:** FastAPI, SQLAlchemy 2.0, Alembic, Pydantic
- **Database:** SQLite locally, Postgres (Neon) in production
- **PDF storage:** local `storage/` folder locally, an S3-compatible bucket (Backblaze B2) in production
- **Hosting:** Vercel (backend project, root directory `backend`)

---

## 2. Folder map

```
backend/
├─ app/
│  ├─ main.py              FastAPI app: CORS, cache headers, mounts the API router
│  ├─ manage.py            Command line tool that loads content (sync commands, check-storage)
│  ├─ api/
│  │  ├─ router.py         Mounts every route file under /api/v1
│  │  └─ routes/           One file per feature (health, terms, subjects, resources,
│  │                       faculty, articles, papers)
│  ├─ core/
│  │  └─ config.py         All settings, read from environment variables
│  ├─ db/
│  │  ├─ base.py           SQLAlchemy Base class
│  │  └─ session.py        Database engine and the get_db() dependency
│  ├─ models/              Database tables (Subject, Term, Resource, Faculty, Article)
│  ├─ schemas/             Response shapes returned by the API (Pydantic)
│  └─ services/
│     └─ storage.py        All file storage logic (local folder or S3/B2, signed URLs)
├─ alembic/                Database migrations (versions/ holds one file per change)
├─ alembic.ini
├─ data/                   Content files you edit
│  ├─ courses.json         Subjects and which subjects belong to which semester
│  ├─ faculty.json         Faculty list (gitignored; copy faculty.example.json to create it)
│  ├─ faculty.example.json Template with fake entries
│  └─ advice/*.md          One markdown file per advice article
├─ storage/                PDFs: storage/<COURSE_CODE>/pyq/<file>.pdf (gitignored)
├─ tests/                  Automated tests (use their own fixture data, not your content)
├─ requirements.txt        Runtime dependencies (the only dependency list Vercel reads)
├─ requirements-dev.txt    Runtime + test/lint tools
├─ ruff.toml               Lint settings
├─ pytest.ini              Test settings
├─ vercel.json             Vercel packaging (files excluded from the function bundle)
├─ .python-version         Python version for Vercel (3.12)
└─ .env.production         Production secrets for running sync from your machine (gitignored, never commit)
```

**Rule of thumb:** routes talk to the database through models and return schemas; anything that touches files goes through `services/storage.py`; anything that changes content goes through `manage.py`.

---

## 3. How a request flows

```
Browser (Next.js)
   │  fetch https://<backend>/api/v1/...
   ▼
main.py  → CORS check → route in app/api/routes/ → get_db() session
   │                              │
   │                              ▼
   │                       models (SQLAlchemy) ──► Postgres / SQLite
   ▼
Response (schema shape) + Cache-Control header
```

- **PDF View/Download:** `GET /resources/{id}/file` does not return JSON.
  - Local mode: the backend streams the file.
  - Production: the backend answers with a **307 redirect** to a short-lived signed URL on the bucket, so the PDF never passes through the Vercel function.
- **Caching:** successful GETs under `/api/v1` (except health and the file route) are cached by Vercel's CDN for about 5 minutes. After a `sync`, changes can take up to that long to appear.

---

## 4. Data model

| Table | Key fields | Notes |
|---|---|---|
| `subjects` | `code` (unique), `name` | A subject is identified by its course code. Papers attach here. |
| `terms` | `season` (fall/winter), `academic_year` (e.g. 2025-26), `is_freshers`, `name` | Unique by season + year + freshers flag. `name` is built as "Fall Semester 2025-26" plus " Freshers". |
| `term_subjects` | `term_id`, `subject_id` | Which subjects are listed under which semester. Edited through `courses.json`. |
| `resources` | `subject_id`, `type` (pyq/note), `title`, `file_path` (unique), `exam`, `year`, `created_at` | One row per PDF. `exam` and `year` are read from the filename. |
| `faculty` | `name` (required), `designation`, `department`, `email`, `cabin` | Not linked to subjects. |
| `articles` | `slug` (unique), `title`, `category`, `summary`, `body`, `author`, `order`, `updated_at` | Advice articles, one per markdown file. |

**Key idea:** papers belong to a **subject**, never to a semester. A subject can appear in several semesters and keeps the same papers. A semester is only a list of subjects.

Exam values you will see: `CAT`, `CAT-1`, `CAT-2`, `FAT-Theory`, `FAT-Lab`, or empty when the filename was not recognised.

---

## 5. API reference
All routes live under `/api/v1`. Interactive docs: `/docs` on the backend URL.

| Method and path | Parameters | Returns |
|---|---|---|
| `GET /health` | none | `{"status": "ok"}` (never cached) |
| `GET /terms` | none | All semesters, newest first |
| `GET /terms/{id}` | none | One semester, 404 if missing |
| `GET /subjects` | `term_id` (optional) | Subjects, optionally only those in a semester |
| `GET /subjects/{id}` | none | One subject, 404 if missing |
| `GET /resources` | `subject_id` (required), `type` (optional: pyq or note) | Resources of a subject (no file paths exposed) |
| `GET /resources/{id}/file` | `download=1` (optional) | The PDF (inline), or forced download; redirect to a signed URL in production |
| `GET /faculty` | none | All faculty, alphabetical |
| `GET /articles` | `category` (optional) | Article list without bodies, ordered by `order` then title |
| `GET /articles/{slug}` | none | Full article, 404 if missing |
| `GET /papers` | `q` (code or name, min 2 characters), `year` (optional), `limit` (default 50, max 100) | Papers matching a subject code or name, with subject info |
| `GET /papers/years` | none | Years that have papers, newest first |

---

## 6. Content: what goes where

| I have... | It goes in... | Then run |
|---|---|---|
| Subjects and semesters | `data/courses.json` | `sync` |
| Question papers (PDFs) | `storage/<COURSE_CODE>/pyq/` | `sync` |
| Faculty details | `data/faculty.json` | `sync` |
| Advice article | `data/advice/<slug>.md` | `sync` |

### 6.1 `data/courses.json`
```json
{
  "subjects": [
    {"code": "MAT1101", "name": "Calculus"}
  ],
  "terms": [
    {"season": "fall", "academic_year": "2025-26", "is_freshers": true,
     "subjects": ["MAT1101"]}
  ]
}
```
- Every code used in a term must also exist in the top-level `subjects` list.
- A subject that is in `subjects` but in no term is still stored and searchable on the Papers page; it just does not appear under any semester.
- Only `fall` and `winter` seasons exist.
- Each term's subject list is **mirrored exactly** from the file on every sync.

### 6.2 PDF folders and filenames
Folder: `storage/<COURSE_CODE>/pyq/`. The folder name must match the course code exactly (capitals).

| File name | Shows as | Tab |
|---|---|---|
| `CAT-2025.pdf` | CAT 2025 | CAT |
| `CAT1-2025.pdf` | CAT-1 2025 | CAT |
| `CAT2-2025.pdf` | CAT-2 2025 | CAT |
| `FAT-Theory-2025.pdf` (or `FAT-2025.pdf`) | FAT Theory 2025 | FAT, Theory section |
| `FAT-Lab-2025.pdf` | FAT Lab 2025 | FAT, Lab section |

- A file that cannot be recognised triggers a **warning** during sync and appears under an "Other" tab, so nothing is silently hidden.
- A folder whose name is not a known course code is skipped with a warning.
- Do not use both `CAT-2025.pdf` and `CAT1-2025.pdf` for the same subject and year.

### 6.3 `data/faculty.json`
```json
{"faculty": [
  {"name": "Dr. Full Name", "designation": "Assistant Professor",
   "department": "School of Computing", "email": "name@example.edu", "cabin": "AB1-101"}
]}
```
Only `name` is required. The table mirrors the file exactly: remove a person from the file and they disappear on the next sync. The file is gitignored on purpose; keep a private backup.

### 6.4 `data/advice/<slug>.md`
```
---
title: How to prepare for CAT?
category: Exams
summary: One line shown on the list page.
author: Final-year student
order: 1
---
Markdown body...
```
- Required: `title`, `category`, `summary`. Optional: `author`, `order` (default 100).
- The filename (without `.md`) is the URL slug and must be lowercase kebab-case, for example `how-to-prepare-for-cat.md`.
- The table mirrors the folder: delete a file and the article disappears on the next sync.

---

## 7. The `manage.py` commands
Run from the `backend/` folder with the virtual environment active:
`python -m app.manage [--env-file FILE] <command> [options]`

| Command | What it does |
|---|---|
| `sync` | Runs sync-courses, sync-files, sync-faculty, sync-advice in that order |
| `sync-courses` | Loads subjects and terms from `data/courses.json` |
| `sync-files` | Scans `storage/`, adds or updates resource rows, uploads PDFs when storage is S3/B2, removes rows (and stored files) whose local file is gone |
| `sync-faculty` | Mirrors `data/faculty.json` into the database |
| `sync-advice` | Mirrors `data/advice/*.md` into the database |
| `check-storage` | Uploads, reads and deletes a tiny test file to verify the bucket works |

Options:
- `--env-file .env.production` loads production settings (database and bucket) for this run only.
- `--prune` (on `sync` and `sync-courses`) **deletes** subjects and terms that are not in `courses.json`, together with their papers and stored files. Always asks for confirmation.
- `--yes` skips confirmation prompts.
- Run `python -m app.manage --help` for the full current list.

### Safety rules
- **Sync mirrors your local files.** Removing something from a file or folder removes it from the database, and from the bucket for PDFs. Always run from the machine that holds the complete `storage/` folder and data files.
- **Production guard:** when the database is not SQLite or storage is S3/B2, every write command prints the database host and bucket name and asks you to type `yes`.
- **Local first:** run `python -m app.manage sync` (no env file) to preview on SQLite before publishing with `--env-file .env.production`.

---

## 8. Configuration
Settings are read from environment variables (and a `.env` file locally). Defaults are chosen so local development needs no setup. See `app/core/config.py`.

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | Set to `production` on Vercel (uses connection-per-request pooling for Postgres) |
| `DATABASE_URL` | `sqlite:///./notesnest.db` | Database. Neon's `postgresql://` URL is converted to the driver form automatically. |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated list of exact frontend origins allowed to call the API (no trailing slash) |
| `STORAGE_BACKEND` | `local` | `local` or `s3` |
| `STORAGE_DIR` | `./storage` | Local PDF folder |
| `S3_BUCKET` | none | Bucket name (required when `s3`) |
| `S3_ENDPOINT_URL` | none | For Backblaze B2: `https://s3.<region>.backblazeb2.com` |
| `S3_REGION` | `auto` | For B2: the region from the endpoint, for example `us-east-005` |
| `S3_ACCESS_KEY_ID` | none | B2 application key ID |
| `S3_SECRET_ACCESS_KEY` | none | B2 application key (shown once at creation) |
| `S3_FORCE_PATH_STYLE` | `false` | Only for providers that need path-style URLs |
| `S3_PRESIGN_SECONDS` | `300` | How long a signed PDF link stays valid |

Use `.env.example` in the repo root as the template. Real secrets live only in `backend/.env.production` (local, gitignored) and in the Vercel project's environment variables.

---

## 9. File storage
All file access goes through `app/services/storage.py`. Nothing else touches the filesystem or the bucket.

- **Local:** reads from `STORAGE_DIR`, blocks path traversal, serves with the correct PDF headers.
- **S3/B2:** uses boto3 with signature v4, checksums only when required and automatic retries; files are served via signed redirect URLs.
- **Object key = `file_path`:** the resource's relative path, for example `MAT1101/pyq/CAT-2025.pdf`, with forward slashes. The same string is the local path and the bucket key.
- **Bucket is private.** Nothing is publicly listable; only signed links work, and they expire.

---

## 10. Database and migrations
- Tables are defined in `app/models/`. Schema changes are tracked by Alembic files in `alembic/versions/`.
- **Local:** `alembic upgrade head` creates or updates the SQLite file.
- **Production (Neon):** migrations are NOT run on deploy. Run them yourself from your machine. Alembic does not read `--env-file`, so pass the URL through the environment (Windows cmd, keep the quotes because the URL contains `&`):
  ```
  set "DATABASE_URL=<neon pooled connection string>"
  alembic upgrade head
  set DATABASE_URL=
  ```
- **After editing a model:**
  ```
  alembic revision --autogenerate -m "describe the change"
  ```
  Review the generated file, then `alembic upgrade head` locally, then the production command above. Check for drift with `alembic check`.

---

## 11. Tests and code quality
From `backend/` with the virtual environment active:
```
ruff check .
pytest
```
- Tests use an in-memory SQLite database seeded with their own fixture data, never your real `courses.json`, faculty or PDFs, so adding content does not break them.
- Lint settings are in `ruff.toml` and test settings in `pytest.ini`. **Do not add a `pyproject.toml`** to `backend/`: Vercel treats it as a Python project and the build fails.
- GitHub Actions runs ruff and pytest on every push.

---

## 12. Deployment
- **Vercel backend project:** root directory `backend`, Python 3.12, function region Singapore (`sin1`) to sit next to the database.
- **Environment variables** go in the Vercel project settings: `APP_ENV`, `DATABASE_URL`, `CORS_ORIGINS`, `STORAGE_BACKEND`, `S3_*` (see the table in section 8). **Changing one needs a redeploy.**
- **Code changes** (anything pushed to GitHub) deploy automatically. **Content changes** (`sync`) do not need a deploy.
- Files excluded from the Vercel bundle are listed in `vercel.json` (storage, data, tests, migrations, caches).
- More detail: `docs/deployment.md`.

---

## 13. "I want to..." cookbook

| I want to... | Do this |
|---|---|
| Run the backend locally | `cd backend`, activate venv, `alembic upgrade head`, `python -m app.manage sync`, `uvicorn app.main:app --reload` |
| Add a subject | Add `{"code", "name"}` to `subjects` in `courses.json`, create `storage/<CODE>/pyq/`, add PDFs, `sync` |
| List a subject under a semester | Add its code to that term's `subjects` in `courses.json`, `sync` |
| Add a new semester | Add a term object (season, academic_year, is_freshers, subjects) to `courses.json`, `sync` |
| Rename a subject | Edit its `name` in `courses.json`, `sync` |
| Remove a subject or semester | Delete it from `courses.json`, then `sync --prune` (deletes its papers too) |
| Add papers | Name them as in section 6.2, put them in `storage/<CODE>/pyq/`, `sync` |
| Replace a PDF | Overwrite the file keeping the same name, `sync` |
| Rename or delete a PDF | Rename or delete the file, `sync` (the old row and bucket file are removed) |
| Add or edit faculty | Edit `data/faculty.json`, `sync` |
| Add or edit an advice article | Create or edit `data/advice/<slug>.md`, `sync` |
| Publish to the live site | `python -m app.manage --env-file .env.production sync`, type `yes` |
| Check the bucket connection | `python -m app.manage --env-file .env.production check-storage` |
| Add an API endpoint | New file in `app/api/routes/`, response shape in `app/schemas/`, register it in `app/api/router.py`, add tests, update section 5 |
| Add or change a table | Edit `app/models/`, generate and review a migration (section 10), run it locally and then on Neon |
| Allow a new frontend URL | Add it to `CORS_ORIGINS` in the Vercel backend project, redeploy |
| Change the Neon password | Reset it in Neon, update `DATABASE_URL` in Vercel and in `.env.production`, redeploy the backend |
| Change a bucket key | Create a new application key in Backblaze, update `S3_*` in Vercel and `.env.production`, redeploy |

---

## 14. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| I edited `courses.json` or added PDFs and the site did not change | You did not run `sync`, or the file was not saved | Save the file, run `sync` (local) or `sync` with `--env-file .env.production` (live), then wait up to about 5 minutes for the cache |
| Live site shows old data after a successful `sync` | API cache | Wait about 5 minutes, hard-refresh with Ctrl+Shift+R |
| Sync warns a file "could not be parsed" | Filename not in the expected pattern | Rename it as in section 6.2 and sync again |
| Sync skips a folder | Folder name is not a course code from `courses.json` | Match the code exactly, or add the subject first |
| A paper shows under the "Other" tab | Unrecognised filename | Rename it, sync |
| Browser shows a CORS error | Frontend URL not in `CORS_ORIGINS`, or you are on a per-deployment URL | Use the production URL, set `CORS_ORIGINS` exactly (no trailing slash), redeploy the backend |
| Env variable change has no effect on Vercel | Variables apply only to new deployments | Redeploy |
| Vercel build fails with "uv lock ... No project table found" | A `pyproject.toml` exists in `backend/` | Delete it; keep config in `ruff.toml` and `pytest.ini` |
| `ModuleNotFoundError` locally | Dependencies not installed in the active venv | `pip install -r requirements-dev.txt` |
| `check-storage` fails with a region or endpoint error | Placeholder or malformed value in `.env.production` | Endpoint must start with `https://`, region must be the real region name, no quotes or angle brackets |
| Database connection errors on the live site | Wrong or rotated `DATABASE_URL` in Vercel | Update it with the pooled string and redeploy |
| Tests fail after adding content | Should not happen (tests use fixtures) | Check whether a test reads the real `data/` folder |

---

## 15. Gotchas
- **`sync` is destructive by design.** It makes the database and bucket match your local files and folders. A missing local file means a removed paper.
- **`--prune` deletes data** (subjects, terms, papers, stored files that are not in `courses.json`). Read the confirmation list.
- **Never commit** `.env.production`, `faculty.json` or the `storage/` folder. Keep private backups of the last two, since they exist nowhere else except the bucket.
- **Never paste real secrets** (database URL, bucket keys) into chats or screenshots. If one leaks, rotate it.
- **Local and live are separate.** `sync` without `--env-file` touches only your local SQLite and `storage/`; with `--env-file .env.production` it touches the live database and bucket.
- **Content vs code:** content changes use `sync`, code changes use `git push`. Mixing these up is the most common reason "nothing updated".
- **Windows `cmd`:** quote values that contain `&` (Neon URLs do), for example `set "DATABASE_URL=..."`.
