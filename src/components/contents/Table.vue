<template>
  <DefaultTable :configs="configs" />
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  components: {},
  props: {
    context: {
      required: false,
      default: "contents",
    },
  },
  computed: {
    ...mapGetters({
      defaultCompany: "people/defaultCompany",
    }),
    configs() {
      return {
        externalFilters: false,
        store: this.context,
        categories: ["ead-courses","ead-subjects"],
        add: true,
        delete: true,
        filters: true,
        selection: false,
        search: false,
        columns: {
          courses: {
            filters: {
              context: "ead-courses",
              company: "/people/" + this.defaultCompany.id,
            },
          },
          subjects: {
            filters: {
              context: "ead-subjects",
              company: "/people/" + this.defaultCompany.id,
            },
          },
        },
      };
    },
  },
};
</script>
