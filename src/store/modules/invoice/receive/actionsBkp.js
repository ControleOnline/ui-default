import { api } from "@controleonline/../../src/boot/api";

import * as types from './mutation_types';

const RESOURCE_ENDPOINT = '/finance/receive';

export const getItems = ({ commit }, params = {}) => {
  commit(types.SET_ISLOADING);

  return api.fetch(RESOURCE_ENDPOINT, { params })
    
    .then(data => {
      commit(types.SET_ISLOADING , false);

      commit(types.SET_ITEMS     , data['hydra:member']);
      commit(types.SET_VIEW      , data['hydra:view']);
      commit(types.SET_TOTALITEMS, data['hydra:totalItems']);

      return data['hydra:member'];

    }).catch(e => {
      commit(types.SET_ISLOADING, false);

      commit(types.SET_ERROR, e.message);
      throw e;
    });
};

export const reset = ({ commit }) => {
  commit(types.RESET);
};

export const getStatuses = ({ commit }, params = {}) => {
  return api.fetch('/statuses', { params })
    
    .then(data => {

      return data['hydra:member'];

    }).catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    });
};

export const getInvoice = ({ commit }, { invoiceId, params }) => {
  return api.fetch(`/finance/receive/${invoiceId}`, { params })
    
    .then(data => {

      return data;

    });
};

export const bankItau = ({ commit }, { invoiceId, operation, params = {} }) => {
  return api.fetch(`/finance/receive/${invoiceId}/bank/itau/${operation}`, { params })
    
    .then(data => {
      if (data.response)
        return data.response.data !== null ? data.response.data : null;

      return null;
    });
};
