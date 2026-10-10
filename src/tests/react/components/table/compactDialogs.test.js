const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
let mockStore;
const mockGetItems = jest.fn();
jest.mock('@store', () => ({useStore: () => mockStore, getAllStores: () => ({people: {actions: {getItems: mockGetItems}}})}));
jest.mock('react-native', () => {
  const React = require('react'); const component = name => p => React.createElement(name, p, p.children);
  return {View: component('View'), Text: component('Text'), TouchableOpacity: component('Button'), ScrollView: component('Scroll'), Modal: component('Modal'),
    TextInput: component('Input'), Image: component('Image'), StyleSheet: {create: v => v}, Platform: {select: v => v.web}, useWindowDimensions: () => ({width: 393, height: 852})};
});
jest.mock('react-native-vector-icons/Feather', () => () => null);
jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({formatStoreColumnLabel: ({fallbackLabel}) => fallbackLabel}));
jest.mock('../../../../react/components/table/useDefaultTableTheme', () => () => ({themeColors: {compact: true, border: '#ddd', textPrimary: '#123'}, checkboxSelectedMarkColor: '#987', modalColors: {textColor: '#123'}}));
jest.mock('../../../../react/components/filters/CompactFilterSelector', () => p => require('react').createElement('Picker', p));
jest.mock('../../../../react/components/filters/DateShortcutFilter', () => () => null);
const Columns = require('../../../../react/components/table/DefaultColumnMenu').default;
const Filter = require('../../../../react/components/filters/DefaultColumnFilter').default;
let tree;
beforeEach(() => {
  global.t = {t: (_store, _kind, key) => key};
  mockGetItems.mockReset().mockResolvedValue([{id: 22, name: 'Ana'}]);
  mockStore = {getters: {currentCompany: {id: 14}, columns: [{name: 'id', isIdentity: true, compactLabel: 'Pedido'}, {name: 'price', compactLabel: 'Valor'}],
    configs: {appearance: 'compact', tablePreferenceScope: {storeName: 'test'}}, visibleColumns: {}}, actions: {setVisibleColumns: jest.fn()}};
});
afterEach(() => {if (tree) renderer.act(() => tree.unmount()); tree = null;});
it('shows selectable columns in a noncollapsed scroll body, preserving required identity', () => {
  renderer.act(() => {tree = renderer.create(React.createElement(Columns, {storeName: 'orders', visible: true}));});
  const buttons = tree.root.findAllByType('Button');
  const id = buttons.find(b => b.props.accessibilityLabel === 'Pedido');
  expect(id.props.disabled).toBe(true);
  const amount = buttons.find(b => b.props.accessibilityLabel === 'Valor');
  renderer.act(() => amount.props.onPress());
  expect(mockStore.actions.setVisibleColumns).toHaveBeenCalledWith(expect.objectContaining({price: false, id: true}));
  expect(tree.root.findByType('Scroll').props.style.height).toBeGreaterThan(0);
});
it('uses fixed channel options without remote loading and emits the selected channel', () => {
  const onChange = jest.fn();
  renderer.act(() => {tree = renderer.create(React.createElement(Filter, {storeName: 'orders', column: {name: 'app', compactLabel: 'Canal', list: [{value: 'POS', label: 'POS'}]}, onChange}));});
  const picker = tree.root.findByType('Picker');
  expect(picker.props.options).toEqual(expect.arrayContaining([expect.objectContaining({key: 'POS', label: 'POS'})]));
  expect(picker.props.onSearchChange).toBeUndefined();
  expect(mockGetItems).not.toHaveBeenCalled();
  renderer.act(() => picker.props.onSelect('POS'));
  expect(onChange).toHaveBeenCalledWith('app', 'POS');
});
it('loads remote options only on opening, using the existing list action', async () => {
  renderer.act(() => {tree = renderer.create(React.createElement(Filter, {storeName: 'orders', column: {name: 'client', list: 'people/getItems'}}));});
  expect(mockGetItems).not.toHaveBeenCalled();
  await renderer.act(async () => {await tree.root.findByType('Picker').props.onBeforeOpen();});
  expect(mockGetItems).toHaveBeenCalledTimes(1);
  expect(tree.root.findByType('Picker').props.options).toEqual(expect.arrayContaining([expect.objectContaining({key: '22'})]));
});
