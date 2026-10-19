# is-a.dev PR Checklist — darrenlabs.is-a.dev (DRAFT, DO NOT SUBMIT YET)

Status: DRAFT ONLY. File `darrenlabs.json` in this folder has NOT been submitted. Do not submit without Darren's explicit approval.

## Target

- Subdomain: `darrenlabs.is-a.dev`
- Availability: CHOSEN, TO BE CONFIRMED via is-a.dev checker / PR. A web search showed no existing match for the exact string — that is NOT a guarantee. Do not claim registered or available until the checker / PR confirms it.
- Points to: Render Static Site for Darren Labs (see `../RENDER.md`)

## Site readiness (helps review)

- Site is now concise single-hero: VoltWorks Power only, top-notch quality/branding, authentic + slightly aesthetic. Do NOT show many projects (would clutter).
- This helps is-a.dev review: real content, not placeholder, not cluttered.
- Site MUST be live on Render (with real content) BEFORE submitting the PR. Reviewers reject placeholder pages.

## File rules (CI will fail if these are wrong)

- [ ] File location in the fork: `domains/darrenlabs.json` — must be inside `domains/`, not root, not a subfolder.
- [ ] Filename: `darrenlabs.json` — 2–64 chars, lowercase letters, numbers, and dashes only. `darrenlabs` = 10 chars, valid.
- [ ] JSON must be valid — validate with `python3 -m json.tool` before committing. No trailing commas, no comments in JSON.
- [ ] Use `records` (plural), NOT `record` (singular). CI schema validation flags `record` immediately.
- [ ] CNAME only. Do NOT include both CNAME + A in the same file — they conflict, CI will catch it.
- [ ] A records, if ever used instead, must be arrays, e.g. `"A": ["76.76.21.21"]` — even with one value. For Render, CNAME is the right call since Render IPs can change.
- [ ] No self-reference: CNAME must NOT point back to `darrenlabs.is-a.dev`.
- [ ] CNAME value: `<your-render-url>.onrender.com` placeholder must be replaced with the REAL Render URL assigned after the Render Static Site is created. Do NOT invent one.

## Current draft contents (`darrenlabs.json`)

- `owner.username` = `DarthSandD` (from Darren's GitHub)
- `owner.email` = `YOUR-EMAIL-HERE` — PLACEHOLDER. Darren must fill the real email. Do NOT invent one.
- `records.CNAME` = `<your-render-url>.onrender.com` — PLACEHOLDER. Replace with real Render URL after service creation.

## Submission steps (on approval only)

1. Fork `https://github.com/is-a-dev/register` (do not work on `main` directly — use a fresh branch, e.g. `add-darrenlabs-domain`).
2. Copy the validated `darrenlabs.json` into `domains/` in your fork.
3. Commit with a clear message, e.g. `Add darrenlabs.is-a.dev`.
4. Open a Pull Request to `is-a-dev/register`. Complete the PR template checklist, confirm the project is dev-related.
5. Tick "Allow edits from maintainers" to speed up review.
6. Monitor the PR. Respond promptly to maintainer feedback — delayed responses risk rejection.
7. Typical review: 24–72 hours. Two gates: automated CI tests first, then human volunteer review of your live site + files.

## After merge

- DNS propagates within minutes (sometimes a bit longer).
- Visit `https://darrenlabs.is-a.dev` to check. If you still see the is-a.dev homepage, refresh / clear cache / flush DNS.
- In Render, confirm the custom-domain certificate is issued and valid.
- If the PR is rejected, do NOT resubmit the same file unchanged — read the CI / reviewer feedback, fix, then resubmit.

## Still needed from Darren

- [ ] Owner email to replace `YOUR-EMAIL-HERE`
- [ ] Real Render `*.onrender.com` URL to replace the placeholder
- [ ] Confirmation `darrenlabs.is-a.dev` is available via the is-a.dev checker
- [ ] Approval to submit the PR
