import Filters from "@controleonline/ui-default/src/utils/filters";
import isEqual from "lodash/isEqual";

export function sendFilterColumn(colName) {
  const column = this.getColumnByName(colName);
  let filters = this.$copyObject(this.filters || []) || [];
  if (!this.colFilter[colName]) {
    delete filters[colName];
  } else if (this.colFilter[colName] instanceof Array) {
    filters[colName] = [];
    this.colFilter[colName].forEach((item) => {
      filters[colName].push(item);
    });
  } else {
    filters[colName] = this.formatFilter(column, this.colFilter[colName]);
  }
  this.applyFilters(filters);
}

export function addFilter(key, value) {
  this.loadPersistentFilters();
  let filters = this.$copyObject(this.filters);
  filters[key] = value;
  this.applyFilters(filters);
}

export function loadPersistentFilters() {
  const persistentFilter = new Filters(
    this.$route.name,
    this.$store.getters[this.configs.store + "/store"] ||
      this.$store.getters[this.configs.store + "/resourceEndpoint"]
  );
  let filters = persistentFilter.getFilters();
  let visibleColumns = persistentFilter.getVisibleColumns();
  this.applyVisibleColumns(visibleColumns);
  this.applyFilters(filters);
}

export function applyVisibleColumns(visibleColumns) {
  let f = this.$copyObject(visibleColumns);
  let pf = this.$copyObject(this.visibleColumns);
  if (!isEqual(f, pf))
    this.$store.commit(this.configs.store + "/SET_VISIBLECOLUMNS", f);
}

export function applyFilters(filters) {
  let f = this.$copyObject(filters);
  let pf = this.$copyObject(this.filters);
  if (f != pf) this.$store.commit(this.configs.store + "/SET_FILTERS", f);
}
export function onSearch() {
  let filters = this.$copyObject(this.filters);
  if (this.search != "") filters["search"] = this.search;
  else delete filters["search"];
  this.applyFilters(filters);
  this.sendFilter();
}
export function clearFilters() {
  let filters = this.$copyObject(this.filters);

  this.columns.forEach((column) => {
    if ((column.key || column.name) in filters) {
      delete filters[column.key || column.name];
    }
  });
  delete filters.search;
  this.$store.commit(this.configs.store + "/SET_FILTERS", filters);
  this.sendFilter();
}

export function sendFilter() {
  this.$emit("loadData");
}
export function clearFilter(colName) {
  this.colFilter[colName] = undefined; // Limpa o filtro para a coluna correspondente
  this.sendFilterColumn(colName);
}

export function setShowInput(colName) {
  if (this.forceShowInput == false) {
    this.showInput = { [colName]: true };
    clearInterval(this.hideFilterTimeout);
    this.hideFilterTimeout = setTimeout(() => {
      if (this.forceShowInput == false) this.hideInput(colName);
    }, 3000);
  }
}

export function hideInput(colName) {
  this.showInput = { [colName]: false };
}

export function mask(column) {
  if (column.mask instanceof Function) return column.mask();
  else return column.mask;
}

export function isEmptyProxy(obj) {
  // Verifique se o objeto é um Proxy
  if (!obj || !(obj instanceof Object) || !obj.hasOwnProperty("__ob__")) {
    return this.isProxyEmpty(obj);
  }

  // Obtenha as chaves do objeto
  const keys = Object.keys(obj);

  // Verifique se não há nenhuma chave no objeto
  return keys.length === 0;
}

export function isProxyEmpty(proxy) {
  for (const _ in proxy) {
    if (proxy.hasOwnProperty(_)) {
      return false;
    }
  }
  return true;
}

export function getIndex(row) {
  return this.items.findIndex((item) => item["@id"] == row["@id"]);
}

export function formatData(column, row, editing) {
  let data = this.format(
    column,
    row,
    this.getNameFromList(column, row),
    editing
  );

  return data;
}

export function getList(configs, column) {
  if (configs?.list && configs?.list[column.key || column.name])
    return configs?.list[column.key || column.name];
  else return column.list;
}

export function shouldIncludeColumn(column) {
  const isVisibleFunction =
    this.configs?.columns &&
    this.configs?.columns[column.key || column.name]?.visible;
  if (typeof isVisibleFunction === "function")
    return isVisibleFunction() !== false && column.visible !== false;
  return isVisibleFunction !== false && column.visible !== false;
}

export function editingInit(data, col) {
  let index = this.getIndex(data);
  return this.editing[index] && this.editing[index][col.key || col.name]
    ? true
    : false;
}

export function getNameFromList(column, row) {
  let editing = this.editingInit(row, column);
  let name = null;

  if (column.list == undefined || typeof column.list == "string") {
    return row[column.key || column.name];
  } else {
    name = column.list.find((item) => {
      let i;
      if (item instanceof Object) i = this.formatList(column, item);
      else i = this.format(column, row, item, editing);

      return (
        i &&
        i.value &&
        i.value.toString().trim() ==
          (row[column.key || column.name] instanceof Object &&
          row[column.key || column.name]
            ? row[column.key || column.name]["@id"]
              ? row[column.key || column.name]["@id"]
                  .split("/")
                  .pop()
                  .toString()
                  .trim()
              : row[column.key || column.name].value
            : row[column.key || column.name]
            ? row[column.key || column.name].toString().trim()
            : null)
      );
    });
    return name instanceof Object && !editing
      ? this.formatList(column, name).label
      : this.formatList(column, name);
  }
}

export function formatFilter(column, value) {
  if (column && column.formatFilter instanceof Function)
    return column.formatFilter(value);

  return value;
}

export function getSearchFilters(column, row) {
  let configColumns = this.configs?.columns;
  let filters = configColumns
    ? configColumns[column.key || column.name]?.filters
    : {};
  let params = this.$copyObject(filters);

  if (column.filters instanceof Function)
    params = Object.assign(params, column.filters(row));

  return params;
}

export function formatList(column, value) {
  if (column && column.formatList instanceof Function)
    return column.formatList(value, column);

  return value;
}

export function selectionDisabled(row, configs) {
  if (!configs || !configs.selectionDisabled) return;
  let disabled;

  if (configs.selectionDisabled instanceof Function)
    disabled = configs.selectionDisabled(row);
  return disabled;
}

export function format(column, row, value, editing) {
  if (editing && column && column.editFormat instanceof Function)
    return column.editFormat(value, column, row, editing);
  else if (column && column.format instanceof Function)
    return column.format(value, column, row, editing);

  return value instanceof Object && !editing ? value.label : value;
}

export function getColumnByName(columnName) {
  return this.columns.find((col) => {
    return col.name === columnName || col.key === columnName;
  });
}

export function saveFormat(columnName, value, row) {
  const column = this.getColumnByName(columnName);
  if (!column) return value;

  if (column.saveFormat instanceof Function)
    return column.saveFormat(value, column, row);
  else if (value instanceof Object && value?.value)
    return !isNaN(value?.value) ? parseFloat(value?.value) : value?.value;
  else if (value instanceof Object && value["@id"]) return value["@id"];

  return !isNaN(value) ? parseFloat(value) : value;
}
