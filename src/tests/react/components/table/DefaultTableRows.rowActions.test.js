const React = require('react');
const renderer = require('react-test-renderer');
const {describe, expect, it, beforeEach} = require('@jest/globals');

global.IS_REACT_ACT_ENVIRONMENT = true;

let mockStores = {};

jest.mock('@store', () => ({
  useStore: jest.fn(name => mockStores[name] || {actions: {}, getters: {}}),
}));

jest.mock('@controleonline/ui-common/src/react/utils/storeColumns', () => ({
  formatStoreColumnLabel: ({fallbackLabel, fieldName}) => fallbackLabel || fieldName,
}));

jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  return props => React.createElement('icon', props);
});

jest.mock('react-native', () => {
  const React = require('react');
  const createComponent = name => props =>
    React.createElement(name, props, props.children);
  const FlatList = props => {
    const items = Array.isArray(props.data) ? props.data : [];
    return React.createElement(
      'FlatList',
      props,
      items.map((item, index) =>
        props.renderItem ? props.renderItem({item, index}) : null,
      ),
    );
  };
  return {
    FlatList,
    ScrollView: createComponent('ScrollView'),
    Text: createComponent('Text'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    View: createComponent('View'),
  };
});

jest.mock('../../../../react/components/table/DefaultTableEmptyState', () => () => null);
jest.mock('../../../../react/components/table/DefaultTableInput', () => {
  const React = require('react');
  return ({column, row}) =>
    React.createElement('cell', {
      field: column?.key || column?.name,
      value: row?.[column?.key || column?.name],
    });
});
jest.mock('../../../../react/components/table/useDefaultTableTheme', () => () => ({
  palette: {background: '#fff', text: '#111', textSecondary: '#666'},
  resolvedAccentColor: '#eee',
  tableBorderColors: {rowBorderColor: '#ddd', headerBorderColor: '#ccc'},
  themeTokens: {},
}));

const DefaultTableRows = require('../../../../react/components/table/DefaultTableRows').default;

const collectTestIds = tree =>
  [
    ...tree.root.findAllByType('View'),
    ...tree.root.findAllByType('TouchableOpacity'),
    ...tree.root.findAllByType('Text'),
  ]
    .map(node => node.props.testID)
    .filter(Boolean);

describe('DefaultTableRows row actions column', () => {
  beforeEach(() => {
    mockStores = {};
    global.t = {t: (_store, _kind, key) => ({actions: 'Ações', edit: 'Editar'}[key])};
  });

  it('renders header + cell when rowActionsComponent is set', () => {
    mockStores.orders = {
      getters: {
        columns: [{key: 'name', label: 'Nome'}],
        items: [{id: 7, name: 'CT-e'}],
        visibleColumns: {},
        configs: {
          rowActionsComponent: () => React.createElement('row-actions'),
          showRowActions: true,
        },
      },
    };

    let tree;
    renderer.act(() => {
      tree = renderer.create(React.createElement(DefaultTableRows, {storeName: 'orders'}));
    });

    expect(collectTestIds(tree)).toEqual(
      expect.arrayContaining([
        'default-table-row-actions-header',
        'default-table-row-actions-7',
      ]),
    );
    expect(tree.root.findAllByType('row-actions')).toHaveLength(1);
  });

  it('does not render an actions column when showRowActions is false', () => {
    mockStores.orders = {
      getters: {
        columns: [{key: 'name', label: 'Nome'}],
        items: [{id: 7, name: 'CT-e'}],
        visibleColumns: {},
        configs: {
          rowActionsComponent: () => React.createElement('row-actions'),
          showRowActions: false,
        },
      },
    };

    let tree;
    renderer.act(() => {
      tree = renderer.create(React.createElement(DefaultTableRows, {storeName: 'orders'}));
    });

    expect(collectTestIds(tree)).not.toEqual(
      expect.arrayContaining(['default-table-row-actions-header']),
    );
    expect(tree.root.findAllByType('row-actions')).toHaveLength(0);
  });
});
