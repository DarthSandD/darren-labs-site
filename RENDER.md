# Darren Labs — Render Static Site Setup (DRAFT, DO NOT DEPLOY YET)

Status: PREPARED LOCALLY ONLY. Nothing has been pushed to GitHub, deployed to Render, or submitted to is-a.dev. All steps below need Darren's approval before execution.

## Target

- Company: Darren Labs — Agentic AI Studio
- Domain target: `darrenlabs.is-a.dev`
- Availability: CHOSEN, TO BE CONFIRMED via is-a.dev checker / PR. A web search showed no existing match for the exact string `darrenlabs.is-a.dev` — that is NOT a guarantee of availability. Do not claim it is registered or available until the is-a.dev checker / PR confirms it.
- Hosting: Render Static Site + custom domain
- Site direction (refined 2026-10-19): top-notch quality/branding, authentic + slightly aesthetic, concise. Show ONLY the top-notch project — VoltWorks Power — concisely. Do NOT show many projects (would clutter). This actually helps is-a.dev review: real content, not placeholder, not cluttered.

## What Render does / does not do

- Render does NOT create or sell the domain. It hosts the site and lets you attach your own custom domain.
- Render gives you a free `*.onrender.com` URL when the service is created.
- Render custom domain is free with automatic HTTPS (Let's Encrypt) on the free tier.
- A Static Site has no backend to sleep. The 15-minute sleep issue applies to Render Web Services (backends), not to a static company page.

## Exact steps (on approval)

1. **Create the GitHub repo (on approval only)**
   - Create a new GitHub repo under `DarthSandD` for the Darren Labs site (name to confirm with Darren — e.g. `darren-labs-site`).
   - Push the local site in `~/workspace/darren-labs-site/` to that repo.
   - Do NOT push until Darren approves. Per standing rule: build + review locally first, push only on go-ahead.

2. **Create the Render Static Site**
   - Render Dashboard → New → Static Site
   - Connect the GitHub repo from step 1.
   - Branch: `main` (confirm if different)
   - Build Command: (leave empty / none — static site, no build step)
   - Publish Directory: `.` (repo root) — confirm if the site lives in a subfolder; if so, use that folder.
   - Click Create. Render will assign a URL like `<your-render-url>.onrender.com`.
   - **DO NOT invent this URL.** After Render creates the service, copy the exact `*.onrender.com` URL it shows and use it in the next steps. Everywhere this doc says `<your-render-url>.onrender.com`, replace it with that real value.

3. **Add the custom domain in Render**
   - In the new service: Settings → Custom Domains → Add Custom Domain
   - Enter: `darrenlabs.is-a.dev`
   - Render will show the domain as pending verification until DNS points to it. That is expected.

4. **Point is-a.dev at Render**
   - In `is-a-dev/darrenlabs.json` (draft in this folder), set:
     `records.CNAME = <your-render-url>.onrender.com`
     using the real Render URL from step 2.
   - Fill `owner.email` — currently `YOUR-EMAIL-HERE`. Darren must supply the real email. Do NOT invent one.
   - Submit the is-a.dev PR per `is-a-dev/PR_CHECKLIST.md` (on approval only).
   - Wait for PR merge + DNS propagation. Render will then automatically issue the HTTPS certificate for `darrenlabs.is-a.dev`.

5. **Verify**
   - Visit `https://darrenlabs.is-a.dev` — expect the Darren Labs homepage.
   - Visit `https://<your-render-url>.onrender.com` — should show the same site.
   - In Render Dashboard → Custom Domains, confirm certificate status is valid / issued.

## Still needed from Darren (before any deploy)

- [ ] Approval to create the GitHub repo + push the site
- [ ] Approval to create the Render Static Site
- [ ] Real Render `*.onrender.com` URL (only exists after service creation — cannot be filled in advance)
- [ ] Owner email for the is-a.dev file (currently `YOUR-EMAIL-HERE`)
- [ ] Approval to submit the is-a.dev PR
- [ ] Confirmation that `darrenlabs.is-a.dev` is available via the is-a.dev checker

## Files in this folder

- `RENDER.md` — this file
- `is-a-dev/darrenlabs.json` — DRAFT is-a.dev file, NOT submitted
- `is-a-dev/PR_CHECKLIST.md` — is-a.dev rules + submission checklist
- `LINKEDIN.md` — LinkedIn Company Page kit (do NOT create the page yet)
- Site files (built by a parallel worker — do NOT overwrite without coordination)
