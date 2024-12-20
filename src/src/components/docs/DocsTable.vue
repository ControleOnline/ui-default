<template>
  <div class="row">
    <div class="col-12">
      <q-table
        dense
        :pagination="{
          page: 1,
          rowsPerPage: 30,
        }"
        :rows="items"
        :columns="settings.columns"
        row-key="id"
        :loading="loadingQtable"
      >
        <template v-slot:top>
          <div class="col-xs-12">
            <q-input
              dense
              outlined
              stack-label
              label="Buscar por empresa"
              debounce="1000"
              v-model="filters.empresa"
              class="full-width"
            />
          </div>
        </template>
        <template v-slot:body="props">
          <q-tr :props="props" :ref="'linha' + props.row.id">
            <q-td key="id" :props="props" class="format_id">#{{ props.row.id }}</q-td>
            <q-td key="type" :props="props">{{ props.row.type }}</q-td>
            <q-td key="name" :props="props">{{ props.row.name }}</q-td>
            <q-td key="company" :props="props">{{ props.row.company }}</q-td>
            <q-td key="date_period" :props="props">{{ props.row.date_period }}</q-td>
            <q-td key="status" :props="props">
              <q-badge
                :text-color="props.row.status.color"
                :label="$t(docs_type + '.status.' + props.row.status.status)"
              />
            </q-td>
            <q-td key="arquivoGuia" :props="props" auto-width>
              <q-btn
                :ref="'btnguide' + props.row.id"
                v-if="props.row.fileName_guide !== null"
                color="secondary"
                label="Baixar"
                size="sm"
                @click="
                  downloadFilesCallApi(props.row.id, 'guide', props.row.fileName_guide)
                "
                :loading="loadArr['guide_' + props.row.id]"
              />
            </q-td>
            <q-td key="arquivoRecibo" :props="props" auto-width>
              <q-btn
                :ref="'btnreceipt' + props.row.id"
                v-if="props.row.fileName_receipt !== null"
                color="secondary"
                label="Baixar"
                size="sm"
                @click="
                  downloadFilesCallApi(
                    props.row.id,
                    'receipt',
                    props.row.fileName_receipt
                  )
                "
                :loading="loadArr['receipt_' + props.row.id]"
              />
            </q-td>
            <q-td key="acoes" :props="props">
              <div class="row q-gutter-xs items-center justify-center">
                <q-btn
                  outline
                  color="primary"
                  label="Editar"
                  size="sm"
                  :to="{ name: 'DocsDetails', params: { id: props.row.id } }"
                />
                <q-btn
                  color="red"
                  label="Apagar"
                  size="sm"
                  @click="deleteConfirm(props.row.id)"
                  :loading="false"
                />
              </div>
            </q-td>
          </q-tr>
        </template>
        <template v-slot:loading>
          <q-inner-loading showing color="primary" />
        </template>
      </q-table>
    </div>
    <q-dialog v-model="confirmDelete" persistent>
      <q-card style="width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <q-avatar icon="delete" color="red" text-color="white" />
          <div class="text-h6 q-ml-md">Apagar Registro</div>
          <q-space />
          <q-btn
            icon="close"
            @click="setClassRow(idRowToDelete, false)"
            flat
            round
            dense
            v-close-popup
          />
        </q-card-section>
        <q-card-section class="row items-center">
          <span class="q-ml-sm" v-html="msgDelete"></span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancelar"
            color="primary"
            @click="setClassRow(idRowToDelete, false)"
            v-close-popup
          />
          <q-btn
            flat
            label="Sim"
            color="primary"
            @click="nowDelete(idRowToDelete)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { api } from "app/modules/controleonline/ui-common/src/api";
import axios from "axios";
import { mapGetters } from "vuex";


