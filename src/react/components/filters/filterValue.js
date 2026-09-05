const EMPTY_SHORTCUTS = new Set(['', 'all', 'none', '*']);

const normalizeText = value => String(value ?? '').trim();

export const isFilledFilterValue = value => {
  if (value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.some(isFilledFilterValue);
  }

  if (typeof value === 'object') {
    const shortcut = normalizeText(value.shortcut).toLowerCase();
    const range = value.customRange && typeof value.customRange === 'object'
      ? value.customRange
      : null;
    const rangeFrom = normalizeText(
      range?.from ?? value.from ?? value.start ?? value.after,
    );
    const rangeTo = normalizeText(
      range?.to ?? value.to ?? value.end ?? value.before,
    );

    if ('shortcut' in value || range || 'start' in value || 'end' in value || 'after' in value || 'before' in value) {
      if (EMPTY_SHORTCUTS.has(shortcut) && !rangeFrom && !rangeTo) {
        return false;
      }
      if ((shortcut === 'custom' || !shortcut) && !rangeFrom && !rangeTo) {
        return false;
      }
    }

    return Object.values(value).some(isFilledFilterValue);
  }

  return normalizeText(value) !== '';
};

export const countActiveFilters = (filters = {}) => {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    return 0;
  }

  return Object.keys(filters).filter(key => {
    if (['page', 'itemsPerPage', 'order', 'sort', 'pagination'].includes(key)) {
      return false;
    }
    return isFilledFilterValue(filters[key]);
  }).length;
};

export const omitEmptyFilters = (filters = {}) => {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    return {};
  }

  return Object.keys(filters).reduce((accumulator, key) => {
    if (isFilledFilterValue(filters[key])) {
      accumulator[key] = filters[key];
    }
    return accumulator;
  }, {});
};
