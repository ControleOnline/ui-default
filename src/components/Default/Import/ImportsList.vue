<template>
  <main class="q-page q-layout-padding">
    <div class="row">
      <div class="col-12">
        <q-table
          dense
          :rows="items"
          :columns="settings.columns"
          row-key="id"
          :loading="isLoading"
          v-model:pagination="pagination"
          @request="onRequest"
        >
          <template v-slot:top>
            <div class="col-3 q-mb-md text-h6">Importar</div>

            <div class="col-9 q-mb-md">
              <div class="row justify-end">
                <q-btn
                  flat
                  label="Adicionar"
                  icon="add"
                  color="primary"
                  class="q-ml-sm"
                  @click="
                    () => {
                      dialog = !dialog;
                    }
                  "
                />
              </div>
            </div>

            <div class="col-sm-6 col-xs-12 q-pa-md">
              <div class="row justify-end">
                <q-select
                  dense
                  outlined
                  stack-label
                  label="Status"
                  v-model="filters.status"
                  :options="statuses"
                  class="full-width"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey"> Sem resultados </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>

            <div v-if="!import_type" class="col-sm-6 col-xs-12 q-pa-md">
              <div class="row justify-end">
                <q-select
                  dense
                  outlined
                  stack-label
                  label="Tipo de import ação"
                  v-model="importType.import_type"
                  :options="importStatuses"
                  class="full-width"
                >
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey"> Sem resultados </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="id" :props="props">{{ props.row.id }}</q-td>
              <q-td key="fileName" :props="props"> {{ props.row.fileName }} </q-td>
              <q-td key="import_type" :props="props">{{
                $t(`import.importStatuses.${props.row.typeLabel}`)
              }}</q-td>
              <q-td key="status" :props="props">{{
                $t(`import.statuses.${props.row.statusLabel}`)
              }}</q-td>
              <q-td key="feedback" :props="props">{{ props.row.feedback }}</q-td>
              <q-td key="uploadDate" :props="props">{{ props.row.uploadDate }}</q-td>
              <q-td auto-width>
                <q-btn
                  v-if="props.row.status === 'waiting'"
                  flat
                  round
                  dense
                  color="red"
                  icon="delete"
                  @click="removeItem(props.row)"
                  :loading="props.row._bussy"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </div>
      <q-dialog v-model="dialog">
        <q-card style="width: 700px; max-width: 80vw">
          <q-card-section class="row items-center">
            <div class="text-h6">import ar</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-card-section>
            <q-select
              dense
              outlined
              v-if="!import_type"
              stack-label
              label="Tipo de import ação"
              v-model="importType.import_type"
              :options="importStatuses"
              class="full-width"
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey"> Sem resultados </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-uploader
              ref="uploader"
              no-thumbnails
              square
              flat
              :url="
                uploadEndpoint +
                '?tableId=' +
                (tableId || '') +
                '&importType=' +
                importType.import_type.value
              "
              :headers="uploadHeaders"
              :accept="uploadAccepted"
              field-name="file"
              color="white"
              @uploaded="fileUploaded"
              @failed="uploadFailed"
              :multiple="false"
              :class="myClass"
              :auto-upload="true"
            >
              <template v-slot:header="scope">
                <div class="row no-wrap items-center justify-end q-pa-sm q-gutter-xs">
                  <q-spinner
                    v-if="scope.isUploading"
                    color="primary"
                    class="q-uploader__spinner"
                  />
                  <q-btn
                    flat
                    dense
                    rounded
                    v-if="scope.canAddFiles"
                    type="a"
                    icon="add_box"
                    color="primary"
                  >
                    <q-uploader-add-trigger />
                    <q-tooltip>Selecione o arquivo</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="scope.isUploading"
                    round
                    dense
                    flat
                    icon="clear"
                    color="red"
                    @click="scope.abort"
                  >
                    <q-tooltip>Cancelar upload</q-tooltip>
                  </q-btn>
                </div>
              </template>

              <template v-slot:list="scope">
                <div class="row items-center" style="min-height: 100%">
                  <div
                    v-if="scope.files.length == 0"
                    class="text-center text-camelcase"
                    style="min-width: 100%; min-height: 100%"
                  >
                    <span class="text-bold text-uppercase">Area de upload</span>
                    <br />
                    Clique no botão "mais" ou arraste seu arquivo até esta caixa
                  </div>

                  <q-list separator v-if="scope.files.length > 0" style="min-width: 100%">
                    <q-item v-for="file in scope.files" :key="file.name">
                      <q-item-section>
                        <q-item-label class="full-width ellipsis">
                          {{ file.name }}
                        </q-item-label>

                        <q-item-label caption> Status: {{ file.__status }} </q-item-label>

                        <q-item-label caption>
                          {{ file.__sizeLabel }} / {{ file.__progressLabel }}
                        </q-item-label>
                      </q-item-section>

                      <q-item-section top side>
                        <q-btn
                          flat
                          dense
                          round
                          class="gt-xs"
                          size="12px"
                          icon="clear"
                          color="red"
                          @click="scope.removeFile(file)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </template>
            </q-uploader>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </main>
</template>

<script>
import { api } from "app/modules/controleonline/ui-common/src/api";



