<template>
  <span
    outlined
    :style="{ color: getColor(column, data) }"
    @click="startEditing(column, data)"
    @mouseenter="isHover(true)"
    @mouseleave="isHover(false)"
  >
    <template v-if="getIcon(column, data)">
      <q-icon :color="getColor(column, data)" :name="getIcon(column, data)" />
    </template>
    <template v-if="column.inputType == 'icon'">
      <q-icon
        :color="getColor(column, data)"
        :name="formatData(column, data, true)"
      />
    </template>
    {{ column.prefix }}

    <!-- ALEMAC // 21/11/2025 // para traduzir ou não cada coluna -->
    {{ 
        column.translate == true
        ? (tempValue != null ? tempValue : this.$tt(this.configs.store, "label", formatData(column, data, false)))
        : (tempValue != null ? tempValue : formatData(column, data, false))
    }}

    {{ column.sufix }}

    <q-icon
      v-if="isEditable() && !isSaving"
      size="1.0em"
      :name="column.list ? 'unfold_more' : 'edit'"
    />
    <q-icon v-else="!isSaving" size="1.0em" name="" />
  </span>
</template>

<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/vue/components/Default/Scripts/DefaultFiltersMethods.js";

export default {
  props: {
    column: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: true,
    },
    editing: {
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
      hover: [],
      tempValue:null
    };
  },
  computed: {
    items() {
      return this.$store.getters[this.configs.store + "/items"];
    },
    isSaving() {
      return this.$store.getters[this.configs.store + "/isSaving"];
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
    isHover(value) {
      this.hover = [];
      this.hover[this.getIndex(this.data)] = [];
      this.hover[this.getIndex(this.data)][
        this.column.key || this.column.name
      ] = value;
    },

    startEditing(col, data) {
      if (col.editable == false || (col.key && col.key.indexOf(".") != -1))
        return;
      this.$store.commit(this.configs.store + "/SET_ITEM", data);
      this.$emit('startEditing',col)
    },
    isEditable() {
      return (
        this.column.inputType !== "increase" &&
        this.column.inputType != "image" &&
        this.column.editable != false &&
        ((this.hover[this.getIndex(this.data)] &&
          this.hover[this.getIndex(this.data)][
            this.column.key || this.column.name
          ] == true) ||
          this.configs.editOnHover != false)
      );
    },
  },
};
</script>
