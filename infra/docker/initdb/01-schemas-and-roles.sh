#!/bin/sh
# Runs once on first container start (empty volume).
# AGENTS.md §3.4: logically separate schemas `app` (NestJS) and `bff` (Next.js)
# with separate credentials and migration ownership; no cross-schema access.
set -eu

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v app_pw="$APP_DB_PASSWORD" -v bff_pw="$BFF_DB_PASSWORD" <<'SQL'
-- Nobody gets implicit rights on the public schema or the database.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE archipelago FROM PUBLIC;

-- NestJS: owns and migrates schema `app`. CREATEDB is for Prisma's shadow database (dev only).
CREATE ROLE app_user LOGIN CREATEDB PASSWORD :'app_pw';
CREATE SCHEMA app AUTHORIZATION app_user;
GRANT CONNECT, TEMPORARY ON DATABASE archipelago TO app_user;
ALTER ROLE app_user SET search_path = app;

-- Next.js BFF: owns and migrates schema `bff` (session store).
CREATE ROLE bff_user LOGIN CREATEDB PASSWORD :'bff_pw';
CREATE SCHEMA bff AUTHORIZATION bff_user;
GRANT CONNECT, TEMPORARY ON DATABASE archipelago TO bff_user;
ALTER ROLE bff_user SET search_path = bff;

-- Explicitly forbid cross-schema access.
REVOKE ALL ON SCHEMA app FROM bff_user;
REVOKE ALL ON SCHEMA bff FROM app_user;
SQL
