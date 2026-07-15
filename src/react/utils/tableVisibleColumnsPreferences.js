export const TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY = 'tableVisibleColumns';
export const TABLE_VIEW_MODE_PREFERENCES_KEY = 'tableViewModes';
export const TABLE_SORT_PREFERENCES_KEY = 'tableSorts';
export const TABLE_SORT_FIELD_PREFERENCES_KEY = 'tableSortFields';
export const TABLE_SORT_DIRECTION_PREFERENCES_KEY = 'tableSortDirections';
export const DEFAULT_TABLE_PREFERENCES_STORAGE_KEY = 'DefaultTablePreferences';

const isPlainObject = value =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getColumnKey = column => column?.key || column?.name || '';

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
    // localStorage can be unavailable in some runtimes
  }
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

export const resolveStoredVisibleColumnsPreference = preferenceKey => {
  if (!preferenceKey) {
    return null;
  }

  const storedPreferences = readStoredPreferences();
  const tableVisibleColumns = storedPreferences[TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY];

  if (!isPlainObject(tableVisibleColumns)) {
    return null;
  }

  const pagePreference = tableVisibleColumns[preferenceKey];
  return isPlainObject(pagePreference) ? pagePreference : null;
};

export const persistVisibleColumnsPreference = (
  preferenceKey = '',
  visibleColumns = {},
) => {
  if (!preferenceKey || !isPlainObject(visibleColumns)) {
    return;
  }

  const storedPreferences = readStoredPreferences();
  const tableVisibleColumns = isPlainObject(
    storedPreferences[TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY],
  )
    ? storedPreferences[TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]
    : {};

  writeStoredPreferences({
    ...storedPreferences,
    [TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY]: {
      ...tableVisibleColumns,
      [preferenceKey]: visibleColumns,
    },
  });
};

export const resolveStoredTableViewModePreference = (
  preferenceKey = '',
  fallbackViewMode = 'table',
) => {
  if (!preferenceKey) {
    return fallbackViewMode;
  }

  const storedPreferences = readStoredPreferences();
  const tableViewModes = storedPreferences[TABLE_VIEW_MODE_PREFERENCES_KEY];

  if (!isPlainObject(tableViewModes)) {
    return fallbackViewMode;
  }

  const resolvedViewMode = tableViewModes[preferenceKey];
  return resolvedViewMode === 'cards' || resolvedViewMode === 'table'
    ? resolvedViewMode
    : fallbackViewMode;
};

export const persistTableViewModePreference = (
  preferenceKey = '',
  viewMode = 'table',
) => {
  if (!preferenceKey || (viewMode !== 'cards' && viewMode !== 'table')) {
    return;
  }

  const storedPreferences = readStoredPreferences();
  const tableViewModes = isPlainObject(
    storedPreferences[TABLE_VIEW_MODE_PREFERENCES_KEY],
  )
    ? storedPreferences[TABLE_VIEW_MODE_PREFERENCES_KEY]
    : {};

  writeStoredPreferences({
    ...storedPreferences,
    [TABLE_VIEW_MODE_PREFERENCES_KEY]: {
      ...tableViewModes,
      [preferenceKey]: viewMode,
    },
  });
};

export const resolveStoredTableSortPreference = (preferenceKey = '') => {
  if (!preferenceKey) {
    return null;
  }

  const storedPreferences = readStoredPreferences();
  const tableSortFields =
    storedPreferences[TABLE_SORT_FIELD_PREFERENCES_KEY];
  const tableSortDirections =
    storedPreferences[TABLE_SORT_DIRECTION_PREFERENCES_KEY];

  const resolvedField = isPlainObject(tableSortFields)
    ? tableSortFields[preferenceKey]
    : '';
  const resolvedDirection = isPlainObject(tableSortDirections)
    ? tableSortDirections[preferenceKey]
    : '';

  if (
    typeof resolvedField === 'string' &&
    resolvedField.trim() &&
    (resolvedDirection === 'asc' || resolvedDirection === 'desc')
  ) {
    return {
      direction: resolvedDirection,
      field: resolvedField.trim(),
    };
  }

  const tableSorts = storedPreferences[TABLE_SORT_PREFERENCES_KEY];

  if (!isPlainObject(tableSorts)) {
    return null;
  }

  const resolvedSort = tableSorts[preferenceKey];

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
  preferenceKey = '',
  sort = null,
) => {
  if (
    !preferenceKey ||
    !isPlainObject(sort) ||
    (sort.direction !== 'asc' && sort.direction !== 'desc') ||
    typeof sort.field !== 'string' ||
    !sort.field.trim()
  ) {
    return;
  }

  const storedPreferences = readStoredPreferences();
  const tableSortFields = isPlainObject(
    storedPreferences[TABLE_SORT_FIELD_PREFERENCES_KEY],
  )
    ? storedPreferences[TABLE_SORT_FIELD_PREFERENCES_KEY]
    : {};
  const tableSortDirections = isPlainObject(
    storedPreferences[TABLE_SORT_DIRECTION_PREFERENCES_KEY],
  )
    ? storedPreferences[TABLE_SORT_DIRECTION_PREFERENCES_KEY]
    : {};
  const legacyTableSorts = isPlainObject(
    storedPreferences[TABLE_SORT_PREFERENCES_KEY],
  )
    ? storedPreferences[TABLE_SORT_PREFERENCES_KEY]
    : {};

  writeStoredPreferences({
    ...storedPreferences,
    [TABLE_SORT_FIELD_PREFERENCES_KEY]: {
      ...tableSortFields,
      [preferenceKey]: sort.field.trim(),
    },
    [TABLE_SORT_DIRECTION_PREFERENCES_KEY]: {
      ...tableSortDirections,
      [preferenceKey]: sort.direction,
    },
    [TABLE_SORT_PREFERENCES_KEY]: {
      ...legacyTableSorts,
      [preferenceKey]: {
        direction: sort.direction,
        field: sort.field.trim(),
      },
    },
  });
};

