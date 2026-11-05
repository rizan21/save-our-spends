#!/usr/bin/env bash
# ==============================================================================
# scripts/run-remote.sh
# 
# Builds and runs Save Our Spends (Spread-Spends) on a remote SSH client (such as
# an Android Pixel device running Termux, or a remote server) using tmux to host
# both the application server and a preconfigured tunnel (e.g. Cloudflare tunnel).
#
# Requirements:
#   - A configured SSH host alias in ~/.ssh/config (defaults to: "pixel")
#   - Syncs latest local repository changes to the remote location automatically.
# ==============================================================================

set -euo pipefail

# --- Default Configurations ---
DEFAULT_SSH_HOST="pixel"
DEFAULT_SESSION_NAME="save-our-spends"
DEFAULT_TUNNEL_CMD="cloudflared tunnel run --url http://127.0.0.1:5173 spread-spends"

SSH_HOST="${SSH_HOST:-$DEFAULT_SSH_HOST}"
SESSION_NAME="${SESSION_NAME:-$DEFAULT_SESSION_NAME}"
TUNNEL_CMD="${TUNNEL_CMD:-}"
TUNNEL_NAME="${TUNNEL_NAME:-}"
SERVER_CMD="${SERVER_CMD:-}"
BUILD_CMD="${BUILD_CMD:-}"
APP_DIR="${APP_DIR:-}"
DEV_MODE=false
SKIP_BUILD=false
BUILD_LOCAL=false
SYNC_DIST=false
NO_TUNNEL=false
SYNC=true
SYNC_ONLY=false
PULL=false
RESTART=false
ATTACH=false
STATUS_ONLY=false
STOP_ONLY=false
LAYOUT="split" # "split" (top/bottom) or "windows" (separate windows)
IS_LOCAL=false

# --- Helper Functions ---

print_usage() {
    cat << 'EOF'
Usage:
  ./scripts/run-remote.sh [ssh_host] [options]

Description:
  Syncs the latest local repository changes to a remote SSH client (defaulting
  to host "pixel" from ~/.ssh/config), builds the application, and launches both
  the server and preconfigured tunnel inside a named tmux session.

SSH Host Requirement:
  Requires an SSH host alias configured in ~/.ssh/config (e.g. "pixel").
  Default host: pixel

SSH Options:
  [ssh_host]              Configured SSH host from ~/.ssh/config (default: pixel)
  -H, --host <host>       Configured SSH host alias
  -d, --dir <path>        Remote directory path (default: auto-detected on host)
  --no-sync               Skip syncing local repo changes to the remote host
  --sync-only             Only sync latest changes without building or starting tmux
  --pull                  Fetch/pull latest changes from remote host into local repo
  --local                 Execute locally on the current machine (skip SSH)

App & Server Options:
  -s, --session <name>    tmux session name (default: "save-our-spends")
  -b, --build-local       Build locally before syncing; syncs dist/ and skips remote build
  --sync-dist             Sync dist/ artifacts to remote host without rebuilding locally
  -t, --tunnel-cmd <cmd>  Tunnel start command (default: "cloudflared tunnel run")
  --tunnel-name <name>    Named tunnel (uses: cloudflared tunnel run <name>)
  --no-tunnel             Run server only without launching a tunnel in tmux
  --server-cmd <cmd>      Custom server command (default: "<pkg_mgr> run preview")
  --build-cmd <cmd>       Custom build command (default: "<pkg_mgr> run build")
  --dev                   Run in dev mode (bun run dev) instead of preview
  --no-build              Skip the build step before launching
  --layout <split|windows>
                          tmux layout: "split" (default, 2 panes) or "windows"

Session Control:
  -r, --restart           Restart existing tmux session if already active
  -k, --stop              Stop / kill the active tmux session on the host
  --status                Check status of the tmux session and processes on the host
  -a, --attach            Attach to the tmux session immediately after start
  -h, --help              Show this help message and exit

Examples:
  # Build locally and launch preview on 'pixel' (recommended for mobile/Termux):
  ./scripts/run-remote.sh -b -r

  # Build locally, sync dist/ to 'pixel', and immediately attach to tmux:
  ./scripts/run-remote.sh -b -r -a

  # Deploy to 'pixel' (syncs files, builds remotely on host, and launches tmux):
  ./scripts/run-remote.sh

  # Deploy to another host configured in ~/.ssh/config:
  ./scripts/run-remote.sh my-server -b -r

  # Only sync modified files & dist to 'pixel' without restarting tmux:
  ./scripts/run-remote.sh -b --sync-only

  # Fetch/pull latest changes from 'pixel' back to local repository:
  ./scripts/run-remote.sh --pull

  # Check status or stop session on 'pixel':
  ./scripts/run-remote.sh --status
  ./scripts/run-remote.sh --stop
EOF
}

