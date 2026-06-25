PYTHON ?= python
PIP ?= pip
NPM ?= cmd /c npm

install:
	$(PIP) install -r requirements.txt
	cd frontend && $(NPM) install

dev:
	$(PYTHON) -m uvicorn app.main:app --reload

test:
	pytest -q
	cd frontend && $(NPM) test

lint:
	$(PYTHON) -m compileall app
	cd frontend && $(NPM) run build

migrate:
	alembic upgrade head

seed:
	$(PYTHON) -m app.seed

docker-up:
	docker compose up --build
