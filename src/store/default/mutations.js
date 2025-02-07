import * as types from "./mutation_types";
import Filters from "@controleonline/ui-default/src/utils/filters";

export default {
  [types.SET_ERROR](state, payload) {
    if (!payload?.error) Object.assign(state, { error: payload });
    return { ...state, error: payload?.error || payload };
  },

  [types.SET_ISLOADING](state, payload = true) {
    if (!payload?.isLoading) Object.assign(state, { isLoading: payload });
    return { ...state, isLoading: payload?.isLoading || payload };
  },

  [types.SET_ISSAVING](state, payload = true) {
    if (!payload?.isSaving) Object.assign(state, { isSaving: payload });
    return { ...state, isSaving: payload?.isSaving || payload };
  },

  [types.SET_ISLOADINGLIST](state, payload = true) {
    if (!payload?.isLoadingList) Object.assign(state, { isLoadingList: payload });
    return { ...state, isLoadingList: payload?.isLoadingList || payload };
  },

  [types.SET_VIOLATIONS](state, payload) {
    if (!payload?.violations) Object.assign(state, { violations: payload });
    return { ...state, violations: payload?.violations || payload };
  },

  [types.SET_TOTALITEMS](state, payload) {
    if (!payload?.totalItems) Object.assign(state, { totalItems: payload });
    return { ...state, totalItems: payload?.totalItems || payload };
  },

  [types.SET_ITEMS](state, payload) {
    if (!payload?.items) Object.assign(state, { items: payload });
    return { ...state, items: payload?.items || payload };
  },

  [types.SET_ITEM](state, payload) {
    if (!payload?.item) Object.assign(state, { item: payload });
    return { ...state, item: payload?.item || payload };
  },

  [types.SET_COLUMNS](state, payload) {
    if (!payload?.columns) Object.assign(state, { columns: payload });
    return { ...state, columns: payload?.columns || payload };
  },

  [types.SET_STORE](state, payload) {
    if (!payload?.store) Object.assign(state, { store: payload });
    return { ...state, store: payload?.store || payload };
  },

  [types.SET_FILTERS](state, payload) {
    if (!payload?.filters) Object.assign(state, { filters: payload });
    const persistentFilter = new Filters(
      state.$router?.currentRoute?.value?.name,
      state.store || state.resourceEndpoint
    );
    persistentFilter.setFilters(payload);
    return { ...state, filters: payload?.filters || payload };
  },

  [types.SET_RESOURCE_ENDPOINT](state, payload) {
    if (!payload?.resourceEndpoint) Object.assign(state, { resourceEndpoint: payload });
    return { ...state, resourceEndpoint: payload?.resourceEndpoint || payload };
  },

  [types.SET_SELECTED](state, payload) {
    if (!payload?.selected) Object.assign(state, { selected: payload });
    return { ...state, selected: payload?.selected || payload };
  },

  [types.SET_RELOAD](state, payload) {
    if (!payload?.reload) Object.assign(state, { reload: payload });
    return { ...state, reload: payload?.reload || payload };
  },

  [types.SET_VISIBLECOLUMNS](state, payload) {
    if (!payload?.visibleColumns) Object.assign(state, { visibleColumns: payload });
    const persistentFilter = new Filters(
      state.$router?.currentRoute?.value?.name,
      state.store || state.resourceEndpoint
    );
    persistentFilter.setVisibleColumns(payload);
    return { ...state, visibleColumns: payload?.visibleColumns || payload };
  },
};
