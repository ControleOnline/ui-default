const fs = require('fs');
const path = require('path');

const {describe, expect, it} = global;

const mapDir = path.resolve(__dirname, '../../../../react/components/map');
const source = fs.readFileSync(path.join(mapDir, 'DefaultNativeMap.native.js'), 'utf8');

const readNamedImports = modulePath => {
  const pattern = /import\s*\{([^}]*)\}\s*from\s*'(\.\/[^']+)';/g;
  const imports = [];
  let match = pattern.exec(source);

  while (match) {
    if (match[2] === modulePath) {
      match[1]
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .forEach(item => imports.push(item));
    }
    match = pattern.exec(source);
  }

  return imports;
};

describe('DefaultNativeMap.native imports', () => {
  ['./DefaultMap.shared', './DefaultNativeMap.shared'].forEach(modulePath => {
    it(`only imports names exported by ${modulePath}`, () => {
      const names = readNamedImports(modulePath);
      const moduleExports = require(path.join(mapDir, modulePath));

      names.forEach(name => {
        expect(typeof moduleExports[name]).toBe('function');
      });
    });
  });

  it('imports the navigation url builders', () => {
    const names = readNamedImports('./DefaultMap.shared');

    expect(names).toEqual(
      expect.arrayContaining([
        'buildGoogleMapsNavigationUrl',
        'buildWazeNavigationUrl',
      ]),
    );
  });
});
