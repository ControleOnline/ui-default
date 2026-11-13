const {describe, expect, it} = require('@jest/globals');

jest.mock('@store', () => ({
  getAllStores: () => ({}),
}));

jest.mock('react-native', () => ({
  Platform: {
    select: value => value.web || value.default,
  },
  StyleSheet: {
    create: value => value,
  },
}));

jest.mock('@controleonline/ui-common/src/utils/formatter.js', () => ({}));
jest.mock('@controleonline/ui-common/src/react/utils/dateRangeFilter', () => ({
  getDateRange: () => ({}),
}));

const {
  getColumnMinWidth,
  getColumnStyle,
  parseSortNumber,
} = require('../../../../react/components/table/DefaultTable.utils');

describe('DefaultTable utils', () => {
  it('uses column width metadata from the store configuration', () => {
    expect(getColumnMinWidth({name: 'status', minWidth: 180})).toBe(180);
    expect(getColumnStyle({name: 'status', minWidth: 180})).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          minWidth: 180,
        }),
      ]),
    );
  });

  it('parses Brazilian thousand and decimal masks as numbers', () => {
    expect(parseSortNumber('1.234,56')).toBeCloseTo(1234.56);
    expect(parseSortNumber('10')).toBe(10);
    expect(parseSortNumber('2')).toBe(2);
    expect(parseSortNumber('1.234')).toBe(1234);
    expect(parseSortNumber('12/03/2024')).toBeNaN();
    expect(parseSortNumber('abc')).toBeNaN();
  });
});
