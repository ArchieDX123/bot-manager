# Bot Manager

Een desktopapp om al je Grok-assistenten overzichtelijk te bekijken, voor elk bedrijf.
Links staat een grote ronde weergave van de gekozen bot, waarvan de ogen je muis volgen. Rechts staat wat de bot doet, met een knop om hem in Grok te openen.

## Downloaden

Ga naar **[Releases](../../releases/latest)** en kies het bestand voor jouw computer.

### Windows

1. Download `Bot-Manager-Windows.exe`.
2. Dubbelklik erop. Installeren is niet nodig.
3. Toont Windows "Onbekende uitgever"? Klik op **Meer info** > **Toch uitvoeren**.

### Mac (Apple Silicon en Intel)

1. Download `Bot-Manager-Mac.dmg` en open het.
2. Sleep **Bot Manager** naar de map **Apps**.
3. Open de app. De eerste keer meldt macOS dat de app niet gecontroleerd kan worden.
   Klik op **Gereed**, ga naar **Systeeminstellingen** > **Privacy en beveiliging**,
   scrol naar beneden en klik bij Bot Manager op **Open toch**. Dit hoeft maar één keer.

De app is niet betaald ondertekend bij Microsoft of Apple, daarom verschijnen deze meldingen.

## Aan de slag

1. **Je bedrijf instellen.** Bij de eerste start vul je je bedrijfsnaam in, upload je eventueel je logo en kies je een accentkleur. Een effen achtergrond achter je logo wordt automatisch weggehaald. Je logo (of naam) staat rechtsboven.
2. **Al je bots in één keer instellen.** Klik op **Automatisch instellen met Grok**:
   1. neem een screenshot van je volledige botlijst in Grok;
   2. kopieer de prompt uit de app en plak hem samen met de screenshot in je Grok-bot (bv. je CEO-bot). Grok maakt een overzicht "bots per team" met een stukje JSON erbij;
   3. plak dat antwoord in de app, en eventueel ook de screenshot voor de exacte kleuren. Naam, team, functie, beschrijving, kleur en vorm worden ingesteld. Bestaande bots worden bijgewerkt en houden hun Grok-link.
3. **Grok-links toevoegen.** Een screenshot bevat geen links. Klik op **Grok-links plakken** (of druk op `G`) en plak de links van je bots. Je mag er de naam voor zetten:
   ```
   Sales Manager - https://grok.com/bot/...
   Social Media Manager - https://grok.com/bot/...
   ```
   Elke bot krijgt meteen een eigen vorm en kleur. Links die al in je lijst staan, worden overgeslagen.
4. **Aanvullen.** Klik op het potlood om de taak, afdeling, beschrijving, vorm, kleur of een eigen afbeelding in te stellen.

> Grok biedt nog geen officiële manier om de lijst met je eigen bots op te vragen. Daarom werkt toevoegen met links. Komt die mogelijkheid er, dan kan ze aan de app worden toegevoegd.

## Gebruik

| Actie | Hoe |
|---|---|
| Vorige / volgende bot | pijltjes boven en onder de cirkel, het muiswiel of `↑` `↓` |
| Zoeken | `/` (op naam, taak, afdeling, beschrijving of tag) |
| Favoriet | ster of `F`; met **Favorieten** zie je alleen je favorieten |
| Bewerken / nieuwe bot | `E` / `N` |
| Grok-links plakken | `G` |
| Beheer | volgorde, verwijderen, bedrijfsgegevens, back-up, weergave |

Je gegevens blijven op je eigen computer. Maak via **Beheer > Exporteren** af en toe een back-up (JSON); met **Importeren** zet je die terug, ook op een andere computer.

## Zelf bouwen

Met [Node.js](https://nodejs.org) 22 of nieuwer:

```
cd app
npm install
npm run dev        # ontwikkelversie in de browser
npm run build      # controle (TypeScript) en productieversie
npm run dist:win   # Windows-app in app/release
```

De Mac-versie wordt op GitHub gebouwd (een Mac-app kan alleen op een Mac gemaakt worden). Een nieuwe versie maken: zet een tag zoals `v2.1.0` en push die; GitHub bouwt dan Windows en Mac en zet ze onder Releases.

## Opbouw

| Map | Wat |
|---|---|
| `app/src/components/BotFace.tsx` | het botgezicht, de ogen die de muis volgen en het knipperen |
| `app/src/components/Stage.tsx`, `Info.tsx` | links de cirkel met pijltjes, rechts de informatie |
| `app/src/components/GrokImport.tsx`, `app/src/grok.ts` | Grok-links plakken en herkennen |
| `app/src/components/Onboarding.tsx`, `BrandForm.tsx` | eerste start en bedrijfsgegevens |
| `app/src/store.ts` | lokaal opslaan, import en export |
| `app/src/styles.css` | het volledige design (kleuren als CSS-variabelen bovenaan) |
| `app/electron/main.cjs` | het desktopvenster |

Gemaakt met React, TypeScript, Vite, Framer Motion en Electron.
