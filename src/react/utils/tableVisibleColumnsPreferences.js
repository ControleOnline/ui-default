export const TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY = 'visibleColumns';
export const TABLE_VIEW_MODE_PREFERENCES_KEY = 'viewMode';
export const TABLE_SORT_PREFERENCES_KEY = 'sort';
export const TABLE_FILTER_PREFERENCES_KEY = 'filters';
export const DEFAULT_TABLE_PREFERENCES_STORAGE_KEY = 'default-table';

const isPlainObject = value =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getColumnKey = column => column?.key || column?.name || '';

const normalizePreferenceSegment = value =>
  String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[/?#]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const resolveDefaultTablePreferenceScope = ({
  route = null,
  storeName = '',
  preferenceKey = '',
} = {}) => {
  const routeName =
    normalizePreferenceSegment(globalThis?.location?.pathname) ||
    normalizePreferenceSegment(route?.name) ||
    normalizePreferenceSegment(route?.key) ||
    'unknown-route';
  const customSegment = normalizePreferenceSegment(preferenceKey);

  /*
   * @agents DefaultTable preferences are saved as [store][route].
   * The same store can back different screens, so filters, sort, view mode,
   * and column visibility must never be keyed only by store or only by route.
   */
  return {
    routeKey: [routeName, customSegment].filter(Boolean).join(':'),
    storeKey: normalizePreferenceSegment(storeName) || 'unknown-store',
  };
};

const normalizePreferenceScope = scope => {
  if (!isPlainObject(scope)) {
    return null;
  }

  const storeKey = normalizePreferenceSegment(scope.storeKey);
  const routeKey = normalizePreferenceSegment(scope.routeKey);

  return storeKey && routeKey ? {storeKey, routeKey} : null;
};

const readStoredPreferences = () => {
  try {
    const rawValue = globalThis?.localStorage?.getItem?.(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
    );

    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return isPlainObject(parsedValue) ? parsedValue : {};
  } catch {
    return {};
  }
};

