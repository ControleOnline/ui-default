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
  Platform: {OS: 'android'},
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

  it('renders backend download files with path app-domain and headers', () => {
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
      uri: 'https://api.controleonline.com/maincompany.controleonline.com/files/3/download',
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

it('uses the domain company from the store when another company is selected', () => {
  require('@store').useStore.mockReturnValue({getters: {
    mainCompany: {id: 1, domain: 'domain.example'},
    currentCompany: {id: 2, domain: 'selected.example'},
  }});
  let tree;
  renderer.act(() => {
    tree = renderer.create(React.createElement(DefaultFile, {file: {id: 7, url: '/files/7/download'}}));
  });
  const source = tree.root.findByType('image').props.source;
  expect(source.uri).toBe('https://api.controleonline.com/domain.example/files/7/download');
  expect(source.headers['app-domain']).toBe('domain.example');
  renderer.act(() => tree.unmount());
});
