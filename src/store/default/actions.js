import {api} from '@controleonline/ui-common/src/api';
import LocalDB from '@controleonline/ui-common/src/api/LocalDB';
import * as types from '@controleonline/ui-default/src/store/default/mutation_types';

let db = null;

export const saveOffline = ({commit, getters}, data) => {
  return;
  if (getters.offline) {
    db = new LocalDB(getters);
    if (Array.isArray(data)) db.saveItems(data);
    else if (typeof data === 'object' && data !== null) db.saveItem(data);
  }
};

export const getItems = ({commit, getters}, params = {}) => {
  commit(types.SET_ISLOADING, true);
  if (getters.items != null) commit(types.SET_ITEMS, []);
  commit(types.SET_TOTALITEMS, 0);
  return api
    .fetch(getters.resourceEndpoint, {params: params})
    .then(data => {
      commit(types.SET_ITEMS, data['hydra:member']);
      commit(types.SET_TOTALITEMS, data['hydra:totalItems']);

      saveOffline({commit, getters}, data['hydra:member']);
      return data['hydra:member'];
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally(() => {
      commit(types.SET_ISLOADING, false);
    });
};

export const getOfflineItems = ({commit, getters}, params = {}) => {
  commit(types.SET_ISLOADING, true);

  if (!getters.offline) return getItems({commit, getters}, params);

  db = new LocalDB(getters);

  return db
    .getItemsByFilters()
    .then(async data => {
      if (!data || (Array.isArray(data) && data.length === 0))
        return getItems({commit, getters}, params);

      commit(types.SET_ITEMS, data);
      return data;
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally(() => {
      commit(types.SET_ISLOADING, false);
    });
};

export const get = ({commit, getters}, id) => {
  commit(types.SET_ISLOADING, true);
  if (getters.item != null) commit(types.SET_ITEM, {});
  return api
    .fetch(
      getters.resourceEndpoint + '/' + id.toString().replace(/\D/g, ''),
      {},
    )
    .then(data => {
      commit(types.SET_ITEM, data);
      saveOffline({commit, getters}, data);
      return data;
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally(() => {
      commit(types.SET_ISLOADING, false);
    });
};

export const save = ({commit, getters}, params) => {
  let id = params.id?.toString().replace(/\D/g, '');
  delete params.id;

  let options = {
    method: id ? 'PUT' : 'POST',
    body: params,
  };
  commit(types.SET_ISSAVING, true);

  return api
    .fetch(getters.resourceEndpoint + (id ? '/' + id : ''), options)
    .then(data => {
      return data;
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally(() => {
      commit(types.SET_ISSAVING, false);
    });
};

export const remove = ({commit, getters}, id) => {
  let options = {
    method: 'DELETE',
  };
  commit(types.SET_ISSAVING, true);

  return api
    .fetch(
      getters.resourceEndpoint + '/' + id.toString().replace(/\D/g, ''),
      options,
    )
    .then(data => {
      return data;
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally(() => {
      commit(types.SET_ISSAVING, false);
    });
};

export const setFilters = ({commit, getters}, params) => {
  commit(types.SET_FILTERS, params);
};

export const setItem = ({commit, getters}, params) => {
  commit(types.SET_ITEM, params);
};

export const setItems = ({commit, getters}, params) => {
  commit(types.SET_ITEMS, params);
};

export const setReload = ({commit, getters}, reload) => {
  commit(types.SET_RELOAD, reload);
};

export const setError = ({commit, getters}, error) => {
  commit(types.SET_ERROR, error);
};

export const setIsSaving = ({commit, getters}, IsSaving) => {
  commit(types.SET_ISSAVING, IsSaving);
};
export const setIsLoading = ({commit, getters}, IsLoading) => {
  commit(types.SET_ISLOADING, IsLoading);
};

export const setTotalItems = ({commit, getters}, totalItems) => {
  commit(types.SET_TOTALITEMS, totalItems);
};

export const setColumns = ({commit, getters}, columns) => {
  commit(types.SET_COLUMNS, columns);
};

export const setResourceEndpoint = (
  {commit, getters},
  resourceEndpoint = null,
) => {
  commit(types.SET_RESOURCEENDPOINT, resourceEndpoint);
};

export const setSelected = ({commit, getters}, selected) => {
  commit(types.SET_SELECTED, selected);
};

export const setVisibleColumns = ({commit, getters}, visibleColumns) => {
  commit(types.SET_VISIBLECOLUMNS, visibleColumns);
};

export const setIsLoadingList = ({commit, getters}, isLoadingList) => {
  commit(types.SET_ISLOADINGLIST, isLoadingList);
};

export const setStore = ({commit, getters}, store) => {
  commit(types.SET_STORE, store);
};

export const setOffline = ({commit, getters}, offline) => {
  commit(types.SET_OFFLINE, offline);
};
export const setPayable = ({commit, getters}, payable) => {
  commit(types.SET_PAYABLE, payable);
};
