# LeadLens API — Documentation

**Base URL:** `https://leadlens-api.railway.app/api`  
**Format:** All requests and responses are JSON.  
**Auth:** No auth required on chat endpoints (rate limited). Dashboard endpoints use CORS origin check.

---

## Rate Limits

| Endpoint pattern | Limit          |
|------------------|----------------|
| `/api/*`         | 100 req / 15 min |
| `/api/chat/*`    | 50 req / 5 min   |

Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Endpoints

### Health Check

**GET** `/health`

```json
{ "status": "ok", "ts": "2025-01-15T10:30:00.000Z" }
```

---

### Chat

#### Start Session

**POST** `/chat/start`

Initiates a new qualification conversation.

| Field      | Type   | Required | Values                   |
|------------|--------|----------|--------------------------|
| `lead_type`| string | yes      | `"founder"`, `"investor"` |

**Success Response (200)**

```json
{
  "session_id" : "3f7e1a20-...",
  "lead_type"  : "founder",
  "step"       : 0,
  "total_steps": 20,
  "question"   : "👋 Welcome to LeadLens!...",
  "step_key"   : "full_name",
  "type"       : "text",
  "options"    : null,
  "required"   : true,
  "progress"   : 0
}
```

**Error Responses**

| Status | Reason                        |
|--------|-------------------------------|
| 400    | Invalid `lead_type`           |
| 429    | Rate limit exceeded           |

---

#### Send Message

**POST** `/chat/message`

Submit an answer and receive the next question.

| Field        | Type          | Required |
|--------------|---------------|----------|
| `session_id` | UUID string   | yes      |
| `value`      | string/array  | yes      |

For `multiselect` fields, `value` can be a comma-separated string or array.  
For `boolean` fields, `value` should be `"yes"` or `"no"`.

**Mid-flow Response (200)**

```json
{
  "completed"  : false,
  "step"       : 2,
  "total_steps": 20,
  "question"   : "...",
  "step_key"   : "phone",
  "type"       : "phone",
  "options"    : null,
  "required"   : false,
  "progress"   : 10
}
```

`type` values:  
- `"text"` — free-form text  
- `"email"` — validated email  
- `"phone"` — phone number  
- `"url"` — validated URL  
- `"number"` — numeric input  
- `"boolean"` — yes/no  
- `"select"` — single choice from `options[]`  
- `"multiselect"` — multiple choices from `options[]`

**Completion Response (200)**

```json
{
  "completed"      : true,
  "score"          : 82,
  "status"         : "hot",
  "breakdown"      : {
    "problem_clarity"    : 13,
    "mvp_maturity"       : 20,
    "traction"           : 18,
    "team_strength"      : 13,
    "funding_readiness"  : 9,
    "validation_evidence": 9
  },
  "closing_message": "🔥 Amazing, Priya!..."
}
```

`status` values: `"hot"` | `"good"` | `"maybe"` | `"low"`

**Validation Error (422)**

```json
{
  "error" : "Please enter a valid email address.",
  "retry" : true
}
```

**Error Responses**

| Status | Reason                              |
|--------|-------------------------------------|
| 400    | Missing/invalid `session_id`        |
| 404    | Session not found                   |
| 400    | Session already completed           |
| 422    | Validation error (retry allowed)    |
| 429    | Rate limit                          |

---

#### Get Session

**GET** `/chat/session/:id`

Returns session metadata and full message history.

```json
{
  "session": {
    "id"          : "3f7e1a20-...",
    "lead_type"   : "founder",
    "state"       : "completed",
    "current_step": 20,
    "started_at"  : "2025-01-15T10:00:00Z",
    "completed_at": "2025-01-15T10:12:00Z"
  },
  "messages": [
    { "role": "bot",  "content": "👋 Welcome...", "step_key": "full_name", "created_at": "..." },
    { "role": "user", "content": "Priya Sharma",  "step_key": "full_name", "created_at": "..." }
  ]
}
```

---

### Leads

#### List Leads

**GET** `/leads`

Returns paginated leads from both tables via the `lead_overview` view.

**Query Parameters**

| Param      | Type    | Default      | Description                          |
|------------|---------|--------------|--------------------------------------|
| `type`     | string  | —            | Filter by `founder` or `investor`    |
| `status`   | string  | —            | Filter by `hot/good/maybe/low`       |
| `search`   | string  | —            | Search `full_name` or `email` (ILIKE)|
| `page`     | integer | `1`          | Page number                          |
| `limit`    | integer | `20`         | Results per page                     |
| `sort_by`  | string  | `created_at` | `created_at`, `score`, `full_name`  |
| `sort_dir` | string  | `desc`       | `asc` or `desc`                      |

**Response**

```json
{
  "total": 124,
  "page" : 1,
  "limit": 20,
  "data" : [
    {
      "type"      : "founder",
      "id"        : "...",
      "full_name" : "Priya Sharma",
      "email"     : "priya@startup.io",
      "score"     : 82,
      "status"    : "hot",
      "created_at": "2025-01-15T10:12:00Z"
    }
  ]
}
```

---

#### Get Lead Detail

**GET** `/leads/:type/:id`

Returns the complete lead record from the relevant table.  
`type` must be `"founder"` or `"investor"`.

---

#### Update Notes

**PATCH** `/leads/:type/:id/notes`

Update internal team notes.

```json
{ "internal_notes": "Strong team, follow up next week." }
```

Returns the updated lead record.

---

### Dashboard

#### Analytics Stats

**GET** `/dashboard/stats`

```json
{
  "total_leads"  : 124,
  "average_score": 58,
  "by_status": [
    { "status": "hot",   "count": "23" },
    { "status": "good",  "count": "41" },
    { "status": "maybe", "count": "38" },
    { "status": "low",   "count": "22" }
  ],
  "by_type": [
    { "type": "founder",  "count": "89", "avg_score": "61" },
    { "type": "investor", "count": "35", "avg_score": "51" }
  ],
  "recent_leads": [...],
  "weekly_trend": [
    { "week": "2025-01-06T00:00:00Z", "count": "31", "avg_score": "59" }
  ],
  "funnel": {
    "total_sessions": 189,
    "completed"     : "124",
    "abandoned"     : "65"
  }
}
```

---

## Error Envelope

All error responses follow this shape:

```json
{
  "error": "Human-readable error message"
}
```

In development, a `stack` field is also included for debugging.

---

## Changelog

| Version | Date       | Notes                            |
|---------|------------|----------------------------------|
| 1.0.0   | 2025-01-15 | Initial release                  |
