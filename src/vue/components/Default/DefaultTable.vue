<template>
  <div
    v-if="configsLoaded"
    :class="[
      configs['full-height'] == false ? '' : 'full',
      'full-height full-width ',
      'default-table',
    ]"
  >
    <div
      class="q-gutter-sm full-height"
      v-if="
        $q.screen.gt.sm &&
        configs.filters &&
        configs.externalFilters != false &&
        configs.headers != false
      "
    >
      <DefaultExternalFilters
        :configs="configs"
        @loadData="loadData"
      ></DefaultExternalFilters>
    </div>
    <q-table
      :grid="isTableView"
      class="default-table full-height"
      dense
      :rows="items"
      :loading="isLoading"
      :row-key="columns[0].name"
      v-model:pagination="pagination"
      @request="loadData"
      :rows-per-page-options="rowsOptions"
      :key="tableKey"
      binary-state-sort
    >
      <template v-slot:body="props">
        <q-tr
          :props="props.row"
          @click="rowClick(props.row, $event)"
          :class="configs.expandedChild ? 'bg-transparent' : ''"
        >
          <q-td
            v-if="configs.selection"
            :class="configs.expandedChild ? 'bg-transparent' : ''"
          >
            <q-checkbox
              v-model="selectedRows[items.indexOf(props.row)]"
              v-bind:value="false"
              :disable="selectionDisabled(props.row, configs)"
            />
          </q-td>
          <q-td
            key="expand"
            v-if="configs.expanded || configs.expandedChild"
            :class="configs.expandedChild ? 'bg-transparent' : ''"
          >
            <q-btn
              v-if="isExpandRow(props.row) && !configs.expandedChild"
              dense
              flat
              round
              :icon="
                expandedRows.includes(props.row['@id'])
                  ? 'keyboard_arrow_up'
                  : 'keyboard_arrow_down'
              "
              @click="toggleExpand(props.row)"
            />
            <q-icon
              v-else-if="configs.expandedChild"
              class="q-ml-md"
              name="subdirectory_arrow_right"
              size="19"
            />
          </q-td>
          <q-td
            :style="styleColumn(column, props.row)"
            v-for="(column, index) in columns"
            :key="column.key || column.name"
            :class="[
              'text-' + column.align,
              { 'dragging-column': isDraggingCollumn[index] },
              { hidden: !shouldIncludeColumn(column) },
              configs.expandedChild ? 'bg-transparent' : '',
            ]"
          >
            <DefaultInput
              :columnName="column.key || column.name"
              :row="props.row"
              :configs="{ ...configs, editOnHover: false }"
              @saved="saved"
              @loadData="loadData"
            />
          </q-td>
          <q-td
            class="q-gutter-sm text-right"
            :class="configs.expandedChild ? 'bg-transparent' : ''"
          >
            <DefaultButtonDialog
              v-if="configs.editable != false"
              :configs="{
                'full-width':
                  configs['full-width'] != undefined
                    ? configs['full-width']
                    : columns.length >= 16,
                'full-height': configs['full-height'],
                icon: 'edit',
                store: configs.store,
                label: 'edit',
                disable: isLoading || editing.length > 0,
                component: this.$components.DefaultForm,
                componentConfigs: configs,
              }"
              :row="props.row"
              @click="editItem(props.row)"
              @saved="saved"
              @error="error"
            />

            <DefaultDelete
              @deleted="deleted"
              :configs="configs"
              :item="props.row"
              v-if="configs.delete != false"
            />

            <DefaultComponent
              :componentConfig="tableActionsComponent()"
              :row="props.row"
              :configs="configs"
              @saved="savedComponent"
              @loadData="loadData"
              @reload="reloadData"
            />
          </q-td>
        </q-tr>
        <template
          v-if="configs.expanded && expandedRows.includes(props.row['@id'])"
        >
          <tr>
            <td
              class="q-pa-none"
              colspan="100%"
              :style="{ height: 'auto', padding: '0 !important' }"
            >
              <component
                :configs="{ ...configs.expanded, expandedChild: true }"
                :row="row"
                :is="configs.expanded.component"
                @loadData="loadData"
                @saved="saved"
                @save="save"
                @error="error"
                @reload="reloadData"
                @deleted="deleted"
              />
            </td>
          </tr>
        </template>
      </template>

      <template v-slot:header="props">
        <q-tr :props="props.row" v-if="configs.headers != false">
          <q-th v-if="configs.selection">
            <q-checkbox
              v-on:click.native="toggleSelectAll"
              v-model="selectAll"
            />
          </q-th>
          <q-th key="expand" v-if="configs.expanded"></q-th>
          <q-th
            @mousedown="startDrag(index)"
            @mouseup="stopDrag()"
            @mousemove="dragColumn(index)"
            :style="styleColumn(column)"
            :class="[
              'text-' + column.align,
              { 'no-drag': index === 0 && nodrag },
              { 'sortable-header': column.sortable },
              {
                asc:
                  column.sortable &&
                  sortedColumn === (column.key || column.name) &&
                  sortDirection === 'ASC',
              },
              {
                desc:
                  column.sortable &&
                  sortedColumn === (column.key || column.name) &&
                  sortDirection === 'DESC',
              },
              { 'dragging-column': isDraggingCollumn[index] },
              { hidden: !shouldIncludeColumn(column) },
            ]"
            v-for="(column, index) in columns"
            @click="sortTable(column.key || column.name)"
            class="header-column"
            @mouseover="
              column.columnFilter == true
                ? setShowInput(column.key || column.name)
                : false
            "
          >
            <div
              v-if="this.configs.filters && column.filter != false"
              @click="stopPropagation"
            >
              <q-menu
                transition-show="flip-right"
                transition-hide="flip-left"
                v-model="showInput[column.key || column.name]"
                anchor="top middle"
                self="bottom middle"
                persistent
              >
                <q-list style="min-width: 100px">
                  <q-item>
                    <q-item-section>
                      <FilterInputs
                        :key="filterKey"
                        :column="column"
                        :configs="configs"
                        @loadData="loadData"
                        @focus="
                          forceShowInput = true;
                          showInput[column.key || column.name];
                        "
                        @blur="
                          loadData();
                          forceShowInput = false;
                        "
                      >
                      </FilterInputs>
                      <q-spinner-ios
                        class="loading-primary"
                        v-if="isLoading && colFilter[column.key || column.name]"
                        size="2em"
                      />
                      <q-icon
                        name="close"
                        @click.stop="
                          clearFilter(column.key || column.name);
                          loadData();
                        "
                        v-else-if="colFilter[column.key || column.name]"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </div>
            <div class="">
              <span class="custom-icon-text">
                <q-icon
                  v-if="isDragging && index === draggedColumnIndex"
                  :name="
                    draggedColumnPosition === 'before'
                      ? 'keyboard_arrow_left'
                      : 'keyboard_arrow_right'
                  "
                />

                {{ $tt(configs.store, "input", column.label) }}
                <q-icon
                  v-if="column.sortable"
                  :name="
                    sortedColumn === column.name || sortedColumn === column.key
                      ? sortDirection === 'ASC'
                        ? 'arrow_upward'
                        : 'arrow_downward'
                      : 'unfold_more'
                  "
                  size="14px"
                />
                <q-icon
                  name="filter_list"
                  v-if="colFilter[column.key || column.name]"
                />
              </span>
            </div>
          </q-th>
          <q-th
            v-if="
              tableActionsComponent() ||
              configs.delete != false ||
              configs.edit != false
            "
          >
          </q-th>
        </q-tr>
      </template>

      <template v-slot:top-left="props" v-if="configs.headers != false">
        <div class="q-gutter-sm">
          <h3
            :class="configs?.title?.class || 'text-secondary text-h6 q-mb-md'"
          >
            <q-icon
              v-if="configs?.title?.icon"
              :name="configs.title.icon.name"
              :size="configs.title.icon.size || '24px'"
              :class="configs.title.icon.class || 'q-mr-sm'"
            />
            {{
              $tt(
                configs?.title ? configs.context || configs.store : "route",
                "title",
                configs?.title && typeof configs?.title != "object"
                  ? configs?.title
                  : configs.context || configs.store || this.$route.name
              )
            }}
          </h3>
        </div>
      </template>

      <template v-slot:top-right="props" v-if="configs.headers != false">
        <div class="table-toolbar">
          <q-toolbar class="q-gutter-sm">
            <DefaultButtonDialog
              v-if="configs.add != false"
              :configs="{
                'full-width':
                  configs['full-width'] != undefined
                    ? configs['full-width']
                    : columns.length >= 16,
                'full-height': configs['full-height'],
                icon: 'add',
                store: configs.store,
                label: 'add',
                disable: isLoading || editing.length > 0,
                component: this.$components.DefaultForm,
                componentConfigs: configs,
              }"
              @click="editItem({})"
              @saved="saved"
              @error="error"
            />
            <q-space v-if="configs.editable != false"></q-space>

            <q-checkbox
              dense
              v-model="selectAll"
              @click.native="toggleSelectAll"
              v-if="$q.screen.gt.sm == false && configs.selection"
            />
            <q-space
              v-if="$q.screen.gt.sm == false && configs.selection"
            ></q-space>

            <ToolBar
              :configs="configs"
              :columns="columns"
              @saved="saved"
              @loadData="loadData"
              @reload="reloadData"
            />

            <q-btn
              v-if="isTableView && configs.controls != false"
              @click="toggleView"
              class="q-pa-xs btn-primary"
              label=""
              dense
              icon="menu"
            >
              <q-tooltip>
                {{ $tt(configs.store, "tooltip", "table") }}
              </q-tooltip>
            </q-btn>
            <q-btn
              v-else-if="configs.controls != false"
              @click="toggleView"
              class="q-pa-xs btn-primary"
              label=""
              dense
              icon="dashboard"
            >
              <q-tooltip>
                {{ $tt(configs.store, "tooltip", "cards") }}
              </q-tooltip>
            </q-btn>
            <q-btn
              v-if="configs.controls != false"
              class="q-pa-xs btn-primary"
              label=""
              dense
              icon="view_week"
            >
              <q-tooltip>
                {{ $tt(configs.store, "tooltip", "config_columns") }}
              </q-tooltip>
              <!-- Menu de configuração de colunas -->
              <q-menu v-model="showColumnMenu">
                <q-list>
                  <q-item
                    v-for="column in columns"
                    :key="column.key || column.name"
                  >
                    <q-item-section>
                      <q-toggle
                        v-model="
                          toogleVisibleColumns[column.key || column.name]
                        "
                        :label="$tt(configs.store, 'input', column.name)"
                        @click="saveVisibleColumns"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
                <q-btn
                  slot="bottom"
                  class="btn-primary"
                  label="Fechar"
                  @click="toggleShowColumnMenu"
                />
              </q-menu>
            </q-btn>

            <q-btn
              v-if="configs.controls != false"
              class="q-pa-xs btn-primary"
              label=""
              dense
              :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
              @click="toggleMaximize(props)"
            >
              <q-tooltip>
                {{
                  $tt(
                    configs.store,
                    "tooltip",
                    props.inFullscreen ? "minimize" : "maximize"
                  )
                }}
              </q-tooltip>
            </q-btn>
            <q-btn
              icon-right="archive btn-primary"
              dense
              class="q-pa-xs btn-primary"
              label=""
              @click="configs.export"
              v-if="configs.export"
            >
              <q-tooltip>
                {{ $tt(configs.store, "tooltip", "export") }}
              </q-tooltip>
            </q-btn>
          </q-toolbar>
        </div>
      </template>

      <template v-slot:item="props">
        <div
          @click="rowClick(props.row, $event)"
          class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
          :style="
            selectedRows[items.indexOf(props.row)]
              ? { transform: 'scale(0.95)' }
              : {}
          "
        >
          <q-card
            bordered
            flat
            :class="
              selectedRows[items.indexOf(props.row)] ? 'selected-card' : ''
            "
          >
            <q-card-section>
              <q-item>
                <template
                  v-for="(column, index) in columns"
                  :key="column.key || column.name"
                >
                  <q-item-section
                    v-if="column.isIdentity"
                    :class="[{ hidden: !shouldIncludeColumn(column) }]"
                  >
                    <template
                      v-if="tableColumnComponent(column.key || column.name)"
                    >
                      <DefaultComponent
                        :componentConfig="
                          tableColumnComponent(column.key || column.name)
                        "
                        :row="props.row"
                        :configs="configs"
                        @saved="savedComponent"
                        @loadData="loadData"
                        @reload="reloadData"
                      />
                    </template>
                    <q-btn
                      class="btn-primary"
                      v-else-if="
                        column.to && props.row[column.key || column.name]
                      "
                      @click="verifyClick(column, props.row)"
                      :color="getColor(column, props.row)"
                      :icon="getIcon(column, props.row)"
                    >
                      {{
                        this.format(
                          column,
                          props.row,
                          getNameFromList(column, props.row)
                        )
                      }}
                    </q-btn>
                    <span
                      v-else
                      :icon="getIcon(column, props.row)"
                      :color="getColor(column, props.row)"
                    >
                      {{
                        this.format(
                          column,
                          props.row,
                          getNameFromList(column, props.row)
                        )
                      }}
                    </span>
                  </q-item-section>
                </template>
                <q-item-section side>
                  <q-checkbox
                    v-if="configs.selection"
                    dense
                    v-model="selectedRows[items.indexOf(props.row)]"
                    v-bind:value="false"
                    :disable="selectionDisabled(props.row, configs)"
                  />
                </q-item-section>
              </q-item>
            </q-card-section>
            <q-separator />
            <q-list dense>
              <template
                v-for="(column, index) in columns"
                :key="column.key || column.name"
              >
                <q-item v-if="!column.isIdentity">
                  <q-item-section>
                    <q-item-label>{{
                      $tt(configs.store, "input", column.label)
                    }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <DefaultInput
                      :columnName="column.key || column.name"
                      :row="props.row"
                      :configs="configs"
                      @saved="saved"
                      @loadData="loadData"
                    />
                  </q-item-section>
                </q-item>
              </template>
            </q-list>
            <q-separator />
            <q-card-section>
              <q-item-section side class="">
                <div class="row justify-end q-gutter-sm">
                  <DefaultButtonDialog
                    v-if="configs.editable != false"
                    :configs="{
                      'full-width':
                        configs['full-width'] != undefined
                          ? configs['full-width']
                          : columns.length >= 16,
                      'full-height': configs['full-height'],
                      icon: 'edit',
                      store: configs.store,
                      label: 'edit',
                      disable: isLoading || editing.length > 0,
                      component: this.$components.DefaultForm,
                      componentConfigs: configs,
                    }"
                    :row="props.row"
                    @click="editItem(props.row)"
                    @saved="saved"
                    @error="error"
                  />
                  <DefaultDelete
                    @deleted="deleted"
                    :configs="configs"
                    :item="props.row"
                    v-if="configs.delete != false"
                  />
                  <DefaultComponent
                    :componentConfig="tableActionsComponent()"
                    :row="props.row"
                    :configs="configs"
                    @saved="savedComponent"
                    @loadData="loadData"
                    @reload="reloadData"
                  />
                </div>
              </q-item-section>
            </q-card-section>
            <q-card-section v-if="configs.expanded" class="flex justify-center">
              <q-btn
                v-if="isExpandRow(props.row)"
                dense
                flat
                round
                :icon="
                  expandedRows.includes(props.row['@id'])
                    ? 'keyboard_arrow_up'
                    : 'keyboard_arrow_down'
                "
                @click="toggleExpand(props.row)"
              />
            </q-card-section>
            <q-card-section
              v-if="configs.expanded && expandedRows.includes(props.row['@id'])"
            >
              <component
                :configs="{ ...configs.expanded, expandedChild: true }"
                :row="row"
                :is="configs.expanded.component"
                @loadData="loadData"
                @saved="saved"
                @save="save"
                @error="error"
                @reload="reloadData"
                @deleted="deleted"
              />
            </q-card-section>
          </q-card>
        </div>
      </template>

      <template v-slot:bottom-row v-if="configs.bottom != false">
        <q-tr class="tr-sum">
          <q-td v-if="configs.selection"> </q-td>
          <q-td key="expand" v-if="configs.expanded"></q-td>
          <q-td
            v-for="(column, index) in columns"
            :class="[
              'text-' + column.align,
              { hidden: !shouldIncludeColumn(column) },
            ]"
          >
            <span
              v-if="
                sumColumn[column.key || column.name] != false &&
                sumColumn[column.key || column.name] != undefined
              "
            >
              {{
                (column.prefix || "") +
                format(column, {}, sumColumn[column.key || column.name]) +
                (column.sufix || "")
              }}
              <q-icon size="1.0em" name="" />
            </span>
          </q-td>
          <q-td
            v-if="
              tableActionsComponent() ||
              configs.delete != false ||
              configs.edit != false
            "
          >
          </q-td>
        </q-tr>
      </template>

      <template v-slot:loading>
        <q-inner-loading showing class="loading-primary" />
      </template>

      <template v-slot:no-data="{ icon, message, filter }">
        <div class="full-width row flex-center text-accent q-gutter-sm">
          <q-icon size="2em" name="sentiment_dissatisfied" />
          <span>
            {{ message }}
          </span>
          <q-icon size="2em" :name="filter ? 'filter_b_and_w' : icon" />
        </div>
      </template>
    </q-table>
  </div>
