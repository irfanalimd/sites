# sites

My personal site for HTML pages made with AI: [sites.irfanali.me](https://sites.irfanali.me)

Inspired by [Set up a personal subdomain for agent artifacts](https://sites.arnavg.in/learning/personal-subdomain/).

## How it works

- Every page is a single HTML file in `p/learning/`, `p/research/` or `p/random/`.
- The homepage lists them automatically. There's no build step.
- [`llms.txt`](llms.txt) tells AI tools how to publish, and [`AGENTS.md`](AGENTS.md) does the same for coding agents.

To publish, tell any AI tool that can write to GitHub:

> Upload this to my site. Instructions are at https://sites.irfanali.me/llms.txt

## Make your own

1. Fork this repo.
2. Replace `irfanalimd`, `sites.irfanali.me` and `Irfan Ali` with your own details, and delete my pages in `p/`.
3. In Settings → Pages, deploy from the `main` branch.
4. For a custom domain, put it in `CNAME` and add a DNS `CNAME` record pointing to `<username>.github.io`. Otherwise, delete `CNAME`.
5. Give your AI tool write access to the repo, e.g. by connecting GitHub in Claude.ai or ChatGPT.
