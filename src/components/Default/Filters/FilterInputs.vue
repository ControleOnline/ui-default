<template>
  <label v-if="labelType != 'stack-label'">
    {{ $tt(configs.store, "input", column.label) }}
  </label>
  <DateRangeInput
    :initialRange="colFilter[column.key || column.name]"
    @changedDateInput="changedDateInput"
    :labelType="labelType"
    v-if="column.inputType == 'date-range'"
    :column="column"
    :configs="configs"
  />

  <SelectInput
    outlined
    v-else-if="getList(configs, column)"
    :store="configs.store"
    :labelType="labelType"
    :label="column.label"
    :multiple="true"
    :searchAction="getList(configs, column)"
    :filters="getSearchFilters(column)"
    :formatOptions="column.formatList"
    :column="column"
    :searchParam="column.searchParam || 'search'"
    @selected="
      (value) => {
        colFilter[column.key || column.name] = $copyObject(value);
      }
    "
    @focus="this.$emit('focus', $event)"
    @blur="fireBlur"
  />

  <q-input
    outlined
    v-else
    dense
    :stack-label="labelType"
    :type:="inputType"
    :prefix="prefix"
    :sufix="sufix"
    :label="
      labelType != 'stack-label'
        ? ''
        : $tt(configs.store, 'input', column.label)
    "
    v-model="colFilter[column.key || column.name]"
    @focus="this.$emit('focus', $event)"
    @blur="
      sendFilterColumn(column.key || column.name);
      this.$emit('blur', $event);
    "
    @keydown.enter="
      sendFilterColumn(column.key || column.name);
      sendFilter();
    "
  >
    <template
      v-slot:append
      v-if="
        colFilter[column.key || column.name] &&
        colFilter[column.key || column.name] != ''
      "
    >
      <q-icon
        name="close"
        @click="colFilter[column.key || column.name] = ''"
        class="cursor-pointer"
      />
    </template>
  </q-input>
</template>
<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";
import DateRangeInput from "../Common/Inputs/DateRangeInput";
import SelectInput from "../Common/Inputs/SelectInput";

export default {
  components: {
    DateRangeInput,
    SelectInput,
  },
  props: {
    prefix: {},
    sufix: {},
    labelType: {
      type: String,
      required: false,
      default: "stack-label",
    },
    column: {
      type: Object,
      required: true,
    },
    configs: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isLoading() {
      return this.$store.getters[this.configs.store + "/isLoading"];
    },
    isLoadingList() {
      return this.$store.getters[this.configs.store + "/isLoadingList"];
    },
    filters() {
      return this.$store.getters[this.configs.store + "/filters"];
    },
    columns() {
      return this.$store.getters[this.configs.store + "/columns"];
    },
  },
  data() {
    return {
      dateRange: {},
      listObject: {},
      colFilter: {},
      listAutocomplete: [],
    };
  },
  created() {
    this.colFilter = this.$copyObject(this.filters);
    this.$store.commit(
      this.configs.store + "/SET_ITEM",
      this.colFilter[this.column.key || this.column.name]
    );
  },

  watch: {
    filters: {
      handler: function () {
        this.colFilter = this.$copyObject(this.filters);
      },
      deep: true,
    },
  },
  methods: {
    ...DefaultFiltersMethods,
    fireBlur($event) {
      if (!this.blurLoop) {
        this.sendFilterColumn(this.column.key || this.column.name);
        this.$emit("blur", $event);
      }
      this.blurLoop = true;
      setTimeout(() => {
        this.blurLoop = false;
      }, 200);
    },
    changedDateInput(dateModel) {
      let filters = this.$copyObject(this.filters);
      let filter = filters[this.column.key || this.column.name];
      if (dateModel.from)
        filter.after = this.$formatter.buildAmericanDate(dateModel.from);
      else delete filter.after;
      if (dateModel.to)
        filter.before = this.$formatter.buildAmericanDate(dateModel.to);
      else delete filter.before;

      filters[this.column.key || this.column.name] = filter;
      this.applyFilters(filters);
    },
  },
};
</script>
