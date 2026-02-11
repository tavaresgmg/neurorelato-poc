from __future__ import annotations

import sys
from pathlib import Path

# Make `backend/` importable as a root so tests can `import app.*`.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
