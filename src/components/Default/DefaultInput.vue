<template>
  <label
    v-if="
      configs.showLabels &&
      configs.labelType != 'stack-label' &&
      configs.store &&
      (!column.preview || !data || !data['@id'])
    "
  >
    {{ $tt(configs.store, "input", column.label) }}
  </label>
  <label
    v-else-if="
      configs.showLabels &&
      configs.labelType != 'stack-label' &&
      (!column.preview || !data || !data['@id'])
    "
  >
    {{ column.label }}
  </label>

  <template v-if="tableColumnComponent(column.key || column.name)">
    <DefaultComponent
      :componentConfig="tableColumnComponent(column.key || column.name)"
      :row="data[column.key || column.name]"
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
  <template v-else-if="column.inputType == 'file'">
    <File
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
    <File
      v-if="!isPreview()"
      class="file-preview"
      :style="
        !isPreview()
          ? ''
          : { position: 'absolute', 'z-index': 2, 'margin-top': '15px' }
      "
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
    <Html
      v-if="column.inputType == 'file' && isPreview()"
      :readonly="column.editInline != true"
      :editInline="column.editInline"
      :key="key"
      :row="data[column.key || column.name]"
      @saved="forceSave"
      @changed="changed"
    />
  </template>

  <template v-else-if="editingInit(data, column) != true">
    <template v-if="column.multiline == true">
      <template v-for="(v, index) in formatData(column, data, false)">
        <span :style="{ color: getColor(column, data) }">
          {{ column.prefix }}
          {{ v }}
          {{ column.sufix }} </span
        ><br />
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
        <span
          :style="{ color: getColor(column, data) }"
          @click="startEditing(column, data)"
        >
          <template v-if="getIcon(column, data)">
            <q-icon
              :color="getColor(column, data)"
              :name="getIcon(column, data)"
            />
          </template>
          <template v-if="column.inputType == 'icon'">
            <q-icon
              :color="getColor(column, data)"
              :name="formatData(column, data, true)"
            />
          </template>
          {{ column.prefix }}
          {{ tempValue != null ? tempValue : formatData(column, data, false) }}
          {{ column.sufix }}
          <q-icon
            v-if="
              column.inputType !== 'increase' &&
              column.inputType != 'image' &&
              column.editable != false &&
              !isSaving &&
              ((editing[getIndex(data)] &&
                editing[getIndex(data)][column.key || column.name] == true) ||
                configs.editOnHover != false)
            "
            size="1.0em"
            :name="column.list ? 'unfold_more' : 'edit'"
          />
          <q-icon
            v-else-if="
              column.inputType !== 'increase' && column.editable == true
            "
            size="1.0em"
            name=""
          />
        </span>
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
    <q-input
      :disable="column.editable == false"
      outlined
      dense
      v-if="column.inputType == 'date-range'"
      v-model="data[column.key || column.name]"
      mask="##/##/####"
      :rules="['$formatter.validateBRDate']"
      @keydown.enter="save(data[column.key || column.name])"
    >
      <template v-slot:append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-date
              v-model="tempDate"
              @update:modelValue="
                (val) =>
                  (data[column.key || column.name] =
                    $formatter.formatDateToBR(val))
              "
            >
              <div class="row items-center justify-end">
                <q-btn
                  v-close-popup
                  :label="$tt(configs.store, 'btn', 'apply')"
                  @click="save(row, column)"
                  class="btn-primary"
                  flat
                />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>

    <SelectInput
      v-else-if="getList(configs, column)"
      multiple
      :disable="column.editable == false"
      :store="configs.store"
      :labelType="configs.labelType || 'stack-label'"
      :label="column.label"
      :searchAction="getList(configs, column)"
      :filters="getSearchFilters(column, data)"
      :formatOptions="column.formatList"
      :searchParam="column.searchParam || 'search'"
      :column="column"
      @blur="changed"
      @selected="onSelected"
    />
    <q-input
      outlined
      v-else
      :disable="column.editable == false"
      dense
      :stack-label="configs.labelType == 'stack-label'"
      lazy-rules
      v-model="data[column.key || column.name]"
      :type="column.inputType == 'number' ? 'number' : 'text'"
      @keydown.enter="save(data[column.key || column.name])"
      :prefix="column.prefix"
      :sufix="column.sufix"
      @blur="changed"
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
</template>
<script>
import File from "@controleonline/ui-default/src/components/Default/Common/Inputs/File.vue";
import { mapActions, mapGetters } from "vuex";
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";
import debounce from "lodash/debounce";
import SelectInput from "@controleonline/ui-default/src/components/Default/Common/Inputs/SelectInput";
import Html from "@controleonline/ui-default/src/components/Default/Common/Inputs/Html.vue";
export default {
  components: {
    File,
    SelectInput,
    Html,
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
      data: false,
      isItemSaved: [],
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
    item() {
      return this.$store.getters[this.configs.store + "/item"] || {};
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

  created() {
    this.data = this.$copyObject(this.row);
    this.$store.commit(this.configs.store + "/SET_ITEM", this.row);
  },
  watch: {
    item() {
      this.data = this.$copyObject(this.item);
    },
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
      if (column && typeof column.to == "function") {
        const route = column.to(
          data[this.column.key || this.column.name],
          this.column,
          data
        );
        //if (route.target) {
        const url = this.$router.resolve(route).href;
        window.open(url, "_blank");
        //} else
        //  this.$router.push(column.to(data[this.column.key || this.column.name], this.column, data));
      }
      return;
    },

    forceSave() {
      this.$emit("forceSave");
    },
    isPreview() {
      return this.column.preview && this.data && this.data["@id"];
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
    getColor(column, data) {
      return column.color || data[column.key || column.name]
        ? data[column.key || column.name].color
        : false;
    },
    getIcon(column, data) {
      return column.icon || data[column.key || column.name]
        ? data[column.key || column.name].icon
        : false;
    },

    startEditing(col, data) {
      let value = this.formatData(col, data, true);
      let index = this.getIndex(data);
      if (col.editable == false || (col.key && col.key.indexOf(".") != -1))
        return;

      if (col.list) this.data[col.key || col.name] = this.formatList(col, data);
      else this.data[col.key || col.name] = this.format(col, data, value);

      this.editing[index] = { [col.key || col.name]: true };
    },

    isInvalid() {
      return true;
    },
    isSavingItem(data) {
      let index = this.getIndex(data);
      return this.isItemSaved[index] &&
        this.isItemSaved[index][this.column.key || this.column.name]
        ? true
        : false;
    },
    onSelected(value) {
      this.data[this.column.key || this.column.name] = value;
    },
    saved(data) {
      let editIndex = this.getIndex(data);
      let items = this.$copyObject(this.items);

      if (editIndex >= 0) items[editIndex] = data;
      else items.push(data);

      this.$store.commit(this.configs.store + "/SET_ITEMS", items);
      this.$emit("saved", data);
      this.$emit("changed", data);

      setTimeout(() => {
        this.$store.commit(this.configs.store + "/SET_ITEM", data);
        this.key++;
      }, 300);
    },
    save: debounce(function (value) {
      let data = this.$copyObject(this.data);
      let col = this.$copyObject(this.column);
      let index = this.getIndex(data);
      let item = this.item[col.key || col.name] || value;
      let c = col.list
        ? this.formatList(col, item)?.value
        : this.format(col, this.item, item);

      if (c == value) return;

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
          this.editing = [];
          this.tempValue = null;
          this.isItemSaved[index] = {
            [col.key || col.name]: false,
          };
        });
    }, 500),
  },
};
</script>
