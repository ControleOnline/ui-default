const {
  resolveNextDateFilterValue,
} = require('../../../react/components/filters/dateFilterSelection');

const { describe, expect, it } = global;

describe('dateFilterSelection', () => {
  it('clears the filter when all is selected', () => {
    expect(
      resolveNextDateFilterValue(
        {
          shortcut: 'custom',
          customRange: { from: '2026-06-01', to: '2026-06-28' },
        },
        'all',
      ),
    ).toBeNull();
  });

  it('preserves the custom range when the custom option is confirmed', () => {
    const currentValue = {
      shortcut: 'custom',
      customRange: { from: '2026-06-01', to: '2026-06-28' },
    };

    expect(
      resolveNextDateFilterValue(currentValue, 'custom'),
    ).toEqual(currentValue);
  });

  it('keeps the current custom range when switching to a shortcut', () => {
    expect(
      resolveNextDateFilterValue(
        {
          shortcut: 'custom',
          customRange: { from: '2026-06-10', to: '2026-06-12' },
        },
        '30d',
      ),
    ).toEqual({
      shortcut: '30d',
      customRange: { from: '2026-06-10', to: '2026-06-12' },
    });
  });
});

