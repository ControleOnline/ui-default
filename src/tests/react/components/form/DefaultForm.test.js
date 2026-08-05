const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

let mockStores = {};
let capturedInputs = [];

jest.mock('@store', () => ({
  useStore: jest.fn(name => mockStores[name] || {actions: {}, getters: {}}),
}));

jest.mock('react-native', () => {
  const React = require('react');
  const createComponent = name => props =>
    React.createElement(name, props, props.children);

  return {
    ScrollView: createComponent('ScrollView'),
    StyleSheet: {create: value => value},
    Text: createComponent('Text'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    View: createComponent('View'),
  };
});

jest.mock('../../../../react/components/inputs/DefaultInput', () => props => {
  const React = require('react');
  capturedInputs.push(props);
  return React.createElement('DefaultInput', props);
});

const DefaultForm = require('../../../../react/components/form/DefaultForm').default;

describe('DefaultForm', () => {
  beforeEach(() => {
    capturedInputs = [];
    mockStores = {
      theme: {
        getters: {
          colors: {},
        },
      },
    };
  });

  it('keeps create-mode draft text while typing when no row is provided', async () => {
    const columns = [
      {
        name: 'name',
        label: 'reason',
        editable: true,
      },
    ];

    await renderer.act(async () => {
      renderer.create(
        React.createElement(DefaultForm, {
          actions: {
            save: jest.fn(),
          },
          columns,
          mode: 'create',
          storeName: 'order_cancellation_reasons',
        }),
      );
    });

    const inputBeforeTyping = capturedInputs[capturedInputs.length - 1];

    await renderer.act(async () => {
      inputBeforeTyping.onChangeValue('Cliente desistiu');
    });

    const inputAfterTyping = capturedInputs[capturedInputs.length - 1];
    expect(inputAfterTyping.value).toBe('Cliente desistiu');
  });

  it('saves hidden create payload columns with row and default values', async () => {
    const save = jest.fn(() => Promise.resolve({id: 10}));
    const columns = [
      {
        name: 'price',
        label: 'value',
      },
      {
        name: 'receiver',
        createPayload: true,
        visibleForm: false,
        saveFormat: value => `/people/${value}`,
      },
      {
        name: 'invoiceType',
        createPayload: true,
        defaultValue: 'invoice',
        visibleForm: false,
      },
    ];
    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultForm, {
          actions: {save},
          columns,
          mode: 'create',
          row: {receiver: 21},
          storeName: 'invoice',
        }),
      );
    });

    await renderer.act(async () => {
      capturedInputs[capturedInputs.length - 1].onChangeValue('123.45');
    });

    const saveButton = tree.root.findAllByType('TouchableOpacity')[1];

    await renderer.act(async () => {
      await saveButton.props.onPress();
    });

    expect(save).toHaveBeenCalledWith({
      price: 123.45,
      receiver: '/people/21',
      invoiceType: 'invoice',
    });
  });

  it('preserves primitive ids for hidden create payload list columns', async () => {
    const save = jest.fn(() => Promise.resolve({id: 11}));
    const columns = [
      {
        name: 'price',
      },
      {
        name: 'receiver',
        createPayload: true,
        list: 'people/getItems',
        visibleForm: false,
        formatList: value => {
          if (!value || typeof value !== 'object') {
            return {value, label: String(value || '')};
          }

          return {value: value.id, label: value.name};
        },
        saveFormat: value => `/people/${value?.value || value}`,
      },
    ];
    let tree;

    await renderer.act(async () => {
      tree = renderer.create(
        React.createElement(DefaultForm, {
          actions: {save},
          columns,
          mode: 'create',
          row: {receiver: 21},
          storeName: 'invoice',
        }),
      );
    });

    await renderer.act(async () => {
      capturedInputs[capturedInputs.length - 1].onChangeValue('1.23');
    });

    await renderer.act(async () => {
      await tree.root.findAllByType('TouchableOpacity')[1].props.onPress();
    });

    expect(save).toHaveBeenCalledWith({
      price: 1.23,
      receiver: '/people/21',
    });
  });

  it('uses explicit form labels before translated column fallbacks', async () => {
    const columns = [
      {
        name: 'paymentType',
        label: 'paymentType.paymentType',
        formLabel: 'Tipo de pagamento',
      },
    ];

    await renderer.act(async () => {
      renderer.create(
        React.createElement(DefaultForm, {
          actions: {save: jest.fn()},
          columns,
          mode: 'create',
          storeName: 'invoice',
        }),
      );
    });

    expect(capturedInputs[capturedInputs.length - 1].label).toBe('Tipo de pagamento');
  });
});
