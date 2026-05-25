# Campus Connect Backend Contract

This file documents the backend shape expected by the frontend service layer.

## Environment

Set the frontend environment variable:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## Authentication

### POST `/auth/login`

Request:

```json
{
  "email": "admin@campusconnect.test",
  "password": "admin123"
}
```

Response:

```json
{
  "id": "u-admin",
  "name": "Admin User",
  "email": "admin@campusconnect.test",
  "role": "admin",
  "token": "jwt-or-session-token"
}
```

## Items

### GET `/items`

Returns an array of item records.

### POST `/items`

Creates a record. The frontend sends:

```json
{
  "type": "Found",
  "title": "Green Hydro Flask",
  "category": "Bottle",
  "location": "CCIS Lobby",
  "date": "2026-05-18",
  "status": "Unclaimed",
  "priority": "Normal",
  "reporterName": "Mika Santos",
  "reporterEmail": "mika@campus.edu",
  "contactNumber": "0917 123 4567",
  "description": "Found beside the second-floor bench.",
  "claimInstructions": "Describe the item before claiming."
}
```

### PUT `/items/:id`

Updates a record using the same payload shape as `POST /items`.

### DELETE `/items/:id`

Deletes a record. A `204 No Content` response is acceptable.

## Audit Logs

### GET `/audit-logs`

Returns:

```json
[
  {
    "id": "log-9001",
    "action": "Created record",
    "itemTitle": "Green Hydro Flask",
    "actor": "Lost and Found Staff",
    "timestamp": "2026-05-18T09:25:00.000Z"
  }
]
```

## Security Notes

- Hash passwords in the backend.
- Validate and sanitize all input server-side, even though the frontend validates too.
- Restrict delete access to admin users.
- Restrict update and resolve actions to staff or admin users.
- Use parameterized queries or ORM query builders to prevent SQL injection.
