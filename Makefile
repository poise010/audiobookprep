.PHONY: install dev build seed-corpus clean

install:
	python3 -m venv .venv
	.venv/bin/pip install -r requirements.txt
	.venv/bin/pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
	cd frontend && npm install

dev:
	cd frontend && npm run dev &
	.venv/bin/uvicorn backend.main:app --reload --port 8000

build:
	cd frontend && npm run build

seed-corpus:
	.venv/bin/python seed_corpus.py

test:
	.venv/bin/pytest tests/ -v

clean:
	rm -rf frontend/dist frontend/node_modules __pycache__ .pytest_cache .venv
