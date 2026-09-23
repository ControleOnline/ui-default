const React = require('react');
const renderer = require('react-test-renderer');
const {expect, it, jest} = require('@jest/globals');
global.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('react-native', () => ({View: 'View', Text: 'Text', TouchableOpacity: 'TouchableOpacity',
  Linking: {openURL: jest.fn()}, StyleSheet: {create: x => x}}));
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('@store', () => ({useStore: jest.fn()}));
jest.mock('../../../../react/components/files/DefaultFile', () => 'Preview');
jest.mock('../../../../react/components/files/DefaultFileColumn.utils', () => ({
  normalizeDefaultFileColumnItems: jest.fn(() => []), normalizeFileColumnText: value => value,
}));
const {useStore} = require('@store');
const {normalizeDefaultFileColumnItems} = require('../../../../react/components/files/DefaultFileColumn.utils');
const Column = require('../../../../react/components/files/DefaultFileColumn').default;
it('passes the domain company to file URL resolution when B is selected', () => {
  const mainCompany = {id: 1, domain: 'domain.example'};
  useStore.mockImplementation(name => name === 'people'
    ? {getters: {mainCompany, currentCompany: {id: 2}}} : {getters: {colors: {}}});
  let tree;
  renderer.act(() => { tree = renderer.create(React.createElement(Column, {})); });
  expect(normalizeDefaultFileColumnItems.mock.calls.at(-1)[0].company).toEqual(mainCompany);
  renderer.act(() => tree.unmount());
});
