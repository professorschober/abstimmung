# AI Tutor fuer ERD-Kundeninterviews

Diese Anwendung simuliert zwei fachliche Ansprechpartner des Roten Kreuzes Lebring:

- Herr Retter: Leitung, Einsaetze, Fahrzeuge, Mitarbeiter, Schulungen
- Frau Taler: Finanzen, Abrechnung, Buchhaltung, Dienstplaene und Aufzeichnungen

Die App besteht aus:

- `client`: React + Vite + TypeScript
- `server`: Express + TypeScript als Proxy zur OpenAI API

## Voraussetzungen

- Node.js 20+
- Ein OpenAI API Key

## Start

1. Abhaengigkeiten installieren:

```powershell
npm.cmd install
```

2. Server-Konfiguration anlegen:

```powershell
Copy-Item server\\.env.example server\\.env
```

3. In `server/.env` den API-Key eintragen.

4. Entwicklungsmodus starten:

```powershell
npm.cmd run dev
```

Optional fuer das Frontend lokal:

```powershell
Copy-Item client\\.env.example client\\.env
```

## Architektur

- Das Frontend sendet Chat-Nachrichten an `POST <VITE_API_BASE_URL>/api/chat`.
- Das Backend waehlt anhand der Persona den passenden Systemprompt.
- Die OpenAI API wird nur serverseitig angesprochen.
- Gespraeche werden nur im Browserzustand gehalten und nicht gespeichert.

## Azure App Service

Die Anwendung ist fuer getrennte Azure App Services vorbereitet:

- `client` als eigener App Service fuer das Vite-Build
- `server` als eigener App Service fuer die Node.js API

### Backend App Service

- Runtime: Node.js 20 oder hoeher
- Build Command: `npm install && npm run build`
- Startup Command: `npm run start`

App Settings fuer das Backend:

- `OPENAI_API_KEY=<dein-key>`
- `OPENAI_MODEL=gpt-4.1-mini`
- `PORT=8080`
- `CLIENT_ORIGINS=https://<frontend-name>.azurewebsites.net`

Falls du mehrere Frontend-URLs, Deployment-Slots oder eine Custom Domain verwendest:

- `CLIENT_ORIGINS=https://frontend.azurewebsites.net,https://staging-frontend.azurewebsites.net,https://deine-domain.at`

### Frontend App Service

- Runtime: Node.js 20 oder hoeher
- Build Command: `npm install && npm run build`
- Startup Command: `npm run start`

App Settings fuer das Frontend:

- `PORT=8080`
- `VITE_API_BASE_URL=https://<backend-name>.azurewebsites.net`

### Wichtige Hinweise

- Das Frontend hat jetzt einen kleinen Node-Server fuer Azure App Service und liefert die gebaute `dist`-App aus.
- Das Backend akzeptiert mehrere erlaubte Origins ueber `CLIENT_ORIGINS`.
- Nach Aenderungen an `VITE_API_BASE_URL` muss das Frontend neu gebaut werden.
