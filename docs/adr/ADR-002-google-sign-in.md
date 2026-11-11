# ADR-002 — Continue with Google (OIDC through the BFF)

- **Status:** Proposed (2026-11-10) — needs owner approval before US-01-11-api/web specs are approved
- **Deciders:** project owner
- **Related:** EPIC-01 §3.8 (GOOG-01–08), BRD BR-033, FR-047, D18–D21; AGENTS.md §3.2–3.5, §3.12

## Context

Registration and sign-in with Google were added to MVP (D18–D21). This changes the auth
boundary: an external identity provider now takes part in sign-in. AGENTS.md requires:

- NestJS is the only authority for authentication and credential issuance;
- the browser only holds an opaque HttpOnly session cookie, never tokens;
- the browser talks only to the same-origin BFF, never to NestJS.

## Decision

1. **Flow:** OpenID Connect authorization code flow with PKCE (`S256`), `state` and `nonce`.
   Scopes `openid email profile`. `prompt=select_account` for sign-in; `prompt=login` with
   `max_age` for deletion re-authentication (D21).
2. **BFF owns the browser leg** (same origin, no NestJS exposure):
   - `GET /api/auth/google/start?intent=signin|reauth&returnTo=…` — creates `state`, `nonce`
     and the PKCE verifier and stores them, with browser timezone, locale and the validated
     `returnTo`, in a short-lived (≤ 10 min), HttpOnly, Secure, `SameSite=Lax` flow cookie
     (encrypted or bound to a server-side record). Then it redirects to Google.
   - `GET /api/auth/google/callback` — checks `state` against the flow cookie, deletes the
     cookie, and sends `code`, `codeVerifier`, `nonce`, `redirectUri`, timezone and locale to
     NestJS. It then creates the BFF session from the returned credentials exactly like Login or
     Register. A new account goes to `/welcome`, an existing one to `/dashboard` or the
     revalidated `returnTo`. On any error it redirects to the start page with an error flag.
     It never logs `code` or the query string.
3. **NestJS owns the decision:**
   - holds the client secret;
   - exchanges the code with Google;
   - validates the ID token: signature via Google JWKS, `iss`, `aud` = client id, `exp`, `nonce`;
   - requires `email_verified`;
   - resolves the account per BR-033 (`sub` → email link → create through
     `workflows/registration` in one Unit of Work);
   - applies single-session revocation and returns the normal credentials plus
     `isNewAccount`.

   Google access and refresh tokens are discarded.

4. **Data (`app` schema, Identity module):**
   - new table `external_identities` (`user_id`, `provider`, `subject`, `email_at_link`,
     `linked_at`), unique `(provider, subject)` and unique `(user_id, provider)`;
   - `users.password_hash` becomes nullable;
   - the consent timestamp is stored for both registration paths.
5. **Outbox:** the `UserRegistered` event carries `emailVerified`. The dispatcher sends a
   verification email only when it is `false`.
6. **Deletion re-auth (D21):** `intent=reauth` returns a one-time re-auth proof from NestJS. The
   proof is valid only for the same `sub`, with `auth_time` at most 5 minutes old. The delete
   endpoint requires it for Google-only accounts.
7. **Configuration:**
   - NestJS: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`;
   - BFF: `GOOGLE_CLIENT_ID`, `GOOGLE_REDIRECT_URI`;
   - an exact redirect URI per environment, registered in Google Cloud.

   Secrets live only in environment configuration, never in the repository.

## Options left open (decide in US-01-11-api CLARIFICATION / SPECIFICATION)

- **OIDC library:** `openid-client` in NestJS (full OIDC including discovery and JWKS), or
  `google-auth-library` (`OAuth2Client.getToken` + `verifyIdToken`). `openid-client` is
  recommended because it is provider-agnostic and handles PKCE/nonce.
- **Flow state:** encrypted cookie only, or a cookie that points to a `bff` schema record.
- **Endpoint names and DTOs:** finalized in OpenAPI.

## Alternatives rejected

- **The BFF exchanges the code and sends the ID token to NestJS.** The client secret would sit
  in the BFF, and the BFF would become part of authentication.
- **Google Identity Services one-tap / popup in the browser.** The ID token would pass through
  client code (NFR-001) and a third-party script would run on auth pages (§7.8).
- **NextAuth/Auth.js.** It brings its own session model, which would duplicate the approved
  BFF session store and NestJS credential authority.

## Consequences

- One new external dependency. When Google is down, Google-only users must use Forgot
  Password to get a password (D20).
- `password_hash` nullable: Login, Change Password and deletion code must handle "no password".
- Tests: a fake OIDC provider (or stubbed token endpoint and JWKS) for NestJS integration tests,
  and a mocked NestJS client for the BFF callback handler.
