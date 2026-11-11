---
id: US-01-11-api
epic: EPIC-01
layer: api
title: Continue with Google
risk: high
depends_on: null
brd_refs: [FR-047, BR-033, BR-001, BR-003]
epic_refs: [GOOG-AC-02…12]
version: 1
---

# US-01-11-api — Continue with Google

**As** a visitor **I want** to register or sign in with my Google account **so that** I don't
need a separate password.

- **AC-1** Given a valid code for an unknown Google identity with `email_verified`, then User
  (Verified, no password, name per A10, browser timezone), Workspace, OWNER Membership, Google
  identity and a `UserRegistered` event (`emailVerified: true`, no verification email) are
  committed in one transaction, and credentials with `isNewAccount: true` are returned.
  _(GOOG-AC-02, 03, BR-001)_
- **AC-2** Given a known Google `sub`, then credentials are returned, all earlier sessions are
  revoked, and a changed Google email creates nothing new. _(GOOG-AC-04, 07, 09)_
- **AC-3** Given a verified Google email that matches an account, then Google is linked, the
  email becomes Verified and pending verification tokens stop working; if the account was
  Unverified, its password is removed and its sessions are revoked first. _(GOOG-AC-05, 06)_
- **AC-4** Given an invalid code, an ID token failing signature/`iss`/`aud`/`exp`/`nonce`, or
  `email_verified = false`, then nothing is created or linked and one generic error is
  returned; Google tokens are neither stored nor logged. _(GOOG-AC-08, 10)_
- **AC-5** Given a Google-only account, then email/password sign-in returns "Invalid email or
  password", and a password reset sets its first password while Google stays linked.
  _(GOOG-AC-11, 12, D20)_

Notes: modules `identity` + `workflows/registration`; data and flow per ADR-002 (nullable
`password_hash`, `external_identities`). Rate limiting reuses US-01-01-api. Test with a fake OIDC
provider. Google Cloud OAuth client must exist (owner: user).
