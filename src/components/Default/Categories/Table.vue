<template>
  <DefaultTable :configs="configs" v-if="loaded" />
</template>
<script>
import DefaultTable from "@controleonline/ui-default/src/components/Default/DefaultTable";
import { mapActions, mapGetters } from "vuex";
export default {
  components: {
    DefaultTable,
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
        store: "categories",
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
    return {
      loaded: false,
    };
  },
  created() {
    let filters = {
      context: this.context,
      company: "/people/" + this.myCompany.id,
    };
    this.$store.commit("categories" + "/SET_FILTERS", filters);
    this.loaded = true;
  },
  methods: {
    ...mapActions({}),
  },
};
</script>
