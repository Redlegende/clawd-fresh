#!/usr/bin/env bash
# Links CLI - Quick access to important URLs

LINKS_FILE="$(dirname "$0")/../links.json"

# Colors
BOLD='\033[1m'
BLUE='\033[34m'
GREEN='\033[32m'
YELLOW='\033[33m'
RESET='\033[0m'

usage() {
    echo "Usage: links [command] [name]"
    echo ""
    echo "Commands:"
    echo "  (none)       List all links"
    echo "  <name>       Show specific link"
    echo "  open <name>  Open link in browser"
    echo ""
    echo "Examples:"
    echo "  links              # List all"
    echo "  links observatory  # Show Observatory URL"
    echo "  links open folio   # Open Folio in browser"
}

list_all() {
    echo -e "${BOLD}🔗 Quick Links${RESET}"
    echo ""
    
    # Parse JSON and display
    python3 << 'EOF'
import json
import sys

try:
    with open("/Users/jakobbakken/clawd-fresh/skills/links/links.json") as f:
        data = json.load(f)
    
    for name, info in data["links"].items():
        aliases = ", ".join(info.get("aliases", []))
        alias_str = f" (aliases: {aliases})" if aliases else ""
        print(f"\033[1m{name}{alias_str}\033[0m")
        print(f"  URL: {info['url']}")
        print(f"  {info['description']}")
        print()
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
EOF
}

get_link() {
    local name="$1"
    
    python3 << EOF
import json
import sys

name = "$name"

try:
    with open("/Users/jakobbakken/clawd-fresh/skills/links/links.json") as f:
        data = json.load(f)
    
    # Check exact match first
    if name in data["links"]:
        info = data["links"][name]
        print(f"\033[1m{name}\033[0m")
        print(f"  URL: {info['url']}")
        print(f"  {info['description']}")
        sys.exit(0)
    
    # Check aliases
    for link_name, info in data["links"].items():
        if name in info.get("aliases", []):
            print(f"\033[1m{link_name}\033[0m (alias: {name})")
            print(f"  URL: {info['url']}")
            print(f"  {info['description']}")
            sys.exit(0)
    
    print(f"Link not found: {name}", file=sys.stderr)
    print("Run 'links' to see all available links.", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
EOF
}

open_link() {
    local name="$1"
    
    python3 << EOF
import json
import subprocess
import sys

name = "$name"

try:
    with open("/Users/jakobbakken/clawd-fresh/skills/links/links.json") as f:
        data = json.load(f)
    
    url = None
    
    # Check exact match first
    if name in data["links"]:
        url = data["links"][name]["url"]
    else:
        # Check aliases
        for link_name, info in data["links"].items():
            if name in info.get("aliases", []):
                url = info["url"]
                break
    
    if url:
        print(f"Opening {url}...")
        subprocess.run(["open", url])
    else:
        print(f"Link not found: {name}", file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
EOF
}

# Main
case "${1:-}" in
    -h|--help|help)
        usage
        exit 0
        ;;
    open)
        if [ -z "${2:-}" ]; then
            echo "Error: Link name required"
            usage
            exit 1
        fi
        open_link "$2"
        ;;
    "")
        list_all
        ;;
    *)
        get_link "$1"
        ;;
esac