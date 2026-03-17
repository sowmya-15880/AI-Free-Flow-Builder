# AI Free Flow Landing Page Builder

This project contains:

- `frontend` - React-based free flow landing page builder UI
- `backend` - FastAPI backend used by the builder

## Run The Application

After unzipping the project folder, run the app using 2 terminal windows/tabs.

### 1. Start Backend

```sh
cd /path/to/app/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8001
```

### 2. Start Frontend

Open a new terminal window/tab and run:

```sh
cd /path/to/app/frontend
npm install
HOST=127.0.0.1 PORT=3000 node node_modules/@craco/craco/dist/bin/craco.js start
```

### 3. Open The App

Once both are running, open:

- Frontend: `http://127.0.0.1:3000`
- Backend API: `http://127.0.0.1:8001`

## Notes

- Replace `/path/to/app` with the actual unzipped folder path.
- Even if `node_modules` is already present, running `npm install` is still recommended.
- The backend uses the `.env` file inside the `backend` folder.
- If `python3` does not work on the machine, try `python`.
