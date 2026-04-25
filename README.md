# HNG14 Stage 1 API

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

4. Seed the database (2026 profiles):

```bash
npm run prisma:seed
```

5. Run locally:

```bash
npm run dev
```

## Endpoints

- POST /api/profiles
- GET /api/profiles/:id
- GET /api/profiles
- GET /api/profiles/search?q=
- DELETE /api/profiles/:id

## GET /api/profiles

Supports combined filtering, sorting, and pagination in one request.

### Supported filters

- gender: male | female
- age_group: child | teenager | adult | senior
- country_id: ISO alpha-2 code (example: NG, KE)
- min_age: integer >= 0
- max_age: integer >= 0
- min_gender_probability: number between 0 and 1
- min_country_probability: number between 0 and 1

All provided filters are combined with AND logic.

### Sorting

- sort_by: age | created_at | gender_probability
- order: asc | desc

Defaults: sort_by=created_at, order=desc.

### Pagination

- page: integer >= 1, default 1
- limit: integer between 1 and 50, default 10

### Example

```http
GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

## GET /api/profiles/search

Natural-language endpoint for rule-based query parsing.

### Query parameters

- q: required natural-language query
- page: optional, same validation as GET /api/profiles
- limit: optional, same validation as GET /api/profiles

### Example

```http
GET /api/profiles/search?q=young males from nigeria&page=1&limit=10
```

## Natural-language parsing approach

The parser is deterministic and keyword based (no AI, no LLM usage). It performs:

1. Normalization: lowercases query and strips punctuation noise.
2. Token detection: detects gender keywords, age-group keywords, age-bound phrases, and country aliases.
3. Filter composition: merges all detected rules into one filter object.
4. Execution: runs through the same filtering + pagination engine used by GET /api/profiles.

### Supported keyword mapping

- young -> min_age=16 and max_age=24
- male, males, man, men, boy, boys -> gender=male
- female, females, woman, women, girl, girls -> gender=female
- child, children, kid, kids -> age_group=child
- teen, teens, teenager, teenagers -> age_group=teenager
- adult, adults -> age_group=adult
- senior, seniors, elderly -> age_group=senior
- above N, over N, older than N, at least N -> min_age=N
- below N, under N, younger than N, at most N -> max_age=N
- from <country> (name aliases and selected ISO codes) -> country_id=<ISO2>

If both male and female are present in the same query, gender is not constrained.

### Mapping examples

- young males -> gender=male + min_age=16 + max_age=24
- females above 30 -> gender=female + min_age=30
- people from angola -> country_id=AO
- adult males from kenya -> gender=male + age_group=adult + country_id=KE
- male and female teenagers above 17 -> age_group=teenager + min_age=17

## Validation and errors

All errors use this exact shape:

## Error response shape

```json
{ "status": "error", "message": "<error message>" }
```

### Status behavior

- 400 Bad Request
	- Missing or empty required parameters (example: missing q in /search)
	- Query text cannot be interpreted in /search
- 422 Unprocessable Entity
	- Invalid query parameter values or types
	- Unknown query parameters
	- Invalid pagination, sort, or filter values
	- Message: Invalid query parameters
- 404 Not Found
	- Profile not found
- 500 Internal Server Error
	- Unexpected server failure
- 502 Bad Gateway
	- Upstream API invalid response

## Notes

- Database seeding is idempotent through unique name + createMany(skipDuplicates).
- IDs are generated as UUID v7.
- Timestamp responses are UTC ISO 8601.
- CORS header Access-Control-Allow-Origin: * is enabled.

## Natural-language parser limitations

- It supports keyword and phrase rules only. Complex grammar, sentiment, or intent inference is out of scope.
- It does not support nested logic such as grouped clauses or explicit OR expressions.
- It only supports supported aliases; uncommon country nicknames may not resolve.
- Ambiguous text that produces no valid filters returns: Unable to interpret query.
- When both gender groups are present in one sentence, the parser intentionally does not apply a gender filter.
