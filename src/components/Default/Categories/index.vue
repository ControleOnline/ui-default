<template>
  <DefaultTable :configs="configs" :key="store + '_' + context" v-if="loaded" />
</template>
<script>
import { mapActions, mapGetters } from "vuex";
export default {
  components: {},
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
    return {
      loaded: false,
    };
  },
  created() {
    let filters = {
      context: this.context,
      company: "/people/" + this.myCompany.id,
    };
    this.setFilters(filters);
  },
  mounted() {
    this.$nextTick(() => {
      this.loaded = true;
    });
  },
  methods: {
    ...mapActions({
      setFilters: "categories/SET_FILTERS",
    }),
  },
};
</script>
