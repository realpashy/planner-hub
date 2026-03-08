# Planner Hub: First-Time Live Push Setup

This guide is written for non-technical setup.

## 1) Create a GitHub repository (one-time)
1. Open https://github.com/new
2. Repository name: `planner-hub`
3. Choose `Private` or `Public`
4. Do NOT add README, .gitignore, or license (leave empty)
5. Click `Create repository`

## 2) Connect this local project to GitHub
Run these commands in `Planner-Hub` folder:

```powershell
git remote remove gitsafe-backup 2>$null
git remote add origin https://github.com/<YOUR_USERNAME>/planner-hub.git
git add .
git commit -m "chore: import replit project and deployment config"
git branch -M main
git push -u origin main
```

If Git asks for login, sign in with your GitHub account in the browser popup.

## 3) Connect Vercel for auto deploy on every push
1. Open https://vercel.com/new
2. Import repository `planner-hub`
3. Framework preset: `Vite`
4. Build command: `npm run build`
5. Output directory: `dist/public`
6. Click `Deploy`

After this, every push to `main` will auto-deploy.

## 4) Create Supabase project (for future DB stage)
1. Open https://supabase.com/dashboard
2. Click `New project`
3. Choose organization, set project name `planner-hub`, choose region, set DB password
4. Wait until project is ready
5. In project settings, copy:
   - Project URL
   - anon public key

## 5) Add Supabase values in Vercel env vars
1. In Vercel project -> `Settings` -> `Environment Variables`
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Save and redeploy

## 6) Daily workflow (live pushes)
Use this every time you update code:

```powershell
git add .
git commit -m "your update message"
git push
```

Vercel deploys automatically after each push.

## Notes
- Current app state is localStorage-based. Supabase is prepared for the next phase.
- `.env` files are ignored, so secrets are not pushed to GitHub.
