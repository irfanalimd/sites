# sites

A minimal publishing portal for HTML artifacts, hosted on GitHub Pages.

- Pages live in `p/<slug>.html`. Uploading one file is all it takes to publish.
- `index.html` lists everything in `p/` automatically (via the GitHub API) and reads each page's `<title>`.
- `llms.txt` tells any AI tool (Claude.ai, ChatGPT, Grok with a GitHub connector, or a CLI agent) how to publish.

Usage from a chat: "Upload this artifact to my sites — instructions at <site>/llms.txt".
