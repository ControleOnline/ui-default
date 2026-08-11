const React = require('react');
const renderer = require('react-test-renderer');

const {describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../../react/utils/tableVisibleColumnsPreferences', () => ({
  resolveStoredTableFiltersPreference: jest.fn(() => null),
  resolveStoredVisibleColumnsPreference: jest.fn(() => null),
  sanitizeTableFiltersPreference: jest.fn(v => v),
  sanitizeVisibleColumnsPreference: jest.fn(v => v?.visibleColumns || []),
}));

const {
  useDefaultTableStoreSync,
} = require('../../../../react/components/table/useDefaultTableStoreSync');

function Harness({data, store}) {
  useDefaultTableStoreSync({
    columns: [],
    columnsForTable: [],
    data,
    defaultTableConfigs: {},
    defaultTableConfigsSignature: 'sig',
    store,
    storeColumnsLength: 0,
    storeFilters: {},
    storeName: 'device_config',
    tablePreferenceScope: 'test',
  });
  return null;
}

describe('useDefaultTableStoreSync', () => {
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
});
