<template>
  <q-select
    outlined
    dense
    :stack-label="configs.labelType || 'stack-label'"
    lazy-rules
    use-input
    :use-chips="multiple == true"
    map-options
    options-cover
    transition-show="flip-down"
    transition-hide="flip-up"
    @filter="searchList"
    :options="options"
    label-color="black"
    input-debounce="700"
    :loading="isLoadingList"
    :disable="column.editable == false"
    :multiple="multiple == true"
    :label="
      configs.labelType != 'stack-label'
        ? ''
        : store
        ? $tt(store, 'input', column.label)
        : column.label
    "
    v-model="data"
    @blur="this.$emit('blur', $event)"
    @focus="this.$emit('focus', $event)"
  >
    <template v-slot:no-option v-if="!isLoadingList">
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";

export default {
  props: {
    multiple: {
      required: false,
      default: false,
    },

    row: {
      type: Object,
      required: false,
    },
    column: {
      type: Object,
      required: false,
    },
    configs: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isLoadingList() {
      return this.$store.getters[this.configs.store + "/isLoadingList"];
    },
    item() {
      return this.$store.getters[this.configs.store + "/item"];
    },
  },
  data() {
    return {
      data: [],
      options: [],
      loading: true,
      searchAction: null,
    };
  },
  created() {
    this.searchAction = this.getList(this.configs, this.column);
    this.data = this.formatList(
      this.column,
      this.item[this.column.key || this.column.name]
    );
    setTimeout(() => {
      this.loading = false;
    }, 300);
  },
  watch: {
    data: {
      handler: function (data) {
        if (!this.loading) this.$emit("selected", data);
      },
      deep: true,
    },
  },
  methods: {
    ...DefaultFiltersMethods,
    searchList(input, update, abort) {
      let params = this.getSearchFilters(this.column, this.row);
      if (input.length > 0)
        params[this.column?.searchParam || "search"] = input;
      if (typeof this.searchAction == "string") {
        this.$store.commit(this.configs.store + "/SET_ISLOADINGLIST", true);
        this.options = [];
        if (this.$store.getters[this.searchAction]) {
          this.$store.getters[this.searchAction].forEach((item) => {
            this.options.push(this.column.formatList(item));
          });
          update();
          this.$store.commit(this.configs.store + "/SET_ISLOADINGLIST", false);
        } else {
          this.$store
            .dispatch(this.searchAction, params)
            .then((result) => {
              //this.options.push(null);
              result.forEach((item) => {
                this.options.push(this.column.formatList(item));
              });
              update();
            })
            .finally(() => {
              this.$store.commit(
                this.configs.store + "/SET_ISLOADINGLIST",
                false
              );
            });
        }
      } else {
        this.options = this.searchAction
          .filter((item) => {
            return (
              item,
              !input ||
                this.column
                  .formatList(item)
                  .value.toString()
                  .toLowerCase()
                  .includes(input.toLowerCase()) ||
                this.column
                  .formatList(item)
                  .label.toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
            );
          })
          .map((item) => {
            if (typeof this.column.formatList == "function")
              return this.column.formatList(item);
            else return item;
          });
        update();
      }
    },
  },
};
</script>
