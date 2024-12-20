import { api } from "@controleonline/../../src/boot/api";





export function getProviders({ commit }, data) {
  const options = {
    method: 'GET',
    params: data.params ? data.params : {}
  };

  return api.fetch('/peoples', options)
    
    .then(response => {
      return response['hydra:member'];
    })
}

export const createExpense = ({ commit }, data) => {
  let options = {
    method: 'POST',
    body: (data.values),
    params: data.params ? data.params : {}
  };

  return api.fetch('/invoices', options)
    
    .then(response => {
      return response.data ? response.data : null;
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    });
}

export const createProvider = ({ commit }, data) => {
  let options = {
    method: 'POST',
    body: (data.values),
    params: data.params ? data.params : {}
  };

  return api.fetch('/peoples', options)
    
    .then(response => {
      return response;
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    });
}

export const updateExpense = ({ commit }, data) => {
  let options = {
    method: 'PUT',
    body: (data.values),
    params: data.params ? data.params : {}
  };

  return api.fetch(`/invoices/${data.id}`, options)
    
    .then(response => {
      return response.data ? response.data : null;
    })
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    });
}

export const deleteExpense = ({ commit }, data) => {
  let options = {
    method: 'DELETE',
    body: (data.values),
    params: data.params ? data.params : {}
  };

  return api.fetch(`/invoices/${data.id}`, options)
    .catch(e => {
      commit(types.SET_ERROR, e.message);
      throw e;
    });
}
