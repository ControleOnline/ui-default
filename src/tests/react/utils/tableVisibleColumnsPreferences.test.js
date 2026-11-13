const {
  DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
  TABLE_FILTER_PREFERENCES_KEY,
  TABLE_SORT_PREFERENCES_KEY,
  TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY,
  TABLE_VIEW_MODE_PREFERENCES_KEY,
  buildDefaultVisibleColumns,
  canHideVisibleColumn,
  persistTableFiltersPreference,
  persistTableSortPreference,
  persistTableViewModePreference,
  persistVisibleColumnsPreference,
  resolveDefaultTablePreferenceScope,
  resolveStoredTableFiltersPreference,
  resolveStoredTableSortPreference,
  resolveStoredTableViewModePreference,
  resolveStoredVisibleColumnsPreference,
  sanitizeTableFiltersPreference,
  sanitizeVisibleColumnsPreference,
} = require('../../../react/utils/tableVisibleColumnsPreferences');

const { beforeEach, describe, expect, it } = global;

const createLocalStorageMock = () => {
  let storage = {};

  return {
    clear: () => {
      storage = {};
    },
    getItem: key => (key in storage ? storage[key] : null),
    removeItem: key => {
      delete storage[key];
    },
    setItem: (key, value) => {
      storage[key] = String(value);
    },
  };
};

describe('tableVisibleColumnsPreferences', () => {
  const columns = [
    { name: 'id' },
    { name: 'status' },
    { name: 'price', visible: false },
  ];
  const scope = {
    companyKey: '42',
    storeKey: 'financialEntries',
    routeKey: 'receivables',
  };

  beforeEach(() => {
    global.localStorage = createLocalStorageMock();
  });

  it('builds the default visibility map from store columns', () => {
    expect(buildDefaultVisibleColumns(columns)).toEqual({
      id: true,
      status: true,
      price: false,
    });
  });

  it('sanitizes stored preferences against the current columns', () => {
    expect(
      sanitizeVisibleColumnsPreference({
        columns,
        visibleColumns: {
          id: false,
          unknown: true,
        },
      }),
    ).toEqual({
      id: true,
      status: true,
      price: false,
    });
  });

  it('does not allow hiding the last remaining column', () => {
    expect(
      canHideVisibleColumn({
        columns,
        fieldName: 'status',
        visibleColumns: {id: true, status: false, price: false},
      }),
    ).toBe(false);
  });

  it('builds the company, route and store preference scope', () => {
    global.location = {pathname: '/order-history-page'};

    expect(
      resolveDefaultTablePreferenceScope({
        companyId: 42,
        route: {name: 'IgnoredRoute'},
        storeName: 'orders',
      }),
    ).toEqual({
      companyKey: '42',
      routeKey: 'order-history-page',
      storeKey: 'orders',
    });

    delete global.location;
  });

  it('uses an explicit preference key before the route pathname', () => {
    global.location = {pathname: '/product-showcases-page'};

    expect(
      resolveDefaultTablePreferenceScope({
        companyId: '99',
        preferenceKey: 'product_showcase_items',
        route: {name: 'ProductShowcasesPage'},
        storeName: 'product_showcase_items',
      }),
    ).toEqual({
      companyKey: '99',
      routeKey: 'product_showcase_items',
      storeKey: 'product_showcase_items',
    });

    delete global.location;
  });

  it('sanitizes stored filters against filterable columns and search key', () => {
    expect(
      sanitizeTableFiltersPreference({
        columns: [
          {name: 'status'},
          {name: 'internal', filter: false},
        ],
        filters: {
          internal: 'hidden',
          search: 'pedido',
          status: 'paid',
          unknown: 'ignored',
        },
      }),
    ).toEqual({
      search: 'pedido',
      status: 'paid',
    });
  });

  it('reads and writes visible columns under default-table[company][store][route]', () => {
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        theme: 'light',
        '42': {
          financialEntries: {
            receivables: {
              [TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]: {
                id: false,
              },
            },
          },
        },
      }),
    );

    expect(resolveStoredVisibleColumnsPreference(scope)).toEqual({
      id: false,
    });

    persistVisibleColumnsPreference({
      companyKey: '42',
      storeKey: 'financialEntries',
      routeKey: 'payables',
    }, {
      id: true,
      status: false,
    });

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      theme: 'light',
      '42': {
        financialEntries: {
          receivables: {
            [TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]: {
              id: false,
            },
          },
          payables: {
            [TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]: {
              id: true,
              status: false,
            },
          },
        },
      },
    });
  });

  it('reads and writes view mode under default-table[company][store][route]', () => {
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        '42': {
          financialEntries: {
            payables: {
              [TABLE_VIEW_MODE_PREFERENCES_KEY]: 'cards',
            },
          },
        },
      }),
    );

    expect(
      resolveStoredTableViewModePreference(
        {companyKey: '42', storeKey: 'financialEntries', routeKey: 'payables'},
        'table',
      ),
    ).toBe('cards');

    expect(
      resolveStoredTableViewModePreference(scope, 'table'),
    ).toBe('table');

    persistTableViewModePreference(scope, 'table');

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      '42': {
        financialEntries: {
          payables: {
            [TABLE_VIEW_MODE_PREFERENCES_KEY]: 'cards',
          },
          receivables: {
            [TABLE_VIEW_MODE_PREFERENCES_KEY]: 'table',
          },
        },
      },
    });
  });

  it('reads and writes sort under default-table[company][store][route]', () => {
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        '42': {
          financialEntries: {
            payables: {
              [TABLE_SORT_PREFERENCES_KEY]: {
                direction: 'asc',
                field: 'price',
              },
            },
          },
        },
      }),
    );

    expect(
      resolveStoredTableSortPreference({
        companyKey: '42',
        storeKey: 'financialEntries',
        routeKey: 'payables',
      }),
    ).toEqual({
      direction: 'asc',
      field: 'price',
    });

    expect(resolveStoredTableSortPreference(scope)).toBeNull();

    persistTableSortPreference(scope, {
      direction: 'desc',
      field: 'dueDate',
    });

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      '42': {
        financialEntries: {
          payables: {
            [TABLE_SORT_PREFERENCES_KEY]: {
              direction: 'asc',
              field: 'price',
            },
          },
          receivables: {
            [TABLE_SORT_PREFERENCES_KEY]: {
              direction: 'desc',
              field: 'dueDate',
            },
          },
        },
      },
    });
  });

  it('reads and writes filters under default-table[company][store][route]', () => {
    persistTableFiltersPreference(scope, {
      search: '72813',
      status: 'paid',
    });

    expect(resolveStoredTableFiltersPreference(scope)).toEqual({
      search: '72813',
      status: 'paid',
    });

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      '42': {
        financialEntries: {
          receivables: {
            [TABLE_FILTER_PREFERENCES_KEY]: {
              search: '72813',
              status: 'paid',
            },
          },
        },
      },
    });
  });

  it('ignores scopes without a company key', () => {
    persistTableFiltersPreference(
      {storeKey: 'orders', routeKey: 'order-history-page'},
      {app: 'POS'},
    );

    expect(global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY)).toBeNull();
    expect(
      resolveStoredTableFiltersPreference({
        storeKey: 'orders',
        routeKey: 'order-history-page',
      }),
    ).toBeNull();
  });
});