const SETTINGS = {
  columns: [
    {
      name: "id",
      field: (row) => row.id,
      align: "left",
      label: "ID",
    },
    {
      name: "fileName",
      field: (row) => row.fileName,
      align: "left",
      label: "Nome do arquivo",
    },
    {
      name: "import_type",
      field: (row) => row.importType,
      align: "left",
      label: "Tipo",
    },
    {
      name: "status",
      field: (row) => row.status,
      align: "left",
      label: "Status",
    },
    {
      name: "feedback",
      field: (row) => row.feedback,
      align: "left",
      label: "Detalhes",
    },
    {
      name: "uploadDate",
      field: (row) => row.uploadDate,
      align: "left",
      label: "Enviado em",
    },
    { name: "action" },
  ],
};

Object.freeze(SETTINGS);

export default {
  watch: {
    "filters.status": function () {
      this.onRequest({
        pagination: this.pagination,
      });
    },

    "importType.import_type": function () {
      this.onRequest({
        pagination: this.pagination,
      });
    },
  },
  props: {
    tableId: {
      type: [String, Number],
      required: false,
    },
    import_type: {
      type: String,
      required: false,
    },

  },

  data() {
    return {
      filters: {
        status: { label: "Abertos", value: -1 },
      },
      statuses: [
        { label: "Abertos", value: -1 },
        { label: "Todos", value: 0 },
        { label: this.$t("import.statuses." + "waiting"), value: "waiting" },
        { label: this.$t("import.statuses." + "importing"), value: "importing" },
        { label: this.$t("import.statuses." + "imported"), value: "imported" },
        { label: this.$t("import.statuses." + "failed"), value: "failed" },
      ],
      importType: {
        import_type: this.import_type
          ? { value: this.import_type }
          : { label: this.$t("import.importStatuses." + "DACTE"), value: "DACTE" },
      },
      importStatuses: [
        { label: this.$t("import.importStatuses." + "table"), value: "table" },
        { label: this.$t("import.importStatuses." + "DACTE"), value: "DACTE" },
        { label: this.$t("import.importStatuses." + "leads"), value: "Leads" },
      ],
      items: [],
      dialog: false,
      settings: SETTINGS,
      isLoading: false,
      pagination: {
        sortBy: "uploadDate",
        descending: false,
        page: 1,
        rowsPerPage: 10,
        rowsNumber: 10,
      },
      uploadEndpoint: `${this.$entrypoint}/import `,
      uploadHeaders: [
        {
          name: "API-TOKEN",
          value: this.$store.getters["auth/user"].token,
        },
      ],
      uploadAccepted: ".csv",
    };
  },

  computed: {
    myClass() {
      return `q-upd q-upd-single`;
    },
  },

  created() {
    this.onRequest({
      pagination: this.pagination,
    });
  },

  methods: {
    // store method
    getItems(params) {
      const endpoint = `imports`;

      if (!params) {
        params = {};
      }

      if (this.tableId) params.tableParam = this.tableId;
      params.status = this.filters.status.value;
      params.import_type = this.importType.import_type.value;

      return api
        .fetch(endpoint, { params })

        .then((result) => {
          return {
            imports: result.response.data.imports,
            total: result.response.data.total,
          };
        });
    },

    // store method
    delete(id) {
      let options = {
        method: "DELETE",
      };

      let endpoint = `import /${id}`;
      return api.fetch(endpoint, options).catch((e) => {
        if (e instanceof SubmissionError) throw new Error(e.errors._error);

        throw new Error(e.message);
      });
    },

    removeItem(item) {
      if (window.confirm("Tem certeza que deseja eliminar este registro?")) {
        item._bussy = true;

        this.delete(item.id)
          .then((data) => {
            if (data) {
              this.cleanItem(item.id);

              this.$emit("removed", item.id);
            }
          })
          .catch((error) => {
            this.$emit("error", { message: error.message });
          })
          .finally(() => {
            item._bussy = false;
          });
      }
    },

    cleanItem(id) {
      let item = this.items.find((obj) => obj["id"] == id);
      let indx = this.items.indexOf(item);
      this.items = [...this.items.slice(0, indx), ...this.items.slice(indx + 1)];
    },

    onRequest(props) {
      if (this.isLoading) return;

      let { page, rowsPerPage, rowsNumber, sortBy, descending } = props.pagination;

      let params = {
        itemsPerPage: rowsPerPage,
        page,
      };

      this.isLoading = true;

      this.getItems(params)
        .then((data) => {
          let _items = [];

          if (data.imports.length) {
            for (let index in data.imports) {
              const row = data.imports[index];
              _items.push({
                id: row.id,
                fileName: row.Name,
                typeLabel: row.importType,
                statusLabel: row.status,
                status: row.status,
                tableName: row.tableName,
                feedback: /[0-9]/g.test(row.feedback)
                  ? row.feedback
                  : this.$t("import.feedback." + row.feedback),
                uploadDate: this.$formatter.formatDateYmdTodmY(row.uploadDate),
                _bussy: false,
              });
            }
          }

          this.items = _items;
          this.pagination.page = page;
          this.pagination.rowsPerPage = rowsPerPage;
          this.pagination.sortBy = sortBy;
          this.pagination.descending = descending;
          this.pagination.rowsNumber = data.total;
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    fileUploaded(info) {
      this.$refs.uploader.removeUploadedFiles();
      this.dialog = false;
      this.onRequest({
        pagination: this.pagination,
      });
    },

    uploadFailed(info) {
      if (this.showError) {
        this.$q.notify({
          message: this.$t("errors.upload_failed"),
          position: "bottom",
          type: "negative",
        });
      }
    },
  },
};
</script>

<style>
.q-uploader {
  margin: 20px auto;
  border: 1px dotted grey;
  border-radius: 10px !important;
  width: 80%;
}
</style>