verify_ssh_config_host() {
    local host="$1"
    local ssh_config="$HOME/.ssh/config"

    if [[ ! -f "$ssh_config" ]]; then
        echo "Error: SSH config file (~/.ssh/config) not found." >&2
        echo "This script requires a configured SSH host alias (such as '$host')." >&2
        echo "" >&2
        echo "Please configure your SSH host in ~/.ssh/config, for example:" >&2
        echo "  Host $host" >&2
        echo "      HostName 192.168.1.xxx" >&2
        echo "      Port 8022" >&2
        echo "      User u0_a123" >&2
        echo "      IdentityFile ~/.ssh/id_ed25519" >&2
        exit 1
    fi

    local matched=false

    # Check if host alias appears in ~/.ssh/config
    if grep -qiE "^[[:space:]]*Host([[:space:]]+.*[[:space:]]+|[[:space:]]+)${host}([[:space:]]+.*|$)" "$ssh_config"; then
        matched=true
    fi

    # Fallback: check with ssh -G
    if [[ "$matched" = false ]]; then
        if ssh -G "$host" 2>/dev/null | grep -q "^hostname [^%]"; then
            matched=true
        fi
    fi

    if [[ "$matched" = false ]]; then
        echo "Error: Host '$host' is not configured in ~/.ssh/config." >&2
        echo "A configured SSH host alias in ~/.ssh/config is required." >&2
        echo "" >&2
        echo "Please add an entry for '$host' in ~/.ssh/config, for example:" >&2
        echo "  Host $host" >&2
        echo "      HostName <pixel-ip-or-domain>" >&2
        echo "      Port 8022" >&2
        echo "      User <user>" >&2
        echo "      IdentityFile ~/.ssh/id_ed25519" >&2
        exit 1
    fi
}

detect_package_manager() {
    if command -v bun &>/dev/null; then
        echo "bun"
    elif command -v pnpm &>/dev/null; then
        echo "pnpm"
    elif command -v npm &>/dev/null; then
        echo "npm"
    elif command -v yarn &>/dev/null; then
        echo "yarn"
    else
        echo ""
    fi
}

