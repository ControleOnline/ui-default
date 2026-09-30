const {describe, expect, it, jest} = require('@jest/globals');

jest.mock('@store', () => ({
  getAllStores: () => ({}),
}));

jest.mock('@controleonline/ui-common/src/utils/formatter.js', () => ({}));

jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({
  formatStoreColumnValue: ({value}) => value?.status || value?.category || value,
}));

const {
  buildReadPresentationStyles,
  mapOptions,
  resolveCellPresentation,
} = require('../../../react/components/inputs/defaultInputUtils');

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

  it('preserves option color and icon metadata from formatList', () => {
    const column = {
      formatList(item) {
        return {
          color: item.color,
          icon: item.icon,
          value: item.id,
          label: item.status,
        };
      },
    };

    const options = mapOptions(column, [
      {id: 1, status: 'Em rota', color: '#2563EB', icon: 'truck'},
    ]);

    expect(options).toEqual([
      {
        color: '#2563EB',
        icon: 'truck',
        key: '1',
        label: 'Em rota',
        raw: {id: 1, status: 'Em rota', color: '#2563EB', icon: 'truck'},
      },
    ]);
  });

  it('resolves table cell presentation from row value and column style', () => {
    const presentation = resolveCellPresentation({
      column: {
        name: 'status',
        style: row => ({color: row.status.color}),
      },
      row: {
        status: {
          status: 'Aprovado',
          color: '#16A34A',
          icon: 'check-circle',
        },
      },
      storeName: 'orders',
    });

    expect(presentation).toEqual({
      backgroundColor: undefined,
      borderColor: undefined,
      color: '#16A34A',
      icon: 'check-circle',
      image: undefined,
      label: 'Aprovado',
    });
  });

  it('resolves table cell presentation from the column format object', () => {
    const presentation = resolveCellPresentation({
      column: {
        name: 'status',
        format(value) {
          return {
            label: value.status,
            color: value.color,
            icon: value.icon,
          };
        },
      },
      row: {
        status: {
          status: 'Preparando',
          color: '#0EA5E9',
          icon: 'clock',
        },
      },
      storeName: 'orders',
    });

    expect(presentation).toEqual({
      backgroundColor: undefined,
      borderColor: undefined,
      color: '#0EA5E9',
      icon: 'clock',
      image: undefined,
      label: 'Preparando',
    });
  });

  it('builds subtle badge colors from resource colors', () => {
    expect(buildReadPresentationStyles({
      color: '#16A34A',
      label: 'Aprovado',
    })).toEqual({
      badgeStyle: {
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        borderColor: 'rgba(22, 163, 74, 0.32)',
      },
      color: '#16A34A',
      hasDecoration: true,
    });
  });
});
