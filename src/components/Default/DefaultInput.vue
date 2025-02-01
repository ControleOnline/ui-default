<template>
  <template v-if="tableColumnComponent(column.key || column.name)">
    <DefaultComponent
      :componentConfig="tableColumnComponent(column.key || column.name)"
      :row="row"
      :configs="configs"
      @saved="saved"
      @loadData="loadData"
      @reload="reloadData"
    />
  </template>
  <q-btn
    class="btn-primary"
    v-else-if="column.to && row[column.key || column.name]"
    @click="verifyClick(column, row)"
    :icon="getIcon(column, row)"
    >{{
      this.format(
        column,
        row,
        getNameFromList(column, row, column.key || column.name)
      )
    }}
  </q-btn>
  <File
    v-else-if="column.inputType == 'file'"
    :disable="column.editable == false"
    :editable="column.editable"
    :fileType="column.fileType"
    :data="formatData(column, row, true)"
    :index="getIndex(row)"
    @save="
      (value, index) => {
        this.save(index, items[index], column, value['@id']);
      }
    "
  />

  <template v-else-if="editingInit(getIndex(row), column) != true">
    <template v-if="column.multiline == true">
      <template v-for="(data, index) in formatData(column, row, false)">
        <span :style="{ color: getColor(column, row) }">
          {{ column.prefix }}
          {{ data }}
          {{ column.sufix }} </span
        ><br />
        <q-separator class="full-width" />
      </template>
    </template>
    <template v-else>
      <div class="flex items-center">
        <q-btn
          v-if="column.inputType === 'increase'"
          flat
          dense
          icon="remove"
          color="grey"
          @click="decreaseQuantity(column, row)"
        />
        <span
          :style="{ color: getColor(column, row) }"
          @mouseenter="
            showEdit[getIndex(row)] =
              column.editable == false
                ? false
                : { [column.key || column.name]: true }
          "
          @mouseleave="
            showEdit[getIndex(row)] = {
              [column.key || column.name]: false,
            }
          "
          @click="
            startEditing(
              getIndex(row),
              column,
              row,
              formatData(column, row, true)
            )
          "
        >
          <template v-if="getIcon(column, row)">
            <q-icon
              :color="getColor(column, row)"
              :name="getIcon(column, row)"
            />
          </template>
          <template v-if="column.inputType == 'icon'">
            <q-icon
              :color="getColor(column, row)"
              :name="formatData(column, row, true)"
            />
          </template>
          {{ column.prefix }}

          {{ tempValue != null ? tempValue : formatData(column, row, false) }}

          {{ column.sufix }}
          <q-icon
            v-if="
              column.inputType !== 'increase' &&
              column.inputType != 'image' &&
              column.editable != false &&
              !isSaving &&
              ((showEdit[getIndex(row)] &&
                showEdit[getIndex(row)][column.key || column.name] == true) ||
                configs.editOnHover != false)
            "
            size="1.0em"
            :name="column.list ? 'unfold_more' : 'edit'"
          />
          <q-icon
            v-else-if="column.inputType !== 'increase'"
            size="1.0em"
            name=""
          />
          <q-spinner-ios
            v-if="isSaving && isEditing(getIndex(row), column)"
            class="loading-primary"
            size="2em"
          />
        </span>
        <q-btn
          v-if="column.inputType === 'increase'"
          flat
          dense
          icon="add"
          color="primary"
          @click="increaseQuantity(column, row)"
        />
      </div>
    </template>
  </template>

  <template v-else>
    <FormInputs
      :column="column"
      :prefix="column.prefix"
      :sufix="column.sufix"
      :editable="column.editable"
      :inputType="getList(configs, column) ? 'list' : column.inputType"
      :store="configs.store"
      :mask="mask(column)"
      :rules="[isInvalid()]"
      :labelType="'stack-label'"
      :label="column.label"
      :filters="getSearchFilters(column, row)"
      :initialValue="editedValue"
      :searchParam="column.searchParam || 'search'"
      :formatOptions="column.formatList"
      :searchAction="getList(configs, column)"
      @focus="editingInit(getIndex(row), column)"
      @changed="
        (value) => {
          editedValue = value;
        }
      "
      @apply="stopEditing(getIndex(row), column, row)"
      @blur="stopEditing(getIndex(row), column, row)"
      @update:modelValue="stopEditing(getIndex(row), column, row)"
      @keydown.enter="stopEditing(getIndex(row), column, row)"
    />
  </template>
</template>
<script>
import File from "@controleonline/ui-default/src/components/Default/Common/Inputs/File.vue";
import FormInputs from "@controleonline/ui-default/src/components/Default/Common/FormInputs";
import { mapActions, mapGetters } from "vuex";
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";
import debounce from "lodash/debounce";