function forceDownloadFile(blob, fileName) {
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveOrOpenBlob(blob);
    return;
  }
  const data = window.URL.createObjectURL(blob);
  var link = document.createElement("a");
  link.href = data;
  link.download = fileName;
  link.click();
  setTimeout(function () {
    window.URL.revokeObjectURL(data);
  }, 100);
}

const SETTINGS = {
  columns: [
    {
      name: "id",
      field: (row) => row.id,
      align: "center",
      label: "ID",
    },
    {
      name: "type",
      field: (row) => row.type,
      align: "left",
      label: "Tipo",
    },
    {
      name: "name",
      field: (row) => row.name,
      align: "left",
      label: "Nome",
    },
    {
      name: "company",
      field: (row) => row.company,
      align: "left",
      label: "Empresa",
    },
    {
      name: "date_period",
      field: (row) => row.date_period,
      align: "center",
      label: "Período",
    },
    {
      name: "status",
      field: (row) => row.status,
      align: "left",
      label: "Status",
    },
    {
      name: "arquivoGuia",
      field: (row) => row.fileName_guide,
      align: "center",
      label: "Guia",
    },
    {
      name: "arquivoRecibo",
      field: (row) => row.fileName_receipt,
      align: "center",
      label: "Recibo",
    },
    {
      name: "acoes",
      field: (row) => row.id,
      align: "center",
      label: "Ações",
    },
  ],
};

Object.freeze(SETTINGS);

