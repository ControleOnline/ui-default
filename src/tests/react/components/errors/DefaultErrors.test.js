const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {afterEach, beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

let mockStores = {};
let consoleErrorSpy = null;

jest.mock('@store', () => ({
  useStore: jest.fn(name => {
    if (name === 'theme') {
      return {
        getters: {
          colors: {
            inputErrorBackground: '#FEF2F2',
            inputErrorBorder: '#DC2626',
            inputErrorText: '#B91C1C',
            modalBackground: '#FFFFFF',
            modalBorder: '#DC2626',
            modalCloseIcon: '#B91C1C',
            modalOverlay: 'rgba(15, 23, 42, 0.55)',
            modalText: '#334155',
            primary: '#0EA5E9',
            textDanger: '#DC2626',
          },
        },
      };
    }

    return mockStores[name] || {actions: {}, getters: {}};
  }),
  useStores: jest.fn(selector =>
    (typeof selector === 'function' ? selector(mockStores) : mockStores),
  ),
}));

jest.mock('react-native', () => {
  const React = require('react');
  const createComponent = name => props =>
    React.createElement(name, props, props.children);

  return {
    Modal: props => React.createElement('modal', props, props.children),
    Pressable: props => React.createElement('pressable', props, props.children),
    StyleSheet: {
      create: styles => styles,
    },
    Text: createComponent('text'),
    TouchableOpacity: createComponent('touchable-opacity'),
    View: createComponent('view'),
  };
});

const DefaultErrors =
  require('../../../../react/components/errors/DefaultErrors').default;

const getTextNodes = tree =>
  tree.root
    .findAllByType('text')
    .map(node => (Array.isArray(node.children) ? node.children.join('') : ''))
    .filter(Boolean);

describe('DefaultErrors', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockStores = {
      orders: {
        actions: {
          setError: jest.fn(),
        },
        getters: {
          error: 'Falha ao salvar.',
        },
      },
    };
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
      consoleErrorSpy = null;
    }

    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders the store error in a popup and clears the store when closed', () => {
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultErrors, {
          store: 'orders',
          title: 'Nao foi possivel concluir',
        }),
      );
    });

    expect(tree.root.findByType('modal').props.visible).toBe(true);
    expect(getTextNodes(tree)).toEqual(
      expect.arrayContaining([
        'Nao foi possivel concluir',
        'Falha ao salvar.',
        '×',
      ]),
    );

    const closeButton = tree.root.findByProps({testID: 'default-errors-close'});

    renderer.act(() => {
      closeButton.props.onPress();
    });

    expect(mockStores.orders.actions.setError).toHaveBeenCalledWith('');
    expect(tree.toJSON()).toBeNull();
  });

  it('renders an explicit popup even without a store binding', () => {
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultErrors, {
          title: 'Pedido nao informado.',
        }),
      );
    });

    expect(tree.root.findByType('modal').props.visible).toBe(true);
    expect(getTextNodes(tree)).toEqual(
      expect.arrayContaining([
        'Pedido nao informado.',
        '×',
      ]),
    );
  });

  it('auto closes after five seconds and clears the store error', () => {
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultErrors, {
          store: 'orders',
          title: 'Nao foi possivel concluir',
        }),
      );
    });

    renderer.act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockStores.orders.actions.setError).toHaveBeenCalledWith('');
    expect(tree.toJSON()).toBeNull();
  });
});
