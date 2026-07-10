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

  return {
    FlatList: createComponent('FlatList'),
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

const DefaultTable =
  require('../../../../react/components/table/DefaultTable').default;

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

    expect(iconNames).toEqual(expect.arrayContaining(['list', 'columns']));
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
    expect(tree.root.findByProps({name: 'list'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'list'}).parent.props.onPress();
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(1);
    expect(tree.root.findByProps({name: 'grid'})).toBeTruthy();

    renderer.act(() => {
      tree.root.findByProps({name: 'grid'}).parent.props.onPress();
    });

    expect(tree.root.findAllByType('ScrollView')).toHaveLength(0);
    expect(tree.root.findByProps({name: 'list'})).toBeTruthy();
  });
});
