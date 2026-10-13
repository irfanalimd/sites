# sites

**[sites.irfanali.me](https://sites.irfanali.me)**: a personal publishing site for HTML pages made with AI tools (research reports, explainers, exercises) plus a weekly *Today I Learned* log.

There's no build step, framework or backend. It's a folder convention, GitHub Pages, and a short instruction file that any AI agent can follow.

> Inspired by [Set up a personal subdomain for agent artifacts](https://sites.arnavg.in/learning/personal-subdomain/) from sites.arnavg.in.

## How it works

```
index.html          homepage: lists every page in p/, grouped by section (no manual index)
llms.txt            publishing instructions for AI agents (web chats with a GitHub connector)
AGENTS.md           instructions for coding agents, including the TIL procedure
CLAUDE.md           one line that points Claude Code to AGENTS.md
404.html            "not found" page, plus redirects for pages that moved
CNAME               the custom domain (sites.irfanali.me)
p/learning/         explainers, tutorials, exercises
p/research/         reports, reviews, analyses
p/random/           everything else
p/til/              one page per week, named after that week's Monday (from _template.html)
```

- **Publishing a page means uploading one file.** Put a self-contained `.html` at `p/<section>/<slug>.html`. It's live in about a minute at `https://sites.irfanali.me/p/<section>/<slug>.html`.
- **The homepage builds itself.** It reads the repo's file list from the GitHub API and shows each page's `<title>`, newest first. Files whose names start with `_` are hidden.
- **The home screen always fits on one screen.** Tapping a section opens its list.

## Publishing

**From a web chat** (Claude.ai, ChatGPT, Grok, or any tool with a GitHub connector that can write files), after making an artifact:

> Upload this to my site. Instructions are at https://sites.irfanali.me/llms.txt

**From a coding agent** (Claude Code, Codex, Cursor, etc.) in this repo, say the same thing. It reads `AGENTS.md` and `llms.txt`.

**By hand:** add the file under `p/<section>/`, then commit and push:

```sh
git add p/research/my-report.html
git commit -m "publish: research/my-report"
git push
```

Starting a commit message with `publish: <section>/<slug>` lets the homepage show the right date.

## TIL (Today I Learned)

TIL is one page per week, and weeks start on Monday. Each day gets its own section, and several notes on the same day are separated by a divider.

Tell any agent:

> Add this to today's learnings: …

It finds this week's page (`p/til/<Monday>.html`), creating it from `p/til/_template.html` on a new week, and adds a dated entry. The exact steps and HTML snippets are in [AGENTS.md](AGENTS.md). To edit by hand, follow the `<!-- TIL:… -->` marker comments inside the page.

## Make your own

1. **Fork** this repo, or copy its files into a new public repo.
2. **Swap in your details.** Search for `irfanalimd`, `sites.irfanali.me` and `Irfan Ali`, and replace them with your GitHub username, domain and name. They appear in `index.html`, `llms.txt`, `AGENTS.md`, `404.html` and `p/til/_template.html`. Delete or replace the pages in `p/`.
3. **Turn on GitHub Pages:** Settings → Pages → *Deploy from a branch* → `main`, folder `/ (root)`.
4. **Add a custom domain** (optional):
   - put your domain in `CNAME`
   - at your DNS provider, add a `CNAME` record from your subdomain (e.g. `sites`) to `<username>.github.io`
   - once the certificate is ready, tick *Enforce HTTPS* in Settings → Pages

   Without a custom domain, delete `CNAME` and use `https://<username>.github.io/<repo>/`.
5. **Give your AI tools write access:** connect GitHub in your chat app (the connector must be able to create or update files in this repo), or use the `gh` CLI or a token with `contents: write`.
6. **Test it:** ask an agent to publish a small page, check that it appears on the homepage within a minute, then delete it.

The site is public, so never publish secrets, private data or anything you wouldn't post openly.
