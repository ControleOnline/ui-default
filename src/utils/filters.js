export default class Filters {
  constructor(route, store) {
    this.route = route;
    this.store = store;
  }

  getFilters() {
    if (!this.getRoute() || !this.store) return {};
    const storedUser = this.getAllFilters();
    return storedUser && storedUser[this.getRoute()]
      ? storedUser[this.getRoute()][this.store] || {}
      : {};
  }

  setFilters(data) {
    if (!this.getRoute() || !this.store) return;
    const storedUser = this.getAllFilters();
    if (!storedUser[this.getRoute()]) {
      storedUser[this.getRoute()] = {};
    }
    storedUser[this.getRoute()][this.store] = data;
    LocalStorage.setItem('DefaultFilters', JSON.stringify(storedUser));
  }

  getVisibleColumns() {
    if (!this.getRoute() || !this.store) return {};
    const storedUser = this.getAllVisibleColumns();
    return storedUser && storedUser[this.getRoute()]
      ? storedUser[this.getRoute()][this.store] || {}
      : {};
  }

  setVisibleColumns(visibleColumns) {
    if (!this.getRoute() || !this.store) return;
    const storedUser = this.getAllVisibleColumns();
    if (!storedUser[this.getRoute()]) {
      storedUser[this.getRoute()] = {};
    }
    storedUser[this.getRoute()][this.store] = visibleColumns;
    LocalStorage.setItem('DefaultVisibleColumns', JSON.stringify(storedUser));
  }

  getAllFilters() {
    const data = LocalStorage.getItem('DefaultFilters');
    return data ? JSON.parse(data) : {};
  }

  getRoute() {
    return this.route;
  }

  getAllVisibleColumns() {
    const data = LocalStorage.getItem('DefaultVisibleColumns');
    return data ? JSON.parse(data) : {};
  }
}