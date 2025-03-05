<template>
  <DefaultLabel :configs="configs" :column="column" />

  <template v-if="tableColumnComponent(column.key || column.name)">
    <DefaultComponent
      :componentConfig="tableColumnComponent(column.key || column.name)"
      :row="data"
      :column="column"
      :configs="configs"
      @saved="saved"
      @loadData="loadData"
      @reload="reloadData"
    />
  </template>
  <q-btn
    class="btn-primary"
    v-else-if="column.to && data[column.key || column.name]"
    @click="verifyClick(data)"
    :icon="getIcon(column, data)"
    >{{ this.format(column, data, getNameFromList(column, data)) }}
  </q-btn>

  <FileInput
    v-else-if="column.inputType == 'file'"
    :configs="configs"
    :row="data"
    :column="column"
    :isItemSaved="isItemSaved"
    @save="save"
  />

  <template
    v-else-if="editingInit(data, column) != true && configs.isForm != true"
  >
    <template v-if="column.multiline == true">
      <template v-for="(v, index) in formatData(column, data, false)">
        <span :style="{ color: getColor(column, data) }">
          {{ column.prefix }}
          {{ v }}
          {{ column.sufix }}
        </span>
        <br />
        <q-separator class="full-width" />
      </template>
    </template>
    <template v-else>
      <div class="flex items-center">
        <q-btn
          v-if="column.inputType === 'increase' && column.editable == true"
          flat
          dense
          icon="remove"
          color="grey"
          @click="decreaseQuantity(column, data)"
        />
        <DefaultSpan
          :configs="configs"
          :row="data"
          :column="column"
          :editing="editing"
          @startEditing="startEditing"
        />
        <q-btn
          v-if="column.inputType === 'increase' && column.editable == true"
          flat
          dense
          icon="add"
          color="primary"
          @click="increaseQuantity(column, data)"
        />
      </div>
    </template>
  </template>

  <template v-else>
    <DateInput
      v-if="column.inputType == 'date-range'"
      :configs="configs"
      :row="data"
      :column="column"
      :isItemSaved="isItemSaved"
      @save="save"
    />
    <SelectInput
      v-else-if="getList(configs, column)"
      multiple
      :configs="configs"
      :row="data"
      :column="column"
      :isItemSaved="isItemSaved"
      @save="save"
    />
    <TextInput
      v-else
      :configs="configs"
      :row="data"
      :column="column"
      :isItemSaved="isItemSaved"
      @save="save"
    />
  </template>
</template>
<script>
import { mapActions, mapGetters } from "vuex";
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";
import debounce from "lodash/debounce";
import SelectInput from "@controleonline/ui-default/src/components/Default/Inputs/Components/SelectInput";
import Html from "@controleonline/ui-default/src/components/Default/Common/DefaultHtml.vue";
import DateInput from "@controleonline/ui-default/src/components/Default/Inputs/Components/DateInput";
import TextInput from "@controleonline/ui-default/src/components/Default/Inputs/Components/TextInput";
import DefaultLabel from "@controleonline/ui-default/src/components/Default/Inputs/Components/DefaultLabel";
import FileInput from "@controleonline/ui-default/src/components/Default/Inputs/Components/FileInput";
import DefaultSpan from "@controleonline/ui-default/src/components/Default/Inputs/Components/DefaultSpan";

