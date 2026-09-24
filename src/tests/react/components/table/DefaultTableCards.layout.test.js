const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
let mockStore;
jest.mock('@store', () => ({useStore: () => mockStore}));
jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({formatStoreColumnLabel: () => ''}));
jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: props => React.createElement('View', props, props.children),
    Text: props => React.createElement('Text', props, props.children),
    FlatList: props => React.createElement('List', {}, props.data.map((item, index) => props.renderItem({item, index}))),
    StyleSheet: {create: value => value},
    Platform: {select: value => value.web},
  };
});
jest.mock('../../../../react/components/table/DefaultTableInput', () => () => null);
jest.mock('../../../../react/components/table/DefaultTableEmptyState', () => () => null);
jest.mock('../../../../react/components/table/DefaultTableRowActions', () => ({__esModule: true, default: () => null, hasDefaultTableRowActionsComponent: () => false}));
jest.mock('../../../../react/components/table/useDefaultTableTheme', () => () => ({palette: {}}));
const Cards = require('../../../../react/components/table/DefaultTableCards').default;
const flatten = style => Object.assign({}, ...[style].flat(Infinity).filter(Boolean));
it.each([1, 2, 3])('preserves content height and column sizing for %i columns', numColumns => {
  const onPress = jest.fn();
  mockStore = {getters: {items: [{id: 1}, {id: 2}], configs: {
    cardListProps: {numColumns}, onRowPress: onPress,
    renderCard: ({item, openRow}) => React.createElement('Card', {onPress: openRow, id: item.id}),
  }}};
  let tree;
  renderer.act(() => {tree = renderer.create(React.createElement(Cards, {storeName: 'people'}));});
  const cards = tree.root.findAllByType('Card');
  expect(cards).toHaveLength(2);
  for (const card of cards) {
    const content = flatten(card.parent.props.style);
    const outer = flatten(card.parent.parent.parent.props.style);
    expect(content.flexBasis).toBe('auto');
    expect(content.flexShrink).toBe(0);
    expect(outer.flexBasis).toBe(numColumns === 1 ? 'auto' : 0);
    expect(outer.flexGrow).toBe(numColumns === 1 ? 0 : 1);
    expect(outer.width).toBe('100%');
  }
  renderer.act(() => cards[1].props.onPress());
  expect(onPress).toHaveBeenCalledWith({id: 2});
  renderer.act(() => tree.unmount());
});
