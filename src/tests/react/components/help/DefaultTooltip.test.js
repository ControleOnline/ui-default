/* global jest */

const React = require('react');
const TestRenderer = require('react-test-renderer');
const {act} = TestRenderer;
const {describe, expect, it} = global;

jest.mock('react-native', () => {
  const React = require('react');
  const component = name => props => React.createElement(name, props, props.children);

  return {
    Modal: props =>
      React.createElement('modal', props, props.visible ? props.children : null),
    Pressable: component('pressable'),
    StyleSheet: {create: styles => styles},
    Text: component('text'),
    TouchableOpacity: component('touchable-opacity'),
    View: component('view'),
  };
});

const DefaultTooltip = require('../../../../react/components/help/DefaultTooltip').default;

describe('DefaultTooltip', () => {
  it('keeps the existing text message contract', () => {
    let renderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(DefaultTooltip, {
          message: 'Ajuda já existente',
          testID: 'message-trigger',
        }),
      );
    });

    const trigger = renderer.root
      .findAllByType('touchable-opacity')
      .find(node => node.props.testID === 'message-trigger');

    act(() => trigger.props.onPress());

    const renderedText = renderer.root
      .findAllByType('text')
      .flatMap(node => node.children)
      .join(' ');
    expect(renderedText).toContain('Ajuda já existente');
  });

  it('renders structured rows and closes from the action or backdrop', () => {
    let renderer;
    act(() => {
      renderer = TestRenderer.create(
        React.createElement(DefaultTooltip, {
          backdropTestID: 'tooltip-backdrop',
          closeAccessibilityLabel: 'Fechar detalhes',
          dialogTestID: 'tooltip-dialog',
          label: 'i',
          rows: [
            {key: 'company', label: 'Empresa', value: 'GYROS'},
            {key: 'device', label: 'Device', value: null},
          ],
          testID: 'tooltip-trigger',
          title: 'Detalhes',
        }),
      );
    });

    expect(renderer.root.findAllByProps({testID: 'tooltip-dialog'})).toHaveLength(0);

    const trigger = renderer.root
      .findAllByType('touchable-opacity')
      .find(node => node.props.testID === 'tooltip-trigger');

    act(() => trigger.props.onPress());

    const renderedText = renderer.root
      .findAllByType('text')
      .flatMap(node => node.children)
      .join(' ');
    expect(renderedText).toContain('GYROS');
    expect(renderedText).toContain('Não configurado');

    act(() =>
      renderer.root.findByProps({accessibilityLabel: 'Fechar detalhes'}).props.onPress(),
    );
    expect(renderer.root.findAllByProps({testID: 'tooltip-dialog'})).toHaveLength(0);

    act(() => trigger.props.onPress());
    act(() => renderer.root.findByProps({testID: 'tooltip-backdrop'}).props.onPress());
    expect(renderer.root.findAllByProps({testID: 'tooltip-dialog'})).toHaveLength(0);
  });
});
