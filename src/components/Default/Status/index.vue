<template>
  <DefaultTable :configs="configs" v-if="configs" />
</template>
<script>

import { mapActions, mapGetters } from "vuex";
export default {
  components: {

  },
  props: {
    context: {
      required: true,
    },
  },

  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    configs() {
      return {
        store: "status",
        "full-height": false,
        add: true,
        selection: false,
        filters: true,
        columns: {
          parent: {
            filters: {
              context: this.context,
              company: "/people/" + this.myCompany.id,
            },
          },
        },
        search: {},
      };
    },
  },
  data() {
    return {};
  },
  created() {
    let filters = {
      context: this.context,
      company: "/people/" + this.myCompany.id,
    };
    this.$store.commit("status" + "/SET_FILTERS", filters);
  },
  methods: {
    ...mapActions({}),
  },
};
</script>
