const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {afterEach, beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

let consoleErrorSpy = null;
let mockStores = {};
let mockWindowDimensions = {width: 480, height: 800};

jest.mock('@store', () => ({
  getAllStores: jest.fn(() => ({})),
  useStore: jest.fn(name => mockStores[name] || {actions: {}, getters: {}}),
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(() => false),
}));

jest.mock('@controleonline/ui-common/src/react/components/MessageService', () => ({
  useMessage: jest.fn(() => ({
    showError: jest.fn(),
  })),
}));

jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  return props => React.createElement('icon', props, props.children);
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
      items.length === 0 && props.ListEmptyComponent ? props.ListEmptyComponent : null,
      props.ListFooterComponent || null,
    );
  };

  return {
    FlatList,
    Modal: createComponent('Modal'),
    Platform: {
      select: value => value.web || value.default || null,
    },
    ScrollView: createComponent('ScrollView'),
    StyleSheet: {create: value => value},
    Text: createComponent('Text'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    View: createComponent('View'),
    useWindowDimensions: jest.fn(() => mockWindowDimensions),
  };
});

jest.mock('../../../../react/components/filters/DefaultColumnFilter', () => () =>
  React.createElement('DefaultColumnFilter'),
);

jest.mock('../../../../react/components/filters/DefaultSearch', () => () =>
  React.createElement('DefaultSearch'),
);

jest.mock('../../../../react/components/form/DefaultForm', () => () =>
  React.createElement('DefaultForm'),
);

jest.mock('../../../../react/components/inputs/DefaultInput', () => () =>
  React.createElement('DefaultInput'),
);

jest.mock('@controleonline/ui-layout/src/react/components/StateStore', () => props =>
  React.createElement('StateStore', props, props.children),
);

const {
  default: DefaultTable,
  resolveColumnListLoadParams,
} = require('../../../../react/components/table/DefaultTable');

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

describe('DefaultTable', () => {
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockWindowDimensions = {width: 480, height: 800};

    mockStores = {
      people: {
        getters: {
          currentCompany: {
            theme: {
              colors: {},
            },
          },
        },
      },
      theme: {
        getters: {
          colors: {},
        },
      },
    };
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
      consoleErrorSpy = null;
    }
  });

  it('keeps the list/card toggle visible on compact layouts even when cards are forced', () => {
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [],
          showColumnFiltersButton: false,
        }),
      );
    });

    const iconNames = tree.root.findAllByType('icon').map(node => node.props.name);

    expect(iconNames).toEqual(expect.arrayContaining(['grid', 'columns']));
  });

  it('forces cards when entering compact mode and still toggles between cards and list', () => {
    const props = {
      columns: [{key: 'name', label: 'Nome'}],
      data: [{id: 1, name: 'Pedido 1'}],
      showColumnFiltersButton: false,
    };
    let tree;

    mockWindowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, props),
      );
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);

    mockWindowDimensions = {width: 480, height: 800};

    renderer.act(() => {
      tree.update(React.createElement(DefaultTable, props));
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(0);
    expect(tree.root.findByProps({name: 'grid'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'grid'}).parent.props.onPress();
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);
    expect(tree.root.findByProps({name: 'list'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'list'}).parent.props.onPress();
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(0);
    expect(tree.root.findByProps({name: 'grid'})).toBeTruthy();
  });

  it('applies a custom rowStyle to rendered table rows', () => {
    let tree;
    const rowStyle = jest.fn(() => ({
      borderLeftColor: '#DC2626',
      borderLeftWidth: 4,
    }));

    mockWindowDimensions = {width: 1024, height: 800};

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultTable, {
          columns: [{key: 'name', label: 'Nome'}],
          data: [{id: 1, name: 'Pedido 1'}],
          onRowPress: () => {},
          rowStyle,
          showColumnFiltersButton: false,
        }),
      );
    });

    const row = tree.root
      .findAllByType('TouchableOpacity')
      .find(node => node.props?.activeOpacity === 0.84);

    expect(rowStyle).toHaveBeenCalledWith(
      expect.objectContaining({id: 1, name: 'Pedido 1'}),
      0,
    );
    expect(Array.isArray(row.props.style)).toBe(true);
    expect(
      row.props.style.some(
        style => style && style.borderLeftWidth === 4 && style.borderLeftColor === '#DC2626',
      ),
    ).toBe(true);
  });
});