const writeStoredPreferences = preferences => {
  try {
    globalThis?.localStorage?.setItem?.(
      DEFAULT_TABLE_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // localStorage can be unavailable in some runtimes.
  }
};

const readScopedPreference = scope => {
  const resolvedScope = normalizePreferenceScope(scope);
  if (!resolvedScope) {
    return {};
  }

  const storedPreferences = readStoredPreferences();
  const storePreferences = storedPreferences[resolvedScope.storeKey];
  const routePreferences = isPlainObject(storePreferences)
    ? storePreferences[resolvedScope.routeKey]
    : null;

  return isPlainObject(routePreferences) ? routePreferences : {};
};

const writeScopedPreference = (scope, nextValues = {}) => {
  const resolvedScope = normalizePreferenceScope(scope);
  if (!resolvedScope || !isPlainObject(nextValues)) {
    return;
  }

  const storedPreferences = readStoredPreferences();
  const storePreferences = isPlainObject(storedPreferences[resolvedScope.storeKey])
    ? storedPreferences[resolvedScope.storeKey]
    : {};
  const routePreferences = isPlainObject(storePreferences[resolvedScope.routeKey])
    ? storePreferences[resolvedScope.routeKey]
    : {};

  writeStoredPreferences({
    ...storedPreferences,
    [resolvedScope.storeKey]: {
      ...storePreferences,
      [resolvedScope.routeKey]: {
        ...routePreferences,
        ...nextValues,
      },
    },
  });
};

export const buildDefaultVisibleColumns = columns =>
  (Array.isArray(columns) ? columns : []).reduce((accumulator, column) => {
    const key = getColumnKey(column);
    if (key) {
      accumulator[key] = column?.visible !== false;
    }
    return accumulator;
  }, {});

export const sanitizeVisibleColumnsPreference = ({
  columns = [],
  visibleColumns = null,
}) => {
  const defaultVisibleColumns = buildDefaultVisibleColumns(columns);

  if (!isPlainObject(visibleColumns)) {
    return defaultVisibleColumns;
  }

  return Object.keys(defaultVisibleColumns).reduce((accumulator, key) => {
    accumulator[key] =
      typeof visibleColumns[key] === 'boolean'
        ? visibleColumns[key]
        : defaultVisibleColumns[key];
    return accumulator;
  }, {});
};

export const sanitizeTableFiltersPreference = ({
  columns = [],
  filters = null,
  searchKey = 'search',
}) => {
  if (!isPlainObject(filters)) {
    return {};
  }

  const allowedFields = new Set(
    (Array.isArray(columns) ? columns : [])
      .filter(column => column?.filter !== false && column?.filters !== false)
      .map(getColumnKey)
      .filter(Boolean),
  );

  if (searchKey) {
    allowedFields.add(searchKey);
  }

  return Object.keys(filters).reduce((accumulator, key) => {
    if (allowedFields.has(key)) {
      accumulator[key] = filters[key];
    }

    return accumulator;
  }, {});
};

export const resolveStoredVisibleColumnsPreference = scope => {
  const visibleColumns =
    readScopedPreference(scope)[TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY];

  return isPlainObject(visibleColumns) ? visibleColumns : null;
};

export const persistVisibleColumnsPreference = (
  scope = null,
  visibleColumns = {},
) => {
  if (!isPlainObject(visibleColumns)) {
    return;
  }

  writeScopedPreference(scope, {
    [TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]: visibleColumns,
  });
};

export const resolveStoredTableViewModePreference = (
  scope = null,
  fallbackViewMode = 'table',
) => {
  const resolvedViewMode =
    readScopedPreference(scope)[TABLE_VIEW_MODE_PREFERENCES_KEY];

  return resolvedViewMode === 'cards' || resolvedViewMode === 'table'
    ? resolvedViewMode
    : fallbackViewMode;
};

export const persistTableViewModePreference = (
  scope = null,
  viewMode = 'table',
) => {
  if (viewMode !== 'cards' && viewMode !== 'table') {
    return;
  }

  writeScopedPreference(scope, {
    [TABLE_VIEW_MODE_PREFERENCES_KEY]: viewMode,
  });
};

export const resolveStoredTableSortPreference = (scope = null) => {
  const resolvedSort = readScopedPreference(scope)[TABLE_SORT_PREFERENCES_KEY];

  if (!isPlainObject(resolvedSort)) {
    return null;
  }

  const direction =
    resolvedSort.direction === 'asc' || resolvedSort.direction === 'desc'
      ? resolvedSort.direction
      : null;
  const field =
    typeof resolvedSort.field === 'string' && resolvedSort.field.trim()
      ? resolvedSort.field.trim()
      : '';

  if (!direction || !field) {
    return null;
  }

  return {
    direction,
    field,
  };
};

export const persistTableSortPreference = (
  scope = null,
  sort = null,
) => {
  if (
    !isPlainObject(sort) ||
    (sort.direction !== 'asc' && sort.direction !== 'desc') ||
    typeof sort.field !== 'string' ||
    !sort.field.trim()
  ) {
    return;
  }

  writeScopedPreference(scope, {
    [TABLE_SORT_PREFERENCES_KEY]: {
      direction: sort.direction,
      field: sort.field.trim(),
    },
  });
};

export const resolveStoredTableFiltersPreference = (scope = null) => {
  const resolvedFilters = readScopedPreference(scope)[TABLE_FILTER_PREFERENCES_KEY];
  return isPlainObject(resolvedFilters) ? resolvedFilters : null;
};

export const persistTableFiltersPreference = (
  scope = null,
  filters = {},
) => {
  if (!isPlainObject(filters)) {
    return;
  }

  writeScopedPreference(scope, {
    [TABLE_FILTER_PREFERENCES_KEY]: filters,
  });
};
