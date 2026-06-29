export const TABLE_VISIBLE_COLUMNS_PREFERENCES_KEY = 'tableVisibleColumns';
export const TABLE_VIEW_MODE_PREFERENCES_KEY = 'tableViewModes';
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