detect_remote_dir() {
    local host="$1"
    local probed
    probed=$(ssh "$host" '
        export PATH="/data/data/com.termux/files/usr/bin:$PREFIX/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"
        if [ -d "$HOME/Spread-Spends" ]; then
            echo "$HOME/Spread-Spends"
        elif [ -d "$HOME/save-our-spends" ]; then
            echo "$HOME/save-our-spends"
        elif [ -d "Spread-Spends" ]; then
            echo "$HOME/Spread-Spends"
        else
            echo "$HOME/Spread-Spends"
        fi
    ' 2>/dev/null || true)

    if [[ -n "$probed" ]]; then
        echo "$probed" | tr -d '\r\n'
    else
        echo "$HOME/Spread-Spends"
    fi
}

sync_repo_to_remote() {
    local host="$1"
    local remote_dir="$2"
    local sync_dist="${3:-false}"
    local local_dir
    local_dir="$(pwd)"

    echo "============================================================"
    echo "  Syncing Repository Changes to Remote Host: $host"
    echo "============================================================"
    echo "[*] Local Source : $local_dir"
    echo "[*] Remote Dest  : $host:$remote_dir"
    if [[ "$sync_dist" = true ]]; then
        echo "[*] Artifacts    : Including pre-built 'dist/' directory in sync"
    fi

    # Remote PATH prefix for Termux (where non-interactive zsh does not load ~/.zshrc)
    local remote_path_prefix="export PATH=\"/data/data/com.termux/files/usr/bin:\$PREFIX/bin:\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH\";"

    # Ensure remote directory exists
    ssh "$host" "${remote_path_prefix} mkdir -p '$remote_dir'"

    # Files and folders to exclude from sync to save bandwidth & preserve remote environment
    local excludes=(
        "--exclude=node_modules"
        "--exclude=.git"
        "--exclude=.wrangler"
        "--exclude=*.log"
        "--exclude=.DS_Store"
    )

    if [[ "$sync_dist" = false ]]; then
        excludes+=("--exclude=dist")
    fi

    local tar_excludes=(
        "--exclude=node_modules"
        "--exclude=.git"
        "--exclude=.wrangler"
        "--exclude=*.log"
        "--exclude=.DS_Store"
    )
    if [[ "$sync_dist" = false ]]; then
        tar_excludes+=("--exclude=dist")
    fi

    local rsync_success=false

    if command -v rsync &>/dev/null; then
        echo "[*] Transferring delta using rsync..."
        # Pass --rsync-path so remote Termux shell loads Termux binaries even in non-interactive mode
        if rsync -avz --delete \
            --rsync-path="PATH=\"/data/data/com.termux/files/usr/bin:\$PREFIX/bin:\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH\" rsync" \
            "${excludes[@]}" "$local_dir/" "$host:$remote_dir/"; then
            rsync_success=true
        else
            echo "[!] rsync failed on remote host. Falling back to compressed tar stream over SSH..."
        fi
    fi

    if [[ "$rsync_success" = false ]]; then
        echo "[*] Streaming compressed tarball via SSH..."
        tar -czf - "${tar_excludes[@]}" -C "$local_dir" . | \
            ssh "$host" "${remote_path_prefix} tar -xzf - -C '$remote_dir'"
    fi

    echo "[✓] Code sync completed successfully."
    echo ""
}

pull_repo_from_remote() {
    local host="$1"
    local remote_dir="$2"
    local local_dir
    local_dir="$(pwd)"

    echo "============================================================"
    echo "  Pulling Changes from Remote Host: $host"
    echo "============================================================"
    echo "[*] Remote Source : $host:$remote_dir"
    echo "[*] Local Dest    : $local_dir"

    local excludes=(
        "--exclude=node_modules"
        "--exclude=.git"
        "--exclude=dist"
        "--exclude=.wrangler"
        "--exclude=*.log"
        "--exclude=.DS_Store"
    )

    local tar_excludes=(
        "--exclude=node_modules"
        "--exclude=.git"
        "--exclude=dist"
        "--exclude=.wrangler"
        "--exclude=*.log"
        "--exclude=.DS_Store"
    )

    local rsync_success=false

    if command -v rsync &>/dev/null; then
        echo "[*] Pulling delta using rsync..."
        if rsync -avz \
            --rsync-path="PATH=\"/data/data/com.termux/files/usr/bin:\$PREFIX/bin:\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH\" rsync" \
            "${excludes[@]}" "$host:$remote_dir/" "$local_dir/"; then
            rsync_success=true
        else
            echo "[!] rsync failed on remote host. Falling back to compressed tar stream over SSH..."
        fi
    fi

    if [[ "$rsync_success" = false ]]; then
        echo "[*] Streaming compressed tarball from remote host via SSH..."
        ssh "$host" "export PATH=\"/data/data/com.termux/files/usr/bin:\$PREFIX/bin:\$PATH\"; tar -czf - ${tar_excludes[*]} -C '$remote_dir' ." | \
            tar -xzf - -C "$local_dir"
    fi

    echo "[✓] Code pull completed successfully."
    echo ""
}

resolve_project_dir() {
    if [[ -n "$APP_DIR" ]]; then
        APP_DIR="${APP_DIR/#\~/$HOME}"
        if [[ -d "$APP_DIR" ]]; then
            cd "$APP_DIR"
            APP_DIR="$(pwd)"
            return 0
        else
            echo "Error: Specified directory does not exist: $APP_DIR" >&2
            exit 1
        fi
    fi

    # Check if current directory has package.json
    if [[ -f "package.json" ]]; then
        APP_DIR="$(pwd)"
        return 0
    fi

    # Candidate directories on remote hosts (including Termux)
    local candidates=(
        "$HOME/Spread-Spends"
        "$HOME/save-our-spends"
        "$HOME/projects/Spread-Spends"
        "$HOME/Projects/Spread-Spends"
        "/data/data/com.termux/files/home/Spread-Spends"
        "/data/data/com.termux/files/home/save-our-spends"
    )

    for candidate in "${candidates[@]}"; do
        if [[ -d "$candidate" ]] && [[ -f "$candidate/package.json" ]]; then
            echo "[*] Auto-detected project directory at: $candidate"
            cd "$candidate"
            APP_DIR="$(pwd)"
            return 0
        fi
    done

    echo "Error: Could not locate application directory containing package.json." >&2
    echo "Please specify the directory using: -d /path/to/Spread-Spends" >&2
    exit 1
}

# --- Argument Parsing ---

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            print_usage
            exit 0
            ;;
        --local)
            IS_LOCAL=true
            shift
            ;;
        -H|--host)
            SSH_HOST="$2"
            shift 2
            ;;
        -d|--dir)
            APP_DIR="$2"
            shift 2
            ;;
        --no-sync)
            SYNC=false
            shift
            ;;
        --sync-only)
            SYNC_ONLY=true
            shift
            ;;
        --pull)
            PULL=true
            shift
            ;;
        -b|--build-local)
            BUILD_LOCAL=true
            SYNC_DIST=true
            shift
            ;;
        --sync-dist)
            SYNC_DIST=true
            shift
            ;;
        --no-tunnel)
            NO_TUNNEL=true
            shift
            ;;
        -s|--session)
            SESSION_NAME="$2"
            shift 2
            ;;
        -t|--tunnel-cmd)
            TUNNEL_CMD="$2"
            shift 2
            ;;
        --tunnel-name)
            TUNNEL_NAME="$2"
            shift 2
            ;;
        --server-cmd)
            SERVER_CMD="$2"
            shift 2
            ;;
        --build-cmd)
            BUILD_CMD="$2"
            shift 2
            ;;
        --dev)
            DEV_MODE=true
            shift
            ;;
        --no-build)
            SKIP_BUILD=true
            shift
            ;;
        -r|--restart)
            RESTART=true
            shift
            ;;
        -k|--stop)
            STOP_ONLY=true
            shift
            ;;
        --status)
            STATUS_ONLY=true
            shift
            ;;
        -a|--attach)
            ATTACH=true
            shift
            ;;
        --layout)
            LAYOUT="$2"
            shift 2
            ;;
        *)
            # Positional argument treated as SSH host if not yet overridden
            if [[ ! "$1" =~ ^- ]]; then
                SSH_HOST="$1"
                shift
            else
                echo "Unknown option: $1" >&2
                print_usage
                exit 1
            fi
            ;;
    esac
