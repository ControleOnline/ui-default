<template>
  <DefaultTable :configs="configs" />
</template>
<script>

import { mapActions, mapGetters } from "vuex";
export default {
  components: {

  },
  props: {
    config: {
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    configs() {
      return {
        "full-height": false,
        companyParam: false,
        store: "imports",
        add: false,
        edit: false,
        selection: false,
        filters: true,
        search: {},
      };
    },
  },
  data() {
    return {};
  },
  beforeCreated() {
    let filters = {
      context: this.config.context,
      company: "/people/" + this.config.people.id,
    };
    this.$store.commit("imports" + "/SET_FILTERS", filters);
  },
  methods: {
    ...mapActions({}),
  },
};
</script>
