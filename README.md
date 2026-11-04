# Bushing Bot Manager

Een desktopapp om alle Grok-assistenten van Bushing overzichtelijk te bekijken.
Links staat een grote ronde weergave van de gekozen bot, waarvan de ogen je muis volgen. Rechts staat wat de bot doet en hoe je hem opent in Grok.

## Downloaden (Windows)

1. Ga naar **Releases** (rechts op deze pagina) en download `Bushing-Bot-Manager-Windows.zip`.
2. Pak de zip uit (rechtsklik > **Alles uitpakken**).
3. Dubbelklik op **Bushing Bot Manager.exe**.
4. Toont Windows "Onbekende uitgever"? Klik op **Meer info** > **Toch uitvoeren**.
   De app is niet digitaal ondertekend, daarom verschijnt deze melding.

## Gebruik

- **Pijltjes boven en onder de cirkel**, het muiswiel of de pijltjestoetsen: wisselen tussen bots.
- **Zoeken** (`/`): zoek op naam, afdeling of taak.
- **Favorieten**: markeer bots die je vaak gebruikt.
- **Beheer**: bots toevoegen, bewerken, verbergen of verwijderen, Grok-links instellen, en exporteren of importeren als JSON.
- **Open in Grok**: opent de ingestelde Grok-link in je browser.

Je gegevens worden alleen lokaal op je eigen computer opgeslagen.

## In de browser bekijken

Met [Node.js](https://nodejs.org) geïnstalleerd:

```
node serve.cjs
```

Open daarna http://localhost:5179

## Inhoud

| Map | Wat |
|---|---|
| `app/dist/` | De gebouwde app (HTML, JavaScript, CSS, lettertypes). |
| `app/electron/` | Het venster van de Windows-app (Electron). |
| `leesbare-code/` | Dezelfde code, opgemaakt zodat ze leesbaar is. |

Gemaakt met React, Framer Motion en Electron.
