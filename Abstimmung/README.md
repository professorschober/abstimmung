# Abstimmung

React/TypeScript PWA mit Express/TypeScript Backend fuer Quizze und Abstimmungen im Unterricht.

## Funktionen

- Lehrkraft erstellt Quiz oder Abstimmung
- App erzeugt einen QR-Code fuer Schuelerinnen und Schueler
- Teilnehmende koennen mobil beitreten und abstimmen
- Quizteilnehmende sehen nach Abgabe ihr Ergebnis
- Lehrkraft kann Ergebnisse live auswerten und anzeigen
- PWA mit Manifest und Service Worker fuer mobile Geraete
- Lokale JSON-Datenbank speichert Sessions, Quizze, Abstimmungen, Teilnehmer und Ergebnisse

## Entwicklung

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173

Backend: http://localhost:4000

Die lokale Datenbank liegt standardmaessig unter `server/data/database.json`.
Mit `DATABASE_FILE=pfad/zur/datei.json` kann ein anderer Speicherort gesetzt werden.

## Build

```bash
npm run build
```
