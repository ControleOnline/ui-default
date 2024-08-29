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
    return {
      loaded: false,
    };
  },
  created() {
    let filters = {
      context: this.config.context,
      company: "/people/" + this.config.people.id,
    };
    this.$store.commit("imports" + "/SET_FILTERS", filters);
    this.loaded = true;
    console.log(this.config);
  },
  methods: {
    ...mapActions({}),
  },
};
</script>
