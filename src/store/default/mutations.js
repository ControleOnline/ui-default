import * as types from './mutation_types';
import Filters from '@controleonline/ui-default/src/utils/filters';

export default {
  [types.SET_ERROR](state, error) {
    state.error = error;
    return 'error';
  },

  [types.SET_ISLOADING](state, isLoading = true) {
    state.isLoading = isLoading;
    return 'isLoading';
  },

  [types.SET_ISSAVING](state, isSaving = true) {
    state.isSaving = isSaving;
    return 'isSaving';
  },

  [types.SET_ISLOADINGLIST](state, isLoadingList = true) {
    state.isLoadingList = isLoadingList;
    return 'isLoadingList';
  },

  [types.SET_PRINT](state, print) {
    state.print = print;
    return 'print';
  },

  [types.SET_TOTALITEMS](state, totalItems) {
    state.totalItems = totalItems || 0;
    return 'totalItems';
  },

  [types.SET_ITEMS](state, items) {
    state.items = items;
    return 'items';
  },

  [types.SET_ITEM](state, item) {
    state.item = item;
    return 'item';
  },
  [types.SET_MESSAGE](state, message) {
    state.message = message;
    return 'message';
  },
  [types.SET_MESSAGES](state, messages) {
    state.messages = messages;
    return 'messages';
  },
  [types.SET_COLUMNS](state, columns) {
    state.columns = columns;
    return 'columns';
  },
  [types.SET_OFFLINE](state, offline) {
    state.offline = offline;
    return 'offline';
  },
  [types.SET_STORE](state, store) {
    state.store = store;
    return 'store';
  },

  [types.SET_FILTERS](state, filters) {
    const persistentFilter = new Filters(
      this.$router.currentRoute.value.name,
      state.store || state.resourceEndpoint,
    );
    persistentFilter.setFilters(filters);
    state.filters = filters;
    return 'filters';
  },

  [types.SET_RESOURCE_ENDPOINT](state, resourceEndpoint) {
    state.resourceEndpoint = resourceEndpoint;
    return 'resourceEndpoint';
  },

  [types.SET_SELECTED](state, selected) {
    state.selected = selected;
    return 'selected';
  },

  [types.SET_PAYABLE](state, payable) {
    state.payable = payable;
    return 'payable';
  },

  [types.SET_RELOAD](state, reload) {
    state.reload = reload;
    return 'reload';
  },

  [types.SET_VISIBLECOLUMNS](state, visibleColumns) {
    state.visibleColumns = visibleColumns;
    const persistentFilter = new Filters(
      state.$router?.currentRoute?.value?.name,
      state.store || state.resourceEndpoint,
    );
    persistentFilter.setVisibleColumns(visibleColumns);
    return 'visibleColumns';
  },
};
