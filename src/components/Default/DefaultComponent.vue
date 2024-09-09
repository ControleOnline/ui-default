<template>
  <component
    v-if="componentConfig.component"
    :is="componentConfig.component"
    :componentProps="componentConfig.props"
    :row="row"
    :configs="configs"
    @saved="saved"
    @loadData="loadData"
  />
</template>
<script>
import { mapActions } from "vuex";

export default {
  data() {
    return {};
  },
  props: {
    componentConfig: {
      type: Object,
      required: true,
      default: {},
    },
    row: {
      type: Object,
      required: true,
      default: {},
    },
    configs: {
      type: Object,
      required: true,
      default: {},
    },
  },
  methods: {
    ...mapActions({}),
    saved(data, editIndex) {
      this.$emit("saved", data, editIndex);
    },
    loadData() {
      this.$emit("loadData");
    },
  },
};
</script>
