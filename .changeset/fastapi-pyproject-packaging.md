---
'scalar-fastapi': patch
---

chore(fastapi): move to pyproject.toml and declare dependencies

Replaces the legacy `setup.py`/`setup.cfg` with a modern `pyproject.toml` (hatchling). The package now declares its runtime dependencies (`fastapi`, `pydantic`, `typing_extensions`), a supported Python version (`>=3.9`), and richer PyPI metadata (project URLs and classifiers). The version stays in sync with the monorepo through the existing Changesets flow.
