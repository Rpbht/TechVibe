# TechVibe

TechVibe is a database-backed interview and upskilling handbook built with React, TypeScript, Vite, Node.js, and SQLite.

For complete request/response schemas and examples, see [API.md](./API.md).

The browser loads a researched 70-category engineering taxonomy with 300 subtopics, live question counts, explanations, code samples, algorithm steps, and complexity data through the API. The API stores normalized content in SQLite and seeds the existing handbook content only when a new database is empty.

Users can create an email-and-password profile and save a personal knowledge-area order. Passwords are salted and hashed with scrypt, session tokens are stored as hashes, and the browser session uses an HTTP-only SameSite cookie. Ordering happens directly in the navigation and supports drag-and-drop, accessible up/down controls, alphabetical sorting, and restoration of the database default.

## Run locally

Requirements: Node.js 22.5 or newer (the project uses Node's built-in SQLite driver).

```powershell
cd C:\Interview\TechVibe
npm install
npm run dev
```

Open <http://localhost:5173>. The development command starts both the API on port 5000 and Vite on port 5173. Vite proxies `/api` to the API, so the browser uses same-origin requests.

The local database is created automatically at `server/data/techvibe.db`. SQLite can also create `techvibe.db-wal` and `techvibe.db-shm` while the application is running. Database files are excluded from Git. The versioned files in `content/batches` are the reproducible source used to prepare a fresh container database.

## Production-style local run

```powershell
npm run build
npm start
```

Open <http://localhost:5000>. The Node server serves both the API and the compiled frontend.

## Docker

Build and run the hardened container with persistent SQLite storage:

```powershell
Copy-Item .env.example .env
docker compose up -d --build
docker compose ps
```

Open <http://localhost:5000>. The named `techvibe-data` volume stores `/app/data/techvibe.db`, so replacing the container does not erase the database. The image runs as a non-root user with a read-only root filesystem, dropped Linux capabilities, and an application health check.

Inspect safe database counts without exposing password hashes:

```powershell
npm run data:inspect
docker compose exec techvibe node scripts/database-inspect.ts
```

See [DEPLOY_GCP_VM.md](./DEPLOY_GCP_VM.md) for the Google Cloud Compute Engine deployment runbook.

Optional environment variables:

- `PORT`: HTTP port, default `5000`
- `DATABASE_PATH`: SQLite database file, default `server/data/techvibe.db`
- `VITE_API_URL`: browser API base, default `/api`
- `CONTENT_API_KEY`: secret key of at least 32 characters that enables the content import endpoint

## Data model

- `technologies`: category metadata and display order
- `technology_subtopics`: ordered subtopics for each category
- `questions`: question metadata, code, complexity, and per-category order
- `question_explanations`: ordered answer paragraphs
- `question_pseudo_code`: ordered algorithm steps
- `users`: profile identity and salted password hashes
- `sessions`: hashed, expiring session tokens
- `user_category_order`: each user's saved category positions

The initial seed content remains in `src/data` as the first-run migration source. Once the database exists, all reads come from SQLite. Versioned content migrations can add or reorder categories without replacing user-managed questions.

Curated source references live in `content/sources.json`, and reproducible question batches live in `content/batches`. Import a batch through the protected API with `npm run content:import -- content/batches/<file>.json` after setting `CONTENT_API_KEY` and, for a remote deployment, `CONTENT_API_URL`.

See [content/README.md](./content/README.md) for the sourcing policy, batch workflow, quality gates, and progress commands.

## API

- `GET /api/health`
- `GET /api/technologies`
- `GET /api/questions?technology=react&page=1&limit=20`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `PUT /api/profile/category-order`
- `POST /api/content/import` (requires `X-API-Key`)

`page` and `limit` are validated positive integers, and `limit` is capped at 100.

## Add production content without an admin panel

Set a strong `CONTENT_API_KEY` in the hosting provider's server-side environment settings. Never put this key in `VITE_*`, browser code, source control, or a URL. Use HTTPS in production. You can generate a key locally with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Send the key in the `X-API-Key` header to `POST /api/content/import`. A request can add one category, up to 100 questions, or both. New categories and questions are appended to their existing default order. The import is atomic: if any category or question is invalid or already exists, nothing in that request is saved.

Example body for a new category and its first question:

```json
{
  "category": {
    "id": "web-performance",
    "name": "Web Performance",
    "description": "Browser and application performance engineering.",
    "iconName": "Globe",
    "subtopics": ["Core Web Vitals", "Rendering"]
  },
  "questions": [
    {
      "id": "web-performance-1",
      "technology": "web-performance",
      "title": "What is Largest Contentful Paint?",
      "questionType": "conceptual",
      "summary": "Explain the LCP user experience metric.",
      "explanation": [
        "LCP measures when the largest visible content element finishes rendering."
      ],
      "source": {
        "title": "Largest Contentful Paint - web.dev",
        "url": "https://web.dev/articles/lcp"
      }
    }
  ]
}
```

To add questions to an existing category, omit `category` and use its ID in each question's `technology` field. Each question requires `questionType` and `source` (`title` and HTTPS `url`). Optional question fields are `code` (`language` and `snippet`), `pseudoCode`, and `complexity` (`time` and `space`). Supported question types are `conceptual`, `code-explanation`, `debugging`, `scenario`, `comparison`, `algorithm`, and `system-design`. Supported category icons are `Atom`, `Globe`, `FileCode2`, `Server`, `Terminal`, `Cpu`, `Boxes`, `Database`, `Network`, `BookOpen`, `Braces`, `Coffee`, `Leaf`, and `Code2`.

Example PowerShell request:

```powershell
$headers = @{ 'X-API-Key' = $env:CONTENT_API_KEY }
$body = Get-Content -Raw .\content-import.json
Invoke-RestMethod -Method Post -Uri 'https://your-domain.example/api/content/import' -Headers $headers -ContentType 'application/json' -Body $body
```

The endpoint is disabled with `503` until a sufficiently long server-side key is configured. Invalid keys receive `401`, repeated invalid attempts are rate-limited, request bodies are limited to 1 MiB, and duplicate IDs or normalized duplicate content are rejected with `409`.

## Quality checks

```powershell
npm run check
```

This runs linting, database/API tests, TypeScript compilation, and the production build.
