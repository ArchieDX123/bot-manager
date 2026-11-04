# Bushing Bot Manager: teruggehaalde versie

Teruggehaald op 4 november 2026 uit `Downloads\Bushing-Bot-Manager-Windows\Bushing Bot Manager.exe`.
De originele bronbestanden (React/TypeScript) zijn verloren gegaan toen het Claude-gesprek werd verwijderd.
Wat hier staat, is alles wat in de gebouwde app zat.

## Inhoud

| Map / bestand | Wat |
|---|---|
| `app/dist/` | De volledige, werkende app (HTML, JS, CSS, lettertypes). |
| `app/electron/main.cjs` | Het venster van de Windows-app (Electron). |
| `app/package.json`, `app/build/icon.png` | Appgegevens en icoon. |
| `leesbare-code/app-volledig.js` | De app-code, opnieuw opgemaakt zodat ze leesbaar is. De eigen code staat onderaan (vanaf ongeveer regel 20.000); de rest zijn de ingebouwde bibliotheken React en Framer Motion. Namen van variabelen zijn bij het bouwen ingekort. |
| `leesbare-code/stijlen.css` | Alle stijlen, leesbaar opgemaakt. |
| `serve.cjs` | Kleine server om de app in de browser te bekijken. |
| `mijn-bots-backup.json` | Back-up van je 17 bots zoals ze in de geïnstalleerde app staan (4 november 2026), inclusief de Grok-link van Geldcoach. |

Let op: de browserversie heeft haar eigen opslag. Ze start met de standaardbots, niet met wat je in de Windows-app aanpast. Open het venster breed genoeg (zoals de app: 1440 × 900); bij een smal venster verdwijnt de botlijst links.

## Bekijken in de browser

```
node serve.cjs
```

Open daarna http://localhost:5179

## Windows-app

De app zelf blijft gewoon werken: `Downloads\Bushing-Bot-Manager-Windows\Bushing Bot Manager.exe`.
Je aanpassingen (bots, favorieten) staan in `%APPDATA%\bushing-bot-manager` en blijven bewaard.
Maak in de app via Beheer af en toe een JSON-export als extra back-up.