export default {
  components: {},
  props: {
    docs_type: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      loadingStatuses: false,
      loadArr: [],
      loadingDownloadReceipt: false,
      loadingDownloadGuide: false,
      idRowToDelete: null,
      msgDelete: null,
      confirmDelete: false,
      myCompanyLocal: null,
      myCompanyLocalLoaded: false,
      items: [],
      statuses: [],
      settings: SETTINGS,
      saving: false,
      loadingQtable: false,
      filters: {
        empresa: "",
      },
    };
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
    user() {
      return this.$store.getters["auth/user"];
    },
  },

  watch: {
    myCompany(company) {
      // Quando o usuário altera a "Company"
      this.checkIfChangeMyCompany();
    },
    $data: {
      // Monitora alteração de determinada variável, OBS: Resolve o BUG do delay no watch da myCompany
      handler: function (objNew) {
        if (!this.myCompanyLocalLoaded) {
          if (objNew.myCompanyLocal !== null) {
            this.getValuesToLoad();
            this.myCompanyLocalLoaded = true;
          }
        }
      },
      deep: true,
    },
  },

  methods: {
    requestStatuses() {
      this.loadingStatuses = true;
      this.statuses.push({
        label: this.$t(this.docs_type + ".status.all"),
        value: -1,
        color: "#000000",
      });
      this.getStatuses().then((statuses) => {
        if (statuses.totalItems) {
          for (let index in statuses.members) {
            let item = statuses.members[index];
            this.statuses.push({
              original: item.status,
              label: this.$t(this.docs_type + ".status." + item.status),
              value: parseInt(item["@id"].match(/^\/statuses\/([a-z0-9-]*)$/)[1]),
              color: item.color,
            });
          }
        }
        this.loadingStatuses = false;
        if (!this.orderId && !this.client)
          this.filters.status = this.statuses.find((status) => "open" == status.original);
        else
          this.filters.status = {
            label: this.$t(this.docs_type + ".status.all"),
            value: -1,
          };
      });
    },

    getStatuses() {
      let params = [];
      params.context = this.docs_type;
      params["order[name]"] = "ASC";

      return api
        .fetch("/statuses", { params })

        .then((result) => {
          return {
            members: result["hydra:member"],
            totalItems: result["hydra:totalItems"],
          };
        });
    },
    nowDelete(id) {
      this.loadingQtable = true;

      this.deleteCallApi(id).then((success) => {
        this.loadingQtable = false;
        this.setClassRow(id, false);
        this.getValuesToLoad();
      });
    },
    setClassRow(id, action) {
      if (action) {
        this.idRowToDelete = id;
        this.$refs["linha" + id].$el.classList.value = "bg-deep-orange-10 text-white";
      } else {
        this.idRowToDelete = null;
        this.$refs["linha" + id].$el.classList.value = "";
      }
    },
    deleteConfirm(id) {
      let data = this.items.find((i) => i.id === id);
      this.setClassRow(id, true);
      let company = data.company;
      let msg = "";
      msg += "Você deseja realmente Excluir o Arquivo:<br>";
      msg += `ID: ${id} - ${company}`;
      this.msgDelete = msg;
      this.confirmDelete = true;
    },
    deleteCallApi(id) {
      let params = {
        method: "DELETE",
        params: { myProvider: this.myCompanyLocal },
      };

      return api
        .fetch("/filesb/" + id, params)

        .then((data) => {
          if (data !== null) {
            let success = data.response.success;
            let message = data.response.message;
            if (success) {
              this.alertNotify(message, "p");
            } else {
              this.alertNotify(message, "n");
            }
            return success;
          }
        })
        .catch((error) => {
          this.alertNotify(error, "n");
        });
    },
    downloadFilesCallApi(id, type, fileName) {
      this.$set(this.loadArr, type + "_" + id, true); // Reatividade para itens de array, usar o $set

      axios({
        url:
          this.$entrypoint +
          `/filesb/${id}/download?type=${type}&timestamp=${new Date().getTime()}`,
        method: "get",
        responseType: "blob",
        headers: {
          "api-token": this.API.token,
        },
      }).then((response) => {
        if (response.data.type === "application/json") {
          this.alertNotify("Arquivo não foi encontrado", "n");
          this.$set(this.loadArr, type + "_" + id, false);
          return false;
        }
        const content = response.headers["content-type"];
        let blob = new Blob([response.data], { type: content }),
          url = window.URL.createObjectURL(blob);
        forceDownloadFile(blob, fileName);
        this.$set(this.loadArr, type + "_" + id, false);
      });
    },
    getCollectionFiles() {
      let params = {
        method: "GET",
        params: {
          myProvider: this.myCompanyLocal,
          context: this.docs_type,
        },
      };

      api
        .fetch("/filesb", params)

        .then((data) => {
          if (data !== null) {
            let success = data.response.success;
            let message = data.response.message;
            if (success) {
              data.response.data.forEach((val) => {
                this.$set(this.loadArr, "guide" + "_" + val.id, false);
                this.$set(this.loadArr, "receipt_" + "_" + val.id, false);
              });
              this.items = data.response.data;
            } else {
              this.items = [];
            }
          }
        })
        .catch((error) => {
          this.alertNotify(error, "n");
        })
        .finally((error) => {
          this.$q.loading.hide();
        });
    },
    checkIfChangeMyCompany() {
      if (this.myCompanyLocal !== null) {
        if (this.myCompany.id !== this.myCompanyLocal) {
          this.myCompanyLocal = this.myCompany.id;
          this.getValuesToLoad();
        }
      }
      if (this.myCompany !== null) {
        if (this.myCompanyLocal !== this.myCompany.id) {
          this.myCompanyLocal = this.myCompany.id;
        }
      }
    },
    /**
     * Exibe Alerta Positivo ou Negativo
     * @param msg
     * @param tipo ('n','p')
     */
    alertNotify(msg, tipo) {
      let status = tipo === "n" ? "negative" : "positive";
      this.$q.notify({
        message: msg,
        html: true,
        group: false,
        multiLine: true,
        position: "bottom",
        type: status,
      });
    },
    onRequest() {},
    getValuesToLoad() {
      this.$q.loading.show();
      this.getCollectionFiles();
    },
  },
  created() {
    this.$q.loading.show();
    this.checkIfChangeMyCompany();
    this.requestStatuses();
  },
};
</script>
<style type="text/css" scoped>
.format_id {
  font-size: 16px;
  font-weight: bold;
}
</style>
