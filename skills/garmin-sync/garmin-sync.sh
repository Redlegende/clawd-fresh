#!/bin/bash
# Garmin Sync Skill
# Automated daily sync with MFA handling via email

SCRIPT_DIR="/Users/jakobbakken/clawd-fresh/projects/the-observatory/garmin-skill"
cd "$SCRIPT_DIR"

# Run the orchestrator
./orchestrator.sh
