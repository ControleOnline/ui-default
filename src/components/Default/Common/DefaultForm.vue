<template>
  <q-form ref="myForm" @submit="onSubmit" class="full-width">
    <div class="row q-col-gutter-xs q-pb-xs" v-if="loaded">
      <template v-for="(column, index) in columns">
        <div
          v-if="
            column.isIdentity != true &&
            showFormColumn[column.key || column.name] &&
            column.add != false &&
            column.multiline != true
          "
          :class="getFilterSize(column)"
        >
          <FormInputs
            :column="column"
            :editable="isEditable(column)"
            :prefix="column.prefix"
            :sufix="column.sufix"
            :inputType="getList(configs, column) ? 'list' : column.inputType"
            :store="configs.store"
            :mask="mask(column)"
            :rules="column.rules"
            :labelType="'outer-label'"
            :label="column.label"
            :filters="getSearchFilters(column)"
            :initialValue="getInitialData(column)"
            :searchParam="column.searchParam || 'search'"
            :formatOptions="column.formatList"
            :searchAction="getList(configs, column)"
            @focus="editingInit(column)"
            @forceSave="onSubmit"
            @changed="
              (value) => {
                item[column.key || column.name] = value;
              }
            "
          />
        </div>
      </template>

      <ExtraData
        :entity="data"
        :configs="configs"
        @changedExtraData="changedExtraData"
      />
    </div>

    <div
      class="row justify-end bg sticky-bottom full-width"
      :style="{
        'z-index': 2,
        position: 'fixed !important',
        left: 0,
        'padding-right': '35px',
      }"
    >
      <q-btn
        :loading="isSaving"
        icon="save"
        type="submit"
        :label="$tt(configs.store, 'btn', 'save')"
        size="md"
        class="q-mt-md btn-primary"
      />
    </div>
  </q-form>
</template>

<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";
import FormInputs from "@controleonline/ui-default/src/components/Default/Common/FormInputs";
import ExtraData from "@controleonline/ui-default/src/components/Default/Common/ExtraData";
import { mapActions, mapGetters } from "vuex";
import configs from "app/modules/controleonline/ui-config/src/store/configs";

export default {
  props: {
    configs: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: false,
    },
    data: {
      type: Object,
      required: false,
      default() {
        return {};
      },
    },
  },
  components: {
    FormInputs,
    ExtraData,
  },
  data() {
    return {
      showFormColumn: {},
      showInput: {},
      listObject: {},
      listAutocomplete: [],
      extraData: {},
      editing: [],
      periodo: false,
      item: {},
      id: null,
      loaded: false,
    };
  },
  created() {
    this.getFilteredColumns();

    if (this.configs.loadOnEdit && this.data && this.data["@id"])
      this.$store
        .dispatch(
          this.configs.store + "/get",
          this.data["@id"].replace(/\D/g, "")
        )
        .then((item) => {
          this.getData(item);
        });
    else this.getData();
  },
  mounted() {
    this.$nextTick(() => {});
  },

  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    isSaving() {
      return this.$store.getters[this.configs.store + "/isSaving"];
    },
    filters() {
      return this.$store.getters[this.configs.store + "/filters"] || {};
    },
    columns() {
      return this.$store.getters[this.configs.store + "/columns"];
    },
    isLoadingList() {
      return this.$store.getters[this.configs.store + "/isLoadingList"];
    },
  },
  watch: {
    item: {
      handler: function (current, preview) {
        this.getFilteredColumns();
      },
      deep: true,
    },
  },
  methods: {
    ...DefaultFiltersMethods,
    ...mapActions({
      getExtraFields: "extra_fields/getItems",
    }),

    getInitialData(column) {
      if (this.item[column.key || column.name])
        return this.item[column.key || column.name];

      return this.configs?.initialData
        ? this.configs?.initialData[column.key || column.name]
        : null;
    },

    getData(initialData) {
      let data = {};
      let itemData = initialData || this.data;

      Object.keys(itemData).forEach((item, i) => {
        let column = this.columns.find((c) => {
          return (c.key || c.name) == item;
        });
        if (column) {
          data[column.key || column.name] = this.getList(this.configs, column)
            ? this.formatList(column, itemData[column.key || column.name], true)
            : this.format(
                column,
                itemData,
                itemData[column.key || column.name],
                true
              );

          if (column.isIdentity) {
            this.id = itemData[column.key || column.name];
            data.id = this.id;
          }
        }
      });

      if (itemData["@id"]) data["id"] = itemData["@id"].split("/").pop();
      this.item = data;
      this.loaded = true;
    },

    isEditable(column) {
      return this.configs?.initialData &&
        this.configs?.initialData[column.key || column.name]
        ? false
        : this.id
        ? column.editable
        : true;
    },
    getFilteredColumns() {
      let columns = {};
      Object.values(this.columns).forEach((c, key) => {
        if (!this.configs?.columns) {
          columns[c.key || c.name] = true;
        } else {
          let cc = this.configs?.columns[c.key || c.name];
          if (cc?.visibleForm && typeof cc.visibleForm === "function") {
            columns[c.key || c.name] = cc.visibleForm(this.item, c);
          } else {
            columns[c.key || c.name] = true;
          }
        }
      });
      this.showFormColumn = columns;
    },

    getFilterSize(column) {
      let size = 0;
      let number = this.columns.length;

      if (number > 0) size = Math.floor(12 / (number + 1));

      if (this.$q.screen.gt.sm) {
        if (size < 4) size = 4;
      } else {
        if (size < 6) size = 6;
      }

      return (
        (column.formClass ||
          "col-xs-12 col-sm-4 col-md-" +
            size +
            " col-lg-" +
            size +
            " col-xl-" +
            size) + " q-pa-xs"
      );
    },
    changedExtraData(data) {
      this.extraData = data;
    },
    save(params) {
      let p = this.$copyObject(this.filters);
      for (const name in params) {
        if (this.showFormColumn[name]) {
          if (this.listObject[name])
            p[name] = this.listObject[name] + "/" + params[name].value;
          else
            p[name] = this.saveFormat(
              name,
              params[name],
              this.id ? { "@id": this.id } : params
            );
        } else {
          p[name] = this.saveFormat(
            name,
            params[name],
            this.id ? { "@id": this.id } : params
          );
        }
      }
      if (this.id) p.id = this.id;

      if (this.myCompany && this.configs.companyParam != false)
        p[this.configs.companyParam || "company"] =
          "/people/" + this.myCompany.id;

      if (this.extraData) p["extra-data"] = this.extraData;

      this.$store
        .dispatch(this.configs.store + "/save", p)
        .then((item) => {
          this.$q.notify({
            message: this.$tt(this.configs.store, "message", "success"),
            position: "bottom",
            type: "positive",
          });
          this.$emit("saved", item, this.index);
        })
        .catch((error) => {
          this.$emit("error", error);
          this.$q.notify({
            message: this.$tt(this.configs.store, "message", "error"),
            position: "bottom",
            type: "negative",
          });
        });
    },

    editingInit(col) {
      this.editing = [{ [col.key || col.name]: true }];
      return this.editing;
    },

    onSubmit() {
      this.$refs.myForm.validate().then((success) => {
        if (success) {
          let payload = this.item;
          this.save(payload);
        }
      });
    },
  },
};
</script>

<style>
.default-form {
  max-width: 1024px !important;
}
</style>
