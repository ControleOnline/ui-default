const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('react-native', () => ({StyleSheet: {create: value => value}, Platform: {select: value => value.web}}));
jest.mock('@store', () => ({getAllStores: () => ({})}));
jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({formatStoreColumnValue: () => ''}));
const {useDefaultTablePagination} = require('../../../../react/components/table/useDefaultTablePagination');
const {getVisiblePageNumbers, isActiveTableFilter} = require('../../../../react/components/table/DefaultTableCompact.helpers');
let tree;
let result;
let options;
const Harness = () => {result = useDefaultTablePagination(options); return null;};
beforeEach(() => {
  options = {autoMode: true, columnsForTable: [], filters: {}, isFocused: true, pageSize: 20,
    paginationMode: 'pages', requestParams: {provider: '/people/1'}, resolvedTotalItems: 45,
    resolvedSort: {field: 'id', direction: 'desc'}, storeName: 'orders', showError: jest.fn(),
    store: {getters: {items: [], resourceEndpoint: 'orders'}},
    resolvedActions: {getItems: jest.fn(async query => {
      const member = [{id: query.page * 100}];
      options.store.getters.items = query.append ? [...options.store.getters.items, ...member] : member;
      return {member, totalItems: 45};
    })}};
});
afterEach(() => renderer.act(() => tree?.unmount()));
const mount = async () => {await renderer.act(async () => {tree = renderer.create(React.createElement(Harness));});};
it('loads numbered pages with the same scope, filters and server sort, replacing records', async () => {
  options.filters = {search: 'Marina'};
  await mount();
  await renderer.act(async () => {await result.goToPage(2);});
  expect(options.resolvedActions.getItems).toHaveBeenLastCalledWith({provider: '/people/1', itemsPerPage: 20, page: 2, 'order[id]': 'desc', search: 'Marina'});
  expect(result.currentPage).toBe(2);
  expect(result.resolvedData).toEqual([{id: 200}]);
  renderer.act(() => result.handleEndReached());
  expect(options.resolvedActions.getItems).toHaveBeenCalledTimes(2);
});
it('resets to page one when filters change and rejects invalid pages', async () => {
  await mount();
  await renderer.act(async () => {await result.goToPage(3);});
  options = {...options, filters: {search: 'Carlos'}};
  await renderer.act(async () => {tree.update(React.createElement(Harness));});
  expect(result.currentPage).toBe(1);
  expect(options.resolvedActions.getItems.mock.calls.at(-1)[0].search).toBe('Carlos');
  const count = options.resolvedActions.getItems.mock.calls.length;
  await result.goToPage(0); await result.goToPage(4); await result.goToPage(1.5);
  expect(options.resolvedActions.getItems).toHaveBeenCalledTimes(count);
});
it('preserves infinite append for consumers that did not opt into numbered pages', async () => {
  options.paginationMode = 'infinite';
  await mount();
  await renderer.act(async () => {result.handleEndReached();});
  expect(options.resolvedActions.getItems.mock.calls.at(-1)[0]).toMatchObject({page: 2, append: true});
  expect(result.resolvedData).toHaveLength(2);
});
it('does not advance the page after an API error', async () => {
  await mount();
  options.resolvedActions.getItems.mockRejectedValueOnce(new Error('Falha demonstrativa'));
  await renderer.act(async () => {await result.goToPage(2);});
  expect(result.currentPage).toBe(1);
  expect(options.showError).toHaveBeenCalledWith('Falha demonstrativa');
});
it('keeps compact page controls bounded and ignores empty date shortcuts', () => {
  expect(getVisiblePageNumbers(1, 50)).toEqual([1, 2, 3]);
  expect(getVisiblePageNumbers(50, 50)).toEqual([48, 49, 50]);
  expect(isActiveTableFilter({shortcut: 'all'})).toBe(false);
  expect(isActiveTableFilter({shortcut: 'today'})).toBe(true);
});
