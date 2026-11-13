// app-community #1092: the compact layout is the DefaultTable default.
// Pages (Order History, Financial Hub) must inherit it instead of opting in.
const fs = require('node:fs');
const path = require('node:path');

const read = relative => fs.readFileSync(path.join(__dirname, relative), 'utf8');

it('uses the compact layout as the DefaultTable default appearance', () => {
  expect(read('../../../../react/components/table/DefaultTable.js')).toMatch(/^\s+appearance = 'compact',$/m);
});

it('keeps legacy appearance reachable through an explicit prop', () => {
  expect(read('../../../../react/components/table/DefaultTableToolbar.js')).toMatch(/configs\.appearance === 'compact'/);
});
