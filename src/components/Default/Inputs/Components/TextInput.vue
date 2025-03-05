<template>
  <q-input
    outlined
    :disable="column.editable == false"
    dense
    :stack-label="configs.labelType == 'stack-label'"
    lazy-rules
    v-model="data[column.key || column.name]"
    :type="column.inputType == 'number' ? 'number' : 'text'"
    @keydown.enter="save(data[column.key || column.name])"
    :prefix="column.prefix"
    :sufix="column.sufix"
     @blur="save(data[column.key || column.name])"
    :label="configs.labelType == 'stack-label' ? column.label : ''"
    :rules="[isInvalid()]"
    :reverse-fill-mask="
      column.inputType == 'float' || column.inputType == 'number'
    "
    :mask="column.mask || column.inputType == 'float' ? '#,##' : column.mask"
    :fill-mask="
      column.inputType == 'float' || column.inputType == 'number' ? 0 : ''
    "
  >
    <template v-slot:append v-if="isSavingItem(data)">
      <q-spinner-ios class="loading-primary" size="2em" />
    </template>
    <template v-slot:append v-if="column.inputType == 'icon'">
      <q-icon :name="data[column.key || column.name]" />
    </template>
    <template v-slot:append v-if="column.inputType == 'color'">
      <q-icon name="colorize" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-color v-model="data[column.key || column.name]"> </q-color>
          <div class="row items-center justify-end">
            <q-btn
              v-close-popup
              :label="$tt(configs.store, 'btn', 'apply')"
              @click="save(data[column.key || column.name])"
              class="btn-primary"
              flat
            />
          </div>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";

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
    isInvalid() {
      return true;
    },
  },
};
</script>
