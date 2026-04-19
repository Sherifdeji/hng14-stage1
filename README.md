# HNG Stage 1 API

Express + TypeScript API that creates and persists profile intelligence from:

- Genderize API
- Agify API
- Nationalize API

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env
```

3. Create migration and generate Prisma client:

```bash
npx prisma migrate dev --name init
npm run prisma:generate
```

4. Run locally:

```bash
npm run dev
```

## Endpoints

- POST /api/profiles
- GET /api/profiles/:id
- GET /api/profiles?gender=&country_id=&age_group=
- DELETE /api/profiles/:id

## Error response shape

```json
{ "status": "error", "message": "<error message>" }
```

## Notes

- Duplicate names are handled idempotently via normalized unique name.
- IDs are generated as UUID v7.
- Timestamp responses are UTC ISO 8601.
- CORS header Access-Control-Allow-Origin: \* is enabled.
