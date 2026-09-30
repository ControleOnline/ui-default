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
});
