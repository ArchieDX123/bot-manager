// Zelf-updaten voor de Mac-versie en de losse Windows-exe.
//
// De Windows-installatie gebruikt electron-updater. Op de Mac kan dat niet zonder
// betaalde Apple-ondertekening, en een losse .exe heeft geen installatieprogramma.
// Daarom doen we het hier zelf: nieuwe versie downloaden, en na het afsluiten de
// app vervangen en opnieuw starten. Een bestand dat de app zelf downloadt krijgt op
// de Mac geen "van internet"-markering, dus macOS vraagt niet opnieuw om toestemming.
const { app, net } = require('electron');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/** Wat kan deze installatie: 'mac', 'portable' of null (alleen melden). */
function mode() {
  if (!app.isPackaged) return null;
  if (process.platform === 'darwin') {
    const bundle = macBundle();
    if (!bundle) return null;
    // Vanuit de .dmg of een tijdelijke "translocatie"-map kan de app zichzelf niet vervangen.
    if (bundle.startsWith('/Volumes/') || bundle.includes('/AppTranslocation/')) return null;
    try {
      fs.accessSync(path.dirname(bundle), fs.constants.W_OK);
      return 'mac';
    } catch {
      return null;
    }
  }
  if (process.platform === 'win32' && process.env.PORTABLE_EXECUTABLE_FILE) return 'portable';
  return null;
}

/** /Applications/Bot Manager.app, afgeleid van het pad van het programma zelf. */
function macBundle() {
  const m = process.execPath.match(/^(.*?\.app)\/Contents\/MacOS\//);
  return m ? m[1] : null;
}

function assetUrl(repo, version, file) {
  return `https://github.com/${repo}/releases/download/v${version}/${file}`;
}

async function download(url, dest, onProgress) {
  const res = await net.fetch(url, { headers: { 'User-Agent': 'bot-manager-app' } });
  if (!res.ok || !res.body) throw new Error(`Download mislukt (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  const tmp = dest + '.part';
  const out = fs.createWriteStream(tmp);
  const reader = res.body.getReader();
  let received = 0;
  let lastPct = -1;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      if (!out.write(Buffer.from(value))) await new Promise((r) => out.once('drain', r));
      const pct = total ? Math.floor((received / total) * 100) : 0;
      if (pct !== lastPct) {
        lastPct = pct;
        onProgress(pct);
      }
    }
  } finally {
    await new Promise((r) => out.end(r));
  }
  if (total && received !== total) throw new Error('Download onvolledig');
  fs.renameSync(tmp, dest);
}

function createSelfUpdater({ repo, send }) {
  const kind = mode();
  let ready = null; // { file, version }
  let busy = false;
  let installing = false;

  async function fetchUpdate(version) {
    if (!kind || busy || (ready && ready.version === version)) return;
    busy = true;
    try {
      const dir = path.join(os.tmpdir(), 'bot-manager-update');
      fs.mkdirSync(dir, { recursive: true });
      const file =
        kind === 'mac' ? path.join(dir, `Bot-Manager-${version}.dmg`) : path.join(dir, `Bot-Manager-${version}.exe`);
      const asset = kind === 'mac' ? 'Bot-Manager-Mac.dmg' : 'Bot-Manager-Windows-portable.exe';
      send({ state: 'downloading', version, percent: 0 });
      await download(assetUrl(repo, version, asset), file, (percent) => send({ state: 'downloading', version, percent }));
      ready = { file, version };
      send({ state: 'ready', version });
    } catch (err) {
      send({ state: 'available', version, message: String(err && err.message ? err.message : err).slice(0, 200) });
    } finally {
      busy = false;
    }
  }

  /** Start het vervangen; de app moet daarna meteen afsluiten. */
  async function install(relaunch) {
    if (!ready || installing) return false;
    installing = true;
    const dir = path.dirname(ready.file);
    if (kind === 'mac') {
      const script = path.join(dir, 'install.sh');
      fs.writeFileSync(
        script,
        `#!/bin/bash
APP="$1"; DMG="$2"; PID="$3"; RELAUNCH="$4"
while kill -0 "$PID" 2>/dev/null; do sleep 0.5; done
MNT=$(mktemp -d /tmp/botmanager.XXXXXX)
hdiutil attach -nobrowse -noverify -noautoopen -mountpoint "$MNT" "$DMG" >/dev/null || exit 1
SRC=$(ls -d "$MNT"/*.app | head -1)
if [ -d "$SRC" ]; then
  rm -rf "$APP.old"
  mv "$APP" "$APP.old" && ditto "$SRC" "$APP" && rm -rf "$APP.old" || { rm -rf "$APP"; mv "$APP.old" "$APP"; }
fi
hdiutil detach "$MNT" -quiet
xattr -dr com.apple.quarantine "$APP" 2>/dev/null
rm -f "$DMG"
[ "$RELAUNCH" = "1" ] && open "$APP"
`,
        { mode: 0o755 },
      );
      spawn('/bin/bash', [script, macBundle(), ready.file, String(process.pid), relaunch ? '1' : '0'], {
        detached: true,
        stdio: 'ignore',
      }).unref();
    } else {
      const target = process.env.PORTABLE_EXECUTABLE_FILE;
      const script = path.join(dir, 'install.ps1');
      fs.writeFileSync(
        script,
        `param($Src, $Dst, $Relaunch)
# Wachten tot de oude versie (en het opstartprogramma) gesloten is, dan vervangen.
for ($i = 0; $i -lt 240; $i++) {
  try { Move-Item -LiteralPath $Src -Destination $Dst -Force -ErrorAction Stop; break } catch { Start-Sleep -Milliseconds 500 }
}
if ($Relaunch -eq '1') { Start-Process -FilePath $Dst }
Remove-Item -LiteralPath $MyInvocation.MyCommand.Path -Force -ErrorAction SilentlyContinue
`,
        'utf8',
      );
      // Via WMI starten: zo hoort het script niet bij de app en wordt het niet
      // samen met de app afgesloten (een gewone "detached" start overleeft dat niet).
      const q = (s) => `"${s}"`;
      const cmdline = [
        'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File',
        q(script),
        q(ready.file),
        q(target),
        relaunch ? '1' : '0',
      ].join(' ');
      const ok = await new Promise((resolve) => {
        execFile(
          'powershell.exe',
          [
            '-NoProfile',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            `$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${cmdline.replace(/'/g, "''")}' }; exit $r.ReturnValue`,
          ],
          { windowsHide: true, timeout: 20000 },
          (err) => resolve(!err),
        );
      });
      if (!ok) {
        installing = false;
        return false;
      }
    }
    return true;
  }

  return {
    kind,
    fetchUpdate,
    isReady: () => !!ready,
    isInstalling: () => installing,
    /** Knop "Herstarten": vervangen en opnieuw openen. */
    restartAndInstall: async () => {
      await install(true);
      app.exit(0);
    },
    /** Gewoon afsluiten met een klaarstaande update: stil vervangen, niet opnieuw openen. */
    installOnQuit: () => install(false),
  };
}

module.exports = { createSelfUpdater };
