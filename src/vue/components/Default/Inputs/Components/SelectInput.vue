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
    @blur="save()"
    @focus="this.$emit('focus', $event)"
  >
    <template v-slot:append v-if="isSavingItem(data)">
      <q-spinner-ios class="loading-primary" size="2em" />
    </template>
    <template v-slot:no-option v-if="!isLoadingList">
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/vue/components/Default/Scripts/DefaultFiltersMethods.js";

export default {
  props: {
    multiple: {
      required: false,
      default: false,
    },
    row: {
      type: Object,
      required: false,
      default:{}
    },
    column: {
      type: Object,
      required: false,
    },
    isItemSaved: {
      required: true,
    },
    configs: {
      type: Object,
      required: true,
    },
  },
  computed: {
    items() {
      return this.$store.getters[this.configs.store + "/items"];
    },
    isLoadingList() {
      return this.$store.getters[this.configs.store + "/isLoadingList"];
    },
    item() {
      return this.$store.getters[this.configs.store + "/item"];
    },
  },
  data() {
    return {
      data: null,
      options: [],
      loading: true,
      searchAction: null,
    };
  },
  created() {
    this.searchAction = this.getList(this.configs, this.column);

    if (this.formatList){
      this.data = this.formatList(this.column, this.row[this.column.key || this.column.name]);
    }

    setTimeout(() => {
      this.loading = false;
    }, 300);
  },
  watch: {
    data: {
      handler: function (data) {
        if (!this.loading) this.save(data);
      },
      deep: true,
    },
  },
  methods: {
    ...DefaultFiltersMethods,
    save() {
      if (!this.data) return;
      this.$emit(
        "save",
        this.data[this.column.key || this.column.name] || this.data
      );
    },
    searchList(input, update, abort) {
      let params = this.getSearchFilters(this.column, this.row);
      if (input.length > 0)
        params[this.column?.searchParam || "search"] = input;
      if (typeof this.searchAction == "string") {
        this.$store.commit(this.configs.store + "/SET_ISLOADINGLIST", true);
        this.options = [];
        if (this.$store.getters[this.searchAction]) {
          this.$store.getters[this.searchAction].forEach((item) => {
            this.options.push(this.formatList(this.column, item));
          });
          update();
          this.$store.commit(this.configs.store + "/SET_ISLOADINGLIST", false);
        } else {
          this.$store
            .dispatch(this.searchAction, params)
            .then((result) => {
              
              // popula a lista no filtro, já com a tradução se necessário
              result.forEach((item) => {
                let list = this.formatList(this.column, item);
                this.options.push({
                  value: list.value,
                  label: this.column.translate
                    ? this.$tt(this.configs.store, "input", list.label)
                    : list.label,
                });
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
                this.formatList(this.column, item)
                  .value.toString()
                  .toLowerCase()
                  .includes(input.toLowerCase()) ||
                this.formatList(this.column, item)
                  .label.toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
            );
          })
          .map((item) => {
            return this.formatList(this.column, item);
          });
        update();
      }
    },
  },
};
</script>

