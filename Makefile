.PHONY: install dev build seed-corpus clean

install:
	python3 -m venv .venv
	.venv/bin/pip install -r requirements.txt
	.venv/bin/python -m spacy download en_core_web_sm
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
