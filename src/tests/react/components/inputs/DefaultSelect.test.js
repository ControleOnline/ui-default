const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@store', () => ({
  getAllStores: () => ({}),
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
});
