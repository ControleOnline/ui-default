const React = require('react');
// Mirror store subscriptions: config publication happens in effects, never render.
module.exports = function createStoreHarness(getStores) {
  let registry;
  let fallback = {};
  const states = new WeakMap();
  return function useStore(name) {
    const next = getStores();
    if (next !== registry) {registry = next; fallback = {};}
    const store = next[name] || (fallback[name] ||= {actions: {}, getters: {}});
    if (!states.has(store)) {
      const state = {version: 0, listeners: new Set()};
      states.set(store, state);
      store.actions ||= {};
      store.getters ||= {};
      for (const field of ['configs', 'columns', 'items', 'viewMode', 'filters', 'visibleColumns']) {
        const action = `set${field[0].toUpperCase()}${field.slice(1)}`;
        const original = store.actions[action];
        store.actions[action] = value => {
          original?.(value);
          if (store.getters[field] === value) return;
          store.getters[field] = value;
          state.version += 1;
          state.listeners.forEach(notify => notify());
        };
      }
    }
    const state = states.get(store);
    React.useSyncExternalStore(notify => {
      state.listeners.add(notify);
      return () => state.listeners.delete(notify);
    }, () => state.version, () => state.version);
    return store;
  };
};
