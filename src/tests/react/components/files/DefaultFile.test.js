const React = require('react');
const renderer = require('react-test-renderer');
const {jest} = require('@jest/globals');

const {afterEach, beforeEach, describe, expect, it} = global;

global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@env', () => ({
  env: {
    API_ENTRYPOINT: 'https://api.controleonline.com',
    DOMAIN: 'manager.controleonline.com',
  },
}));

jest.mock('@store', () => ({
  useStore: jest.fn(() => ({
    getters: {},
  })),
}));

jest.mock('react-native', () => ({
  Image: props => React.createElement('image', props, props.children),
}));

const DefaultFile =
  require('../../../../react/components/files/DefaultFile').default;

describe('DefaultFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders backend download files with app-domain query and headers', () => {
    let tree;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(DefaultFile, {
          file: {
            id: 3,
            url: '/files/3/download',
          },
          company: {
            domain: 'maincompany.controleonline.com',
          },
          headers: {
            Authorization: 'Bearer token',
          },
          resizeMode: 'contain',
        }),
      );
    });

    const image = tree.root.findByType('image');

    expect(image.props.source).toEqual({
      uri: 'https://api.controleonline.com/files/3/download?app-domain=maincompany.controleonline.com',
      headers: {
        Authorization: 'Bearer token',
        'app-domain': 'maincompany.controleonline.com',
      },
    });
    expect(image.props.resizeMode).toBe('contain');
  });

  it('returns null when there is no file source', () => {
    let tree;

    renderer.act(() => {
      tree = renderer.create(React.createElement(DefaultFile, null));
    });

    expect(tree.toJSON()).toBeNull();
  });
});
