import {
  countActiveFilters,
  isFilledFilterValue,
  omitEmptyFilters,
} from '../../../react/components/filters/filterValue';

describe('filterValue', () => {
  it('treats empty strings, null and empty collections as inactive', () => {
    expect(isFilledFilterValue('')).toBe(false);
    expect(isFilledFilterValue('   ')).toBe(false);
    expect(isFilledFilterValue(null)).toBe(false);
    expect(isFilledFilterValue(undefined)).toBe(false);
    expect(isFilledFilterValue([])).toBe(false);
    expect(isFilledFilterValue({})).toBe(false);
  });

  it('does not count date shortcut all or empty custom range', () => {
    expect(isFilledFilterValue({shortcut: 'all'})).toBe(false);
    expect(
      isFilledFilterValue({
        shortcut: 'custom',
        customRange: {from: '', to: ''},
      }),
    ).toBe(false);
    expect(isFilledFilterValue({shortcut: '7d'})).toBe(true);
    expect(
      isFilledFilterValue({
        shortcut: 'custom',
        customRange: {from: '2026-01-01', to: ''},
      }),
    ).toBe(true);
  });

  it('clears leftover empty filters when counting and omitting', () => {
    const filters = {
      status: '',
      search: '   ',
      period: {shortcut: 'all', customRange: {from: '', to: ''}},
      page: 1,
      category: 'sales',
    };

    expect(countActiveFilters(filters)).toBe(1);
    expect(omitEmptyFilters(filters)).toEqual({category: 'sales'});
  });
});