done

# ==============================================================================
# Remote SSH Execution Mode
# ==============================================================================

if [[ "$IS_LOCAL" = false ]]; then
    # Verify that the host is defined in ~/.ssh/config
    verify_ssh_config_host "$SSH_HOST"

    # Auto-detect or resolve remote directory
    if [[ -z "$APP_DIR" ]]; then
        echo "[*] Probing remote directory on $SSH_HOST..."
        APP_DIR="$(detect_remote_dir "$SSH_HOST")"
        echo "[*] Target directory: $APP_DIR"
    fi

    # Handle --pull action (fetch remote changes into local repo)
    if [[ "$PULL" = true ]]; then
        pull_repo_from_remote "$SSH_HOST" "$APP_DIR"
        exit 0
    fi

    # If --build-local was requested, perform build on local machine first
    if [[ "$BUILD_LOCAL" = true ]]; then
        echo "============================================================"
        echo "  Building Application Locally"
        echo "============================================================"
        LOCAL_PKG_MGR="$(detect_package_manager)"
        if [[ -z "$LOCAL_PKG_MGR" ]]; then
            echo "Error: Local package manager (bun, pnpm, npm, yarn) not found." >&2
            exit 1
        fi
        LOCAL_BUILD_CMD="${BUILD_CMD:-$LOCAL_PKG_MGR run build}"
        echo "[*] Local Manager   : $LOCAL_PKG_MGR"
        echo "[*] Local Build Cmd : $LOCAL_BUILD_CMD"
        echo "------------------------------------------------------------"

        eval "$LOCAL_BUILD_CMD"

        if [[ ! -d "dist" ]]; then
            echo "Error: Local build succeeded but 'dist' directory was not found." >&2
            exit 1
        fi
        echo "------------------------------------------------------------"
        echo "[✓] Local build completed successfully."
        echo ""
    fi

    # Handle file sync unless explicitly disabled or running check commands
    if [[ "$STATUS_ONLY" = false && "$STOP_ONLY" = false && "$SYNC" = true ]]; then
        sync_repo_to_remote "$SSH_HOST" "$APP_DIR" "$SYNC_DIST"
        if [[ "$SYNC_ONLY" = true ]]; then
            echo "[✓] Sync-only requested. Exiting without launching."
            exit 0
        fi
    fi

    # Build argument array for remote execution
    REMOTE_FORWARD_ARGS=("--local")
    REMOTE_FORWARD_ARGS+=("--dir" "$APP_DIR")
    REMOTE_FORWARD_ARGS+=("--session" "$SESSION_NAME")
    if [[ -n "$TUNNEL_CMD" ]]; then REMOTE_FORWARD_ARGS+=("--tunnel-cmd" "$TUNNEL_CMD"); fi
    if [[ -n "$TUNNEL_NAME" ]]; then REMOTE_FORWARD_ARGS+=("--tunnel-name" "$TUNNEL_NAME"); fi
    if [[ -n "$SERVER_CMD" ]]; then REMOTE_FORWARD_ARGS+=("--server-cmd" "$SERVER_CMD"); fi
    if [[ -n "$BUILD_CMD" ]]; then REMOTE_FORWARD_ARGS+=("--build-cmd" "$BUILD_CMD"); fi
    if [[ "$DEV_MODE" = true ]]; then REMOTE_FORWARD_ARGS+=("--dev"); fi
    if [[ "$SKIP_BUILD" = true || "$BUILD_LOCAL" = true || "$SYNC_DIST" = true ]]; then
        REMOTE_FORWARD_ARGS+=("--no-build")
    fi
    if [[ "$NO_TUNNEL" = true ]]; then REMOTE_FORWARD_ARGS+=("--no-tunnel"); fi
    if [[ "$RESTART" = true ]]; then REMOTE_FORWARD_ARGS+=("--restart"); fi
    if [[ "$STOP_ONLY" = true ]]; then REMOTE_FORWARD_ARGS+=("--stop"); fi
    if [[ "$STATUS_ONLY" = true ]]; then REMOTE_FORWARD_ARGS+=("--status"); fi
    if [[ "$ATTACH" = true ]]; then REMOTE_FORWARD_ARGS+=("--attach"); fi
    if [[ "$LAYOUT" != "split" ]]; then REMOTE_FORWARD_ARGS+=("--layout" "$LAYOUT"); fi

    # If user wants to attach or stop/status interactively, allocate tty with -t
    SSH_TTY_FLAG=""
    if [[ "$ATTACH" = true ]]; then
        SSH_TTY_FLAG="-t"
    fi

    echo "============================================================"
    echo "  Executing on Remote Host: $SSH_HOST"
    echo "============================================================"

    # Run the script remotely
    ssh $SSH_TTY_FLAG "$SSH_HOST" "export PATH=\"/data/data/com.termux/files/usr/bin:\$PREFIX/bin:\$HOME/.bun/bin:\$HOME/.local/bin:\$PATH\"; cd '$APP_DIR' && bash scripts/run-remote.sh ${REMOTE_FORWARD_ARGS[*]}"

    # If not attached, provide quick reference commands
    if [[ "$ATTACH" = false && "$STATUS_ONLY" = false && "$STOP_ONLY" = false ]]; then
        echo ""
        echo "============================================================"
        echo "  Remote Launch Complete ($SSH_HOST)"
        echo "============================================================"
        echo "  To attach to session : ssh -t $SSH_HOST 'tmux attach -t $SESSION_NAME'"
        echo "  To check status      : $0 $SSH_HOST --status"
        echo "  To stop session      : $0 $SSH_HOST --stop"
        echo "============================================================"
    fi

    exit 0
