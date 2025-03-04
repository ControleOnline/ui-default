<template>
  <div
    class="row q-pt-xs q-py-lg row-filters"
    v-if="filteredColumns.length > 0"
  >
    <q-card class="full-width">
      <!--
            <q-card-section class="row col-12 q-pa-sm q-pl-lg">
                <q-title class="">{{ $tt(configs.store, 'title', 'filters') }}</q-title>
            </q-card-section>
            -->
      <q-card-section class="row col-12 q-pa-sm">
        <template v-for="(column, index) in filteredColumns">
          <div :class="column.filterClass || getFilterSize() + ' q-pa-sm '">
            <FilterInputs
              :prefix="column.prefix"
              :sufix="column.sufix"
              :key="key"
              :labelType="'upper'"
              :column="column"
              :configs="configs"
              @loadData="sendFilter"
            >
            </FilterInputs>
          </div>
        </template>
        <template v-for="(customFilter, index) in tableFilterComponent">
          <div :class="column.filterClass || getFilterSize() + ' q-pa-sm '">
            <component
              :componentProps="customFilter.props"
              :is="customFilter.component"
              :prefix="customFilter.prefix"
              :sufix="customFilter.sufix"
              :key="key"
              :labelType="'upper'"
              :configs="configs"
              @loadData="sendFilter"
            />
          </div>
        </template>
        <div :class="'q-pa-sm flex col items-end justify-end'">
          <q-btn
            class="q-pa-sm q-mr-md btn-search btn-primary"
            :label="$tt(configs.store, 'btn', 'filter')"
            dense
            icon-right="search"
            @click="sendFilter"
          ></q-btn>
          <q-btn
            class="q-pa-sm btn-clear btn-primary"
            dense
            icon-right="filter_alt_off"
            @click="
              () => {
                clearFilters();
                openFilters = false;
              }
            "
          >
            <q-tooltip>
              {{ $tt(configs.store, "tooltip", "clear") }}
            </q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>
<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";
import FilterInputs from "@controleonline/ui-default/src/components/Default/Filters/FilterInputs";

export default {
  props: {
    configs: {
      type: Object,
      required: true,
    },
  },
  components: {
    FilterInputs,
  },
  computed: {
    columns() {
      return this.$store.getters[this.configs.store + "/columns"];
    },
    tableFilterComponent() {
      return this.configs?.components?.customFilters || [];
    },
    filteredColumns() {
      return this.columns.filter(
        (column) =>
          this.shouldIncludeColumn(column) && column.externalFilter == true
      );
    },
    filters() {
      return this.$store.getters[this.configs.store + "/filters"];
    },
  },
  data() {
    return {
      listObject: {},
      key: 0,
    };
  },
  watch: {
    filters: {
      handler: function () {
        this.key++;
      },
      deep: true,
    },
  },
  created() {},
  methods: {
    ...DefaultFiltersMethods,

    getFilterSize() {
      let size = 0;
      let number = this.filteredColumns.length;
      let customFilters = this.tableFilterComponent;

      if (number > 0)
        size = Math.floor(12 / (number + 1 + customFilters.length));

      if (size < 2) size = 2;

      return (
        "col-xs-12 col-sm-4 col-md-" +
        size +
        " col-lg-" +
        size +
        " col-xl-" +
        size
      );
    },
  },
};
</script>

<style scoped>
.btn-search {
  width: calc(100% - 56px);
}
</style>
