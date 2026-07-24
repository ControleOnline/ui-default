const tableRuntimeByStoreName = new Map();
const DEFAULT_RUNTIME_KEY = '__default_table__';

const getRuntimeKey = storeName => storeName || DEFAULT_RUNTIME_KEY;

export const setDefaultTableRuntime = (storeName, runtime = {}) => {
  tableRuntimeByStoreName.set(getRuntimeKey(storeName), runtime);
};

export const getDefaultTableRuntime = storeName =>
  tableRuntimeByStoreName.get(getRuntimeKey(storeName)) || {};
