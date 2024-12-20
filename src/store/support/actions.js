import { api } from "@controleonline/../../src/boot/api";
import * as types from './mutation_types';

export const getNews = ({ commit }, params = {}) => {
  commit(types.SET_ISLOADING);

  return api.fetch('/support/news', { params })
    
    .then(data => {
      commit(types.SET_ISLOADING, false);

      return data.response ? data.response : null;

    });
};

export const getFaqs = ({ commit }, params = {}) => {
  commit(types.SET_ISLOADING);

  return api.fetch('/support/faqs', { params })
    
    .then(data => {
      commit(types.SET_ISLOADING, false);

      return data.response ? data.response : null;

    });
};