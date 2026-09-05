export const TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY = 'visibleColumns';
export const TABLE_VIEW_MODE_PREFERENCES_KEY = 'viewMode';
export const TABLE_SORT_PREFERENCES_KEY = 'sort';
export const TABLE_FILTER_PREFERENCES_KEY = 'filters';
export const DEFAULT_TABLE_PREFERENCES_STORAGE_KEY = 'default-table';
export const REQUIRED_VISIBLE_COLUMN_KEYS = ['id'];

const isPlainObject = value =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getColumnKey = column => column?.key || column?.name || '';

const normalizeColumnKey = value => String(value || '').trim().toLowerCase();

export const isRequiredVisibleColumn = column => {
  const key = normalizeColumnKey(getColumnKey(column));
  if (!key) {
    return false;
  }

  if (column?.required === true || column?.hideable === false) {
    return true;
  }

  return REQUIRED_VISIBLE_COLUMN_KEYS.includes(key);
};

export const isRequiredVisibleColumnKey = (key, columns = []) => {
  const normalizedKey = normalizeColumnKey(key);
  if (!normalizedKey) {
    return false;
  }

  const column = (Array.isArray(columns) ? columns : []).find(
    item => normalizeColumnKey(getColumnKey(item)) === normalizedKey,
  );

  if (column) {
    return isRequiredVisibleColumn(column);
  }

  return REQUIRED_VISIBLE_COLUMN_KEYS.includes(normalizedKey);
};

const normalizePreferenceSegment = value =>
  String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[/?#]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const resolveDefaultTablePreferenceScope = ({
  companyId = '',
  preferenceKey = '',
  route = null,
  storeName = '',
} = {}) => {
  const routeName =
    normalizePreferenceSegment(preferenceKey) ||
    normalizePreferenceSegment(globalThis?.location?.pathname) ||
    normalizePreferenceSegment(route?.name) ||
    normalizePreferenceSegment(route?.key) ||
    'unknown-route';

  /*
   * @agents DefaultTable preferences are saved as [company][store][route].
   * The same store can back different screens, and the same user can switch
   * companies, so filters, sort, view mode, and column visibility must be
   * keyed by company, store and route together.
   */
  return {
    companyKey: normalizePreferenceSegment(companyId),
    routeKey: routeName,
    storeKey: normalizePreferenceSegment(storeName) || 'unknown-store',
  };
};

const normalizePreferenceScope = scope => {
  if (!isPlainObject(scope)) {
    return null;
  }

  const companyKey = normalizePreferenceSegment(scope.companyKey);
  const storeKey = normalizePreferenceSegment(scope.storeKey);
  const routeKey = normalizePreferenceSegment(scope.routeKey);

  return companyKey && storeKey && routeKey
    ? {companyKey, storeKey, routeKey}
    : null;
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
  const companyPreferences = storedPreferences[resolvedScope.companyKey];
  const storePreferences = isPlainObject(companyPreferences)
    ? companyPreferences[resolvedScope.storeKey]
    : null;
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
  const companyPreferences = isPlainObject(
    storedPreferences[resolvedScope.companyKey],
  )
    ? storedPreferences[resolvedScope.companyKey]
    : {};
  const storePreferences = isPlainObject(companyPreferences[resolvedScope.storeKey])
    ? companyPreferences[resolvedScope.storeKey]
    : {};
  const routePreferences = isPlainObject(storePreferences[resolvedScope.routeKey])
    ? storePreferences[resolvedScope.routeKey]
    : {};

  writeStoredPreferences({
    ...storedPreferences,
    [resolvedScope.companyKey]: {
      ...companyPreferences,
      [resolvedScope.storeKey]: {
        ...storePreferences,
        [resolvedScope.routeKey]: {
          ...routePreferences,
          ...nextValues,
        },
      },
    },
  });
};

export const buildDefaultVisibleColumns = columns =>
  (Array.isArray(columns) ? columns : []).reduce((accumulator, column) => {
    const key = getColumnKey(column);
    if (key) {
      accumulator[key] = isRequiredVisibleColumn(column)
        ? true
        : column?.visible !== false;
    }
    return accumulator;
  }, {});

const enforceRequiredVisibleColumns = (columns = [], visibleColumns = {}) => {
  const nextVisibleColumns = {...visibleColumns};
  const columnList = Array.isArray(columns) ? columns : [];

  columnList.forEach(column => {
    const key = getColumnKey(column);
    if (key && isRequiredVisibleColumn(column)) {
      nextVisibleColumns[key] = true;
    }
  });

  const hasVisibleColumn = Object.keys(nextVisibleColumns).some(
    key => nextVisibleColumns[key] !== false,
  );

  if (!hasVisibleColumn) {
    const fallbackColumn =
      columnList.find(column => isRequiredVisibleColumn(column)) ||
      columnList.find(column => getColumnKey(column));
    const fallbackKey = getColumnKey(fallbackColumn);
    if (fallbackKey) {
      nextVisibleColumns[fallbackKey] = true;
    }
  }

  return nextVisibleColumns;
};

export const sanitizeVisibleColumnsPreference = ({
  columns = [],
  visibleColumns = null,
}) => {
  const defaultVisibleColumns = buildDefaultVisibleColumns(columns);

  if (!isPlainObject(visibleColumns)) {
    return enforceRequiredVisibleColumns(columns, defaultVisibleColumns);
  }

  const sanitized = Object.keys(defaultVisibleColumns).reduce((accumulator, key) => {
    accumulator[key] =
      typeof visibleColumns[key] === 'boolean'
        ? visibleColumns[key]
        : defaultVisibleColumns[key];
    return accumulator;
  }, {});

  return enforceRequiredVisibleColumns(columns, sanitized);
};

export const canHideVisibleColumn = ({
  columns = [],
  fieldName = '',
  visibleColumns = {},
} = {}) => {
  if (isRequiredVisibleColumnKey(fieldName, columns)) {
    return false;
  }

  const visibleCount = Object.keys(visibleColumns || {}).filter(
    key => visibleColumns[key] !== false,
  ).length;

  return visibleCount > 1;
};

export const sanitizeTableFiltersPreference = ({
  columns = [],
  filters = null,
}) => {
  if (!isPlainObject(filters)) {
    return {};
  }

  const columnFields = new Set(
    (Array.isArray(columns) ? columns : [])
      .map(getColumnKey)
      .filter(Boolean),
  );
  const blockedFields = new Set(
    (Array.isArray(columns) ? columns : [])
      .filter(column => column?.filter === false || column?.filters === false)
      .map(getColumnKey)
      .filter(Boolean),
  );
  const allowedSpecialFields = new Set(['search']);

  return Object.keys(filters).reduce((accumulator, key) => {
    if (
      allowedSpecialFields.has(key) ||
      (columnFields.has(key) && !blockedFields.has(key))
    ) {
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
