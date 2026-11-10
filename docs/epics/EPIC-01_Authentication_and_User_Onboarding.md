# EPIC-01 — Authentication and User Onboarding

**Product:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-01-auth/`](../design/mockups/epic-01-auth/) — index with sources and corrections: [design/README.md](../design/README.md#epic-01--authentication--onboarding)  
**Status:** Business rules and desktop UI/UX approved; technical contracts proposed where explicitly noted. Sign in with Google (§3.8) approved 2026-11-10 (D18–D21); mockups `epic-01-auth/google-sign-in-screens.png` with corrections in the design README; its technical flow is a proposed ADR ([ADR-002](../adr/ADR-002-google-sign-in.md))  
**Language:** English. Default product UI language: English; English (en) and Ukrainian (uk) are mandatory in the first MVP release. Ukrainian may be implemented during MVP hardening after core epics, but before launch.  
**Scope:** MVP  
**Related epics:** EPIC-02 Projects, EPIC-03 Goals, EPIC-06 Weekly Focus, EPIC-09 Settings & Localization (no separate document; specified in BRD §8.2: FR-008–FR-011, FR-046)

## 1. Purpose and outcomes

Provide secure account creation and login (email/password or Google), session lifecycle, email verification, password recovery, and optional first-time product setup. Registration creates a personal workspace automatically. Email verification is non-blocking and does not restrict MVP functionality. Users may skip any onboarding step without losing successfully saved data.

## 2. Scope

### Included
- Registration with full name, email, password, password confirmation, and Terms/Privacy consent.
- Atomic provisioning of User, personal Workspace, OWNER Membership, and transactional outbox event.
- Automatic sign-in after successful registration.
- Email/password login and logout, single-active-session policy, expiration and recovery.
- **Continue with Google** on Registration, Login and Session Expired: one flow that registers a new user or signs in an existing one, including automatic linking by verified email (§3.8).
- Email verification with resend, Dashboard reminder, email status on the Account page (A9), and email template.
- Forgot Password / Reset Password with one-time links and global session revocation.
- Optional Welcome → first Project → first Goal → Weekly Focus onboarding.
- Approved desktop states with English-first UI copy and localization-ready message architecture; Ukrainian translation may be implemented after core epics but must be complete before the first MVP release.

### Excluded from MVP
- Social login providers other than Google; unlinking or managing connected accounts; linking a Google account whose email differs from the account email.
- MFA, team invitation/collaboration UI, Remember Me, AI onboarding, timers, gamification, dark mode.
- Change Password UI (EPIC-09 Settings), although the shared password policy applies.
- Detailed Project, Goal, and Weekly Focus domain rules, owned by their respective epics.

## 3. Approved business rules

### 3.1 Registration

**REG-01.** Required: Full Name, Email, Password, Confirm Password, and explicit Terms/Privacy consent (on the Google path, consent is given by the button text instead, GOOG-03). Full Name is trimmed and 2–100 characters long (approved, D12). Email uniqueness is case-insensitive.

**REG-02.** An existing email produces **“This email is already registered”** and a Login link. This intentionally discloses account existence on the registration form; login and password-recovery responses remain non-enumerating. On the Google path an existing email is linked, not rejected (GOOG-04).

**REG-03.** User, personal Workspace, OWNER Membership, and outbox event are committed atomically. Email delivery occurs after commit via the configured email provider (SMTP in MVP; AWS SES optional later, D8). A failed BFF session establishment must not repeat registration; provide a path to Login.

**REG-04.** Successful registration establishes an authenticated BFF session and opens Welcome without requiring email verification. The account starts Unverified.

**REG-05.** The profile timezone is auto-detected from the browser at registration (fallback UTC) without an extra form field; it is editable later in Settings and a change applies from the next calendar week (D2). The registration week (in that timezone) is the user's first week of use for Weekly Reflection (A2).

### 3.2 Shared password policy

**PWD-01.** Password length **8–128** characters, containing at least one uppercase letter, one lowercase letter, one digit, and one special character. Confirm Password must match exactly.

**PWD-02.** Apply to Registration, Reset Password, and future Change Password. Do not impose strength validation during Login. NestJS is authoritative; frontend validation must match backend behavior, including edge cases and Unicode semantics.

**PWD-03.** Passwords are hidden by default; Show/Hide is available on Registration, Login, and Reset Password.

### 3.3 Login

**LOGIN-01.** Invalid email/password combinations produce the same message: **“Invalid email or password”**. This includes a Google-only account (no password set).

**LOGIN-02.** Normal successful Login always opens **Dashboard**. A distinct Session Recovery login may return to the previous authorized internal URL if safe; otherwise Dashboard.

**LOGIN-03.** Unverified users can sign in and use all MVP features.

**LOGIN-04.** Enforce server-side rate limiting and progressive slowdown against brute force, without permanent account lockout. The example 30-second UI wait is illustrative, not a fixed policy.

### 3.4 Session management

**SES-01.** One active authenticated session per user. A new successful Login revokes all previous active sessions, including sessions on other devices or browsers.

**SES-02.** Absolute session maximum: **30 days from creation**. Idle timeout: **7 days of inactivity**. Credential rotation must not extend the absolute session deadline. The exact definition of qualifying activity and idle-clock updates remains a technical contract to finalize.

**SES-03.** Logout revokes the current session, applies across tabs in that browser, and redirects to Login with **“You have been signed out”**.

**SES-04.** Expired/revoked sessions cannot access protected routes or APIs. Show **“Session Expired”** and prompt reauthentication. After successful recovery, return to a safe, permitted internal page if available, otherwise Dashboard. Do not offer unauthenticated Dashboard access on the expired-session screen.

**SES-05.** Browser stores only a random opaque session identifier in a Secure, HttpOnly cookie. JWT access tokens and opaque rotating refresh tokens remain in the server-side BFF session store. NestJS owns issuance, validation, rotation, revocation, and authorization decisions.

### 3.5 Email verification

**EV-01.** Send verification email asynchronously after registration; do not block automatic login or any MVP feature.

**EV-02.** Verification link expires after **24 hours**, strictly before `expiresAt`; token is cryptographically random, one-time, and stored only as a hash server-side.

**EV-03.** Opening the link via GET only displays a confirmation page. An explicit **Verify Email** action performs the state change via POST, protecting against link-scanner prefetch.

**EV-04.** Resend is available after a **60-second server-enforced cooldown** and additional rate limiting. A new link invalidates the prior unused link.

**EV-05.** Unverified users see a nonintrusive Dashboard banner and email status on the Account page (A9). The banner may be dismissed **until the end of the current session**; the Account status and resend remain available.

**EV-06.** On successful verification, show **Continue to App** if the user has an active session, otherwise **Go to Login**. Show **Email Already Verified** only where this can be determined without leaking sensitive account state; otherwise use a neutral invalid/used-link state.

**EV-07.** Expired/invalid/used links lead to a safe new-link request flow. Possession of an invalid link alone must not authorize issuing a new verification token.

### 3.6 Forgot and Reset Password

**RESET-01.** Forgot Password uses a neutral submission response regardless of whether an account exists.

**RESET-02.** Reset link is valid **30 minutes** (strictly before expiry), one-time, random, and hashed in storage. A new reset request invalidates prior unused reset tokens. Resend cooldown: **60 seconds**, server-enforced, with rate limiting.

**RESET-03.** Successful reset atomically consumes the token and updates the password, then revokes **all active sessions across devices** and NestJS refresh credentials. Redirect to Login; do not automatically sign in.

**RESET-04.** Reusing the current password is allowed if it meets the password policy. Invalid, expired, and used tokens must not change credentials.

**RESET-05.** A Google-only account receives the same neutral response and a reset link; completing it sets the account's first password, after which both sign-in methods work. RESET-03 applies unchanged (D20).

### 3.7 Optional first-time onboarding

**ONB-01.** After automatic login, open Welcome with **Create First Project** and **Skip for Now**.

**ONB-02.** All onboarding steps are optional. **Skip Setup** from *any* step navigates immediately to Dashboard, not the next step. Successfully persisted Project, Goal, and Weekly Focus data remain intact; unfinished forms are not considered saved.

**ONB-03.** Guided sequence: Welcome → Create First Project → Create First Goal → Set Weekly Focus → Dashboard. Each completed creation is an independent committed operation, not a single multi-step transaction.

**ONB-04.** Project form: required Name and Priority (P1–P3); optional Description. Goal form: required Name, Project, Priority (P1–P3); optional Description and Deadline. Follow the authoritative EPIC-02/03 validation rules.

**ONB-05.** Weekly Focus follows EPIC-06 rules. The illustrated **“up to 3”** limit is **not approved** and must not be implemented based on the mockup.

**ONB-06.** Dashboard shows actual persisted state: empty if nothing was created, or the saved Project/Goal/Focus information. No fabricated 33% progress or unsupported overall Project Progress.

**ONB-07.** Onboarding is offered only immediately after registration. Leaving it (Skip, navigation or sign-out) ends it; it is not resumed or re-offered on later sign-ins (D11).

### 3.8 Sign in with Google

**GOOG-01.** Registration, Login and Session Expired show **Continue with Google** at the top, above an “or” divider and the email form (owner-confirmed 2026-11-10). One flow serves both cases: an unknown Google identity registers a new account; a known one signs in. Only Google is supported in MVP.

**GOOG-02.** Google is used as an OpenID Connect provider: authorization code flow with PKCE, `state` and `nonce`; scopes `openid email profile` only. NestJS validates the ID token and is the sole authority for linking, account creation and credential issuance. Google access/refresh tokens are not stored. Technical flow: ADR-002 (proposed).

**GOOG-03.** A new account from Google:
- requires Google's `email_verified = true`; otherwise nothing is created and the generic Google error is shown (GOOG-07);
- Terms/Privacy consent is given by the text under the button: “By continuing with Google, you agree to the Terms of Service and Privacy Policy” (D19); the consent time is stored as for email registration;
- Full Name comes from the Google profile (`name`, else given + family name, else the email local part, else the whole email), trimmed and cut to 100 characters so it always satisfies 2–100 (A10); editable later in Account;
- email is **Verified** immediately; no verification email is sent;
- timezone (REG-05) and UI locale are captured in the browser before the redirect;
- provisioning follows REG-03 (same Unit of Work: User + Workspace + OWNER Membership + Google identity + outbox event) and REG-04/ONB-01: session established, Welcome opens.

**GOOG-04.** Linking (D18): if no account has this Google identity but an account with the same email exists (case-insensitive) and Google reports `email_verified = true`, the Google identity is linked to it and the user is signed in. The email becomes Verified and pending verification tokens are invalidated. If the existing account was **Unverified**, its password is removed and all its sessions are revoked before signing in, so a password set by someone else on an unconfirmed email cannot be used (pre-account takeover protection).

**GOOG-05.** After the first link, the account is found by the Google subject identifier (`sub`), not by email. A later change of the Google email does not change the Archipelago email. One Google identity belongs to at most one account and one account has at most one Google identity.

**GOOG-06.** Signing in with Google follows SES-01–SES-05 and LOGIN-02–LOGIN-04 unchanged: it revokes previous sessions; normal sign-in opens Dashboard, a new account opens Welcome, Session Recovery returns to the validated return URL (§6.4) carried through the flow. Rate limiting also applies to the Google callback. Archipelago logout does not sign the user out of Google.

**GOOG-07.** If the user cancels at Google, Google returns an error, `state`/`nonce` validation fails or `email_verified` is false, the user returns to the page that started the flow (Login, Registration or Session Expired) with **“Couldn't sign in with Google. Try again or use your email.”** Nothing is created or linked.

**GOOG-08.** Google-only accounts (no password): Change Password is hidden in Account until a password exists (RESET-05). Account deletion re-authenticates with Google (fresh sign-in, at most 5 minutes old) plus the explicit confirmation; accounts with a password re-enter it as before (D21, BRD FR-046).

## 4. User flows

### UF-01 — Registration and first access
1. Visitor opens Registration and completes required fields and consent.
2. Frontend validates; NestJS validates authoritatively and checks case-insensitive email uniqueness.
3. In a shared PostgreSQL Unit of Work, Identity and Workspaces create User + personal Workspace + OWNER Membership + outbox event.
4. After commit, email delivery is queued and BFF establishes an authenticated session.
5. User opens Welcome even if email remains Unverified.
6. User starts Project setup or selects Skip for Now → Dashboard.
7. If BFF session establishment fails after committed registration, offer Login; do not retry account creation.

### UF-02 — Normal Login
1. Visitor enters Email and Password.
2. NestJS validates credentials and applies abuse controls.
3. On success, prior sessions are revoked and BFF creates the single current session.
4. User navigates to Dashboard. On failure, show generic credentials error; on rate limit, show retry guidance.

### UF-03 — Session expiry / replacement / recovery
1. BFF detects idle expiry, absolute expiry, or server-side revocation (including login elsewhere).
2. Protected access is denied; show Session Expired and navigate to Login with a validated internal return destination.
3. User reauthenticates; new Login replaces previous sessions.
4. Navigate to the previous permitted internal destination if valid and still authorized, otherwise Dashboard.

### UF-04 — Logout
1. User opens the profile menu (avatar + name, top-right of the header) and selects **Log out** (reference mockup `docs/design/mockups/general/alignment-dashboard-profile-menu.png`; BRD FR-045, D17).
2. BFF invalidates its session and coordinates credential revocation with NestJS.
3. Other tabs receive logout UX notification; every tab is denied protected API access regardless of notification delivery.
4. Navigate to Login with “You have been signed out”.

### UF-05 — Email verification
1. Transactional email contains a 24-hour verification link.
2. GET opens Verify Your Email page without consuming token.
3. User selects Verify Email; POST validates and consumes token once, marking email Verified.
4. Show Continue to App if authenticated; otherwise Go to Login.
5. For expired/invalid/used links, show safe recovery UI. The Account page provides verified/unverified status and resend with 60-second cooldown.

### UF-06 — Forgot / Reset Password
1. User submits email; UI always gives neutral confirmation.
2. If eligible, outbox/email provider sends a 30-minute one-time reset link.
3. User opens link, enters and confirms a policy-compliant password.
4. Backend validates/consumes token and updates password atomically.
5. All sessions/refresh credentials are revoked; user returns to Login.

### UF-07 — Optional onboarding
1. Welcome offers Create First Project or Skip for Now.
2. Project creation commits Project; user can continue or Skip Setup.
3. Goal creation commits Goal associated with selected Project; user can continue or Skip Setup.
4. Weekly Focus can be saved according to EPIC-06; Finish or Skip Setup opens Dashboard.
5. Dashboard reflects only successfully saved records; users can create missing entities later in normal app sections.

### UF-08 — Continue with Google
1. Visitor selects Continue with Google on Registration, Login or Session Expired; the browser timezone, locale and (for recovery) return URL are captured.
2. BFF starts the OIDC flow (state, nonce, PKCE) and redirects to Google.
3. User picks a Google account and consents; Google redirects back to the BFF callback.
4. BFF validates `state` and passes the code to NestJS, which exchanges it, validates the ID token and resolves the account: known `sub` → sign in; same verified email → link (GOOG-04) and sign in; otherwise → register (GOOG-03).
5. Previous sessions are revoked and BFF creates the single current session.
6. New account → Welcome; existing account → Dashboard; Session Recovery → safe return URL.
7. On cancel or any failure, return to the starting page with the GOOG-07 message.

## 5. Acceptance criteria

### Registration and password validation
- **REG-AC-01:** Registration is accessible to unauthenticated visitors.
- **REG-AC-02:** All required fields and Terms/Privacy consent are validated.
- **REG-AC-03:** Email is syntactically validated and unique case-insensitively.
- **REG-AC-04:** Duplicate email shows approved message and Login link.
- **REG-AC-05:** Registration passwords satisfy 8–128, upper/lower/digit/symbol policy.
- **REG-AC-06:** Confirm Password must match exactly.
- **REG-AC-07:** User, Workspace, OWNER Membership, and outbox event are atomic.
- **REG-AC-08:** Successful registration creates a BFF session and opens Welcome.
- **REG-AC-09:** Verification is not required for first access.
- **REG-AC-10:** Registration failure leaves no partially provisioned workspace/membership; post-commit session failure does not duplicate user creation.

### Login and abuse prevention
- **LOGIN-AC-01:** Email, Password, Sign In, Forgot Password, and registration link are available.
- **LOGIN-AC-02:** Unknown email and incorrect password yield identical generic error.
- **LOGIN-AC-03:** Normal Login opens Dashboard.
- **LOGIN-AC-04:** Loading disables duplicate submission and preserves appropriate field values on failure.
- **LOGIN-AC-05:** Backend rate limiting and progressive slowdown are enforced.
- **LOGIN-AC-06:** No permanent account lockout is applied.
- **LOGIN-AC-07:** New Login revokes all previous sessions.
- **LOGIN-AC-08:** Unverified users can log in.

### Session management
- **SES-AC-01:** Absolute lifetime never exceeds 30 days from session creation.
- **SES-AC-02:** Seven days of inactivity expires the session.
- **SES-AC-03:** Refresh-token rotation does not extend absolute lifetime.
- **SES-AC-04:** Browser never receives access/refresh credentials.
- **SES-AC-05:** Logout invalidates the server-side session.
- **SES-AC-06:** Logout UX propagates across browser tabs; server access remains revoked even if propagation fails.
- **SES-AC-07:** Logout opens Login with signed-out confirmation.
- **SES-AC-08:** Expired/revoked sessions cannot access protected routes/APIs.
- **SES-AC-09:** Expired/revoked session shows Session Expired.
- **SES-AC-10:** Return URL is validated as internal and authorized; invalid URL falls back to Dashboard.
- **SES-AC-11:** Login from another device revokes prior session.
- **SES-AC-12:** Password Reset revokes all sessions and refresh credentials.

### Email verification
- **EV-AC-01:** Verification email is dispatched after registration commit via outbox/email provider.
- **EV-AC-02:** Unverified accounts have unrestricted MVP access.
- **EV-AC-03:** Verification token is hashed, one-time, and expires after 24 hours.
- **EV-AC-04:** GET does not consume the token; explicit POST verifies.
- **EV-AC-05:** Successful verification changes status once; subsequent reuse cannot reverify.
- **EV-AC-06:** Resend is unavailable until 60 seconds have elapsed and remains rate-limited.
- **EV-AC-07:** Resend invalidates earlier unused verification tokens.
- **EV-AC-08:** Dashboard shows unverified banner; dismissal lasts current session only.
- **EV-AC-09:** The Account page always shows email status and eligible resend action.
- **EV-AC-10:** Success shows exactly one appropriate CTA based on active session.
- **EV-AC-11:** Expired, invalid, and used tokens have safe, non-leaking result states.
- **EV-AC-12:** Invalid-link possession alone cannot authorize resend.

### Password recovery
- **RESET-AC-01:** Forgot Password confirmation does not reveal account existence.
- **RESET-AC-02:** Reset token expires after 30 minutes and is one-time/hashed.
- **RESET-AC-03:** New request invalidates prior unused token.
- **RESET-AC-04:** Resend cooldown of 60 seconds is server-enforced with rate limiting.
- **RESET-AC-05:** Reset form applies shared password policy and confirmation match.
- **RESET-AC-06:** Reusing the existing password is permitted.
- **RESET-AC-07:** Password update and token consumption are atomic.
- **RESET-AC-08:** All existing sessions/refresh tokens are revoked after success.
- **RESET-AC-09:** Successful reset redirects to Login, not automatic login.
- **RESET-AC-10:** Invalid/expired/used token cannot update password.
- **RESET-AC-11:** Recovery UI covers loading, validation, expired/invalid, success, and retry states.

### Onboarding
- **ONB-AC-01:** Successful registration signs user in automatically.
- **ONB-AC-02:** Personal Workspace and OWNER Membership exist before onboarding begins.
- **ONB-AC-03:** Welcome opens after Registration.
- **ONB-AC-04:** Welcome has Create First Project and Skip for Now.
- **ONB-AC-05:** Email verification is not a prerequisite.
- **ONB-AC-06:** Welcome Skip for Now opens Dashboard immediately.
- **ONB-AC-07:** Create First Project opens Project creation.
- **ONB-AC-08:** Project form follows EPIC-02 validation.
- **ONB-AC-09:** Successfully created Project persists independently of later onboarding actions.
- **ONB-AC-10:** User can proceed to Goal creation.
- **ONB-AC-11:** Goal is associated with selected Project.
- **ONB-AC-12:** Goal form follows EPIC-03 validation.
- **ONB-AC-13:** Successfully created Goal persists independently.
- **ONB-AC-14:** User can proceed to Weekly Focus after Goal creation.
- **ONB-AC-15:** Weekly Focus follows EPIC-06 business rules, without an invented item limit.
- **ONB-AC-16:** Weekly Focus may be skipped.
- **ONB-AC-17:** Successfully saved Weekly Focus persists after exit.
- **ONB-AC-18:** Skip Setup is available at every onboarding step.
- **ONB-AC-19:** Skip Setup navigates directly to Dashboard, not the next step.
- **ONB-AC-20:** Skip does not auto-create Project, Goal, or Weekly Focus.
- **ONB-AC-21:** Skip does not delete saved records.
- **ONB-AC-22:** Skip does not roll back committed creations.
- **ONB-AC-23:** Skipping does not restrict MVP access.
- **ONB-AC-24:** Unsaved form drafts are not treated as created entities.
- **ONB-AC-25:** With no Project, Dashboard shows an appropriate empty state.
- **ONB-AC-26:** With Project but no Goal, Dashboard reflects Project and contextual next action.
- **ONB-AC-27:** With Project and Goal, Dashboard reflects persisted records only.
- **ONB-AC-28:** Missing entities can be created later from standard app sections.
- **ONB-AC-29:** Onboarding completion/skip does not change verification status.

### Sign in with Google
- **GOOG-AC-01:** Registration, Login and Session Expired show Continue with Google at the top, then an “or” divider, then the email form; on Registration the consent line sits directly under the Google button, above the divider.
- **GOOG-AC-02:** An unknown Google identity with a verified email creates User + Workspace + OWNER Membership + Google identity + outbox event atomically; the email is Verified; no verification email is sent; Welcome opens.
- **GOOG-AC-03:** Full Name is taken from Google per GOOG-03 and always satisfies REG-01 (2–100 characters after trimming); timezone follows REG-05.
- **GOOG-AC-04:** A known Google identity signs in and opens Dashboard (or the safe return URL in Session Recovery).
- **GOOG-AC-05:** A verified Google email matching an existing account links Google to it, marks the email Verified and invalidates pending verification tokens.
- **GOOG-AC-06:** Linking to an Unverified account removes its password and revokes its sessions.
- **GOOG-AC-07:** After linking, the account is resolved by Google `sub`; a changed Google email does not create a second account.
- **GOOG-AC-08:** `email_verified = false`, cancel, provider error, invalid `state`/`nonce` or an invalid ID token create and link nothing and show the GOOG-07 message on the starting page.
- **GOOG-AC-09:** Google sign-in revokes all previous sessions (SES-01) and is rate-limited.
- **GOOG-AC-10:** No Google code, ID token or access token reaches browser storage, client code, logs or analytics; Google tokens are not persisted.
- **GOOG-AC-11:** Email/password Login for a Google-only account returns “Invalid email or password”.
- **GOOG-AC-12:** Forgot Password for a Google-only account is neutral and sends a reset link; completing it sets a first password and Google stays linked.

### UI and localization
- **UI-AC-01:** Show/Hide Password exists on Login, Registration, Reset Password.
- **UI-AC-02:** Password fields default to hidden.
- **UI-AC-03:** Inline validation messages appear by relevant fields.
- **UI-AC-04:** Submit buttons show loading and prevent duplicate submission.
- **UI-AC-05:** All user-facing messages are externalized from the start; English is the default and both English and Ukrainian translations are required by the first MVP release (the Ukrainian pass may be delivered during MVP hardening). Language toggle labels: "EN" / "УКР" (locale code `uk`) (C15, A4).
- **UI-AC-06:** Auth pages **and Welcome/onboarding** use a centered layout without the authenticated sidebar; the root Welcome mockup showing the sidebar and a "Go to Dashboard" button is superseded (C11).
- **UI-AC-07:** Welcome offers Create First Project and Skip for Now.
- **UI-AC-08:** Onboarding screens use shared progress indicator and Skip Setup.

## 6. Architectural contracts

### 6.1 System ownership (approved architecture)

| Component | Responsibility |
|---|---|
| `apps/web` — Next.js App Router | UI, RHF/Zod client validation, same-origin BFF endpoints, server-side session store integration, opaque HttpOnly cookie, safe navigation, accessible English-default UX with bilingual en/uk support by first MVP release |
| `apps/api` — NestJS modular monolith | Sole authority for Identity, credentials, token issuance/rotation/revocation, authentication, authorization, domain business rules, registration orchestration |
| PostgreSQL `app` schema | NestJS-owned domain persistence and migrations |
| PostgreSQL `bff` schema | BFF-owned session persistence and migrations |
| Email provider (SMTP in MVP; SES optional later) + transactional outbox | Email verification and password reset dispatch after database commit |
| Google (OpenID Connect provider) | Authenticates the user for Continue with Google; NestJS holds the client secret, exchanges the code and validates the ID token (ADR-002, proposed) |

Use distinct database credentials and no direct cross-schema reads. Integrate through explicit module application contracts, avoiding circular dependencies and `forwardRef`.

### 6.2 Proposed BFF ↔ Identity operations (contract design, not approved endpoint names)

| Operation | Authority | Expected behavior |
|---|---|---|
| Register | NestJS Identity + Workspaces UoW | Atomically provision User/Workspace/OWNER/outbox; return outcome allowing BFF to establish session |
| Login | NestJS Identity | Validate credentials and abuse controls; atomically replace previous authorization generation/session |
| Continue with Google | BFF (start/callback, `state`/PKCE) + NestJS Identity / registration workflow | Exchange code, validate ID token, sign in / link / register per GOOG-03–05; same session outcome as Login or Register |
| Google re-authentication for deletion | BFF + NestJS Identity | Fresh Google sign-in (≤ 5 min) as the deletion proof for Google-only accounts (GOOG-08) |
| Refresh | NestJS Identity | Rotate opaque refresh credential; enforce revocation and session policy |
| Validate session generation | NestJS Identity | Deny credentials from prior logins or password reset |
| Logout | BFF + NestJS Identity | Revoke BFF record and underlying Identity credentials; fail closed for protected access |
| Request email verification / resend | NestJS Identity | Enforce cooldown, invalidation, outbox dispatch |
| Verify email | NestJS Identity | POST-only one-time token consumption and status update |
| Request password reset | NestJS Identity | Neutral response, cooldown/rate limiting, outbox dispatch |
| Complete password reset | NestJS Identity | Atomic token consumption/password update and global credential revocation |
| Create Project / Goal / Weekly Focus | Corresponding NestJS domain modules | Independent writes; BFF presents results and handles navigation |

Endpoint URLs, HTTP status codes, DTOs, idempotency keys, and OpenAPI schemas should be finalized during technical design; do not infer them from this table.

### 6.3 Session revocation across isolated schemas

Because NestJS cannot directly mutate the private BFF session schema, **a proposed solution** is an Identity-owned `sessionVersion`/`credentialsVersion` or active-session generation. Each BFF session references that generation; NestJS validates it on protected operations. New Login and successful Password Reset advance/revoke the generation and refresh credentials. The BFF removes its local session upon detecting invalidation. This proposal requires a dedicated ADR or equivalent technical approval.

For reliable revocation, avoid relying only on cross-tab events or asynchronous BFF cleanup. The server must reject old credentials even if a stale BFF session record remains.

### 6.4 Return URL and onboarding contracts

- Distinguish normal Login (Dashboard) from Session Recovery (safe return destination).
- Permit only application-internal paths and recheck current authorization; reject protocol-relative URLs, external origins, untrusted redirect chains, and malformed paths.
- Registration onboarding steps call ordinary Project/Goal/Weekly Focus domain APIs; no onboarding-wide transaction.
- Do not persist invented domain progress or Weekly Focus limits based on illustrations.

## 7. Security and privacy requirements

1. **Transport and cookies:** HTTPS; session cookie `Secure`, `HttpOnly`, appropriate `SameSite`, path/domain scope, and unpredictable opaque identifier. Protect state-changing BFF routes against CSRF using appropriate same-origin and token/origin controls.
2. **Password storage:** approved adaptive password hashing (e.g., Argon2id) with secure parameters; never store plaintext passwords or send them to analytics/logs. Exact algorithm/parameters require technical approval.
3. **Token storage:** store only hashes of email-verification/password-reset tokens; use cryptographically secure random values, one-time atomic consumption, strict expiry, and constant-time comparison where applicable.
4. **Enumeration policy:** generic Login and Forgot Password responses; duplicate-registration disclosure is an explicit approved exception. Already-verified email response must not expose unknown account status.
5. **Abuse controls:** server-side rate limiting, progressive Login slowdown, resend cooldowns, IP/account-aware protections, safe retry guidance; avoid permanent lockout.
6. **Session enforcement:** one active session, 30-day absolute/7-day idle limits, refresh rotation/revocation, global revocation after reset, protected API denial after expiry/replacement.
7. **Cross-tab behavior:** browser notification improves UX but is not a security boundary; server-side invalidation is authoritative.
8. **Email link safety:** no token consumption on GET, avoid token leakage in logs, referrers, analytics, and third-party assets; avoid unsafe redirect propagation.
9. **Authorization:** BFF cannot be the sole authority for workspace access; NestJS checks user/workspace ownership and permissions.
10. **Operational reliability:** outbox-driven email delivery, retry-safe processing, transaction boundaries, observable failures without exposing secrets.
11. **Validation parity:** NestJS `class-validator` strong-password rule plus max 128; RHF/Zod equivalent. Contract tests must cover Unicode and validator-library edge cases.
12. **Localization/accessibility:** English and Ukrainian messages by the first MVP release (English default); localization-ready text architecture from the beginning, accessible labels, keyboard operation, focus management, inline errors, and non-color-only status indicators.
13. **Google sign-in:** OIDC code flow with PKCE, `state` and `nonce`; exact redirect URI allowlist; ID token signature (Google JWKS), `iss`, `aud`, `exp` and `nonce` validated in NestJS; `email_verified` required for create and link; flow cookie short-lived and HttpOnly; client secret only in NestJS configuration; Google tokens and codes never logged or persisted; pre-account takeover protection per GOOG-04.

## 8. Approved desktop UI/UX mockup inventory

**Design status:** Approved with listed refinements. Image mockups are visual references; business rules in this specification take precedence over incidental generated labels or metrics.

| ID | Screen / mockup set | Required states | Approved refinements |
|---|---|---|---|
| UI-01 | Registration | Default, validation errors, duplicate email, loading, show/hide password, success transition, **Continue with Google + “or” divider + consent line** | Include full password checklist, required fields and consent; success opens Welcome through automatic session. Google elements: `google-sign-in-screens.png` (Google above the email form; consent line under the Google button) |
| UI-02 | Login | Default, invalid credentials, loading, rate-limited, signed-out confirmation, **Continue with Google + “or” divider** | No Remember Me; rate-limit example time is not fixed. Google elements: `google-sign-in-screens.png` (Google above the email form) |
| UI-03 | Session Expired | Idle/absolute expiry, revoked by another login, reauthentication loading, Continue with Google | No Dashboard bypass before reauth; safe return URL after recovery; Google first, then “Log in with Email” |
| UI-04 | Logout Result | Login with “You have been signed out” | Session invalid across tabs |
| UI-05 | Welcome | Create First Project, Skip for Now | Onboarding optional; no sidebar (root mockup with sidebar and "Go to Dashboard" superseded, C11) |
| UI-06 | Forgot Password | Default, invalid email, server error, loading | Neutral submission response; preserve appropriate values |
| UI-07 | Check Your Inbox | Confirmation, 60-second cooldown, resend loading, error | Server-enforced cooldown |
| UI-08 | Reset Password | Default, valid, validation errors, loading | Shared password checklist and Show/Hide |
| UI-09 | Reset Result | Success, expired, invalid/used, updating | Success → Login; invalid/expired → safe new request |
| UI-10 | Verify Your Email | Ready, verifying | Explicit POST action; GET must not consume token |
| UI-11 | Verification Result | Verified, already verified, expired, invalid/used, server error | Show one CTA based on active session; neutral already-verified handling |
| UI-12 | Dashboard Unverified Banner | Visible, dismissed for current session | Remains absent until session ends; Account status persists |
| UI-13 | Account Email Status | Unverified, verified, resend cooldown/loading/error | Server-side resend protection |
| UI-14 | Verification Email | Transactional email template, CTA, 24-hour expiry, fallback URL | Safe link and security note |
| UI-15 | Create First Project | Default, validation, saving, saved, Skip Setup | Required Name/Priority P1–P3; optional Description |
| UI-16 | Create First Goal | Default, validation, saving, saved, Skip Setup | Required Name/Project/Priority P1–P3; optional Description/Deadline |
| UI-17 | Set Weekly Focus | Select/configure, saving, finish, Skip Setup | EPIC-06 owns rules; no unapproved “up to 3” constraint |
| UI-18 | Dashboard after onboarding | Empty, Project only, Project+Goal, persisted Weekly Focus | Actual saved data only; no fabricated 33% or overall Project Progress |
| UI-19 | Google sign-in states | Redirecting (button loading, page disabled), returning/signing in, cancelled or failed (GOOG-07 message on the starting page) | Button follows Google branding guidelines; `google-sign-in-screens.png` |
| UI-20 | Account for a Google-only user (EPIC-09) | “Signed in with Google” status, no Change Password, Delete Account with Google re-authentication | GOOG-08; `google-sign-in-screens.png` (timezone row belongs to the Settings page, A9) |

**Shared visual language:** Grafana-inspired light interface, white/gray surfaces, restrained orange accents, rounded compact cards, orange mountain Archipelago logo, accessible inline validation, consistent navigation. Auth pages use a centered layout without sidebar; authenticated pages use the reference app shell (`docs/design/mockups/general/alignment-dashboard*.png`, BRD FR-045, D17): header with logo, EN / УКР toggle and profile menu; collapsible sidebar Dashboard, Projects, Goals, Contributions, Weekly Focus, Reflection (`/reflection`), then a Workspace group with Settings and Account.

## 9. Cross-epic dependencies and open technical decisions

### Approved cross-epic dependencies
- **EPIC-02:** Project fields, validation, persistence, and authorization.
- **EPIC-03:** Goal fields, association with Project, validation, and authorization.
- **EPIC-06:** Weekly Focus creation rules and data model; no inferred count limits.
- **EPIC-09:** Account page — Full Name, email status/resend, Change Password (current session kept, other sessions revoked), account deletion; Settings page — timezone, language (persisted per account); no avatar upload (D5, D6, A9). Specified in BRD §8.2.

### Technical decisions to finalize before implementation
1. Session generation/versioning ADR, revocation propagation, and handling of BFF session records after Identity revocation.
2. Exact definition of qualifying activity for 7-day idle timeout, write throttling, clock tolerance, and expiration evaluation.
3. Login slowdown policy thresholds, retry semantics, and abuse-control telemetry (without leaking account existence).
4. Endpoint/DTO/OpenAPI contracts, transaction/idempotency semantics, and BFF session establishment failure UX.
5. Password hashing parameters, email-token delivery/verification flow hardening, and password-validation parity tests.
6. ~~Onboarding resume/completion state~~ — resolved: no resume (ONB-07, D11).
7. ~~Full Name 2–100~~ — resolved: approved (REG-01, D12).
8. Google sign-in technical flow (ADR-002, proposed): code exchange location, OIDC library, identity table, flow cookie, deletion re-auth check. Google Cloud OAuth client (owner: user) with redirect URIs per environment.

## 10. Definition of Done (EPIC-01)

- Approved flows and acceptance criteria implemented and covered by automated tests.
- Security and authorization checks run in NestJS; BFF never exposes access/refresh credentials to browser.
- Registration atomicity, duplicate email, recovery, email verification, and single-session revocation verified under concurrent requests.
- Idle/absolute expiry and safe return navigation tested, including multiple tabs and devices.
- Outbox email dispatch, cooldowns, token expiry/one-time use, and failure handling tested.
- Google sign-in tested for new, known, linked (Verified and Unverified target) and failed/cancelled flows, with no Google tokens in the browser or logs.
- Onboarding skip from every step tested; persisted entities survive skip and Dashboard displays only real data.
- Desktop screens match approved mockup inventory and refinements; English-default UI copy, accessibility, and localization-ready message structure verified; both en/uk translations are a first-MVP release gate. Ukrainian translation may be implemented after core epics but must be complete before the first MVP release.
- Open technical decisions above resolved and recorded before claiming implementation readiness.

---

**Document note:** This specification consolidates approved business and design decisions. Items labeled **proposed**, **to finalize**, or **confirm** are not silently promoted to approved architecture or business rules.


## Shared MVP mobile release gate (BRD NFR-006, D9)

Responsive web, no native app. Login (including Continue with Google) must be fully usable at 360 px width; no screen has horizontal page scroll at 360 px. Desktop mockups stay the visual reference; no separate mobile mockups are required.

## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Full Name 2–100 approved; open decision 7 closed | D12 (Q13) |
| Added REG-05: timezone auto-detected at registration | D2 (Q2), A2 |
| Added ONB-07: no onboarding resume; open decision 6 closed | D11 (Q12) |
| UI-AC-05 aligned with first-MVP bilingual gate; language label EN/УКР | C15, A4 |
| Welcome without sidebar; root mockup superseded | C11 |
| Canonical sidebar order and `Reflection` label | A3, C12 |
| Logout entry point: header profile menu (reference mockup) | D17 |
| EPIC-09 scope stated (no separate document) | D4, D5, D6 |
| Email channel: configured SMTP provider instead of AWS SES (SES optional later) | D8 |
| 2026-11-10: Sign in with Google added — §2, REG-01/02, LOGIN-01, RESET-05, §3.8 GOOG-01–08, UF-08, GOOG-AC-01–12, §6, §7.13, UI-01–03, UI-19/20, §9.8, §10 | D18–D21, A10 (BRD Q20–Q23) |
| 2026-11-10: BRD consistency pass — app shell per D17 (A3 superseded); email status on Account page (A9); EPIC-09 page split; mobile release gate | D17, A9, D9 |