</template>

<script>
import DefaultExternalFilters from "@controleonline/ui-default/src/vue/components/Default/Filters/DefaultExternalFilters";
import FilterInputs from "@controleonline/ui-default/src/vue/components/Default/Filters/FilterInputs";
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/vue/components/Default/Scripts/DefaultFiltersMethods.js";
import { mapActions, mapGetters } from "vuex";
import isEqual from "lodash/isEqual";
import ToolBar from "@controleonline/ui-default/src/vue/components/Default/ToolBar";
import DefaultDelete from "@controleonline/ui-default/src/vue/components/Default/DefaultDelete";
import { debounce } from "lodash";

export default {
  props: {
    configs: {
      type: Object,
      required: true,
    },
    rowsOptions: {
      type: Array,
      required: false,
      default() {
        return [50, 100, 200, 500];
      },
    },
  },

  components: {
    DefaultDelete,
    DefaultExternalFilters,
    FilterInputs,
    ToolBar,
  },

  data() {
    return {
      expandedRows: [],
      editIndex: false,
      forceShowInput: false,
      hideFilterTimeout: false,
      showInput: {},
      filterKey: 0,
      configsLoaded: false,
      isTableView: this.$q.screen.gt.sm == false,
      listAutocomplete: [],
      showColumnMenu: false,
      nodrag: false,
      timeoutId: null,
      isDraggingCollumn: [],
      isDragging: false,
      tableKey: 0,
      draggedColumnIndex: -1,
      showEdit: [],
      saveEditing: [],
      selectAll: false,
      sortedColumn: null,
      sortDirection: null,
      editedValue: false,
      editing: [],
      sumColumn: [],
      colFilter: {},
      listObject: {},
      items: [],
      item: {},
      selectedItems: [],
      selectedRows: new Array(this.rowsOptions.pop()).fill(false),
      dialog: false,
      toogleVisibleColumns: [],
      pagination: {
        page: 1,
        rowsNumber: 0,
        rowsPerPage: this.rowsOptions[0] || 50,
      },
    };
  },

  created() {
    this.$store.commit(this.configs.store + "/SET_ISLOADING", false);
    this.removeHiddenColumns();
  },
  mounted() {
    this.$nextTick(() => {
      this.colFilter = this.$copyObject(this.filters);
      this.search = this.colFilter["search"];
      this.saveVisibleColumns();
      if (this.myCompany) {
        this.loadPersistentFilters();
        this.loadData();
      }
    });
  },

  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
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
  },
  watch: {
    myCompany: {
      handler: function (current, preview) {
        if (current?.id != preview?.id) {
          if (this.configs.companyParam != false) {
            this.addFilter(
              this.configs.companyParam || "company",
              "/people/" + current?.id
            );

            this.loadPersistentFilters();
            this.loadData();
          }
        }
      },
      deep: true,
    },
    reload: {
      handler: function (reload) {
        if (reload == true) this.loadData();
      },
      deep: true,
    },
    filters: {
      handler: function () {
        this.colFilter = this.$copyObject(this.filters);
        this.search = this.colFilter?.search;
        this.filterKey++;
      },
      deep: true,
    },
    selectedRows: {
      handler: function (selectedRows) {
        this.selectedItems = this.items.filter(
          (objeto, indice) => selectedRows[indice]
        );
        if (
          !isEqual(
            this.$copyObject(this.selected),
            this.$copyObject(this.selectedItems)
          )
        ) {
          this.$store.commit(
            this.configs.store + "/SET_SELECTED",
            this.$copyObject(this.selectedItems)
          );
          this.$emit("selected", this.$copyObject(this.selectedItems));
        }
      },
      deep: true,
    },
    selected: {
      handler: function () {
        this.discoverySelected();
      },
      deep: true,
    },
  },
  methods: {
    ...DefaultFiltersMethods,
    isExpandRow(row) {
      return (
        this.configs.expanded?.noExpand == undefined ||
        this.configs.expanded?.noExpand(row) == false
      );
    },
    toggleExpand(row) {
      if (this.expandedRows.includes(row["@id"])) {
        this.expandedRows = this.expandedRows.filter(
          (rowId) => rowId !== row["@id"]
        );
      } else {
        let filters = this.configs.expanded.filters(row);

        this.$store.commit(
          this.configs.expanded.store + "/SET_FILTERS",
          filters
        );
        this.expandedRows = [row["@id"]];
      }
    },

    styleColumn(column, row) {
      if (typeof column.style == "function") return column.style(row);
      return "";
    },
    reloadData() {
      this.$emit("reload");
    },
    deleted(item) {
      let items = this.$copyObject(this.items);
      items = items.filter((i) => i["@id"] != item["@id"]);
      this.updateItems(items);
      this.reloadData();
      this.tableKey++;
    },

    updateItems(items) {
      this.$store.commit(this.configs.store + "/SET_ITEMS", items);
      this.items = items;
      this.tableKey++;
    },
    discoverySelected() {
      if (!this.configs.selection) return;
      let selectedRows = [];
      this.items.forEach((element, index) => {
        selectedRows[index] = false;
        this.selected.forEach((e) => {
          if (isEqual(this.$copyObject(e), this.$copyObject(element))) {
            selectedRows[index] = true;
          }
        });
      });
      this.selectedRows = selectedRows;
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
    toggleView() {
      this.isTableView = !this.isTableView;
      this.adjustElementHeight();
    },
    toggleMaximize(props) {
      props.toggleFullscreen();
      setTimeout(() => {
        if (this.configs["full-height"] == false && !props.inFullscreen)
          this.scrollToTop(this.adjustElementHeight(props.inFullscreen));
        else this.adjustElementHeight(props.inFullscreen);
      }, 500);
    },
    rowClick(row, event) {
      this.$emit("rowClick", row, event);
    },
    removeHiddenColumns() {
      let columns = this.$copyObject(this.columns);
      columns.forEach((column, columnIndex) => {
        if (!this.shouldIncludeColumn(column)) delete columns[columnIndex];
        else columns[columnIndex].visible = true;
      });
      this.$store.commit(
        this.configs.store + "/SET_COLUMNS",
        this.recriarIndices(columns)
      );
      this.toogleVisibleColumns = this.$copyObject(
        this.visibleColumns || columns
      );
    },
    recriarIndices(arrayOriginal) {
      return Object.values(
        arrayOriginal.reduce((obj, valor, indice) => {
          obj[indice] = valor;
          return obj;
        }, {})
      );
    },
    saveVisibleColumns() {
      let columns = this.$copyObject(this.columns);
      columns.forEach((column, columnIndex) => {
        if (this.toogleVisibleColumns[column.key || column.name] != false) {
          columns[columnIndex].visible = true;
          this.toogleVisibleColumns[column.key || column.name] = true;
        } else {
          columns[columnIndex].visible = false;
        }
      });

      this.applyVisibleColumns(this.toogleVisibleColumns);
      this.$store.commit(this.configs.store + "/SET_COLUMNS", columns);
      this.configsLoaded = true;
    },
    toggleShowColumnMenu() {
      this.showColumnMenu = this.showColumnMenu ? false : true;
    },
    stopPropagation(event) {
      event.stopPropagation();
    },
    startDrag(index) {
      if (index !== 0) {
        this.columns.forEach((column, columnIndex) => {
          this.isDraggingCollumn[columnIndex] = false;
        });
        this.draggedColumnIndex = index;

        this.timeoutId = setTimeout(() => {
          this.isDragging = true;
          this.isDraggingCollumn[index] = true;
        }, 100);
      } else {
        this.nodrag = true;
      }
    },
    stopDrag() {
      this.isDraggingCollumn = [];
      this.nodrag = false;
      this.draggedColumnIndex = -1;
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
      if (this.isDragging) {
        //console.log(this.columns);
      }

      this.isDragging = false;
    },
    dragColumn(index) {
      if (this.isDragging && index !== this.draggedColumnIndex) {
        this.isDraggingCollumn = [];

        const draggedColumn = this.columns[this.draggedColumnIndex];
        this.columns.splice(this.draggedColumnIndex, 1);
        this.columns.splice(index, 0, draggedColumn);
        this.draggedColumnIndex = index;

        this.isDraggingCollumn[index] = true;
        this.tableKey += 1;
      }
    },

    tableColumnComponent(name) {
      if (this.configs.components?.customColumns)
        return this.configs.components?.customColumns[name];
    },
    tableActionsComponent() {
      return this.configs.components?.tableActions;
    },

    error(error) {
      this.$emit("error", error);
    },
    savedComponent(data) {
      //this.saved(data);
    },
    saved(data) {
      let index = this.getIndex(data);
      let items = this.$copyObject(this.items);
      console.log(items,data);
      if (index != -1) items[index] = data;
      else items.push(data);
      console.log("eee");
      this.updateItems(items);

      if (this.configs.expandedChild != true) this.$emit("saved", data);
    },

    editItem(item) {
      const index = this.getIndex(item);
      this.item = this.$copyObject(item);
      this.editIndex = index;
    },

    toggleSelectAll() {
      this.selectedRows = this.selectedRows.map((item, index) => {
        if (this.selectionDisabled(this.items[index], this.configs))
          return this.selectedRows[index];
        return this.selectAll;
      });
    },
    sortTable(columnName) {
      const column = this.columns.find((col) => {
        return col.name === columnName || col.key === columnName;
      });

      if (column && column.sortable) {
        if (this.sortedColumn === columnName) {
          this.sortDirection = this.sortDirection === "ASC" ? "DESC" : "ASC";
        } else {
          this.sortedColumn = columnName;
          this.sortDirection = "ASC";
        }

        let filters = this.$copyObject(this.filters);
        if (!this.sortedColumn) delete filters.order;
        else
          filters.order = {
            [this.sortedColumn]: this.sortDirection,
          };

        this.applyFilters(filters);

        if (
          !this.pagination.rowsPerPage ||
          this.totalItems <= this.pagination.rowsPerPage
        ) {
          this.reorderTableData();
        } else {
          this.loadData();
        }
      }
    },
    reorderTableData() {
      if (!this.sortedColumn || !this.sortDirection) {
        return; // Não fazer nada se não houver ordenação
      }
      const clonedData = this.$copyObject(this.items);

      clonedData.sort((a, b) => {
        const aValue = a[this.sortedColumn];
        const bValue = b[this.sortedColumn];
        if (aValue < bValue) {
          return this.sortDirection === "ASC" ? -1 : 1;
        } else if (aValue > bValue) {
          return this.sortDirection === "ASC" ? 1 : -1;
        }
        return 0;
      });

      this.items = clonedData;
    },

    getFilterParams(params) {
      this.columns.forEach((item, i) => {
        if (item.name && this.filters && this.filters[item.key || item.name]) {
          if (this.filters[item.key || item.name] instanceof Array) {
            let obj = [];
            this.filters[item.key || item.name].forEach((valor) => {
              obj.push(valor.value || valor);
            });
            params[item.filterName || item.key || item.name] = obj;
          } else if (this.filters[item.name] instanceof Object) {
            let obj = [];
            Object.entries(this.filters[item.name]).forEach(
              ([chave, valor]) => {
                if (valor?.value) obj.push({ chave: valor.value });
                else obj = this.filters[item.name];
              }
            );
            params[item.filterName || item.key || item.name] = obj;
          } else {
            params[item.filterName || item.key || item.name] =
              this.filters[item.name];
          }

          if (item.filterName) delete params[item.key || item.name];
        }
      });

      let filteredParams = Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== "" && value != null) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      return filteredParams;
    },
    isInvalid() {
      return true;
    },
    sum(column, value) {
      if (column.sum == true) {
        this.sumColumn[column.key || column.name] = this.sumColumn[
          column.key || column.name
        ]
          ? parseFloat(this.sumColumn[column.key || column.name]) +
            parseFloat(value)
          : parseFloat(value);
      }
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

    scrollToTop(callback) {
      const top = 0;
      const currentPosition =
        window.pageYOffset || document.documentElement.scrollTop;

      if (currentPosition > top) {
        window.scrollTo({ top: top, behavior: "smooth" });

        const checkIfDone = () => {
          const newPosition =
            window.pageYOffset || document.documentElement.scrollTop;
          if (newPosition === top || newPosition === 0) {
            if (typeof callback == "function") callback();
          } else {
            window.requestAnimationFrame(checkIfDone);
          }
        };

        window.requestAnimationFrame(checkIfDone);
      } else if (typeof callback == "function") {
        callback();
      }
    },
    adjustElementHeight(full) {
      setTimeout(() => {
        const e = document?.querySelectorAll(
          ".q-body--fullscreen-mixin"
        ).length;
        let elements = [];
        if (e > 0 || full)
          elements = document?.querySelectorAll(".fullscreen .q-table__middle");
        else if (typeof this.$el.querySelectorAll === "function")
          elements = this.$el?.querySelectorAll(
            ".default-table.full .q-table__middle"
          );

        if (elements.length == 0) {
          if (typeof this.$el.querySelectorAll === "function")
            elements = this.$el?.querySelectorAll(
              ".default-table .q-table__middle"
            );
          elements.forEach((element) => {
            if (element) {
              element.style.height = "";
            }
          });
        } else
          elements.forEach((element) => {
            if (element) {
              let position = 30;
              let elementTop = element.getBoundingClientRect().top || 0;
              let screenHeight =
                window.innerHeight * (100 / (0.85 * 100)) - elementTop;
              element.style.height = `calc(${screenHeight}px - ${position}px)`;
            }
          });
      }, 500);
    },
    saveFile(row, column, selected) {
      let params = {};
      params[column.key || column.name] = selected["@id"];
      params.id = row["@id"].split("/").pop();

      this.$store
        .dispatch(this.configs.store + "/save", params)
        .then((data) => {
          this.items[this.items.indexOf(row)] = data;
        });
    },
    loadData(props) {
      this.adjustElementHeight();
      if (this.isLoading) return;
      if (props) {
        this.pagination = props.pagination;
        this.applyFilters(Object.assign(this.filters, props.filters));
      }

      let params = Object.assign(
        this.$copyObject(this.filters),
        this.$copyObject(this.pagination)
      );
      params.itemsPerPage =
        this.pagination.rowsPerPage || this.rowsOptions[0] || 50;
      delete params.rowsNumber;
      delete params.sortBy;
      delete params.descending;
      delete params.rowsPerPage;
      params = this.getFilterParams(params);
      if (this.myCompany && this.configs.companyParam != false)
        params[this.configs.companyParam || "company"] =
          "/people/" + this.myCompany?.id;
      this.sumColumn = {};
      this.items = [];
      this.$store
        .dispatch(this.configs.store + "/getItems", params)
        .then((data) => {
          this.pagination.rowsNumber = this.totalItems;
          data.forEach((d) => {
            for (const key in d) {
              if (d.hasOwnProperty(key)) {
                const value = d[key];
                const column = this.columns.filter(
                  (column) => column.id === key || column.name === key
                );
                if (column.length > 0 && column[0].sum) {
                  this.sum(column[0], value);
                }
              }
            }
          });
          this.items = data;
          this.discoverySelected();
        })
        .catch(() => {
          this.items = [];
        })
        .finally(() => {
          this.adjustElementHeight();
          this.$store.commit(this.configs.store + "/SET_RELOAD", false);
          this.$emit("loaded");
        });
    },
  },
};
</script>

<style lang="scss" src="./Css/DefaultTable.scss" />
<style lang="scss" src="./Css/Colors.scss" />
<style lang="scss" src="./Css/Light.scss" />
<style lang="scss" src="./Css/Dark.scss" />
