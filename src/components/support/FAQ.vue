<template>
  <q-table dense :loading="isLoading" :rows="data" :columns="settings.columns" v-model:pagination="pagination"
    @request="onRequest" row-key="id" :visible-columns="settings.visibleColumns" style="min-height: 90vh;">
    <template v-slot:top v-if="search === true">
      <div class="col-xs-12 q-pb-md text-h6">
        Pedidos
      </div>
      <div class="col-sm-6 col-xs-12 q-pa-md">
        <q-input
      dense
      outlined stack-label label="Buscar por" debounce="1000" v-model="filters.text" class="full-width" />
      </div>
      <div class="col-sm-6 col-xs-12 q-pa-md">
        <q-select dense outlined  stack-label label="Status do pedido" v-model="filters.status" :options="statuses" class="full-width"
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
    </template>

    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="id" :props="props">
          <q-btn outline dense :to="{ name: 'OrderDetails', params: { id: props.row.id } }" :label="`#${props.row.id}`"
            :style="{ color: props.row.color_status }" class="full-width" />
        </q-td>
        <q-td key="notaFiscal" :props="props">{{ props.row.notaFiscal }}</q-td>
        <q-td key="dataPedido" :props="props">{{ props.cols[2].value }}</q-td>
        <q-td key="ultimaModificacao" :props="props">{{ props.cols[3].value }}</q-td>
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
        <q-td key="preco" :props="props">{{ props.cols[8].value }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>

import { date } from 'quasar';
import { mapActions, mapGetters } from 'vuex';

const SETTINGS = {
  visibleColumns: [
    'id',
    'notaFiscal',
    'dataPedido',
    'ultimaModificacao',
    'status',
    'coleta',
    'entrega',
    'transportadora',
    'preco',
  ],
  columns: [
    {
      name: 'id',
      field: 'id',
      align: 'left',
      label: 'ID'
    },
    {
      name: 'notaFiscal',
      field: 'notaFiscal',
      align: 'left',
      label: 'Nota Fiscal',
      format: (val, row) => {
        return val ? '#' + val : ''
      },
    },
    {
      name: 'dataPedido',
      field: 'dataPedido',
      align: 'left',
      format: (val, row) => {
        return date.formatDate(val, 'DD/MM/YYYY')
      },
      label: 'Data do pedido'
    },
    {
      name: 'ultimaModificacao',
      field: 'ultimaModificacao',
      align: 'left',
      format: (val, row) => {
        return date.formatDate(val, 'DD/MM/YYYY HH:mm:ss')
      },
      label: 'Ultima alteração'
    },
    {
      name: 'status',
      field: 'status',
      align: 'left',
      label: 'Status'
    },
    {
      name: 'coleta',
      field: 'coleta',
      align: 'left',
      label: 'Coleta'
    },
    {
      name: 'localColeta',
      field: 'localColeta',
      align: 'left',
      label: 'Local de coleta'
    },
    {
      name: 'entrega',
      field: 'entrega',
      align: 'left',
      label: 'Entrega'
    },
    {
      name: 'localEntrega',
      field: 'localEntrega',
      align: 'left',
      label: 'Local de entrega'
    },
    {
      name: 'transportadora',
      field: 'transportadora',
      align: 'left',
      label: 'Transportadora'
    },
    {
      name: 'preco',
      field: 'preco',
      align: 'left',
      format: (val, row) => {
        return this.$formatter. formatMoney(val, 'BRL', 'pt-br');
      },
      label: 'Preço'
    },
  ],
};

Object.freeze(SETTINGS);

export default {
  props: {
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
      { 'label': 'Todos', 'value': -1 },
    ];

    return {
      settings: SETTINGS,
      data: [],
      statuses: statuses,
      filters: {
        text: null,
        status: statuses[0],
        company: null,
      },
      pagination: {
        sortBy: 'ultimaModificacao',
        descending: false,
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 10,
      },
      loadingStatuses: false,
    }
  },

  computed: {
    ...mapGetters({
      isLoading: 'purchasingOrder/isLoading',
      error: 'purchasingOrder/error',
      violations: 'purchasingOrder/violations',
      items: 'purchasingOrder/items',
      totalItems: 'purchasingOrder/totalItems',
      myCompany: 'people/currentCompany',
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
      if (!items)
        return;

      let data = [];

      for (let index in items) {
        let item = items[index];

        data.push({
          '@id': item['@id'],
          'id': item['@id'].match(/^\/purchasing\/orders\/([a-z0-9-]*)$/)[1],
          'notaFiscal': item.invoiceTax.length > 0 ? '#' + item.invoiceTax[0].invoiceTax.invoiceNumber : '',
          'dataPedido': item.orderDate,
          'ultimaModificacao': item.alterDate,
          'status': item.status.status,
          'color_status': item.status.color,
          'fornecedor': item.client.alias,
          'coleta': item.retrievePeople !== null ? item.retrievePeople.name : '',
          'localColeta': item.quote !== null ? `${item.quote.cityOrigin.city} / ${item.quote.cityOrigin.state.uf}` : '',
          'entrega': item.deliveryPeople !== null ? item.deliveryPeople.name : '',
          'localEntrega': item.quote !== null ? `${item.quote.cityDestination.city} / ${item.quote.cityDestination.state.uf}` : '',
          'transportadora': item.quote !== null ? item.quote.carrier.name : '',
          'preco': item.price,
        });
      }

      this.data = data;
    },

    'filters.text'() {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filters,
      });
    },

    'filters.status'() {
      this.onRequest({
        pagination: this.pagination,
        filter: this.filters,
      });
    },
  },

  methods: {
    ...mapActions({
      getItems: 'purchasingOrder/getItems',
      reset: 'purchasingOrder/reset',
      getStatuses: 'purchasingOrder/getStatuses',
    }),

    requestStatuses() {
      this.loadingStatuses = true;
      let params = [];
      params.context = 'order';

      this.getStatuses(params)
        .then(statuses => {
          if (statuses.length) {
            let data = [];
            for (let index in statuses) {
              let item = statuses[index];
              this.statuses.push({
                'label': this.$t(`order.statuses.${item.status}`),
                'value': item['@id'].match(/^\/statuses\/([a-z0-9-]*)$/)[1],
              });
            }
          }
          this.loadingStatuses = false;
        });
    },

    onRequest(props) {
      let {
        page,
        rowsPerPage,
        rowsNumber,
        sortBy,
        descending
      } = props.pagination;
      let filter = props.filter;
      let params = { itemsPerPage: rowsPerPage, page };

      if (this.filters.text != null && this.filters.text.length > 0) {
        if (this.filters.text.length < 3)
          return;

        params['text'] = this.filters.text;
      }

      if (this.filters.status != null && this.filters.status.value != -1) {
        params['status'] = this.filters.status.value;
      }

      if (this.filters.company != null) {
        params['myCompany'] = this.filters.company.id;
      }

      if (this.invoiceId !== null) {
        params['invoice.invoice'] = this.invoiceId;
      }

      params['order[alterDate]'] = 'desc';

      this.getItems(params)
        .then(() => {
          this.pagination.page = page;
          this.pagination.rowsPerPage = rowsPerPage;
          this.pagination.sortBy = sortBy;
          this.pagination.descending = descending;
        });
    },
  },
};
</script>