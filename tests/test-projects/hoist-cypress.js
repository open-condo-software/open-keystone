const fs = require('fs');
const path = require('path');

const PKG_NAME = 'cypress-multi-reporters';

function main() {
  const rootDir = path.join(__dirname, '..', '..');
  const rootPackage = path.join(rootDir, 'node_modules', PKG_NAME);

  if (!fs.existsSync(rootPackage)) {
    throw Error('cypress-multi-reporters is not detected in root package');
  }

  const dirent = fs.readdirSync(__dirname, { withFileTypes: true });

  for (const dir of dirent) {
    if (dir.isDirectory()) {
      const localPackage = path.join(__dirname, dir.name, 'node_modules', PKG_NAME);
      fs.mkdirSync(localPackage, { recursive: true });
      fs.cpSync(rootPackage, localPackage, { recursive: true });
    }
  }
}

main();
