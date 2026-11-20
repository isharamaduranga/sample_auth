# Simple Login & Signup (Interview Practice)

React + Spring Boot + MySQL sample project. Code eka interview ekedi explain karanna lesi wenna Controller → Service → Repository flow ekata hadala thiyenawa. API requests walata validation, password walata BCrypt hash, login ekata short lived JWT ekak use karanawa.

## Project layout

```text
frontend/  React + Vite UI, browser validation, Vercel config
backend/   Spring Boot API
  controller/  HTTP endpoints
  dto/         request/response shapes and validation rules
  entity/      JPA database model
  repository/  Spring Data JPA queries
  service/     business logic interface
  service/impl/ business logic implementation
  security/    BCrypt, JWT, CORS and endpoint rules
docker-compose.yml  local MySQL for development
```

## Run on your computer

Requirements: Java 17+, Maven 3.6+, Node.js, npm, and Docker Desktop (for MySQL).

1. Start MySQL from the project root:

   ```bash
   docker compose up -d
   ```

   Local DB is `sample_auth`, username `root`, password `root` on port `3306`.

2. Start the Spring Boot API in a terminal:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

   API runs at `http://localhost:8080`. For a local interview demo, default settings are enough. `spring.jpa.hibernate.ddl-auto=update` lets Hibernate create/update the `users` table.

3. Start React in another terminal:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Open the Vite URL shown in the terminal (usually `http://localhost:5173`). To point it at a different API, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`.

## Try the API / check MySQL

Signup:

```http
POST http://localhost:8080/api/auth/signup
Content-Type: application/json

{"name":"Alex Morgan","email":"alex@example.com","password":"example123"}
```

Login:

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{"email":"alex@example.com","password":"example123"}
```

Signup returns a success message and switches the UI back to login. Login returns a JWT and public user details. Password or password hash is never included in either response. To confirm the signup saved a row, open MySQL Workbench or run:

```sql
USE sample_auth;
SELECT id, name, email, password_hash, created_at FROM users;
```

`password_hash` should start with `$2a$` (or `$2b$`), not the password you typed. The same password produces a different salted BCrypt hash when a different user signs up.

The token protects `GET /api/auth/me`. Send `Authorization: Bearer <token>` to read the signed-in user's public details. The sample UI checks this endpoint when it reloads.

## Flow to explain at the interview

1. React checks the fields for quick feedback and POSTs JSON to `/api/auth/signup` or `/api/auth/login`.
2. Controller receives the request DTO. `@Valid` applies Jakarta validation rules before business logic runs.
3. `AuthServiceImpl` normalizes the email and coordinates the operation.
4. Signup calls `PasswordEncoder.encode()` and saves the BCrypt hash through `UserRepository`, then returns a success message. The user logs in separately. The DB unique constraint prevents duplicate emails.
5. Login finds the user by email then calls `PasswordEncoder.matches(plainPassword, storedHash)`. It never decrypts the hash.
6. On success, `JwtService` signs a one-hour JWT. `JwtAuthenticationFilter` checks Bearer tokens; `/api/auth/me` requires authentication.
7. Spring Data JPA builds `findByEmail` / `existsByEmail` queries from method names. No native SQL is needed for this small example.

### Sinhala short answer

“Signup request eka Controller eken DTO validation karala Service ekata yanawa. Service eka email normalize karala password eka BCrypt walin hash karanawa, Repository/JPA haraha MySQL users table ekata save karanawa. Login ekedi email eken user hoyala `matches()` use karala password verify karanawa; hash eka decrypt karanne na. Hari nam JWT ekak return karanawa. Entity eka DB table eka represent karanawa, DTO eka API data shape eka, Repository eka DB access eka, Service eka business rules, Controller eka HTTP requests handle karanawa.”

## Environment variables

Backend reads these environment variables; never commit real secrets:

| Variable | Local default | Purpose |
| --- | --- | --- |
| `DB_URL` | local MySQL JDBC URL | Database connection URL |
| `DB_USERNAME` | `root` | Database username |
| `DB_PASSWORD` | `root` | Database password |
| `JWT_SECRET` | development-only value in config | Random secret, minimum 32 characters |
| `JWT_EXPIRATION_MS` | `3600000` | Token lifetime (one hour) |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:5173` | Exact frontend origin allowed to call API |
| `PORT` | `8080` | Hosting platform's server port |

Set a new random `JWT_SECRET` on a hosted deployment. Set a JDBC URL for its MySQL instance, for example `jdbc:mysql://HOST:PORT/DATABASE?sslMode=REQUIRED&serverTimezone=UTC`, plus its username/password. Hosted database providers can use different SSL options; use the JDBC URL and credentials they provide.

For a deployed frontend, set Vercel's `VITE_API_URL` to `https://YOUR-BACKEND-DOMAIN/api`, and set backend `CORS_ALLOWED_ORIGIN` to the exact Vercel site URL (for example `https://your-project.vercel.app`). Redeploy the frontend after changing its environment variable.

## GitHub + hosting outline

1. Create a GitHub repository, then from this folder run `git init`, `git add .`, `git commit -m "Build sample login signup app"`, and `git push` to your new repository.
2. Import the repo into Vercel. Set **Root Directory** to `frontend`; Vercel detects Vite. Add `VITE_API_URL` in Project Settings → Environment Variables. `frontend/vercel.json` provides SPA routing. Vercel supports deploying Vite frontends from Git, with preview deployments when pushes happen.
3. Deploy `backend/` as a Java/Maven web service on a Java-capable host and provision a MySQL database. Configure the environment variables above. If using Railway, its current Free plan offers limited monthly usage and services sleep when idle; MySQL is available but usage/egress counts toward the allowance. Check the provider's live limits before relying on it.
4. Put the final backend URL in Vercel's `VITE_API_URL`, and the Vercel URL in backend `CORS_ALLOWED_ORIGIN`.
5. Create one account in the deployed UI, then query the hosted `users` table to demonstrate persistence.

Vercel is suitable for the React/Vite frontend here; the Spring Boot application and MySQL database are separate services. Vercel Hobby is free for personal, non-commercial use, and its terms/limits can change. This repo is configured for those services but has not been published or deployed from your accounts.

## Security scope

This is an interview/demo starter, not a production identity system. It uses BCrypt, parameterized JPA access, DTO validation, generic login failure text, a database unique constraint, stateless JWT checks, and configurable CORS. It keeps the demo token in `localStorage` for simplicity; production apps should consider secure HttpOnly cookies, rate limiting, email verification, password reset, stricter account policy, secret rotation, database migrations, and HTTPS-only deployment. `ddl-auto=update` is convenient for this demo; production deployments should use a migration tool.