fi

# ==============================================================================
# Local Execution Mode (runs on the remote client/server)
# ==============================================================================

resolve_project_dir

# Handle --status action
if [[ "$STATUS_ONLY" = true ]]; then
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo "============================================================"
        echo "Status: Tmux session '$SESSION_NAME' is RUNNING."
        echo "============================================================"
        tmux list-windows -t "$SESSION_NAME" -F 'Window #I: #W (#{window_panes} panes)'
        tmux list-panes -t "$SESSION_NAME" -F '  Pane #P: #{pane_title} | PID: #{pane_pid} | Active: #{pane_current_command}'
        echo "------------------------------------------------------------"
        echo "Attach using: tmux attach -t $SESSION_NAME"
    else
        echo "Status: Tmux session '$SESSION_NAME' is NOT running."
    fi
    exit 0
fi

# Handle --stop action
if [[ "$STOP_ONLY" = true ]]; then
    if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
        echo "[*] Stopping tmux session '$SESSION_NAME'..."
        tmux kill-session -t "$SESSION_NAME"
        echo "[✓] Tmux session '$SESSION_NAME' has been stopped."
    else
        echo "[!] Session '$SESSION_NAME' is not currently running."
    fi
    exit 0
fi

# Verify tmux exists on the target machine
if ! command -v tmux &>/dev/null; then
    echo "Error: 'tmux' is required but not installed on this machine." >&2
    echo "Installation instructions:" >&2
    echo "  - Termux (Android): pkg install tmux" >&2
    echo "  - Ubuntu / Debian:  sudo apt update && sudo apt install -y tmux" >&2
    echo "  - Arch Linux:       sudo pacman -S tmux" >&2
    echo "  - Alpine Linux:     apk add tmux" >&2
    echo "  - macOS:            brew install tmux" >&2
    exit 1
