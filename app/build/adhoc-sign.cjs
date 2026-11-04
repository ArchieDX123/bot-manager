// Geeft de Mac-app een "ad-hoc" handtekening. Zonder handtekening meldt macOS
// op Apple Silicon dat de app "beschadigd" is. Dit vervangt geen betaalde
// Apple-ondertekening: gebruikers moeten de app nog één keer toestaan.
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
};
