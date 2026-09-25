# TechVibe Content Program

## Target

- 70 categories
- Approximately 1,000 questions per category
- No difficulty classification
- Supported question types: conceptual, code explanation, debugging, scenario, comparison, algorithm, and system design
- Every imported question includes a verification source

## Content policy

Questions and explanations must be original writing derived from authoritative or reputable public material. Do not copy proprietary interview banks, tutorials, or documentation prose verbatim.

Each question must:

1. Use a stable, unique lowercase ID.
2. Belong to an existing category.
3. Declare one supported `questionType`.
4. Provide at least one substantive explanation paragraph.
5. Include a direct HTTPS source title and URL.
6. Avoid duplicating an existing question's meaning or normalized content.
7. Include correct, runnable-looking code when a code snippet is present.

## Files

- `sources.json` contains the source registry for all 70 categories.
- `batches/*.json` contains versioned, reproducible import batches.
- The SQLite database is the runtime source of truth but is not committed to source control.

## Import a batch

Set the production API URL and secret key, then import a versioned batch:

```powershell
$env:CONTENT_API_URL = 'https://your-domain.example/api'
$env:CONTENT_API_KEY = '<server-side-content-key>'
npm run content:import -- content/batches/<batch-name>.json
```

Validate a file without importing it:

```powershell
npm run content:import -- content/batches/<batch-name>.json --dry-run
```

## Check progress

With the application running:

```powershell
npm run content:report
```

## Current versioned batches

| Batch | Questions | Coverage |
| --- | ---: | --- |
| `foundation-priority-001.json` | 25 | First five priority categories |
| `coverage-all-categories-001.json` | 65 | One question for every remaining category |
| `priority-expansion-002.json` | 50 | Additional depth for the first five categories |
| `java-expansion-003.json` | 100 | Source-grounded Java expansion |
| `spring-boot-expansion-004.json` | 100 | Source-grounded Spring Boot expansion |
| `react-expansion-005.json` | 100 | Source-grounded React expansion |
| `angular-expansion-006.json` | 100 | Source-grounded Angular expansion |
| `general-engineering-expansion-007.json` | 100 | Source-grounded General Engineering expansion |
| `java-backend-expansion-008.json` | 300 | 200 Java and 100 Backend Engineering questions |

The repository currently contains 940 new sourced questions in versioned batches. After all batches are imported, the runtime database also retains 14 original seed questions, for 954 questions total. Java has 315 questions, Backend Engineering has 101, General Engineering, Spring Boot, and Angular have 115 each, and React has 118.

## Quality gates

Run `npm run check` before importing or publishing a batch. Automated checks verify category coverage, HTTPS sources, supported question types, unique versioned IDs, API behavior, TypeScript compilation, and the production build.