fi

# Detect Package Manager
PKG_MGR="$(detect_package_manager)"
if [[ -z "$PKG_MGR" ]]; then
    echo "Error: Neither bun, pnpm, npm, nor yarn was found in PATH." >&2
    echo "Please install bun (preferred) or Node.js." >&2
    exit 1
fi

# Ensure dependencies are installed
if [[ ! -d "node_modules" ]]; then
    echo "[*] 'node_modules' directory not found. Installing dependencies with $PKG_MGR..."
    if [[ "$PKG_MGR" == "bun" || "$PKG_MGR" == "npm" || "$PKG_MGR" == "pnpm" ]]; then
        $PKG_MGR install --ignore-scripts
    else
        $PKG_MGR install
    fi
fi

# Resolve Build and Server Commands
if [[ -z "$BUILD_CMD" ]]; then
    BUILD_CMD="$PKG_MGR run build"
fi

if [[ -z "$SERVER_CMD" ]]; then
    if [[ "$DEV_MODE" = true ]]; then
        SERVER_CMD="$PKG_MGR run dev"
    else
        SERVER_CMD="$PKG_MGR run preview"
    fi
fi

# Resolve Tunnel Command
if [[ -z "$TUNNEL_CMD" ]]; then
    if [[ -n "$TUNNEL_NAME" ]]; then
        TUNNEL_CMD="cloudflared tunnel run $TUNNEL_NAME"
    else
        TUNNEL_CMD="$DEFAULT_TUNNEL_CMD"
    fi
fi

# Check for tunnel binary (warn if cloudflared is specified but missing)
if [[ "$NO_TUNNEL" = false && "$TUNNEL_CMD" == cloudflared* ]] && ! command -v cloudflared &>/dev/null; then
    echo "[!] Warning: 'cloudflared' was not found in PATH."
    echo "    If your tunnel binary is located in a custom path or uses another CLI,"
    echo "    provide it with: --tunnel-cmd '<command>'"
fi

# Check for existing tmux session
if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    if [[ "$RESTART" = true ]]; then
        echo "[*] Stopping existing tmux session '$SESSION_NAME' for restart..."
        tmux kill-session -t "$SESSION_NAME"
    else
        echo "[!] Tmux session '$SESSION_NAME' is already running."
        echo "    - Attach to session : tmux attach -t $SESSION_NAME"
        echo "    - Restart session   : $0 --restart"
        echo "    - Stop session      : $0 --stop"
        exit 1
    fi
fi

