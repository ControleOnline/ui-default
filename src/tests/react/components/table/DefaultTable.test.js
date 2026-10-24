const {registerDefaultTableTests, React, renderer, mockState, DefaultTable, mergeSortedDataWithLiveItems, resolveColumnListLoadParams, shouldTriggerEndReachedFromScroll, DEFAULT_TABLE_PREFERENCES_STORAGE_KEY, reactNavigation, getAllStores, STORE_ACTION_META_KEY, flattenStyle} = require('./defaultTableTestSetup.cjs');
describe('resolveColumnListLoadParams', () => {
  it('uses company for category stores and people for financial owner stores', () => {
    expect(resolveColumnListLoadParams({
      column: {list: 'categories/getItems'},
      currentCompanyId: 21,
    })).toEqual({company: 21});
    expect(resolveColumnListLoadParams({
      column: {list: 'wallet/getItems'},
      currentCompanyId: 21,
    })).toEqual({people: 21});
    expect(resolveColumnListLoadParams({
      column: {list: 'paymentType/getItems'},
      currentCompanyId: 21,
    })).toEqual({people: 21});
  });

  it('resolves contextual list params without losing the company scope', () => {
    expect(resolveColumnListLoadParams({
      column: {
        list: 'categories/getItems',
        listRequestParams: ({requestParams}) => ({context: requestParams.context}),
      },
      currentCompanyId: 21,
      requestParams: {context: 'receive'},
    })).toEqual({company: 21, context: 'receive'});
  });
});
describe('mergeSortedDataWithLiveItems', () => {
  it('keeps the sorted order and replaces stale rows with live store items', () => {
    const sortedData = [
      {
        '@id': '/invoices/332',
        id: 332,
        status: {id: 32, status: 'open'},
      },
      {
        '@id': '/invoices/333',
        id: 333,
        status: {id: 33, status: 'paid'},
      },
    ];
    const liveItems = [
      {
        id: 333,
        status: {id: 33, status: 'paid'},
      },
      {
        id: 332,
        status: {id: 33, status: 'paid'},
      },
      {
        id: 334,
        status: {id: 33, status: 'paid'},
      },
    ];

    const mergedData = mergeSortedDataWithLiveItems({liveItems, sortedData});

    expect(mergedData.map(item => item.id)).toEqual([332, 333]);
    expect(mergedData[0].status.status).toBe('paid');
  });
});
describe('shouldTriggerEndReachedFromScroll', () => {
  it('returns true before the scroll reaches the exact end', () => {
    expect(shouldTriggerEndReachedFromScroll({
      nativeEvent: {
        contentOffset: {y: 650},
        contentSize: {height: 1200},
        layoutMeasurement: {height: 400},
      },
    })).toBe(true);

    expect(shouldTriggerEndReachedFromScroll({
      nativeEvent: {
        contentOffset: {y: 100},
        contentSize: {height: 1200},
        layoutMeasurement: {height: 400},
      },
    })).toBe(false);
  });
});
