#!/usr/bin/env bash

set -euo pipefail
set -m

PYTHON=${PYTHON:-python3}
COMMAND=${FLASK:-$PYTHON -m flask}

export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export FLASK_APP=sample_tracker.py
export FLASK_ENV=${FLASK_ENV:-development}

$COMMAND db upgrade
$COMMAND run &
cd static && npm run watch

fg %1
kill %2
