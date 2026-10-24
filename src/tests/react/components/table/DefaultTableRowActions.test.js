const React = require('react');
const {describe, expect, it} = require('@jest/globals');

const {
  hasDefaultTableRowActionsComponent,
  resolveDefaultTableRowActionsWidth,
} = require('../../../../react/components/table/DefaultTableRowActions');

describe('DefaultTableRowActions helpers', () => {
  it('accepts function and element types as custom row actions', () => {
    expect(hasDefaultTableRowActionsComponent(() => null)).toBe(true);
    expect(hasDefaultTableRowActionsComponent(React.createElement('span'))).toBe(true);
    expect(hasDefaultTableRowActionsComponent(null)).toBe(false);
    expect(hasDefaultTableRowActionsComponent('pdf')).toBe(false);
  });

  it('uses configured width and falls back to 140', () => {
    expect(resolveDefaultTableRowActionsWidth({rowActionsWidth: 168})).toBe(168);
    expect(resolveDefaultTableRowActionsWidth({actionsColumnWidth: 96})).toBe(96);
    expect(resolveDefaultTableRowActionsWidth({rowActionsWidth: 0})).toBe(140);
    expect(resolveDefaultTableRowActionsWidth({})).toBe(140);
  });
});
