const {describe, expect, it, jest} = require('@jest/globals');

jest.mock('@store', () => ({
  getAllStores: () => ({}),
}));

jest.mock('@controleonline/ui-common/src/utils/formatter.js', () => ({}));

jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({
  formatStoreColumnValue: ({value}) => value,
}));

const {mapOptions} = require('../../../react/components/inputs/defaultInputUtils');

describe('defaultInputUtils', () => {
  it('deduplicates list options by normalized key', () => {
    const column = {
      formatList(item) {
        return {
          value: item.id,
          label: item.wallet,
        };
      },
    };

    const options = mapOptions(column, [
      {id: 4584, wallet: 'Cielo'},
      {id: 4584, wallet: 'Cielo'},
      {id: 4579, wallet: 'Cielo'},
    ]);

    expect(options).toEqual([
      {
        key: '4584',
        label: 'Cielo',
        raw: {id: 4584, wallet: 'Cielo'},
      },
      {
        key: '4579',
        label: 'Cielo',
        raw: {id: 4579, wallet: 'Cielo'},
      },
    ]);
  });
});
