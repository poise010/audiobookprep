.PHONY: install dev build seed-corpus clean

install:
	pip3 install -r requirements.txt
	python3 -m spacy download en_core_web_sm
	cd frontend && npm install

dev:
	cd frontend && npm run dev &
	uvicorn backend.main:app --reload --port 8000

build:
	cd frontend && npm run build

seed-corpus:
	python3 seed_corpus.py

test:
	pytest tests/ -v

clean:
	rm -rf frontend/dist frontend/node_modules __pycache__ .pytest_cache
