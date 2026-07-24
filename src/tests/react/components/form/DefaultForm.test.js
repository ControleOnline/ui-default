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
      inputBeforeTyping.props.onChangeValue('Cliente desistiu');
    });

    const inputAfterTyping = capturedInputs[capturedInputs.length - 1];
    expect(inputAfterTyping.value).toBe('Cliente desistiu');
  });
});
