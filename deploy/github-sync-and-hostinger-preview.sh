#!/usr/bin/env bash
# ==============================================================================
# UAB „Gilės inžinerija“ — GitHub Sync (@mindaugassamulionis-stack) & Hostinger Live Preview
# ==============================================================================
set -euo pipefail

PROJECT_DIR="/home/mindu/Desktop/giles/giles-platform"
TOKEN_ENV="/home/mindu/.config/github-mcp/token.env"
EXPECTED_OWNER="${GITHUB_OWNER:-mindaugassamulionis-stack}"
REPO_NAME="${GITHUB_REPO:-giles-platform}"
MODE="${1:---status}"

if [ -f "$TOKEN_ENV" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$TOKEN_ENV"
  set +a
fi

echo "=== [1/4] Checking GitHub Authentication & MCP Server ==="
/home/mindu/.local/bin/github-mcp-server --version
ACTIVE_LOGIN="$(gh api user --jq .login 2>/dev/null || echo "unauthenticated")"
echo "  Active GitHub CLI / MCP login : @${ACTIVE_LOGIN}"
echo "  Target repository owner       : @${EXPECTED_OWNER}/${REPO_NAME}"

if [ "$ACTIVE_LOGIN" != "$EXPECTED_OWNER" ]; then
  echo "  [NOTICE] Current token is authenticated as @${ACTIVE_LOGIN} (not @${EXPECTED_OWNER})."
  echo "  To switch to @${EXPECTED_OWNER}, paste your classic token into:"
  echo "    /home/mindu/.config/github-mcp/PASTE_TOKEN_HERE.txt"
  echo "  and run:"
  echo "    /home/mindu/.local/bin/set-github-token"
fi

echo "=== [2/4] Verifying Local Git Repository & Secret Hygiene ==="
cd "$PROJECT_DIR"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init -b main
fi
git config user.name "mindaugassamulionis-stack"
git config user.email "247673548+mindaugassamulionis-stack@users.noreply.github.com"

if git check-ignore -q .env; then
  echo "  [PASS] .env is git-ignored"
else
  echo "  [FAIL] .env is NOT ignored by git! Refusing to sync." >&2
  exit 1
fi

if [ "$MODE" = "--status" ]; then
  echo "=== [3/4] Dry-Run Status Complete (pass --sync-github or --preview-deploy to execute) ==="
  exit 0
fi

if [ "$MODE" = "--sync-github" ] || [ "$MODE" = "--all" ]; then
  echo "=== [3/4] Syncing Repository to GitHub (${ACTIVE_LOGIN}/${REPO_NAME}) ==="
  if ! gh repo view "${ACTIVE_LOGIN}/${REPO_NAME}" >/dev/null 2>&1; then
    gh repo create "${ACTIVE_LOGIN}/${REPO_NAME}" --private --description "UAB Gilės inžinerija — Biokuro katilinių ir pramoninės šilumos energetikos platforma"
  fi
  REMOTE_URL="https://github.com/${ACTIVE_LOGIN}/${REPO_NAME}.git"
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REMOTE_URL"
  else
    git remote add origin "$REMOTE_URL"
  fi
  git add -A
  if ! git diff --cached --quiet; then
    git commit -m "chore(release): sync giles-platform for live preview deployment"
  fi
  git push -u origin main
  echo "  [PASS] Synced to $REMOTE_URL"
fi

if [ "$MODE" = "--preview-deploy" ] || [ "$MODE" = "--all" ]; then
  echo "=== [4/4] Building & Verifying Hostinger / Docker Live Preview (port 3088) ==="
  docker compose -f "$PROJECT_DIR/deploy/docker-compose.giles-prod.yml" up -d --build giles-platform
  "$PROJECT_DIR/deploy/cutover-domains-check.sh" "http://127.0.0.1:3088"
fi
