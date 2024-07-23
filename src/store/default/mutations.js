import * as types from "./mutation_types";
import Filters from "@controleonline/ui-default/src/utils/filters";


export default {
  [types.SET_ERROR](state, error) {
    Object.assign(state, { error });
  },

  [types.SET_ISLOADING](state, isLoading = true) {
    Object.assign(state, { isLoading: isLoading });
  },

  [types.SET_ISSAVING](state, isSaving = true) {
    Object.assign(state, { isSaving: isSaving });
  },

  [types.SET_ISLOADINGLIST](state, isLoadingList = true) {
    Object.assign(state, { isLoadingList: isLoadingList });
  },

  [types.SET_VIOLATIONS](state, violations) {
    Object.assign(state, { violations });
  },

  [types.SET_TOTALITEMS](state, totalItems) {
    Object.assign(state, { totalItems });
  },

  [types.SET_ITEMS](state, items) {
    Object.assign(state, { items });
  },

  [types.SET_ITEM](state, item) {
    Object.assign(state, { item });
  },

  [types.SET_COLUMNS](state, columns) {
    Object.assign(state, { columns });
  },

  [types.SET_FILTERS](state, filters) {
    // console.log('Setting filters:', filters);
    const persistentFilter = new Filters(this.$router.currentRoute.value.name, state.resourceEndpoint);
    persistentFilter.setFilters(filters);
    Object.assign(state, { filters });
  },

  [types.SET_REROURCE_ENDPOINT](state, resourceEndpoint) {
    Object.assign(state, { resourceEndpoint });
  },

  [types.SET_SELECTED](state, selected) {
    Object.assign(state, { selected });
  },
  [types.SET_RELOAD](state, reload) {
    Object.assign(state, { reload });
  },
  [types.SET_VISIBLECOLUMNS](state, visibleColumns) {
    const persistentFilter = new Filters(this.$router.currentRoute.value.name, state.resourceEndpoint);
    persistentFilter.setVisibleColumns(visibleColumns);
    Object.assign(state, { visibleColumns });
  },
};
