# Road Crashes (AU) — Build Review

This file exists only to create a reviewable PR. All code is already deployed on `main`.

**Merge this PR to acknowledge the build.** Closing without merging is also fine.

## Links

- **GitHub Pages:** https://ben-gy.github.io/au-crashes/ *(redirects to custom domain once DNS is set)*
- **Custom domain:** https://au-crashes.benrichardson.dev *(live after DNS + cert below)*

## DNS setup

CNAME record has been automatically created in Cloudflare:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `au-crashes` | `ben-gy.github.io` | DNS only (grey cloud) |

TLS cert issuance has been triggered. If cert isn't live yet, cycle CNAME:
```bash
gh api repos/ben-gy/au-crashes/pages -X PUT -f cname=""
sleep 3
gh api repos/ben-gy/au-crashes/pages -X PUT -f cname="au-crashes.benrichardson.dev"
```
