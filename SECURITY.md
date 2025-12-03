# Security & Privacy

## Token Security

We use **HMAC-SHA256** to sign tracking links. This ensures:
1. **Integrity:** The score or email cannot be tampered with in the URL.
2. **Authenticity:** Only the server with the `EMAIL_SIGNING_KEY` can generate valid links.

### Key Rotation
To rotate the key:
1. Generate a new key.
2. Update the `EMAIL_SIGNING_KEY` environment variable.
3. **Note:** Old links will immediately become invalid. It is recommended to rotate keys only between campaigns.

## Privacy (GDPR/CCPA)

- **IP Addresses:** We do not store raw IP addresses. IPs are hashed (SHA-256) before storage to allow for abuse detection (rate limiting) without storing PII.
- **Data Retention:** Admin exports allow you to manage and delete data as requested by users.

## Admin Access

- The `/api/admin/*` endpoints are protected by `x-admin-api-key` header (or `?key=` query param for CSV export convenience).
- Keep the `ADMIN_API_KEY` secure and rotate it if leaked.

