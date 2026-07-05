const React = require('react');
const ReactDOMServer = require('react-dom/server');
const {jest} = require('@jest/globals');

const {beforeEach, describe, expect, it} = global;

jest.mock('@store', () => ({
  useStore: jest.fn(name => {
    if (name === 'theme') {
      return {
        getters: {
          colors: {
            primary: '#0EA5E9',
          },
        },
      };
    }

    return {getters: {}};
  }),
}));

jest.mock('react-native', () => ({
  StyleSheet: {
    create: styles => styles,
  },
  Text: props => React.createElement('text', null, props.children),
  TouchableOpacity: props => React.createElement('touchable-opacity', props, props.children),
  View: props => React.createElement('view', null, props.children),
}));

const DefaultErrors =
  require('../../../../react/components/errors/DefaultErrors').default;

describe('DefaultErrors', () => {
  beforeEach(() => {
    global.t = {
      t: jest.fn(),
    };
  });

  it('renders the title, resolved error and retry action', () => {
    const markup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(DefaultErrors, {
        error: {
          message: 'Falha ao salvar.',
        },
        title: 'Nao foi possivel concluir',
        onRetry: jest.fn(),
        retryLabel: 'Tentar novamente',
      }),
    );

    expect(markup).toContain('Nao foi possivel concluir');
    expect(markup).toContain('Falha ao salvar.');
    expect(markup).toContain('Tentar novamente');
  });
});
