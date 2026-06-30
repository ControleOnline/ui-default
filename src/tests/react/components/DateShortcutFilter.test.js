const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('react-native', () => {
  const React = require('react');
  const createComponent = name => props =>
    React.createElement(name, props, props.children);

  return {
    StyleSheet: {create: value => value},
    Text: createComponent('Text'),
    TextInput: createComponent('TextInput'),
    TouchableOpacity: createComponent('TouchableOpacity'),
    View: createComponent('View'),
  };
});

jest.mock(
  '../../../react/components/filters/CompactFilterSelector',
  () => props => {
    const React = require('react');
    const content =
      typeof props.children === 'function'
        ? props.children({close: props.onClose || (() => {})})
        : props.children;

    return React.createElement('CompactFilterSelector', props, content);
  },
);

jest.mock(
  '@controleonline/ui-common/src/react/utils/storeColumns',
  () => ({
    formatStoreColumnLabel: () => 'Periodo',
    resolveStoreColumn: () => ({}),
    resolveStoreConfigByName: () => ({columns: []}),
  }),
);

const DateShortcutFilter =
  require('../../../react/components/filters/DateShortcutFilter').default;

describe('DateShortcutFilter', () => {
  beforeEach(() => {
    global.t = {
      t: (_store, group, key) => {
        if (group === 'orders' && key === 'apply_period') return 'Aplicar';
        if (group === 'orders' && key === 'clear') return 'Limpar';
        if (group === 'orders' && key === 'date_from') return 'Data inicial';
        if (group === 'orders' && key === 'date_to') return 'Data final';
        return key;
      },
    };
  });

  it('keeps the freshly typed custom range when applying it', () => {
    const onChange = jest.fn();
    const onCustomRangeChange = jest.fn();
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DateShortcutFilter, {
          customRange: {from: '', to: ''},
          onChange,
          onCustomRangeChange,
          value: 'custom',
        }),
      );
    });

    const inputs = tree.root.findAllByType('TextInput');
    const buttons = tree.root.findAllByType('TouchableOpacity');

    renderer.act(() => {
      inputs[0].props.onChangeText('2026-06-01');
      inputs[1].props.onChangeText('2026-06-28');
    });

    renderer.act(() => {
      buttons[1].props.onPress();
    });

    expect(onCustomRangeChange).toHaveBeenCalledTimes(1);
    expect(onCustomRangeChange).toHaveBeenCalledWith({
      from: '2026-06-01',
      to: '2026-06-28',
    });
    expect(onChange).not.toHaveBeenCalledWith('custom');
  });
});
