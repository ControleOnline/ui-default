const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

let mockStores = {};

jest.mock('@store', () => ({
  getAllStores: jest.fn(() => mockStores),
  useStore: jest.fn(name => mockStores[name] || {actions: {}, getters: {}}),
}));

jest.mock('react-native', () => {
  const React = require('react');
  const createComponent = name => props =>
    React.createElement(name, props, props.children);

  return {
    Modal: createComponent('Modal'),
    ScrollView: createComponent('ScrollView'),
    StyleSheet: {create: value => value},
    Text: createComponent('Text'),
    TextInput: createComponent('TextInput'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    View: createComponent('View'),
  };
});

jest.mock('react-native-vector-icons/Feather', () => {
  const React = require('react');
  return props => React.createElement('Icon', props, props.children);
});

const DefaultSelect = require('../../../../react/components/inputs/DefaultSelect').default;

const createDeferred = () => {
  let resolve;
  const promise = new Promise(nextResolve => {
    resolve = nextResolve;
  });

  return {promise, resolve};
};

describe('DefaultSelect', () => {
  beforeEach(() => {
    mockStores = {
      people: {
        getters: {
          currentCompany: {
            id: 21,
          },
        },
      },
      invoice: {
        getters: {
          configs: {},
        },
      },
    };
  });

  it('waits for onBeforeOpen before showing the options modal', async () => {
    const gate = createDeferred();
    const onBeforeOpen = jest.fn(() => gate.promise);
    const onStartEditing = jest.fn();
    let tree;
    let openPromise;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultSelect, {
          column: {
            key: 'jobTitle',
            label: 'Cargo',
            list: 'categories/getItems',
          },
          editing: false,
          getOptionsForColumn: () => [
            {
              key: '1',
              label: 'Analista de RH',
            },
          ],
          onBeforeOpen,
          onStartEditing,
          row: {},
          storeName: 'employee_profiles',
          value: '1',
        }),
      );
    });

    const readButton = tree.root.findAllByType('TouchableOpacity')[0];
    const modal = tree.root.findByType('Modal');

    expect(modal.props.visible).toBe(false);

    renderer.act(() => {
      openPromise = readButton.props.onPress();
    });

    expect(onStartEditing).toHaveBeenCalledTimes(1);
    expect(onBeforeOpen).toHaveBeenCalledTimes(1);
    expect(modal.props.visible).toBe(false);

    await renderer.act(async () => {
      gate.resolve();
      await openPromise;
    });

    expect(modal.props.visible).toBe(true);
  });

  it('loads remote list options itself when the modal opens and when search changes', async () => {
    const getItems = jest.fn(() => Promise.resolve([
      {id: 33, status: 'Pago', context: 'invoice'},
    ]));
    mockStores.status = {
      actions: {
        getItems,
      },
      getters: {
        items: [],
      },
    };
    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultSelect, {
          column: {
            key: 'status',
            label: 'Situação',
            list: 'status/getItems',
            listRequestParams: {
              context: 'invoice',
            },
            searchParam: 'status',
          },
          onStartEditing: jest.fn(),
          row: {
            status: {id: 1, status: 'Aberto'},
          },
          storeName: 'invoice',
          value: '1',
        }),
      );
    });

    const readButton = tree.root.findAllByType('TouchableOpacity')[0];

    await renderer.act(async () => {
      await readButton.props.onPress();
      await Promise.resolve();
    });

    expect(getItems).toHaveBeenCalledWith({
      context: 'invoice',
      __storeMeta: expect.objectContaining({
        skipSystemError: true,
      }),
    });
    expect(
      tree.root.findAllByType('Text').some(node => node.props.children === 'Pago'),
    ).toBe(true);

    const searchInput = tree.root.findByType('TextInput');
    await renderer.act(async () => {
      searchInput.props.onChangeText('pag');
      await Promise.resolve();
    });

    expect(getItems).toHaveBeenLastCalledWith({
      context: 'invoice',
      status: 'pag',
      __storeMeta: expect.objectContaining({
        skipSystemError: true,
      }),
    });
  });

  it('keeps the status label visible when the row status has color but no icon', async () => {
    global.t = {
      t: jest.fn(() => 'Waiting payment'),
    };
    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultSelect, {
          column: {
            name: 'status',
            label: 'Status',
            list: 'status/getItems',
            translate: false,
            format(value) {
              return {
                value: value.id,
                label: global.t.t('orders', 'status', value.status),
                color: value.color,
              };
            },
            formatList(value) {
              return {
                value: value.id,
                label: global.t.t('orders', 'status', value.status),
                color: value.color,
              };
            },
          },
          row: {
            status: {
              id: 6,
              status: 'waiting payment',
              color: '#000000',
            },
          },
          storeName: 'orders',
        }),
      );
    });

    const visibleStatus = tree.root
      .findAllByType('Text')
      .find(node => node.props.children === 'Waiting payment');

    expect(visibleStatus).toBeTruthy();
    expect(visibleStatus.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flex: 1,
          fontWeight: '800',
        }),
        {color: '#000000'},
      ]),
    );
  });
});
