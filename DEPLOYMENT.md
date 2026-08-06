# Deployment

Static site, no build step. `site/` deploys as-is.

| | |
|---|---|
| **Live** | <https://tsd-uofm.karpowitsch.org> |
| **Pages alias** | <https://tsd-uofm.pages.dev> |
| **Repo** | `akarpo/tsd-uofm` (public) |
| **Cloudflare project** | `tsd-uofm`, **Git-connected** |
| **Production branch** | `main` |
| **Build command** | *(none)* |
| **Build output directory** | `site` |
| **Account ID** | `441404c330567750a5ca12287a929313` |
| **Zone** | `karpowitsch.org` — `4e38a83c602bbff03565598e8e11afe9` |

**Push to `main` deploys.** That is the whole workflow.

---

## Creating the Pages project

The house convention in this account is **Git-connected Pages, never Direct
Upload** — all seven sibling projects deploy from GitHub. The dashboard's
"Import an existing Git repository" flow is the documented path, but its controls
sit in a nested app frame that did not respond to automation here.

The reliable route is the API, replicating the `source` block from an existing
project verbatim:

```bash
REPO_ID=$(gh api repos/akarpo/tsd-uofm --jq '.id')
OWNER_ID=$(gh api users/akarpo --jq '.id')

curl -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data @- <<EOF
{
  "name": "tsd-uofm",
  "production_branch": "main",
  "source": {
    "type": "github",
    "config": {
      "owner": "akarpo", "owner_id": "$OWNER_ID",
      "repo_name": "tsd-uofm", "repo_id": "$REPO_ID",
      "production_branch": "main",
      "pr_comments_enabled": true,
      "deployments_enabled": true,
      "production_deployments_enabled": true,
      "preview_deployment_setting": "all",
      "preview_branch_includes": ["*"], "preview_branch_excludes": [],
      "path_includes": ["*"], "path_excludes": []
    }
  },
  "build_config": { "build_command": "", "destination_dir": "site", "root_dir": "" }
}
EOF
```

This works because the Cloudflare **GitHub App is already installed** on the
account. On a fresh account the app must be installed through the dashboard first —
that step is a GitHub authorization and cannot be automated away.

To crib the shape from a working project:

```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT/pages/projects/tsd-standards" \
  -H "Authorization: Bearer $TOKEN" | jq '.result | {source, build_config}'
```

---

## Custom domain and DNS

Two separate steps. **Attaching the domain to the Pages project does not create the
DNS record** — a persistent source of "why is my site dead".

```bash
# 1. attach to the project
curl -X POST ".../pages/projects/tsd-uofm/domains" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"name":"tsd-uofm.karpowitsch.org"}'

# 2. create the record
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"tsd-uofm","content":"tsd-uofm.pages.dev",
           "proxied":true,"ttl":1}'
```

Matching the pattern every sibling uses: **proxied CNAME → `<project>.pages.dev`,
TTL auto**. Always list existing records for the name first — creating a duplicate
is easy and confusing.

The domain and its certificate went `pending → active` in roughly three minutes.

### Token scopes

Two tokens were in play, and the difference matters:

| Token | Pages read/write | Zone read | DNS write | Cache purge |
|---|---|---|---|---|
| wrangler OAuth (`~/.wrangler/config/default.toml`) | ✅ | ✅ | ❌ | ❌ |
| user API token | ✅ | ✅ | ✅ | ❌ |

**Wrangler's OAuth token cannot write DNS.** It reads the zone happily, which makes
the failure look like something else — the actual response is a bare
`{"code": 10000, "message": "Authentication error"}`. A user API token with
`Zone:DNS:Edit` is required.

Neither token is stored in this repo. The user token was passed through a shell
environment variable and never written to a file.

---

## Verifying a deploy

```bash
curl -s ".../pages/projects/tsd-uofm/deployments?per_page=1" \
  -H "Authorization: Bearer $TOKEN" \
| jq -r '.result[0] | "\(.short_id) \(.latest_stage.name) \(.latest_stage.status)"'
```

Deployment-specific URLs (`https://<short_id>.tsd-uofm.pages.dev/`) bypass the
custom domain's edge cache and are the quickest way to confirm what actually
shipped.

---

## Two traps worth remembering

**Do not `dig` a hostname before its record exists.** A negative answer is cached
for the zone's SOA minimum — up to 30 minutes — and the site looks dead from your
machine long after it is live everywhere else. It happened here: a polling loop
queried the name a second after the CNAME was created, cached the NXDOMAIN, and
kept returning nothing while Cloudflare, Google and Quad9 all resolved it fine.
Check against a public resolver, or `curl --resolve`, before believing your own
machine. On macOS the local cache clears with:

```bash
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

**A stale asset right after a deploy is usually just the edge revalidating.** Assets
ship with `cache-control: public, max-age=14400, must-revalidate`. A first request
after a deploy can return the previous copy with `cf-cache-status: EXPIRED`, then
serve the new one immediately after. Check twice before reaching for a purge — and
note that neither token above has cache-purge scope anyway.

---

## Size

| | |
|---|---|
| `site/` total | ~22 MB |
| Audio | ~21 MB across 6 files (largest 10 MB) |
| Payload JSON | ~50 KB |
| Everything else | < 100 KB |

Comfortably inside Cloudflare Pages' limits (25 MB per file, 20,000 files). The
~300 MB of bulk source data is gitignored and re-fetchable; see `SCRIPTS.md`.
