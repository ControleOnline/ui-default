const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('react-native', () => {
  const React = require('react');
  const el = name => props => React.createElement(name, props, props.children);
  return {StyleSheet: {create: v => v}, Text: el('Text'), View: el('View'), TouchableOpacity: el('TouchableOpacity'), useWindowDimensions: () => ({width: 1440})};
});
jest.mock('react-native-vector-icons/Feather', () => () => null);
jest.mock('@store', () => ({
  useStore: () => ({getters: {totalItems: 45, configs: {paginationMode: 'pages', currentPage: 1, pageSizeNumber: 20}}}),
}));
jest.mock('../../../../react/components/table/useDefaultTableTheme', () => () => ({
  themeColors: {defaultTable_tableFooterBackground: '#111', defaultTable_tableFooterBorder: '#222', defaultTable_tableFooterText: '#fff'},
}));
const DefaultTablePaginationBar = require('../../../../react/components/table/DefaultTablePaginationBar').default;

it('renders the standalone pagination bar with themed footer colors without throwing', () => {
  let tree;
  renderer.act(() => {tree = renderer.create(React.createElement(DefaultTablePaginationBar, {storeName: 'orders'}));});
  const root = tree.root.findByProps({testID: 'default-table-pagination'});
  const style = [].concat(...[root.props.style].flat());
  expect(style).toEqual(expect.arrayContaining([expect.objectContaining({backgroundColor: '#111', borderTopColor: '#222'})]));
  renderer.act(() => tree.unmount());
});