export default {
  components: {
    SelectInput,
    DateInput,
    Html,
    TextInput,
    DefaultLabel,
    FileInput,
    DefaultSpan,
  },
  props: {
    columnName: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: true,
    },
    configs: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      key: 0,
      data: null,
      editing: [],
      isItemSaved: [],
      tempValue: null,
    };
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    items() {
      return this.$store.getters[this.configs.store + "/items"];
    },
    columns() {
      return this.$store.getters[this.configs.store + "/columns"];
    },
    isLoading() {
      return this.$store.getters[this.configs.store + "/isLoading"];
    },
    isSaving() {
      return this.$store.getters[this.configs.store + "/isSaving"];
    },
    filters() {
      return this.$store.getters[this.configs.store + "/filters"];
    },
    totalItems() {
      return this.$store.getters[this.configs.store + "/totalItems"];
    },
    visibleColumns() {
      return this.$store.getters[this.configs.store + "/visibleColumns"];
    },
    isLoadingList() {
      return this.$store.getters[this.configs.store + "/isLoadingList"];
    },
    reload() {
      return this.$store.getters[this.configs.store + "/reload"];
    },
    selected() {
      return this.$store.getters[this.configs.store + "/selected"];
    },
    column() {
      return this.getColumnByName(this.columnName);
    },
  },
  created() {
    this.data = this.$copyObject(this.row);
  },
  watch: {
    reload(reload) {
      if (reload == true) {
        this.$emit("loadData");
        this.$store.commit(this.configs.store + "/SET_RELOAD", false);
      }
    },
  },
  methods: {
    ...DefaultFiltersMethods,
    reloadData() {
      this.$emit("reload");
    },

    changed($event) {
      if (this.column.inputType == "color") return;
      this.$emit("blur", $event);
      this.save(this.data[this.column.key || this.column.name]);
    },
    tableColumnComponent(name) {
      if (this.configs.components?.customColumns)
        return this.configs.components?.customColumns[name];
    },
    verifyClick(data) {
      if (this.column && typeof this.column.to == "function") {
        const route = this.column.to(
          data[this.column.key || this.column.name],
          this.column,
          data
        );
        if (this.column.target) {
          const url = this.$router.resolve(route).href;
          window.open(url, this.column.target || null);
        } else this.$router.push(route);
      }
      return;
    },

    increaseQuantity(column, data) {
      let value = this.tempValue || this.formatData(column, data, false);

      value = (value || 0) + 1;

      this.tempValue = value;
      this.save(value);
    },
    decreaseQuantity(column, data) {
      let value =
        this.tempValue ||
        (this.tempValue === 0 ? 0 : this.formatData(column, data, false));

      if (value && value >= 1) value--;

      this.tempValue = value;
      this.save(parseFloat(value));
    },

    startEditing(col) {
      let index = this.getIndex(this.data);
      this.editing[index] = { [col.key || col.name]: true };
    },

    clearFields() {
      this.editing = [];
      this.tempValue = null;
      this.isItemSaved = [];
      this.key++;
    },
    saved(data) {
      let items = this.$copyObject(this.items);
      let editIndex = this.getIndex(data);
      if (editIndex >= 0) items[editIndex] = data;
      else items.push(data);

      this.data = data;

      this.$store.commit(this.configs.store + "/SET_ITEMS", this.data);
      this.$emit("saved", data);
      this.$emit("changed", data);
    },

    getValue(data) {
      let col = this.$copyObject(this.column);
      return col.list
        ? this.formatList(col, data)?.value
        : this.format(col, this.row, data);
    },
    save: debounce(function (value) {
      let data = this.$copyObject(this.data);
      let col = this.$copyObject(this.column);
      let index = this.getIndex(data);
      let item = this.row[col.key || col.name];
      let c = this.getValue(item);
      let d = this.getValue(value);

      if (c == d) return this.clearFields();
      if (this.configs.isForm) return this.$emit("changed", value);

      this.isItemSaved[index] = {
        [col.key || col.name]: true,
      };

      let params = {};
      if (data["@id"]) params["id"] = data["@id"].split("/").pop();
      params[col.key || col.name] =
        this.saveFormat(col.key || col.name, value, data) ||
        (col.list
          ? null
          : col.inputType == "float" || col.inputType == "increase"
          ? 0
          : "");
      if (this.myCompany && this.configs.companyParam != false)
        params[this.configs.companyParam || "company"] =
          "/people/" + this.myCompany?.id;
      this.$store
        .dispatch(this.configs.store + "/save", params)
        .then((data) => {
          if (data) {
            this.$q.notify({
              message: this.$tt(this.configs.store, "message", "success"),
              position: "bottom",
              type: "positive",
            });
            this.saved(data);
          } else {
            this.$q.notify({
              message: this.$tt(this.configs.store, "message", "error"),
              position: "bottom",
              type: "negative",
            });
          }
        })
        .catch((error) => {
          this.$emit("error", error);
          this.$q.notify({
            message: this.$tt(this.configs.store, "message", "error"),
            position: "bottom",
            type: "negative",
          });
        })
        .finally(() => {
          this.clearFields();
        });
    }, 100),
  },
};
</script>
