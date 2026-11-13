const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
let mockStore;
let mockWidth = 393;
jest.mock('@store', () => ({useStore: () => mockStore, getAllStores: () => ({})}));
jest.mock('react-native', () => {
  const React = require('react');
  const component = name => props => React.createElement(name, props, props.children);
  return {View: component('View'), Text: component('Text'), TextInput: component('Input'), TouchableOpacity: component('Button'),
    Modal: component('Modal'), ScrollView: component('Scroll'), useWindowDimensions: () => ({width: mockWidth}),
    StyleSheet: {create: value => value}, Platform: {select: value => value.web}};
});
jest.mock('react-native-vector-icons/Feather', () => () => null);
jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({formatStoreColumnLabel: ({fallbackLabel}) => fallbackLabel}));
jest.mock('../../../../react/components/table/DefaultFiltersModal', () => () => null);
jest.mock('../../../../react/components/table/DefaultColumnMenu', () => () => null);
jest.mock('../../../../react/components/table/DefaultDebug', () => () => null);
jest.mock('../../../../react/components/table/DefaultToolbarAction', () => () => null);
jest.mock('../../../../react/components/table/useDefaultTableTheme', () => () => ({themeColors: {textPrimary: 'theme-text', inputBackground: 'theme-input'}}));
const Toolbar = require('../../../../react/components/table/DefaultTableCompactToolbar').default;
let tree;
beforeEach(() => {
  mockWidth = 393;
  mockStore = {getters: {add: true, columns: [{name: 'id', sortable: true}], filters: {status: 'paid'}, configs: {
    add: false, onAdd: jest.fn(), effectiveViewMode: 'cards', tablePreferenceScope: {}, onFilterChange: jest.fn(), resolvedSort: {field: 'id', direction: 'desc'},
  }}, actions: {setFilters: jest.fn(), setConfigs: jest.fn()}};
  renderer.act(() => {tree = renderer.create(React.createElement(Toolbar, {storeName: 'orders'}));});
});
afterEach(() => renderer.act(() => tree.unmount()));
it('submits search through the history callback, retaining existing filters', () => {
  renderer.act(() => tree.root.findByType('Input').props.onChangeText('  Marina  '));
  renderer.act(() => tree.root.findAllByType('Button').find(b => b.props.accessibilityLabel === 'Pesquisar').props.onPress());
  expect(mockStore.getters.configs.onFilterChange).toHaveBeenCalledWith({status: 'paid', search: 'Marina'});
  expect(mockStore.actions.setFilters).not.toHaveBeenCalled();
  expect(tree.root.findByType('Input').props.style.flat().some(s => s?.fontSize === 16)).toBe(true);
});
it('lets explicit add=false override the store default and switches view without clearing filters', () => {
  expect(tree.root.findAllByType('Button').some(b => b.props.accessibilityLabel === 'Adicionar')).toBe(false);
  renderer.act(() => tree.root.findAll(n => n.props.action?.label === 'Tabela')[0].props.action.onPress());
  expect(mockStore.actions.setConfigs).toHaveBeenCalledWith(expect.objectContaining({effectiveViewMode: 'table'}));
  expect(mockStore.getters.filters).toEqual({status: 'paid'});
});
it('has no results counter or sort caption row; sort lives in the "Mais opções" menu', () => {
  const texts = tree.root.findAllByType('Text').map(node => [].concat(node.props.children).join(''));
  expect(texts.some(text => /resultado/.test(text))).toBe(false);
  expect(texts.some(text => /Ordenar/.test(text))).toBe(false);
  const sortAction = tree.root.findAll(node => node.props.action?.accessibilityLabel === 'Escolher ordenação');
  expect(sortAction.length).toBeGreaterThan(0);
});
it('keeps a single non-wrapping row and moves Filtros/Tabela/Cards into "Mais opções" on mobile', () => {
  const labels = tree.root.findAllByType('Button').map(b => b.props.accessibilityLabel);
  expect(labels).not.toContain('Filtros');
  expect(labels).not.toContain('Tabela');
  expect(labels).not.toContain('Cards');
  expect(labels).toContain('Mais opções');
  const row = tree.root.findAll(n => Array.isArray(n.props.style) && n.props.style.some(x => x?.flexWrap === 'nowrap'));
  expect(row.length).toBeGreaterThan(0);
  const actions = tree.root.findAll(n => n.props.action?.label).map(n => n.props.action.label);
  expect(actions).toEqual(expect.arrayContaining(['Filtros', 'Tabela', 'Cards']));
});
const labelsAt = width => {
  mockWidth = width;
  renderer.act(() => tree.update(React.createElement(Toolbar, {storeName: 'orders'})));
  return tree.root.findAllByType('Button').map(b => b.props.accessibilityLabel);
};
it('collapses to search + More options on non-mobile widths under 1000px', () => {
  const labels = labelsAt(800);
  ['Filtros', 'Tabela', 'Cards', 'Colunas'].forEach(l => expect(labels).not.toContain(l));
  expect(labels).toContain('Mais opções');
});
it('keeps the full toolbar from 1000px up', () => {
  const labels = labelsAt(1000);
  ['Filtros', 'Tabela', 'Cards', 'Colunas', 'Mais opções'].forEach(l => expect(labels).toContain(l));
});
