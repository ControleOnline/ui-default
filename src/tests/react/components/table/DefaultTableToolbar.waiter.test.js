jest.mock('../../../../react/components/table/DefaultTableCompactToolbar', () => () => null);
const React = require('react');
const renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
let mockConfigs;
jest.mock('@store', () => ({useStore: () => ({getters: {configs: mockConfigs}})}));
jest.mock('react-native', () => ({
 View: props => require('react').createElement('view', props, props.children),
 Text: props => require('react').createElement('text', props, props.children),
 StyleSheet: {create: value => value},
 Platform: {select: value => value.web || value.default || null},
 useWindowDimensions: () => ({width: 400}),
}));
jest.mock('../../../../react/components/table/DefaultTableControls', () => () => require('react').createElement('controls'));
jest.mock('../../../../react/components/table/DefaultToolbarAction', () => props => require('react').createElement('action', props));
jest.mock('../../../../react/components/table/DefaultTableImportModal', () => () => null);
jest.mock('../../../../react/components/table/DefaultTableSearch', () => ({
 DefaultTableCollapsedSearch: () => null, DefaultTableCompactSearch: () => null, DefaultTableInlineSearch: () => require('react').createElement('search'),
}));
jest.mock('../../../../react/components/table/useDefaultTableTheme', () => () => ({tableBorderColors: {}, toolbarColors: {}}));
const Toolbar = require('../../../../react/components/table/DefaultTableToolbar').default;
let tree;
beforeEach(() => {mockConfigs = {toolbarActions: [{key: 'custom', onPress: jest.fn()}], importAction: jest.fn(), exportAction: jest.fn()};});
afterEach(() => {if(tree) renderer.act(() => tree.unmount());});
it('keeps generic actions and controls enabled by default', () => {
 renderer.act(() => {tree = renderer.create(React.createElement(Toolbar, {storeName: 'categories'}));});
 expect(tree.root.findAllByType('action')).toHaveLength(3);
 expect(tree.root.findAllByType('controls')).toHaveLength(1);
});
it('hides actions and administrative controls while keeping waiter search', () => {
 renderer.act(() => {tree = renderer.create(React.createElement(Toolbar, {storeName: 'categories', showToolbarActions: false, showToolbarControls: false}));});
 expect(tree.root.findAllByType('action')).toHaveLength(0);
 expect(tree.root.findAllByType('controls')).toHaveLength(0);
 expect(tree.root.findAllByType('search')).toHaveLength(1);
});
it('honors stored flags and allows an explicit screen override', () => {
 mockConfigs.showToolbarActions = false; mockConfigs.showToolbarControls = false;
 renderer.act(() => {tree = renderer.create(React.createElement(Toolbar, {storeName: 'categories'}));});
 expect(tree.root.findAllByType('controls')).toHaveLength(0);
 renderer.act(() => tree.update(React.createElement(Toolbar, {storeName: 'categories', showToolbarActions: true, showToolbarControls: true})));
 expect(tree.root.findAllByType('controls')).toHaveLength(1);
 expect(tree.root.findAllByType('action')).toHaveLength(3);
});
