# Bushing Bot Manager

Een desktopapp om alle Grok-assistenten van Bushing overzichtelijk te bekijken.
Links staat een grote ronde weergave van de gekozen bot, waarvan de ogen je muis volgen. Rechts staat wat de bot doet en hoe je hem opent in Grok.

## Downloaden

Ga naar **Releases** (rechts op deze pagina) en kies het bestand voor jouw computer.

### Windows

1. Download `Bushing-Bot-Manager-Windows.exe`.
2. Dubbelklik erop. Installeren is niet nodig.
3. Toont Windows "Onbekende uitgever"? Klik op **Meer info** > **Toch uitvoeren**.

### Mac (Apple Silicon en Intel)

1. Download `Bushing-Bot-Manager-Mac.dmg` en open het.
2. Sleep **Bushing Bot Manager** naar de map **Apps**.
3. Open de app. De eerste keer meldt macOS dat de app niet gecontroleerd kan worden.
   Klik op **Gereed**, ga naar **Systeeminstellingen** > **Privacy en beveiliging**,
   scrol naar beneden en klik bij Bushing Bot Manager op **Open toch**.
   Dit hoeft maar één keer.

De app is niet betaald ondertekend bij Microsoft of Apple, daarom verschijnen deze meldingen.

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
