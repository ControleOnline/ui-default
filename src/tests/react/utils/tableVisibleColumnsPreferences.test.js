const {
  DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
  TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY,
  TABLE_VIEW_MODE_PREFERENCES_KEY,
  buildDefaultVisibleColumns,
  persistTableViewModePreference,
  persistVisibleColumnsPreference,
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
});
