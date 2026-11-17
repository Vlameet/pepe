# USERHUNT

## Deploy on Render
Create a **Web Service** connected to `Vlameet/pepe`, branch `main`.

- Runtime: Node
- Root Directory: leave empty
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node 18 or newer

The service serves the frontend from `docs/userhunt` and the API from the same origin.

## API
- `GET /api/health`
- `POST /api/check`

Example body:
```json
{ "username": "example", "platforms": ["GitHub", "Reddit", "Telegram"] }
```

GitHub and Reddit use public lookup endpoints. Other platforms currently return `unknown`, not a guessed availability result. A 404 is only a possible-availability signal because names may be reserved. Respect each platform's terms and rate limits.
