<template>
  <component
    v-if="componentConfig.component"
    :is="componentConfig.component"
    :componentProps="componentConfig.props"
    :row="row"
    :configs="componentConfig.configs || configs"
    @saved="saved"
    @loadData="loadData"
    @reload="reload"
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
    click() {},
    saved(data) {
      this.$emit("saved", data);
    },
    loadData() {
      this.$emit("loadData");
    },
    reload() {
      this.$emit("reload");
    },
  },
};
</script>
