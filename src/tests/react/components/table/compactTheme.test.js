const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
const mockColors = {primary: '#123456', background: '#abcdef', text: '#654321', modalBackground: '#fedcba'};
jest.mock('@store', () => ({useStore: () => ({getters: {colors: mockColors}})}));
const {default: useTheme, DefaultTableThemeContext} = require('../../../../react/components/table/useDefaultTableTheme');
const {resolveDomainThemeColors} = require('@controleonline/ui-common/src/react/components/resolveDomainThemeColors');
let result;
function Probe({appearance}) {result = useTheme(null, appearance); return null;}
it('uses configured theme colors in compact mode and responds to changes without a fixed palette', () => {
  let tree;
  renderer.act(() => {tree = renderer.create(React.createElement(Probe, {appearance: 'compact'}));});
  expect(result.themeColors).toEqual({...mockColors, compact: true});
  mockColors.background = '#998877';
  renderer.act(() => tree.update(React.createElement(Probe, {appearance: 'default'})));
  expect(result.themeColors.background).toBe('#998877');
  renderer.act(() => tree.unmount());
});
it('shares configured theme colors with nested controls', () => {
  const colors = {primary: '#abcdef', modalBackground: '#123abc'};
  let tree;
  renderer.act(() => {tree = renderer.create(React.createElement(DefaultTableThemeContext.Provider, {value: colors}, React.createElement(Probe)));});
  expect(result.themeColors).toBe(colors);
  expect(result.modalColors.backgroundColor).toBe('#123abc');
  renderer.act(() => tree.unmount());
});
it('preserves domain branding regardless of the selected franchise', () => {
  const main = {theme: {colors: {primary: '#000001', text: '#000002'}}};
  const domain = {primary: '#000003'};
  const result = resolveDomainThemeColors(domain, main);
  expect(result).toEqual({primary: '#000003', text: '#000002'});
  expect(resolveDomainThemeColors({}, main).primary).toBe('#000001');
  expect(domain).toEqual({primary: '#000003'});
});
