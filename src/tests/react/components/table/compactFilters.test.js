const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
let mockStore;
jest.mock('@store', () => ({useStore: () => mockStore}));
jest.mock('react-native', () => {
  const React = require('react');
  const component = name => props => React.createElement(name, props, props.children);
  return {View: component('View'), Text: component('Text'), TouchableOpacity: component('Button'), Modal: component('Modal'),
    ScrollView: component('Scroll'), StyleSheet: {create: value => value}, Platform: {select: value => value.web}};
});
jest.mock('react-native-vector-icons/Feather', () => () => null);
jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({formatStoreColumnLabel: ({fallbackLabel}) => fallbackLabel}));
jest.mock('../../../../react/components/filters/DefaultColumnFilter', () => props => require('react').createElement('Filter', props));
jest.mock('../../../../react/components/table/useDefaultTableTheme', () => () => ({modalColors: {}, resolvedAccentColor: 'theme-accent'}));
jest.mock('../../../../react/utils/tableVisibleColumnsPreferences', () => ({
  persistTableFiltersPreference: jest.fn(), resolveDefaultTablePreferenceScope: () => ({}), sanitizeTableFiltersPreference: ({filters}) => filters,
}));
const Filters = require('../../../../react/components/table/DefaultFiltersModal').default;
let tree;let close;
const render = visible => React.createElement(Filters, {storeName: 'orders', visible, deferred: true, onClose: close});
beforeEach(() => {
  global.t = {t: (_store, _kind, key) => key};
  close = jest.fn();
  mockStore = {getters: {columns: [{name: 'status'}], filters: {status: 'paid', search: 'Marina'}, configs: {onFilterChange: jest.fn()}}, actions: {setFilters: jest.fn()}};
  renderer.act(() => {tree = renderer.create(render(true));});
});
afterEach(() => renderer.act(() => tree.unmount()));
const click = label => tree.root.findAllByType('Button').find(button => button.findAllByType('Text').some(text => text.props.children === label)).props.onPress();
it('applies edited filters once and retains search only after Apply', () => {
  renderer.act(() => tree.root.findByType('Filter').props.onChange('status', 'closed'));
  expect(mockStore.actions.setFilters).not.toHaveBeenCalled();
  expect(mockStore.getters.configs.onFilterChange).not.toHaveBeenCalled();
  renderer.act(() => click('Aplicar filtros'));
  expect(mockStore.getters.configs.onFilterChange).toHaveBeenCalledTimes(1);
  expect(mockStore.getters.configs.onFilterChange).toHaveBeenCalledWith({status: 'closed', search: 'Marina'});
  expect(close).toHaveBeenCalledTimes(1);
});
it('closing discards draft changes and clearing stays deferred', () => {
  renderer.act(() => click('Limpar'));
  expect(tree.root.findByType('Filter').props.filters).toEqual({});
  expect(mockStore.actions.setFilters).not.toHaveBeenCalled();
  renderer.act(() => tree.root.findByType('Modal').props.onRequestClose());
  renderer.act(() => tree.update(render(false)));
  renderer.act(() => tree.update(render(true)));
  expect(tree.root.findByType('Filter').props.filters).toEqual({status: 'paid', search: 'Marina'});
});
