const React = require('react');
const renderer = require('react-test-renderer');

const {beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

const mockResolveStoredTableFiltersPreference = jest.fn(() => null);
const mockSanitizeTableFiltersPreference = jest.fn((args) => {
  if (args && args.filters) return args.filters;
  return args || {};
});

jest.mock('../../../../react/utils/tableVisibleColumnsPreferences', () => ({
  persistTableFiltersPreference: jest.fn(),
  resolveStoredTableFiltersPreference: (...args) =>
    mockResolveStoredTableFiltersPreference(...args),
  resolveStoredVisibleColumnsPreference: jest.fn(() => null),
  sanitizeTableFiltersPreference: (...args) =>
    mockSanitizeTableFiltersPreference(...args),
  sanitizeVisibleColumnsPreference: jest.fn(v => v?.visibleColumns || []),
}));

const {
  areTableFiltersEqual,
  useDefaultTableStoreSync,
} = require('../../../../react/components/table/useDefaultTableStoreSync');

function Harness({data, store, storeFilters, columnsForTable, tablePreferenceScope, filters, onFilterChange}) {
  useDefaultTableStoreSync({
    filters,
    onFilterChange,
    columns: [],
    columnsForTable: columnsForTable || [],
    data,
    defaultTableConfigs: {},
    defaultTableConfigsSignature: 'sig',
    store,
    storeColumnsLength: 0,
    storeFilters: storeFilters || {},
    storeName: 'device_config',
    tablePreferenceScope: tablePreferenceScope || {
      companyKey: 'c1',
      storeKey: 'orders',
      routeKey: 'order-history-page',
    },
  });
  return null;
}

describe('useDefaultTableStoreSync', () => {
  beforeEach(() => {
    mockResolveStoredTableFiltersPreference.mockReset();
    mockResolveStoredTableFiltersPreference.mockReturnValue(null);
    mockSanitizeTableFiltersPreference.mockClear();
  });

  it('publishes controlled data once per array reference (avoids #185 loop)', () => {
    const setItems = jest.fn();
    const store = {
      actions: {setItems},
      getters: {},
    };
    const data = [{id: 1}];

    let tree;
    renderer.act(() => {
      tree = renderer.create(React.createElement(Harness, {data, store}));
    });

    expect(setItems).toHaveBeenCalledTimes(1);
    expect(setItems).toHaveBeenCalledWith(data);

    // New store identity (zustand commit) with same data reference must NOT re-publish
    const storeAfterCommit = {
      actions: {setItems},
      getters: {items: data},
    };
    renderer.act(() => {
      tree.update(React.createElement(Harness, {data, store: storeAfterCommit}));
    });
    expect(setItems).toHaveBeenCalledTimes(1);

    // New data reference must publish again
    const data2 = [{id: 2}];
    renderer.act(() => {
      tree.update(
        React.createElement(Harness, {data: data2, store: storeAfterCommit}),
      );
    });
    expect(setItems).toHaveBeenCalledTimes(2);
    expect(setItems).toHaveBeenLastCalledWith(data2);

    tree.unmount();
  });

  it('hydrates stored filters once and does not re-setFilters when storeFilters churns (period toggle #185)', () => {
    const setFilters = jest.fn();
    const setItems = jest.fn();
    const stored = {
      alterDate: {shortcut: 'today', customRange: {from: '', to: ''}},
    };
    mockResolveStoredTableFiltersPreference.mockReturnValue(stored);
    mockSanitizeTableFiltersPreference.mockImplementation(({filters}) => filters || {});

    const columnsForTable = [{name: 'alterDate', externalFilter: true}];
    const store = {actions: {setFilters, setItems}, getters: {}};

    let tree;
    renderer.act(() => {
      tree = renderer.create(
        React.createElement(Harness, {
          data: [],
          store,
          storeFilters: {},
          columnsForTable,
        }),
      );
    });

    expect(setFilters).toHaveBeenCalledTimes(1);
    expect(setFilters).toHaveBeenCalledWith(stored);

    // Simulate user toggle today → all → today: storeFilters identity changes each time
    const afterAll = {};
    const afterToday = {
      alterDate: {shortcut: 'today', customRange: {from: '', to: ''}},
    };

    renderer.act(() => {
      tree.update(
        React.createElement(Harness, {
          data: [],
          store: {actions: {setFilters, setItems}, getters: {filters: afterAll}},
          storeFilters: afterAll,
          columnsForTable,
        }),
      );
    });
    renderer.act(() => {
      tree.update(
        React.createElement(Harness, {
          data: [],
          store: {actions: {setFilters, setItems}, getters: {filters: afterToday}},
          storeFilters: afterToday,
          columnsForTable,
        }),
      );
    });

    // Must remain a single hydrate — no chase of storeFilters
    expect(setFilters).toHaveBeenCalledTimes(1);

    tree.unmount();
  });

  it('areTableFiltersEqual treats equivalent period payloads as equal', () => {
    const a = {alterDate: {shortcut: 'today', customRange: {from: '', to: ''}}};
    const b = {alterDate: {shortcut: 'today', customRange: {from: '', to: ''}}};
    expect(areTableFiltersEqual(a, b)).toBe(true);
    expect(areTableFiltersEqual(a, {alterDate: {shortcut: 'all'}})).toBe(false);
    expect(areTableFiltersEqual({}, {})).toBe(true);
  });
});


describe('controlled history filters and persisted preferences', () => {
  it('keeps the initial date shown by the dialog aligned with the request owner', () => {
    mockResolveStoredTableFiltersPreference.mockReturnValue(null);
    const filters = {alterDate: {shortcut: 'today'}};
    const store = {getters: {filters: {}}, actions: {setFilters: jest.fn()}};
    const onFilterChange = jest.fn();
    let tree;
    renderer.act(() => {tree = renderer.create(React.createElement(Harness, {
      store, filters, onFilterChange, columnsForTable: [{key: 'alterDate'}],
    }));});
    expect(store.actions.setFilters).toHaveBeenCalledWith(filters);
    expect(onFilterChange).not.toHaveBeenCalled();
    renderer.act(() => tree.unmount());
  });
  it.each([{}, {alterDate: {shortcut: 'all'}}])('notifies the query owner when restoring all periods: %j', saved => {
    mockResolveStoredTableFiltersPreference.mockReturnValue(saved);
    const store = {getters: {}, actions: {setFilters: jest.fn()}};
    const onFilterChange = jest.fn();
    const props = {store, storeFilters: {alterDate: {shortcut: 'today'}},
      filters: {alterDate: {shortcut: 'today'}}, onFilterChange,
      columnsForTable: [{key: 'alterDate'}]};
    let tree;
    renderer.act(() => {tree = renderer.create(React.createElement(Harness, props));});
    expect(store.actions.setFilters).toHaveBeenCalledWith(saved);
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenCalledWith(saved);
    renderer.act(() => {tree.update(React.createElement(Harness, {...props, filters: saved, storeFilters: saved}));});
    expect(onFilterChange).toHaveBeenCalledTimes(1);
    renderer.act(() => tree.unmount());
  });
});
