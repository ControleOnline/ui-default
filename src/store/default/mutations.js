import * as types from "./mutation_types";
import Filters from "@controleonline/ui-default/src/utils/filters";

export default {
  [types.SET_ERROR](state, error) {
    state.error = error;
  },

  [types.SET_ISLOADING](state, isLoading = true) {
    state.isLoading = isLoading;
  },

  [types.SET_ISSAVING](state, isSaving = true) {
    state.isSaving = isSaving;
  },

  [types.SET_ISLOADINGLIST](state, isLoadingList = true) {
    state.isLoadingList = isLoadingList;
  },

  [types.SET_VIOLATIONS](state, violations) {
    state.violations = violations;
  },

  [types.SET_TOTALITEMS](state, totalItems) {
    state.totalItems = totalItems;
  },

  [types.SET_ITEMS](state, items) {
    state.items = items;
  },

  [types.SET_ITEM](state, item) {
    state.item = item;
  },

  [types.SET_COLUMNS](state, columns) {
    state.columns = columns;
  },

  [types.SET_STORE](state, store) {
    state.store = store;
  },

  [types.SET_FILTERS](state, filters) {
    const persistentFilter = new Filters(
      this.$router.currentRoute.value.name,
      state.store || state.resourceEndpoint
    );
    persistentFilter.setFilters(filters);
    state.filters = filters;
  },

  [types.SET_RESOURCE_ENDPOINT](state, resourceEndpoint) {
    state.resourceEndpoint = resourceEndpoint;
  },

  [types.SET_SELECTED](state, selected) {
    state.selected = selected;
  },
  [types.SET_RELOAD](state, reload) {
    state.reload = reload;
  },
  [types.SET_VISIBLECOLUMNS](state, visibleColumns) {
    const persistentFilter = new Filters(
      this.$router.currentRoute.value.name,
      state.store || state.resourceEndpoint
    );
    persistentFilter.setVisibleColumns(visibleColumns);
    state.visibleColumns = visibleColumns;
  },
};
