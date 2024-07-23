import { LocalStorage } from "quasar";

export default class Filters {

  constructor(route, store) {
    this.route = route;
    this.store = store;
  }

  getFilters() {
    if (!this.getRoute() || !this.store) return {};

    let storedUser = this.getAllFilters();
    return storedUser && storedUser[this.getRoute()]
      ? storedUser[this.getRoute()][this.store] || {}
      : {};
  }

  setFilters(data) {
    if (!this.getRoute() || !this.store) return;
    let storedUser = this.getAllFilters();
    if (!storedUser[this.getRoute()])
      storedUser[this.getRoute()] = {};
    storedUser[this.getRoute()][this.store] = data;
    LocalStorage.set("DefaultFilters", storedUser);
  }

  getVisibleColumns() {
    if (!this.getRoute() || !this.store) return {};
    let storedUser = this.getAllVisibleColumns();
    return storedUser && storedUser[this.getRoute()]
      ? storedUser[this.getRoute()][this.store] || {}
      : {};
  }

  setVisibleColumns(visibleColumns) {
    if (!this.getRoute() || !this.store) return;
    let storedUser = this.getAllVisibleColumns();
    if (!storedUser[this.getRoute()])
      storedUser[this.getRoute()] = {};
    storedUser[this.getRoute()][this.store] = visibleColumns;
    LocalStorage.set("DefaultVisibleColumns", storedUser);

  }

  getAllFilters() {
    return LocalStorage.getItem("DefaultFilters") || {};
  }

  getRoute() {
    return this.route;
  }

  getAllVisibleColumns() {
    return LocalStorage.getItem("DefaultVisibleColumns") || {};
  }

}