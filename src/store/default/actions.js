import { api } from "@controleonline/ui-common/src/api";

import * as types from "@controleonline/ui-default/src/store/default/mutation_types";

export const getItems = ({ commit, getters }, params = {}) => {
  commit(types.SET_ISLOADING, true);
  return api
    .fetch(getters.resourceEndpoint, { params: params })

    .then((data) => {
      commit(types.SET_ITEMS, data["hydra:member"]);
      commit(types.SET_TOTALITEMS, data["hydra:totalItems"]);
      return data["hydra:member"];
    })
    .catch((e) => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally((e) => {
      commit(types.SET_ISLOADING, false);
    });
};

export const get = ({ commit, getters }, id) => {
  commit(types.SET_ISLOADING, true);
  return api
    .fetch(getters.resourceEndpoint + "/" + id.toString().replace(/\D/g, ""), {})
    .then((data) => {
      commit(types.SET_ITEM, data);
      return data;
    })
    .catch((e) => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally((e) => {
      commit(types.SET_ISLOADING, false);
    });
};

export const save = ({ commit, getters }, params) => {
  let id = params.id;
  delete params.id;

  let options = {
    method: id ? "PUT" : "POST",
    body: params,
  };
  commit(types.SET_ISSAVING, true);

  return api
    .fetch(getters.resourceEndpoint + (id ? "/" + id : ""), options)
    .then((data) => {
      return data;
    })
    .catch((e) => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally((e) => {
      commit(types.SET_ISSAVING, false);
    });
};

export const remove = ({ commit, getters }, id) => {
  let options = {
    method: "DELETE",
  };
  commit(types.SET_ISSAVING, true);

  return api
    .fetch(getters.resourceEndpoint + "/" + id, options)
    .then((data) => {
      return data;
    })
    .catch((e) => {
      commit(types.SET_ERROR, e.message);
      throw e;
    })
    .finally((e) => {
      commit(types.SET_ISSAVING, false);
    });
};