# Step 1: Build the app
if [[ "$SKIP_BUILD" = false ]]; then
    echo "============================================================"
    echo "  Building Application"
    echo "============================================================"
    echo "[*] Manager : $PKG_MGR"
    echo "[*] Command : $BUILD_CMD"
    echo "[*] Path    : $APP_DIR"
    echo "------------------------------------------------------------"
    
    (cd "$APP_DIR" && eval "$BUILD_CMD")
    
    echo "------------------------------------------------------------"
    echo "[✓] Build completed successfully."
    echo ""
else
    echo "[*] Skipping build step (--no-build flag active)."
fi

# Step 2: Create Named tmux Session and Launch Processes
echo "============================================================"
echo "  Launching Services in tmux"
echo "============================================================"
echo "[*] Session Name : $SESSION_NAME"
echo "[*] Server Cmd   : $SERVER_CMD"
if [[ "$NO_TUNNEL" = true ]]; then
    echo "[*] Tunnel       : Disabled (--no-tunnel)"
else
    echo "[*] Layout       : $LAYOUT"
    echo "[*] Tunnel Cmd   : $TUNNEL_CMD"
fi

if [[ "$NO_TUNNEL" = true ]]; then
    # Single pane/window for Server only
    tmux new-session -d -s "$SESSION_NAME" -n "server" -c "$APP_DIR"
    sleep 0.5
    tmux select-pane -t "$SESSION_NAME:server" -T "Server"
    tmux send-keys -t "$SESSION_NAME:server" "echo '=== [Server] $SERVER_CMD ===' && $SERVER_CMD" C-m
elif [[ "$LAYOUT" = "windows" ]]; then
    # Window 0: Server
    tmux new-session -d -s "$SESSION_NAME" -n "server" -c "$APP_DIR"
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:server" "echo '=== [Server] $SERVER_CMD ===' && $SERVER_CMD" C-m

    # Window 1: Tunnel
    tmux new-window -t "$SESSION_NAME" -n "tunnel" -c "$APP_DIR"
    sleep 0.5
    tmux send-keys -t "$SESSION_NAME:tunnel" "echo '=== [Tunnel] $TUNNEL_CMD ===' && $TUNNEL_CMD" C-m

    # Return focus to server window
    tmux select-window -t "$SESSION_NAME:server"
else
    # Default: Split pane (Top: Server, Bottom: Tunnel)
    tmux new-session -d -s "$SESSION_NAME" -n "app" -c "$APP_DIR"
    sleep 0.5
    
    # Configure Server in top pane
    tmux select-pane -t "$SESSION_NAME:app" -T "Server"
    tmux send-keys -t "$SESSION_NAME:app" "echo '=== [Server] $SERVER_CMD ===' && $SERVER_CMD" C-m

    # Split horizontally into top and bottom panes
    tmux split-window -v -t "$SESSION_NAME:app" -c "$APP_DIR"
    sleep 0.5

    # Configure Tunnel in bottom pane
    tmux select-pane -t "$SESSION_NAME:app" -T "Tunnel"
    tmux send-keys -t "$SESSION_NAME:app" "echo '=== [Tunnel] $TUNNEL_CMD ===' && $TUNNEL_CMD" C-m

    # Set layout and titles
    tmux select-layout -t "$SESSION_NAME:app" even-vertical 2>/dev/null || true
    tmux select-pane -t "$SESSION_NAME:app" -U
fi

# Enable mouse support and pane border title format if supported
tmux set-option -t "$SESSION_NAME" mouse on 2>/dev/null || true
tmux set-option -t "$SESSION_NAME" pane-border-status top 2>/dev/null || true
tmux set-option -t "$SESSION_NAME" pane-border-format " [ #{pane_title} ] " 2>/dev/null || true

echo "------------------------------------------------------------"
echo "[✓] tmux session '$SESSION_NAME' is active in the background."
echo ""
echo "  Useful Commands:"
echo "    tmux attach -t $SESSION_NAME   # Attach and view server & tunnel output"
echo "    Ctrl+b, then d                 # Detach and leave services running"
echo "    Ctrl+b, then z                 # Zoom / unzoom current pane"
echo "    $0 --status                    # Check session status"
echo "    $0 --stop                      # Terminate session and services"
echo "============================================================"

# Auto-attach if requested
if [[ "$ATTACH" = true ]]; then
    echo "[*] Attaching to session..."
    tmux attach -t "$SESSION_NAME"
fi
