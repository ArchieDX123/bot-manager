// Geeft de Mac-app een "ad-hoc" handtekening. Zonder handtekening meldt macOS
// op Apple Silicon dat de app "beschadigd" is. Dit vervangt geen betaalde
// Apple-ondertekening: gebruikers moeten de app nog één keer toestaan.
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  // Bij een universele build worden eerst een Intel- en een Apple Silicon-versie
  // gemaakt (in "-temp"-mappen) en daarna samengevoegd. Alleen het eindresultaat ondertekenen.
  if (context.appOutDir.endsWith('-temp')) return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
};
