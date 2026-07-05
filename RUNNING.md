# Running this project (Windows)

This guide helps you run the Vite + React + TypeScript app in this repository and apply the included SQL files (Supabase/Postgres). Instructions are Windows-friendly (cmd.exe / PowerShell).

---

## 1) Requirements
- Node.js (LTS recommended — v18+). Use nvm-windows to manage versions.
- npm (comes with Node.js)
- Git (optional, for cloning)
- Optional for SQL: Supabase account/CLI or PostgreSQL + psql

---

## 2) Install Node (recommended: nvm-windows)
Option A — Using nvm-windows (recommended if you need version control):
1. Download & install nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
2. Open a new PowerShell/cmd and run:

```powershell
nvm install 18.20.0
nvm use 18.20.0
node -v
npm -v
```

Option B — Official installer (quick):
- Download LTS installer from https://nodejs.org and run it.
- Verify with:

```powershell
node -v
npm -v
```

---

## 3) Add .env for local dev
Create `.env` or `.env.local` in the project root (D:\First_project_clgclub) and copy values from `env.txt`:

```
VITE_SUPABASE_PROJECT_ID="dqftflcsulaghqeydllu"
VITE_SUPABASE_PUBLISHABLE_KEY="<paste the key from env.txt here>"
VITE_SUPABASE_URL="https://dqftflcsulaghqeydllu.supabase.co"
```

---

## 4) Install dependencies and run dev server (Vite)
From the repo root (PowerShell or cmd):

```powershell
npm install
npm run dev
```

- Vite prints the dev URL (e.g. http://localhost:5173). Open it in your browser.
- Useful scripts in package.json: `dev`, `build`, `preview`, `lint`.

---

## 5) Install recommended VS Code extensions (optional but helpful)
If you have the `code` CLI available, run from cmd/PowerShell:

```powershell
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension formulahendry.code-runner
code --install-extension eg2.vscode-npm-script
code --install-extension eamodio.gitlens
code --install-extension mtxr.sqltools
code --install-extension ms-ossdata.vscode-postgresql
code --install-extension supabase.supabase-vscode
```

If `code` isn't in your PATH, enable "Shell Command: Install 'code' command in PATH" inside VS Code.

---

## 6) Apply the SQL files (Supabase / Postgres)
Files in this repo:
- `20251115133220_ceab0311-a0f3-48c5-b9ae-05b960ae1bb3.sql` — schema, RLS policies, triggers
- `20251119170612_17f5445e-dde5-432a-bc03-621ef4deb597.sql` — additional policies

These are Supabase/Postgres SQL files (references `auth.uid()`, `auth.users`, and `gen_random_uuid()`). Choose one of the following:

Option A — Use Supabase (recommended if you use Supabase):
1. Install Supabase CLI:

```powershell
npm install -g supabase
supabase login
```

2. Use local Supabase (Docker required):

```powershell
supabase start
supabase db push   # if using migrations or schema files in a migrations folder
```

3. Or use the Supabase dashboard SQL editor to paste and execute the SQL files directly.

Option B — Use psql with a Postgres database:
- Ensure required extensions exist (e.g. `pgcrypto` for gen_random_uuid):

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

- Run the SQL files using psql (PowerShell / cmd):

```powershell
psql -h <host> -p <port> -U <user> -d <database> -f "D:\First_project_clgclub\20251115133220_ceab0311-a0f3-48c5-b9ae-05b960ae1bb3.sql"
psql -h <host> -p <port> -U <user> -d <database> -f "D:\First_project_clgclub\20251119170612_17f5445e-dde5-432a-bc03-621ef4deb597.sql"
```

Note: The SQL uses row-level security (RLS) and references `auth.*` — Supabase provides the `auth` schema. If applying to plain Postgres, you may need to create or adjust the `auth` schema or apply the SQL within a Supabase environment to avoid missing references.

---

## 8) Option C — Run with Docker (quick & repeatable)

If you'd prefer to run this app in a container (production-style static build), the repository includes a Dockerfile and a docker-compose.yml.

- The Dockerfile uses a multi-stage build: node builds the Vite app and nginx serves the static output.
- docker-compose maps host port 5173 to the container port 80, so after starting the container you can open http://localhost:5173 in your browser.

Commands:

```powershell
# build and run
docker compose up --build -d

# open http://localhost:5173 in your browser

# stop
docker compose down
```

Requirements: Docker Desktop or Docker Engine installed and running.

---

## 9) Helper scripts included

To simplify running the project locally I added platform scripts in the repo root:

- `start-dev.bat` — Windows batch file that installs dependencies and starts the Vite dev server.
- `start-dev.ps1` — PowerShell script which installs dependencies and starts the dev server in a new process.
- `run-sql.bat` / `run-sql.ps1` — helper scripts for running a SQL file using `psql` (they take parameters for host/port/db/user/file).

Examples (PowerShell):

```powershell
# start dev server
.\start-dev.ps1

# run a SQL file
.\run-sql.ps1 -DBHost localhost -Port 5432 -Database mydb -User postgres -SqlFile .\20251115133220_ceab0311-a0f3-48c5-b9ae-05b960ae1bb3.sql
```

---

## 10) Auto-deploy (GitHub Pages)

If you want a publicly available link (open in Chrome from anywhere) you can deploy the site to GitHub Pages. I added a GitHub Actions workflow at `.github/workflows/deploy.yml` which will build and publish `dist/` to the `gh-pages` branch automatically when you push to `main` or `master`.

Steps to get a live site:

1. Create a GitHub repository and push this project to it (if not already on GitHub):

```bash
git remote add origin git@github.com:<your-username>/<your-repo>.git
git push -u origin main
```

2. Wait for the GitHub Action to finish (Actions → Build and deploy to GitHub Pages). It will create/update the `gh-pages` branch and publish to GitHub Pages.

3. Your site URL will be: `https://<your-username>.github.io/<your-repo>/` — open that in Chrome.

Note: If your repo's default branch is `main` or `master`, the workflow will trigger; otherwise update the workflow `push.branches` list.

---

## 7) Troubleshooting tips
- If `npm run dev` fails: check Node version and that dependencies installed successfully
- If SQL complains about missing functions or schema (`auth.uid()`, `auth.users`, `gen_random_uuid()`), run in a Supabase environment or install proper extensions (`pgcrypto`) and ensure `auth` schema exists.
- If the `code` CLI isn't found, enable it from VS Code or install it manually.

---

## 8) Quick next steps I can help with (choose one)
- Run the project here (I will attempt `npm install` and `npm run dev` once Node is available in the environment)
- Apply SQL files to a Supabase project — I can walk you through or apply if you provide connection details or use the Supabase local stack
- Add any more project-specific run scripts or environment setup

---

If you'd like, tell me which of the next steps you'd like me to do and I’ll continue (e.g. run commands here, apply SQL to a Supabase project, or produce a short quick-start snippet for devs).
