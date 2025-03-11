<template>
  <FieldsTypes :context="context" />
</template>
<script>
import FieldsTypes from "@controleonline/ui-common/src/vue/components/Fields/types";

export default {
  props: {
    configs: {
      type: Object,
      required: true,
    },
  },
  components: {
    FieldsTypes,
  },
  computed: {},
  created() {
    this.context = this.configs?.context || this.configs.store;
  },
  data() {
    return {
      context: null,
      openFields: false,
    };
  },
  watch: {},
  methods: {},
};
</script>