export default {
  components: {
    File,
    FormInputs,
  },
  props: {
    columnName: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: false,
      default: 0,
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
      editing: [],
      showEdit: [],
      editedValue: false,
      saveEditing: [],
      tempValue: null,
    };
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    items() {
      return this.$store.getters[this.configs.store + "/items"] || [];
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
      return this.$store.getters[this.configs.store + "/filters"] || {};
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
      return this.$store.getters[this.configs.store + "/selected"] || [];
    },
    column() {
      return this.getColumnByName(this.columnName);
    },
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
    tableColumnComponent(name) {
      if (this.configs.components?.customColumns)
        return this.configs.components?.customColumns[name];
    },
    verifyClick(column, row) {
      if (column && typeof column.to == "function") {
        const route = column.to(row[column.key || column.name], column, row);
        //if (route.target) {
        const url = this.$router.resolve(route).href;
        window.open(url, "_blank");
        //} else
        //  this.$router.push(column.to(row[column.key || column.name], column, row));
      }
      return;
    },

    increaseQuantity(column, row) {
      let value = this.tempValue || this.formatData(column, row, false);

      value = (value || 0) + 1;

      this.tempValue = value;
      this.save(this.getIndex(row), row, column, value);
    },
    decreaseQuantity(column, row) {
      let value =
        this.tempValue ||
        (this.tempValue === 0 ? 0 : this.formatData(column, row, false));

      if (value && value >= 1) value--;

      this.tempValue = value;
      this.save(this.getIndex(row), row, column, parseFloat(value));
    },
    getColor(column, row) {
      return column.color || row[column.key || column.name]
        ? row[column.key || column.name].color
        : false;
    },
    getIcon(column, row) {
      return column.icon || row[column.key || column.name]
        ? row[column.key || column.name].icon
        : false;
    },
    editingInit(index, col) {
      return this.editing[index] && this.editing[index][col.key || col.name]
        ? true
        : false;
    },

    getIndex(row) {
      return this.items.findIndex((item) => item["@id"] == row["@id"]);
    },

    startEditing(index, col, row, value) {
      if (col.editable == false || (col.key && col.key.indexOf(".") != -1))
        return;

      if (col.list)
        this.editedValue = this.formatList(
          col,
          this.items[index][col.key || col.name]
        );
      else this.editedValue = this.format(col, row, value);
      this.editing[index] = { [col.key || col.name]: true };
      this.showEdit[index] = { [col.key || col.name]: false };
    },

    stopEditing(index, col, row) {
      let editing = this.$copyObject(this.editing);
      editing[index] = {
        [col.key || col.name]: false,
      };

      this.saveEditing[index] = {
        [col.key || col.name]: true,
      };
      this.editing = editing;

      this.save(index, row, col, this.editedValue?.value || this.editedValue);
    },
    isInvalid() {
      return true;
    },
    isEditing(index, col) {
      return this.saveEditing[index] &&
        this.saveEditing[index][col.key || col.name]
        ? true
        : false;
    },
    saved(data) {
      let editIndex = this.getIndex(data);
      let items = this.$copyObject(this.items);

      if (editIndex >= 0) items[editIndex] = data;
      else items.push(data);

      this.$store.commit(this.configs.store + "/SET_ITEMS", items);

      //this.tableKey++;

      this.$emit("saved", data, editIndex);
    },
    save: debounce(function (index, row, col, value) {
      this.$store.commit(this.configs.store + "/SET_ITEM", row);

      let c = col.list
        ? this.formatList(col, row[col.key || col.name])?.value
        : this.format(col, row, row[col.key || col.name]);
      if (c == value) {
        this.editing = [];
        this.saveEditing[index] = {
          [col.key || col.name]: false,
        };
        return;
      }
      let params = {};
      if (row["@id"]) params["id"] = row["@id"].split("/").pop();

      params[col.key || col.name] =
        this.saveFormat(col.key || col.name, value, row) ||
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
            let items = this.$copyObject(this.items);

            if (index >= 0) items[index] = data;
            else items.push(data);
            this.$store.commit(this.configs.store + "/SET_ITEMS", items);
            //this.tableKey++;
            this.$q.notify({
              message: this.$tt(this.configs.store, "message", "success"),
              position: "bottom",
              type: "positive",
            });
            this.saved(data, index);
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
          this.editing = [];
          this.tempValue = null;
          this.saveEditing[index] = {
            [col.key || col.name]: false,
          };
        });
    }, 500),
  },
};
</script>
