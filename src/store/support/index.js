import * as actions from './actions';
import * as getters from './getters';
import mutations from './mutations';

export default {
  namespaced: true,
<<<<<<<< HEAD:src/store/guides/index.js
  getters,
  mutations,
  actions,
  state,
========
  state     : {
    isLoading: false,
  },
  actions,
  getters,
  mutations,
>>>>>>>> 6674ca873f77206b0d52470e7daeef418992ed67:src/store/support/index.js
};
