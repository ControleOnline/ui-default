export const isActiveTableFilter = value => {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    if (value.shortcut) return value.shortcut !== 'all';
    if ('value' in value) return isActiveTableFilter(value.value);
    return Object.values(value).some(isActiveTableFilter);
  }
  return true;
};

export const getCompactFilterLabel = value => {
  if (Array.isArray(value)) return value.map(getCompactFilterLabel).join(', ');
  if (value && typeof value === 'object') {
    if (value.shortcut) return ({today: 'Hoje', yesterday: 'Ontem', all: 'Todos', custom: 'Personalizado'})[value.shortcut] || value.shortcut;
    return String(value.label || value.value || 'Selecionado');
  }
  return String(value ?? '');
};

export const getVisiblePageNumbers = (page, totalPages) => {
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  return Array.from({length: Math.min(3, totalPages)}, (_, index) => start + index);
};

export const getCompactColumnLabel = (column, fallback) => column?.compactLabel || fallback;
