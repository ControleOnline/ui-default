<template>
  <q-table :loading="isLoading" :rows="data" :columns="settings.columns" v-model:pagination="pagination"
    @request="onRequest" row-key="id" :visible-columns="settings.visibleColumns" style="min-height: 90vh">
    <template v-slot:top v-if="search === true">      
      <div class="col-sm-3 col-xs-12 q-pa-md">
        <q-input stack-label label="Buscar por" debounce="1000" v-model="filters.text" class="full-width" />
      </div>
      <div class="col-sm-3 col-xs-12 q-pa-md">
        <q-select stack-label label="Status do pedido" v-model="filters.status" :options="statuses" class="full-width"
          :loading="loadingStatuses">
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Sem resultados
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
      <div class="col-sm-6 col-xs-12 q-pa-md">
        <DataFilter :fromDate="filters.from" :toDate="filters.to" :showButton="false" @dateChanged="dateChanged" />
      </div>
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="id" :props="props">
          <q-btn outline dense :to="{ name: 'OrderDetails', params: { id: props.row.id } }" :label="`#${props.row.id}`"
            :style="{ color: props.row.color_status }" class="full-width" />

          <q-icon v-if="
            props.row.app == 'app' ||
            props.row.app == 'Cota Fácil' ||
            props.row.app == 'Gestor'
          " name="touch_app" color="blue" />
          <q-icon v-else name="electrical_services" color="green" />

          <q-icon v-if="hasSchedule(props.row.other_informations) == true" name="schedule" color="blue" />
          <q-icon v-if="hasRural(props.row.other_informations) == true" name="agriculture" color="red" />
          <q-icon v-if="hasDificult(props.row.other_informations) == true" name="fmd_bad" color="red" />
          <q-icon v-if="hasClosedTasks(props.row.task) == true" name="priority_high" color="green" />
          <q-icon v-if="hasPendingTasks(props.row.task) == true" name="priority_high" color="yellow" />
          <q-icon v-if="hasOpenedTasks(props.row.task) == true" name="priority_high" color="red" />
        </q-td>
        <q-td key="notaFiscal" :props="props">{{ props.row.notaFiscal }}</q-td>
        <q-td key="dataPedido" :props="props">{{ props.cols[2].value }}</q-td>
        <q-td key="dataEntrega" :props="props">{{ props.cols[3].value }}</q-td>
        <q-td key="ultimaModificacao" :props="props">{{
            props.cols[4].value
        }}</q-td>
        <q-td key="status" :props="props" :style="{ color: props.row.color_status }">
          {{ $t(`order.statuses.${props.row.status}`) }}
        </q-td>
        <q-td key="coleta" :props="props">
          {{ props.row.localColeta }}<br />{{ props.row.coleta }}
        </q-td>
        <q-td key="entrega" :props="props">
          {{ props.row.localEntrega }}<br />{{ props.row.entrega }}
        </q-td>
        <q-td key="transportadora" :props="props">
          {{ props.row.transportadora }}
        </q-td>
        <q-td key="preco" :props="props">{{ props.cols[9].value }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import DataFilter from "@controleonline/ui-legacy/ui-common/src/components/Common/DataFilter.vue";

import { date } from "quasar";
import { mapActions, mapGetters } from "vuex";

const SETTINGS = {
  visibleColumns: [
    "id",
    "notaFiscal",
    "dataPedido",
    "dataEntrega",
    "ultimaModificacao",
    "status",
    "coleta",
    "entrega",
    "transportadora",
    "preco",
  ],
  columns: [
    {
      name: "id",
      field: "id",
      align: "left",
      label: "ID",
    },
    {
      name: "notaFiscal",
      field: "notaFiscal",
      align: "left",
      label: "Nota Fiscal",
      format: (val, row) => {
        return val ? "#" + val : "";
      },
    },
    {
      name: "dataPedido",
      field: "dataPedido",
      align: "left",
      format: (val, row) => {
        return date.formatDate(val, "DD/MM/YYYY");
      },
      label: "Data do pedido",
    },
    {
      name: "dataEntrega",
      field: "dataEntrega",
      align: "left",
      format: (val, row) => {
        if (val) {
          return date.formatDate(val, "DD/MM/YYYY");
        }
        return "--";
      },
      label: "Previsão de entrega",
    },
    {
      name: "ultimaModificacao",
      field: "ultimaModificacao",
      align: "left",
      format: (val, row) => {
        return date.formatDate(val, "DD/MM/YYYY HH:mm:ss");
      },
      label: "Ultima alteração",
    },
    {
      name: "status",
      field: "status",
      align: "left",
      label: "Status",
    },
    {
      name: "coleta",
      field: "coleta",
      align: "left",
      label: "Coleta",
    },
    {
      name: "localColeta",
      field: "localColeta",
      align: "left",
      label: "Local de coleta",
    },
    {
      name: "entrega",
      field: "entrega",
      align: "left",
      label: "Entrega",
    },
    {
      name: "localEntrega",
      field: "localEntrega",
      align: "left",
      label: "Local de entrega",
    },
    {
      name: "transportadora",
      field: "transportadora",
      align: "left",
      label: "Transportadora",
    },
    {
      name: "preco",
      field: "preco",
      align: "left",
      format: (val, row) => {
        return this.$formatter. formatMoney(val, "BRL", "pt-br");
      },
      label: "Preço",
    },
  ],
};

Object.freeze(SETTINGS);

export default {
  components: {
    DataFilter,
  },
  props: {
    client_id: {
      required: false,
    },
    search: {
      type: Boolean,
      required: false,
      default: true,
    },
    invoiceId: {
      type: String,
      required: false,
      default: null,
    },
  },

  created() {
    if (this.myCompany !== null) {
      this.filters.company = this.myCompany;
      this.onRequest({
        pagination: this.pagination,
        filter: this.filters,
      });
    }
    this.requestStatuses();
  },

  beforeUnmount() {
    this.reset();
  },

  data() {
    let statuses = [
      { label: "Abertos", value: -1 },
      { label: "Todos", value: 0 },
    ];

    return {
      settings: SETTINGS,
      data: [],
      statuses: statuses,
      filters: {
        text: null,
        status: statuses[0],
        company: null,
        defaultCompany: null,
        from: "",
        to: "",
      },
      pagination: {
        sortBy: "ultimaModificacao",
        descending: false,
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 10,
      },
      loadingStatuses: false,
    };
  },

  computed: {
    ...mapGetters({
      defaultCompany: "people/defaultCompany",
      isLoading: "salesOrder/isLoading",
      error: "salesOrder/error",
      violations: "salesOrder/violations",
      items: "salesOrder/items",
      totalItems: "salesOrder/totalItems",
      myCompany: "people/currentCompany",
    }),
  },

  watch: {
    myCompany(company) {
      if (company !== null) {
        this.filters.company = company;
        this.onRequest({
          pagination: this.pagination,
          filter: this.filters,
        });
      }
    },

    totalItems(val) {
      this.pagination.rowsNumber = val;
    },

    items(items) {
      if (!items) return;

      let data = [];

      for (let index in items) {
        let item = items[index];

        var dataEntrega = new Date(item.alterDate);

        if (!item.quote) {
          dataEntrega = null;
        } else if (item.quote.deadline) {
          if (
            item.status.status === "on the way" ||
            item.status.status === "retrieved"
          ) {
            dataEntrega.setDate(dataEntrega.getDate() + item.quote.deadline);
          } else {
            dataEntrega = null;
          }
        }

        data.push({
          "@id": item["@id"],
          id: item["@id"].match(/^\/sales\/orders\/([a-z0-9-]*)$/)[1],
          app: item.app,
          notaFiscal:
            item.invoiceTax.length > 0
              ? "#" + item.invoiceTax[0].invoiceTax.invoiceNumber
              : "",
          dataPedido: item.orderDate,
          dataEntrega: dataEntrega,
          ultimaModificacao: item.alterDate,
          status: item.status.status,
          color_status: item.status.color,
          task: item.task,
          other_informations: item.otherInformations,
          fornecedor: item.client ? item.client.alias : null,
          coleta: item.retrievePeople !== null ? item.retrievePeople.name : "",
          localColeta:
            item.quote !== null
              ? `${item.quote.cityOrigin.city} / ${item.quote.cityOrigin.state.uf}`
              : "",
          entrega: item.deliveryPeople !== null ? item.deliveryPeople.name : "",
          localEntrega:
            item.quote !== null
              ? `${item.quote.cityDestination.city} / ${item.quote.cityDestination.state.uf}`
              : "",
          transportadora: item.quote !== null ? item.quote.carrier.name : "",
          preco: item.price,
        });
      }

      this.data = data;
    },

    "filters.text"() {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filters,
      });
    },

    "filters.status"() {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filters,
      });
    },

    "filters.from"() {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filters,
      });
    },
    "filters.to"() {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filters,
      });
    },
  },

  methods: {
    ...mapActions({
      getItems: "salesOrder/getItems",
      reset: "salesOrder/reset",
      getStatuses: "salesOrder/getStatuses",
    }),
    dateChanged(date) {
      if (date.from || date.to) {
        this.filters.from = date.from;
        this.filters.to = date.to;
        this.onRequest({
          pagination: this.pagination,
          filter: this.filters,
        });
      }
    },
    formatDate(dateString) {
      if (dateString)
        return date.formatDate(
          date.extractDate(dateString, "DD/MM/YYYY"),
          "YYYY-MM-DD"
        );
      else return null;
    },
    requestStatuses() {
      this.loadingStatuses = true;
      this.getStatuses({
        visibility: "public",
        realStatus: ["open", "pending", "closed", "canceled"],
        context: 'order'
      }).then((statuses) => {
        if (statuses.length) {
          for (let index in statuses) {
            let item = statuses[index];
            this.statuses.push({
              label: this.$t(`order.statuses.${item.status}`),
              value: item["@id"].match(/^\/statuses\/([a-z0-9-]*)$/)[1],
            });
          }
          this.statuses.sort(function (a, b) {
            return (a.label > b.label) - (a.label < b.label);
          });
        }
        this.loadingStatuses = false;
      });
    },
    hasPendingTasks(tasks) {
      let has = false;
      tasks.forEach((task) => {
        if (task.taskStatus.status == 'pending') {
          has = true;
        }
      });
      return has;
    },
    hasOpenedTasks(tasks) {
      let has = false;
      tasks.forEach((task) => {
        if (task.taskStatus.status == 'open') {
          has = true;
        }
      });
      return has;
    },
    hasClosedTasks(tasks) {
      let has = false;
      tasks.forEach((task) => {
        if (task.taskStatus.status == 'closed') {
          has = true;
        }
      });
      return has;
    },
    hasSchedule(o_i) {
      let other_informations = typeof o_i == 'object' ? o_i : (o_i);
      let has = false;
      if (
        other_informations &&
        other_informations.schedule &&
        other_informations.schedule.retrieve
      ) {
        has = true;
      }
      return has;
    },

    hasDificult(o_i) {
      let other_informations = typeof o_i == 'object' ? o_i : (o_i);

      let has = false;
      if (
        other_informations &&
        other_informations.dificult
      ) {
        has = true;
      }
      return has;
    },

    hasRural(o_i) {
      let other_informations = typeof o_i == 'object' ? o_i : (o_i);

      let has = false;
      if (
        other_informations &&
        other_informations.rural
      ) {
        has = true;
      }
      return has;
    },
    onRequest(props) {
      let { page, rowsPerPage, rowsNumber, sortBy, descending } =
        props.pagination;
      let filter = props.filter;
      let params = { itemsPerPage: rowsPerPage, page };

      if (this.filters.text != null && this.filters.text.length > 0) {
        if (this.filters.text.length < 2) return;

        params["searchBy"] = this.filters.text;
      }

      if (this.filters.status != null && this.filters.status.value == -1) {
        params["status.realStatus"] =
          this.defaultCompany.configs &&
            typeof this.defaultCompany.configs.salesOrdersStartRealStatus !=
            "undefined"
            ? (this.defaultCompany.configs.salesOrdersStartRealStatus)
            : ["pending"];
      } else if (
        this.filters.status != null &&
        this.filters.status.value != 0
      ) {
        params["status"] = this.filters.status.value;
      }
      params.fromDate = this.formatDate(this.filters.from) || "";
      params.toDate = this.formatDate(this.filters.to) || "";

      if (this.filters.company != null) {
        params["myCompany"] = this.filters.company.id;
      }

      if (this.invoiceId !== null) {
        params["invoice.invoice"] = this.invoiceId;
      }

      params["order[alterDate]"] = "desc";

      if (this.client_id) {
        params["client"] = this.client_id;
      }

      this.getItems(params).then(() => {
        this.pagination.page = page;
        this.pagination.rowsPerPage = rowsPerPage;
        this.pagination.sortBy = sortBy;
        this.pagination.descending = descending;
      });
    },
  },
};
</script>
