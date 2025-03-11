<template>
  <DefaultFile
    :context="configs.context || configs.store"
    :disable="column.editable == false"
    :editable="column.editable"
    :fileType="column.fileType"
    :labelType="configs.labelType || 'stack-label'"
    :row="formatData(column, data, true)"
    :label="column.name"
    multiple
    :key="key"
    @save="save"
  />
  <DefaultFile
    v-if="!isPreview()"
    class="file-preview"
    :style="
      !isPreview()
        ? ''
        : { position: 'absolute', 'z-index': 2, 'margin-top': '15px' }
    "
    :context="configs.context || configs.store"
    :row="data[column.key || column.name]"
    :fileType="column.fileType"
    :disable="column.editable == false"
    :editable="column.editable"
    :labelType="configs.labelType"
    :label="column.label"
    multiple
    :key="key"
    @save="save"
  />
  <DefaultHtml
    v-if="column.inputType == 'file' && isPreview()"
    :readonly="column.editInline != true"
    :editInline="column.editInline"
    :key="key"
    :row="data[column.key || column.name]"
    @saved="forceSave"
    @changed="changed"
  />
</template>

<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/vue/components/Default/Scripts/DefaultFiltersMethods.js";

export default {
  components: {},
  props: {
    column: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: true,
    },
    isItemSaved: {
      required: true,
    },
    configs: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      data: null,
    };
  },
  computed: {
    items() {
      return this.$store.getters[this.configs.store + "/items"];
    },
  },
  created() {
    this.data = this.$copyObject(this.row);
  },
  methods: {
    ...DefaultFiltersMethods,
    save(data) {
      this.$emit("save", data);
    },
    forceSave() {
      this.$emit("forceSave");
    },
    isPreview() {
      return this.column.preview && this.data && this.data["@id"];
    },
  },
};
</script>
