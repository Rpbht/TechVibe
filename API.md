# TechVibe API Reference

This document describes the HTTP API exposed by the TechVibe Node.js backend.

## Overview

| Item | Value |
| --- | --- |
| API base path | `/api` |
| Local production-style URL | `http://localhost:5000/api` |
| Data format | JSON encoded as UTF-8 |
| User authentication | HTTP-only session cookie |
| Content-management authentication | Static API key in `X-API-Key` |
| Default request-body limit | 16 KiB |
| Content-import body limit | 1 MiB |

All API responses include:

```http
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
```

JSON request bodies must be objects. A JSON array or primitive at the root is rejected.

The API is currently unversioned. Its routes begin with `/api`, not `/api/v1`.

## Environments

During local development, Vite normally proxies `/api` to the Node.js server:

```text
Frontend: http://localhost:5173
API:      http://localhost:5000/api
```

After `npm run build` and `npm start`, the Node.js server serves both the frontend and API:

```text
Application: http://localhost:5000
API:         http://localhost:5000/api
```

The browser API base can be changed with `VITE_API_URL`. The server port can be changed with `PORT`.

## Authentication

### User sessions

Registration and login return a `techvibe_session` cookie. Browser clients should include credentials with requests:

```ts
fetch('/api/auth/me', { credentials: 'include' });
```

Session-cookie properties:

| Property | Value |
| --- | --- |
| Name | `techvibe_session` |
| Lifetime | 30 days |
| Path | `/` |
| HttpOnly | Yes |
| SameSite | `Lax` |
| Secure | Enabled for HTTPS requests |

Only a SHA-256 hash of the session token is stored in the database.

### Content API key

`POST /api/content/import` is protected by a server-side static API key. Configure a secret containing at least 32 characters:

```text
CONTENT_API_KEY=<strong-random-secret>
```

Send it in a header:

```http
X-API-Key: <strong-random-secret>
```

Generate a suitable key locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The key must remain in the hosting provider's server-side environment settings. Do not put it in:

- A `VITE_*` variable
- Browser or React source code
- A query parameter or URL
- Source control
- Public logs or screenshots

Use HTTPS in production. Anyone possessing the key can import content.

## Error format

Error responses use one consistent shape:

```json
{
  "error": "Human-readable error message."
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `200 OK` | Request completed successfully |
| `201 Created` | Content import completed successfully |
| `400 Bad Request` | Invalid parameters, JSON, or content fields |
| `401 Unauthorized` | Missing or invalid authentication |
| `404 Not Found` | Unknown `/api` route |
| `405 Method Not Allowed` | Known route called with the wrong HTTP method |
| `409 Conflict` | Email, category ID, or question ID already exists |
| `413 Content Too Large` | Request exceeds the applicable body-size limit |
| `429 Too Many Requests` | Authentication failures exceeded a rate limit |
| `500 Internal Server Error` | Unexpected server failure |
| `503 Service Unavailable` | Content import has no valid server-side API key configured |

## Endpoint summary

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | None | Check database availability |
| `GET` | `/api/technologies` | Optional session | List categories and question counts |
| `GET` | `/api/questions` | None | List paginated questions for one category |
| `GET` | `/api/auth/me` | Optional session | Return the current signed-in user |
| `POST` | `/api/auth/register` | None | Create a user and session |
| `POST` | `/api/auth/login` | None | Authenticate and create a session |
| `POST` | `/api/auth/logout` | Optional session | Delete and clear the current session |
| `PUT` | `/api/profile/category-order` | Session cookie | Save the user's complete category order |
| `POST` | `/api/content/import` | `X-API-Key` | Add a category and/or questions |

## Shared schemas

### User

```json
{
  "id": 1,
  "email": "engineer@example.com"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Database-generated user ID |
| `email` | string | Normalized to trimmed lowercase |

### Technology

```json
{
  "id": "react",
  "name": "React",
  "iconName": "Atom",
  "description": "Component-driven user interface engineering.",
  "subtopics": ["Components", "Hooks"],
  "questionCount": 3
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable category identifier |
| `name` | string | Display name |
| `iconName` | string | Name of the navigation icon |
| `description` | string | Category description |
| `subtopics` | string[] | Ordered subtopic names |
| `questionCount` | integer | Live count calculated from the database |

### Question

```json
{
  "id": "react-2",
  "technology": "react",
  "title": "Stale Closure and Memory Leak in Real-Time Listener",
  "questionType": "debugging",
  "summary": "Analyze an asynchronous event subscription hook.",
  "explanation": [
    "The callback captures state from the render in which the effect ran.",
    "Use a functional state update and close the socket during cleanup."
  ],
  "code": {
    "language": "typescript",
    "snippet": "setHistory((previous) => [...previous, data.price]);"
  },
  "pseudoCode": [
    "Receive and parse the message.",
    "Append the price using the latest state."
  ],
  "complexity": {
    "time": "O(n)",
    "space": "O(n)"
  },
  "source": {
    "title": "Synchronizing with Effects - React",
    "url": "https://react.dev/learn/synchronizing-with-effects"
  }
}
```

| Field | Type | Required in import | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique question ID |
| `technology` | string | Yes | Existing or concurrently imported category ID |
| `title` | string | Yes | Question heading |
| `questionType` | string | Yes | Question format classification |
| `summary` | string | No | Short introduction |
| `explanation` | string[] | Yes | One or more answer paragraphs |
| `code` | object | No | One formatted code snippet |
| `code.language` | string | If `code` is present | Language label used by the code block |
| `code.snippet` | string | If `code` is present | Multiline source code |
| `pseudoCode` | string[] | No | Ordered algorithm steps |
| `complexity` | object | No | Complexity analysis |
| `complexity.time` | string | If `complexity` is present | Time-complexity text |
| `complexity.space` | string | If `complexity` is present | Space-complexity text |
| `source` | object | Yes | Attribution for the material used to create the question |
| `source.title` | string | Yes | Human-readable source title |
| `source.url` | string | Yes | HTTPS source URL |

Supported `questionType` values are `conceptual`, `code-explanation`, `debugging`, `scenario`, `comparison`, `algorithm`, and `system-design`.

The UI has enhanced syntax highlighting for `typescript`, `javascript`, `jsx`, `tsx`, `python`, `go`/`golang`, `sql`, `docker`, `java`, `c`, `cpp`, `csharp`, `bash`, `json`, `kotlin`, `rust`, and `swift`. Other language values are accepted and still render in the code panel, but may not receive language-specific highlighting.

The current UI displays `pseudoCode` inside the code section. Include `code` when algorithm steps must be visible.

## Health

### `GET /api/health`

Checks whether the backend can query the database.

Authentication: none.

#### Successful response

```http
HTTP/1.1 200 OK
```

```json
{
  "status": "ok"
}
```

The response status field can be `ok` or `unavailable`. An unexpected database exception may instead produce `500`.

## Categories

### `GET /api/technologies`

Returns all categories, their ordered subtopics, and live question counts.

Authentication: optional session cookie.

When a valid session cookie is present, the user's saved category order is applied. Categories that were added after the user saved an order appear after the explicitly ordered categories.

#### Query parameters

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `default` | string | No | `false` | Use `true` to ignore the user's saved order and return database-default order |

Only the exact value `true` activates default ordering.

#### Example request

```http
GET /api/technologies?default=true HTTP/1.1
Host: localhost:5000
```

#### Successful response

```http
HTTP/1.1 200 OK
```

```json
[
  {
    "id": "general-engineering",
    "name": "General Engineering Fundamentals",
    "iconName": "BookOpen",
    "description": "Core engineering principles.",
    "subtopics": ["Problem Solving", "Code Quality"],
    "questionCount": 0
  },
  {
    "id": "java",
    "name": "Java",
    "iconName": "Coffee",
    "description": "Java language and runtime concepts.",
    "subtopics": ["JVM", "Collections"],
    "questionCount": 2
  }
]
```

## Questions

### `GET /api/questions`

Returns a paginated list of questions for one category.

Authentication: none.

#### Query parameters

| Parameter | Type | Required | Default | Constraints |
| --- | --- | --- | --- | --- |
| `technology` | string | Yes | None | Non-empty category ID |
| `page` | integer | No | `1` | From 1 through 1,000,000 |
| `limit` | integer | No | `20` | From 1 through 100 |

#### Example request

```http
GET /api/questions?technology=react&page=1&limit=1 HTTP/1.1
Host: localhost:5000
```

#### Successful response

```http
HTTP/1.1 200 OK
```

```json
{
  "data": [
    {
      "id": "react-1",
      "technology": "react",
      "title": "Explain React reconciliation",
      "explanation": [
        "React compares element trees to determine the minimum required DOM updates."
      ]
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 1,
  "totalPages": 3
}
```

An unknown category is not treated as an error. It returns `200 OK` with an empty `data` array, `total: 0`, and `totalPages: 0`.

#### Error responses

| Status | Cause |
| --- | --- |
| `400` | Missing `technology` |
| `400` | `page` or `limit` is not a positive integer or exceeds its maximum |

## Authentication

### `GET /api/auth/me`

Returns the current user when a valid session cookie is present.

Authentication: optional session cookie.

#### Signed-in response

```json
{
  "user": {
    "id": 1,
    "email": "engineer@example.com"
  }
}
```

#### Anonymous response

```json
{
  "user": null
}
```

Both cases return `200 OK`.

### `POST /api/auth/register`

Creates a user, creates a session, and returns the profile.

Authentication: none.

#### Request headers

```http
Content-Type: application/json
```

#### Request body

```json
{
  "email": "engineer@example.com",
  "password": "a-secure-password"
}
```

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `email` | string | Yes | Valid email-like format; maximum 254 characters; normalized to lowercase |
| `password` | string | Yes | 8 through 128 characters |

#### Successful response

```http
HTTP/1.1 200 OK
Set-Cookie: techvibe_session=<token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000
```

```json
{
  "user": {
    "id": 1,
    "email": "engineer@example.com"
  }
}
```

Passwords are salted and hashed with scrypt. Plaintext passwords are not stored.

#### Error responses

| Status | Cause |
| --- | --- |
| `400` | Invalid email or password length |
| `409` | Email already has an account |
| `413` | Body exceeds 16 KiB |

### `POST /api/auth/login`

Authenticates a user, creates a session, and returns the profile.

Authentication: none.

#### Request body

```json
{
  "email": "engineer@example.com",
  "password": "a-secure-password"
}
```

#### Successful response

Returns `200 OK`, the same `{ "user": ... }` shape as registration, and a `techvibe_session` cookie.

#### Error responses

| Status | Cause |
| --- | --- |
| `401` | Email or password is incorrect |
| `429` | Five failed attempts occurred for the same IP-and-email pair within 15 minutes |

The failure counter is held in process memory and resets if the Node.js process restarts.

### `POST /api/auth/logout`

Deletes the current database session when present and clears the browser cookie.

Authentication: optional session cookie.

#### Successful response

```json
{
  "success": true
}
```

This endpoint returns `200 OK` even when the caller does not have an active session.

## Personal category ordering

### `PUT /api/profile/category-order`

Replaces the signed-in user's complete category order.

Authentication: required session cookie.

#### Request body

```json
{
  "categoryIds": [
    "general-engineering",
    "java",
    "spring-boot",
    "react",
    "angular"
  ]
}
```

`categoryIds` must contain every current category ID exactly once. Partial lists, duplicates, unknown IDs, and missing IDs are rejected.

#### Successful response

```json
{
  "success": true
}
```

#### Error responses

| Status | Cause |
| --- | --- |
| `400` | `categoryIds` is not a string array |
| `400` | Array does not contain every category exactly once |
| `401` | No valid session cookie |

## Content import

### `POST /api/content/import`

Adds one new category, up to 100 new questions, or both in one atomic database transaction. It does not update or delete existing records.

Authentication: required `X-API-Key` header.

#### Request headers

```http
Content-Type: application/json
X-API-Key: <CONTENT_API_KEY>
```

#### Root request schema

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `category` | object | Conditional | One new category; omit when only adding questions |
| `questions` | array | Conditional | Zero through 100 new questions |

At least one category or question must be supplied.

#### Category schema

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `id` | string | Yes | 1-80 characters; lowercase letters, numbers, and single hyphens only |
| `name` | string | Yes | 1-120 trimmed characters |
| `description` | string | Yes | 1-500 trimmed characters |
| `iconName` | string | No | Defaults to `Code2`; must be a supported icon name |
| `subtopics` | string[] | No | Maximum 100 entries; each entry contains 1-120 trimmed characters |

Supported `iconName` values:

```text
Atom, Globe, FileCode2, Server, Terminal, Cpu, Boxes,
Database, Network, BookOpen, Braces, Coffee, Leaf, Code2
```

New categories are appended to the database-default order.

#### Question import schema

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `id` | string | Yes | 1-80 characters; lowercase letters, numbers, and single hyphens only; globally unique |
| `technology` | string | Yes | Existing category ID or the category included in this request |
| `title` | string | Yes | 1-300 trimmed characters |
| `questionType` | string | Yes | One supported question type |
| `summary` | string | No | 1-2,000 trimmed characters when supplied |
| `explanation` | string[] | Yes | 1-30 paragraphs; each paragraph contains 1-5,000 trimmed characters |
| `code` | object | No | One code block |
| `code.language` | string | If `code` exists | 1-50 trimmed characters |
| `code.snippet` | string | If `code` exists | 1-50,000 trimmed characters |
| `pseudoCode` | string[] | No | Maximum 50 steps; each step contains 1-1,000 trimmed characters |
| `complexity` | object | No | Requires both `time` and `space` |
| `complexity.time` | string | If `complexity` exists | 1-100 trimmed characters |
| `complexity.space` | string | If `complexity` exists | 1-100 trimmed characters |
| `source` | object | Yes | Source-attribution object |
| `source.title` | string | Yes | 1-200 trimmed characters |
| `source.url` | string | Yes | Valid HTTPS URL; maximum 2,048 characters |

Supported question types:

```text
conceptual, code-explanation, debugging, scenario,
comparison, algorithm, system-design
```

New questions are appended to their category's existing question order.

#### Example: create a category and code question

```json
{
  "category": {
    "id": "web-performance",
    "name": "Web Performance",
    "description": "Browser and application performance engineering.",
    "iconName": "Globe",
    "subtopics": [
      "Core Web Vitals",
      "Rendering",
      "Network Performance"
    ]
  },
  "questions": [
    {
      "id": "web-performance-1",
      "technology": "web-performance",
      "title": "How can a long JavaScript task affect Interaction to Next Paint?",
      "questionType": "scenario",
      "summary": "Explain the scheduling issue and show one way to yield to the browser.",
      "explanation": [
        "A long synchronous task blocks the main thread, delaying input handling and the next visual update.",
        "Break large work into smaller units and yield between units so higher-priority browser work can run."
      ],
      "code": {
        "language": "javascript",
        "snippet": "for (const chunk of chunks) {\n  processChunk(chunk);\n  await scheduler.yield();\n}"
      },
      "pseudoCode": [
        "Split the expensive work into bounded chunks.",
        "Process one chunk.",
        "Yield control before processing the next chunk."
      ],
      "complexity": {
        "time": "O(n)",
        "space": "O(1), excluding input and output"
      },
      "source": {
        "title": "Optimize Interaction to Next Paint - web.dev",
        "url": "https://web.dev/articles/optimize-inp"
      }
    }
  ]
}
```

#### Example: add questions to an existing category

Omit `category` and use the existing category ID in `technology`:

```json
{
  "questions": [
    {
      "id": "react-4",
      "technology": "react",
      "title": "Why should this state update use a functional updater?",
      "questionType": "code-explanation",
      "summary": "Identify and correct the stale closure.",
      "explanation": [
        "The direct update can capture history from an older render.",
        "The functional updater receives the latest committed state."
      ],
      "code": {
        "language": "typescript",
        "snippet": "setHistory((previous) => [...previous, price]);"
      },
      "source": {
        "title": "Queueing a Series of State Updates - React",
        "url": "https://react.dev/learn/queueing-a-series-of-state-updates"
      }
    }
  ]
}
```

#### Successful response

```http
HTTP/1.1 201 Created
```

```json
{
  "categoriesAdded": 1,
  "questionsAdded": 1
}
```

The entire request is transactional. If validation or persistence fails for any item, no category or question from that request is saved.

#### Error responses

| Status | Cause |
| --- | --- |
| `400` | Invalid field, malformed ID, empty import, duplicate question ID within the request, or unknown category |
| `401` | Missing or incorrect `X-API-Key` |
| `409` | Category ID or question ID already exists, or normalized question content duplicates an existing question |
| `413` | Body exceeds 1 MiB |
| `429` | Ten invalid API-key attempts occurred from the same IP within 15 minutes |
| `503` | `CONTENT_API_KEY` is missing or shorter than 32 characters |

The failed-key counter is held in process memory and resets if the Node.js process restarts.

#### PowerShell example

Save the JSON request as `content-import.json`, then run:

```powershell
$headers = @{ 'X-API-Key' = $env:CONTENT_API_KEY }
$body = Get-Content -Raw .\content-import.json

Invoke-RestMethod `
  -Method Post `
  -Uri 'https://your-domain.example/api/content/import' `
  -Headers $headers `
  -ContentType 'application/json' `
  -Body $body
```

#### cURL example

```bash
curl --request POST 'https://your-domain.example/api/content/import' \
  --header 'Content-Type: application/json' \
  --header "X-API-Key: $CONTENT_API_KEY" \
  --data-binary '@content-import.json'
```

## Operational notes

- The content endpoint is create-only. Existing categories and questions cannot currently be edited or deleted through the API.
- Category and question IDs should be treated as permanent public identifiers.
- Imports do not use idempotency keys. Repeating a successful import produces `409 Conflict` because the IDs already exist.
- Imported questions include a normalized SHA-256 content fingerprint to reject exact normalized duplicates even when their IDs differ.
- SQLite must be stored on a persistent production volume and backed up regularly.
- The application currently expects same-origin browser requests and does not emit permissive cross-origin resource-sharing headers.
- Place the application behind HTTPS and a reverse proxy that applies request logging, general rate limiting, and body-size limits.
- Rotate `CONTENT_API_KEY` immediately if it is exposed.
