const {
  DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
  TABLE_SORT_DIRECTION_PREFERENCES_KEY,
  TABLE_SORT_FIELD_PREFERENCES_KEY,
  TABLE_SORT_PREFERENCES_KEY,
  TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY,
  TABLE_VIEW_MODE_PREFERENCES_KEY,
  buildDefaultVisibleColumns,
  persistTableSortPreference,
  persistTableViewModePreference,
  persistVisibleColumnsPreference,
  resolveStoredTableSortPreference,
  resolveStoredTableViewModePreference,
  resolveStoredVisibleColumnsPreference,
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
      id: false,
      status: true,
      price: false,
    });
  });

  it('reads and writes visible columns preferences under the per-page bucket', () => {
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        theme: 'light',
        [TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]: {
          'financialEntries:receivables': {
            id: false,
          },
        },
      }),
    );

    expect(
      resolveStoredVisibleColumnsPreference('financialEntries:receivables'),
    ).toEqual({
      id: false,
    });

    persistVisibleColumnsPreference('financialEntries:payables', {
      id: true,
      status: false,
    });

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      theme: 'light',
      [TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]: {
        'financialEntries:receivables': {
          id: false,
        },
        'financialEntries:payables': {
          id: true,
          status: false,
        },
      },
    });
  });

  it('reads and writes the preferred table view mode by page', () => {
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        [TABLE_VIEW_MODE_PREFERENCES_KEY]: {
          'financialEntries:payables': 'cards',
        },
      }),
    );

    expect(
      resolveStoredTableViewModePreference(
        'financialEntries:payables',
        'table',
      ),
    ).toBe('cards');

    expect(
      resolveStoredTableViewModePreference(
        'financialEntries:receivables',
        'table',
      ),
    ).toBe('table');

    persistTableViewModePreference('financialEntries:receivables', 'table');

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      [TABLE_VIEW_MODE_PREFERENCES_KEY]: {
        'financialEntries:payables': 'cards',
        'financialEntries:receivables': 'table',
      },
    });
  });

  it('reads and writes the preferred sort by page', () => {
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        [TABLE_SORT_FIELD_PREFERENCES_KEY]: {
          'financialEntries:payables': 'price',
        },
        [TABLE_SORT_DIRECTION_PREFERENCES_KEY]: {
          'financialEntries:payables': 'asc',
        },
      }),
    );

    expect(
      resolveStoredTableSortPreference('financialEntries:payables'),
    ).toEqual({
      direction: 'asc',
      field: 'price',
    });

    expect(
      resolveStoredTableSortPreference('financialEntries:receivables'),
    ).toBeNull();

    persistTableSortPreference('financialEntries:receivables', {
      direction: 'desc',
      field: 'dueDate',
    });

    expect(
      JSON.parse(
        global.localStorage.getItem(DEFAULT_TABLE_PREFERENCES_STORAGE_KEY),
      ),
    ).toEqual({
      [TABLE_SORT_FIELD_PREFERENCES_KEY]: {
        'financialEntries:payables': 'price',
        'financialEntries:receivables': 'dueDate',
      },
      [TABLE_SORT_DIRECTION_PREFERENCES_KEY]: {
        'financialEntries:payables': 'asc',
        'financialEntries:receivables': 'desc',
      },
      [TABLE_SORT_PREFERENCES_KEY]: {
        'financialEntries:receivables': {
          direction: 'desc',
          field: 'dueDate',
        },
      },
    });
  });

  it('keeps reading the legacy combined sort format when needed', () => {
    global.localStorage.setItem(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        [TABLE_SORT_PREFERENCES_KEY]: {
          'financialEntries:ownTransfers': {
            direction: 'asc',
            field: 'createdAt',
          },
        },
      }),
    );

    expect(
      resolveStoredTableSortPreference('financialEntries:ownTransfers'),
    ).toEqual({
      direction: 'asc',
      field: 'createdAt',
    });
  });
});
