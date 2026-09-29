#!/bin/zsh
# Aurora & Cedar Stays — one-time setup before the Claude Code run.
# Run this in Terminal (not inside Claude Code): it needs you to type the SSH passwords.
#
# Before running:
#  a) Install Node.js LTS from nodejs.org (this Mac has no node/npm; Playwright needs it).
#  b) Create GoDaddy's own staging site: GoDaddy → My Products → Managed WordPress → (site) → Settings
#     → Staging Site → Create. Don't use the old WPvivid copy at /mystaging01 (stale, hand-modified).
#  c) Copy the SSH/SFTP login for production AND for the new staging site from each one's Settings page.

command -v node >/dev/null || { echo "Install Node.js first (nodejs.org, LTS), then re-run."; exit 1; }

# 1) Production host is known; fill in the user and the staging values.
PROD_HOST="1256185.eu15.ssh.myftpupload.com"
PROD_USER=""
STAGING_HOST=""
STAGING_USER=""
[[ -z "$PROD_USER" || -z "$STAGING_HOST" || -z "$STAGING_USER" ]] && { echo "Fill in PROD_USER, STAGING_HOST and STAGING_USER first."; exit 1; }
[[ "$STAGING_HOST" == "$PROD_HOST" && "$STAGING_USER" == "$PROD_USER" ]] && { echo "Staging login equals production. Create GoDaddy staging first."; exit 1; }

mkdir -p ~/acs-fix-run/.claude ~/acs-fix-run/acs-fix && cd ~/acs-fix-run

cat > ssh_config <<EOF
Host acs-prod
  HostName $PROD_HOST
  User $PROD_USER
Host acs-staging
  HostName $STAGING_HOST
  User $STAGING_USER
Host acs-*
  ControlMaster auto
  ControlPath ~/.ssh/cm-acs-%n
  ControlPersist 24h
  ServerAliveInterval 60
  StrictHostKeyChecking accept-new
EOF

# 2) Log in once to each site (type the SSH password when asked). Each connection stays open 24 hours.
ssh -F ./ssh_config -fN acs-prod
ssh -F ./ssh_config -fN acs-staging
ssh -F ./ssh_config acs-prod 'echo production connected'
ssh -F ./ssh_config acs-staging 'echo staging connected'

# 3) The prompt and the repo it reads (HANDOVER.md, acs-site plugin).
cp ~/aurora-and-cedar/tasks/acs-fix-run-prompt.md ./acs-claude-code-prompt.md

# 4) Permissions so Claude Code can work unattended. The deny list is a backstop, not a security boundary.
cat > .claude/settings.json <<'EOF'
{
  "permissions": {
    "defaultMode": "acceptEdits",
    "additionalDirectories": ["~/aurora-and-cedar"],
    "allow": [
      "Bash(ssh *)", "Bash(scp *)", "Bash(rsync *)",
      "Bash(curl *)", "Bash(dig *)",
      "Bash(npx playwright *)", "Bash(npm *)", "Bash(node *)", "Bash(python3 *)",
      "Bash(git -C ~/aurora-and-cedar *)",
      "Bash(mkdir *)", "Bash(chmod *)", "Bash(date *)", "Bash(sleep *)",
      "WebFetch", "WebSearch", "Edit"
    ],
    "deny": [
      "Bash(* wp core update *)", "Bash(* wp plugin install *)", "Bash(* wp plugin update *)",
      "Bash(* wp plugin deactivate *)", "Bash(* wp plugin delete *)", "Bash(* wp theme update *)",
      "Bash(* wp user delete *)", "Bash(* wp user update *)", "Bash(* wp user create *)",
      "Bash(* wp post delete *)", "Bash(* wp db import *)", "Bash(* wp db reset *)", "Bash(* wp db drop *)",
      "Bash(* wp db query *DROP*)", "Bash(* wp db query *DELETE*)", "Bash(* wp db query *TRUNCATE*)",
      "Bash(* wp option delete *)", "Bash(* wp site empty *)",
      "Bash(rsync *--delete*)", "Bash(* rm -rf *)", "Bash(* rm -r *)",
      "Bash(git * push --force*)", "Bash(git * reset --hard*)"
    ]
  }
}
EOF

echo "Setup done. Put audit.md in ~/acs-fix-run, connect your VPN, then run:"
echo "  cd ~/acs-fix-run && caffeinate -i claude \"\$(cat acs-claude-code-prompt.md)\""
