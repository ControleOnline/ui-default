const fs = require('fs');
const path = require('path');
const read = name => fs.readFileSync(path.join(__dirname, '../../../../react/components/table', name), 'utf8');

test('compact rows are 40px and the ID badge is a 32px control (#1444)', () => {
  expect(read('DefaultTableRows.js')).toMatch(/TABLE_ROW_MIN_HEIGHT = 40/);
  expect(read('DefaultTableRows.js')).toMatch(/minHeight: TABLE_ROW_MIN_HEIGHT/);
  expect(read('DefaultTableInput.js')).toMatch(/paddingVertical: 0, minHeight: 32/);
  expect(read('DefaultTable.styleGroup2.js')).toMatch(/paddingHorizontal: 14,\s+paddingVertical: 4/);
});
