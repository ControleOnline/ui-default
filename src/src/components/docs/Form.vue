<!--suppress ALL -->
<template>
  <q-form ref="myForm" @submit="onSubmit" autocomplete="off">
    <div class="row q-col-gutter-xs q-pb-xs">
      <div class="col-xs-12 col-md-6">
        <q-select
          dense
          outlined
          autocomplete="off"
          v-model="item.empresa"
          use-input
          use-chips
          input-debounce="0"
          label="Empresa"
          :options="optionsQselect"
          option-value="id"
          option-label="name"
          :loading="loading"
          @filter="searchPeopleByDocumentOrName"
          :rules="[isInvalid('select')]"
          hint="Digite o CNPJ ou Razão Social"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                Nenhum Resultado Encontrado
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </div>
    <div class="row q-col-gutter-xs q-pb-xs q-mt-md">
      <div class="col-xs-12 col-sm-3">
        <q-select
          dense
          outlined
          stack-label
          label="Tipo"
          v-model="item.tipo"
          :options="tipos"
          class="full-width"
          :rules="[isInvalid('select')]"
        />
      </div>
      <div class="col-xs-12 col-sm-3">
        <q-select
          dense
          outlined
          stack-label
          label="Nome"
          v-model="item.imposto"
          :options="impostos"
          class="full-width"
          :rules="[isInvalid('select')]"
        />
      </div>
      <div class="col-xs-12 col-sm-3">
        <q-input
          dense
          outlined
          ref="periodoInput"
          stack-label
          v-model="item.periodo"
          mask="##/####"
          label="Período (Mês/Ano)"
          @blur="onBlurFunc('mesAno', item.periodo)"
          @focus="periodoFocus = true"
          :rules="[isInvalid('periodo')]"
        >
        </q-input>
      </div>
      <div class="col-xs-12 col-sm-3">
        <q-select
          dense
          outlined
          stack-label
          :label="$t(this.docs_type + '.status_name')"
          v-model="item.status"
          :options="statuses"
          class="full-width"
          :rules="[isInvalid('select')]"
        />
      </div>
      <div class="col-xs-12 col-md-6">
        <q-file
          ref="guia"
          color="purple-12"
          v-model="arquivoGuia"
          label="Guia PDF"
          :rules="[isInvalid('arquivoGuia')]"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>

        <q-btn
          v-if="checkFilesIsAtached('arquivoGuia', arquivoGuia)"
          @click="checkConfirm('arquivoGuia')"
          size="sm"
          color="red-10"
          icon="cancel"
          label="Excluir Guia"
        />
        <q-btn
          v-if="btnSeeGuideVis"
          ref="btnSeeGuide"
          :loading="btnSeeGuideLoading"
          class="q-ml-sm"
          @click="downloadFilesCallApi('guide')"
          size="sm"
          color="secondary"
          icon="download_for_offline"
          label="Download"
        />
      </div>
      <div class="col-xs-12 col-md-6 q-mt-xs-lg q-mt-md-none">
        <q-file
          v-model="arquivoRecibo"
          color="purple-12"
          label="Recibo PDF"
          :rules="[isInvalid('arquivoRecibo')]"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>
        <q-btn
          v-if="checkFilesIsAtached('arquivoRecibo', arquivoRecibo)"
          @click="checkConfirm('arquivoRecibo')"
          size="sm"
          color="red-10"
          icon="cancel"
          label="Excluir Recibo"
        />
        <q-btn
          v-if="btnSeeReceiptVis"
          ref="btnSeeReceipt"
          :loading="btnSeeReceiptLoading"
          class="q-ml-sm"
          @click="downloadFilesCallApi('receipt')"
          size="sm"
          color="secondary"
          icon="download_for_offline"
          label="Download"
        />
      </div>
    </div>

    <div class="row justify-between q-mt-xl">
      <q-btn
        ref="btnCancelar"
        icon="arrow_back"
        type="button"
        label="Retornar"
        size="md"
        color="primary"
        class="q-mt-md"
        :to="{ name: 'DocsIndex' }"
      />
      <q-btn
        ref="btnSave"
        :loading="saving"
        icon="save"
        type="submit"
        label="Salvar"
        size="md"
        color="primary"
        class="q-mt-md"
      />
    </div>
    <q-dialog v-model="confirmDetach" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="file_copy" color="primary" text-color="white" />
          <span class="q-ml-sm">
            Você deseja realmente Desanexar o Arquivo
            {{ detachLabel === "arquivoGuia" ? "da Guia" : "do Recibo" }} ?
          </span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="primary" v-close-popup />
          <q-btn
            flat
            label="Sim"
            color="primary"
            @click="detachFile(detachLabel)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-form>
</template>

<script>
import { api } from "app/modules/controleonline/ui-common/src/api";
import axios from "axios";
import { mapGetters } from "vuex";



const msgErro = "Este campo é obrigatório";

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

/**
 * Verifica se o objeto arquivo é válido
 * @param fileObj
 * @returns {boolean}
 */
function fileExists(fileObj) {
  return fileObj !== null && typeof fileObj !== "undefined";
}

function sizeIsFic(fileObj) {
  return fileObj.size >= 2 && fileObj.size <= 5;
}

/**
 * Checa se é um arquivo fictício, usado apenas para atualização(PUT) de dados
 * @param fileObj
 * @returns {boolean}
 */
function fileIsFictitious(fileObj) {
  if (!fileExists(fileObj)) {
    return false;
  }
  return sizeIsFic(fileObj);
}

function findIn(obj, search) {
  return obj.find((c) => c.value === search);
}

export default {
  components: {
  },
  props: {
    docs_type: {
      type: String,
      required: true,
    },
    idRoute: {
      required: true,
      default: null,
    },
  },
  data() {
    return {
      loadingStatuses: false,
      btnSeeGuideVis: true,
      btnSeeGuideLoading: false,
      btnSeeReceiptVis: true,
      btnSeeReceiptLoading: false,
      btnSeeReceiptHidden: true,
      editMode: false, // Quando 'true', modo de edição de registro existente, quando 'false' modo de inserção de novo registro
      myCompanyLocal: null,
      myCompanyLocalLoaded: false,
      pageUpdated: false,

      detachLabel: null,
      confirmDetach: false,
      arquivoGuia: null,
      arquivoRecibo: null,
      // ----- Para Busca de Empresa por CNPJ e Razão Social
      searchTmp: null,
      optionsQselect: null,
      // ----------------
      periodoFocus: false,

      saving: false,
      loading: false,
      item: {
        tipo: null,
        empresa: null,
        imposto: null,
        periodo: null,
        status: null,
      },
      statuses: [],
      tipos: [
        {
          label: "Imposto",
          value: "imposto",
        },
        {
          label: "Declaração",
          value: "declaracao",
        },
      ],
      impostos: [
        {
          label: "DAS",
          value: "das",
        },
        {
          label: "PIS",
          value: "pis",
        },
        {
          label: "COFINS",
          value: "cofins",
        },
      ],
    };
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
  },
  watch: {
    myCompany(company) {
      // Quando o usuário altera a "Company"
      this.checkIfChangeMyCompany();
    },
    $data: {
      // Monitora alteração de determinada variável, OBS: Resolve o BUG do delay no watch da myCompany
      handler: function (objNew) {
        // --------------------
        if (objNew.arquivoGuia !== null) {
          // Apresenta ou oculta o Botão ver Guia
          this.btnSeeGuideVis = sizeIsFic(objNew.arquivoGuia);
        } else {
          this.btnSeeGuideVis = false;
        }
        // --------------------
        if (objNew.arquivoRecibo !== null) {
          // Apresenta ou oculta o Botão ver Recibo
          this.btnSeeReceiptVis = sizeIsFic(objNew.arquivoRecibo);
        } else {
          this.btnSeeReceiptVis = false;
        }
        // --------------------
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
        //if (!this.orderId && !this.client)
        //this.filters.status = this.statuses.find((status) => 'open' == status.original);
        //else
        //          this.filters.status = { label: this.$t(this.docs_type + ".status.all"), value: -1 };
      });
    },

    getStatuses() {
      let params = [];
      params.context = this.docs_type;
      params["order[name]"] = "ASC";

      return api.fetch("/statuses", { params })
      .then((result) => {
        return {
          members: result["hydra:member"],
          totalItems: result["hydra:totalItems"],
        };
      });
    },

    /**
     * @param type ('guide','receipt')
     * @param action ('hide','show')
     */
    guiRecHideShowLoading(type, action) {
      if (action === "hide") {
        if (type === "guide") {
          this.btnSeeGuideLoading = false;
        }
        if (type === "receipt") {
          this.btnSeeReceiptLoading = false;
        }
      }
      if (action === "show") {
        if (type === "guide") {
          this.btnSeeGuideLoading = true;
        }
        if (type === "receipt") {
          this.btnSeeReceiptLoading = true;
        }
      }
    },
    downloadFilesCallApi(type) {
      let id = this.idRoute;
      this.guiRecHideShowLoading(type, "show");
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
          this.guiRecHideShowLoading(type, "hide");
          return false;
        }
        const content = response.headers["content-type"];
        let blob = new Blob([response.data], { type: content }),
          url = window.URL.createObjectURL(blob);
        let fileName = null;
        if (type === "guide") {
          fileName = this.arquivoGuia.name;
        }
        if (type === "receipt") {
          fileName = this.arquivoRecibo.name;
        }
        forceDownloadFile(blob, fileName);
        this.guiRecHideShowLoading(type, "hide");
      });
    },
    checkIfChangeMyCompany() {
      if (this.myCompanyLocal !== null) {
        if (this.myCompany.id !== this.myCompanyLocal) {
          this.$router.push({
            name: this.docs_type[0].toUpperCase() + this.docs_type.substr(1) + "Index",
          });
        }
      }
      if (this.myCompany !== null) {
        if (this.myCompanyLocal !== this.myCompany.id) {
          this.myCompanyLocal = this.myCompany.id;
        }
      }
    },
    validaData(data) {
      let date = data;
      let ardt = [];
      let ExpReg = new RegExp("(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[012])/[12][0-9]{3}");
      ardt = date.split("/");
      let erro = false;
      if (date.search(ExpReg) === -1) {
        erro = true;
      } else if (
        (ardt[1] === 4 || ardt[1] === 6 || ardt[1] === 9 || ardt[1] === 11) &&
        ardt[0] > 30
      )
        erro = true;
      else if (ardt[1] === 2) {
        if (ardt[0] > 28 && ardt[2] % 4 !== 0) erro = true;
        if (ardt[0] > 29 && ardt[2] % 4 === 0) erro = true;
      }
      return !erro;
    },
    setFileGuideOrReceipt(arqTipo, value) {
      if (arqTipo === "arquivoGuia") {
        this.arquivoGuia = value;
      }
      if (arqTipo === "arquivoRecibo") {
        this.arquivoRecibo = value;
      }
    },
    checkConfirm(arqTipo) {
      this.detachLabel = arqTipo;
      this.confirmDetach = true;
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
    /**
     * Cria um arquivo fictício para exibir na caixa de arquivo "Guia ou Recibo", apenas para edição (método PUT)
     * @param arqTipo ('guia','recibo')
     * @param fileName (Ex: 'guia-pdf-3.pdf')
     */
    editModeSetFileOnlyName(arqTipo, fileName) {
      let tmpFileObj = null;
      tmpFileObj = new File(["foo"], fileName, {
        type: "text/plain",
      });
      this.setFileGuideOrReceipt(arqTipo, tmpFileObj);
    },
    detachFile(arqTipo) {
      this.setFileGuideOrReceipt(arqTipo, null);
    },
    checkFilesIsAtached(arqTipo, objFile) {
      // Verifica se é necessário exibir botão 'Excluir Guia ou Excluir Recibo'
      if (!fileExists(objFile)) {
        this.setFileGuideOrReceipt(arqTipo, null);
        return false;
      }
      return true;
    },
    /**
     * @param method ('post','put','get')
     * @param data (objJSON)
     * @returns {Promise<AxiosResponse<any>>}
     */
    getOrSaveDataToAPI(method, data, id) {
      // Trabalha com os métodos GET, POST e PUT
      var formData = new FormData();
      let idStr = "";
      if (typeof id !== "undefined") {
        // Para o método GET captura de 1 único registro
        idStr = "/" + id;
      }
      if (typeof data !== "undefined") {
        // Somente para os método POST cria ou atualiza
        if (!fileIsFictitious(this.arquivoGuia)) {
          // Só anexa o arquivo da GUIA se o arquivo da guia não foi alterado
          formData.append("file", this.arquivoGuia);
        }
        if (!fileIsFictitious(this.arquivoRecibo)) {
          // Só anexa o arquivo do Recibo se o arquivo do recibo não foi alterado
          formData.append("fileb", this.arquivoRecibo);
        }
        formData.append("data", (data));
      }
      return axios({
        method: method,
        url: this.$entrypoint + "/filesb" + idStr,
        data: formData,
        headers: {
          "api-token": this.API.token,
          "Content-Type": "multipart/form-data",
        },
      })
        .then((data) => {
          return data.data;
        })
        .catch((error) => {
          this.alertNotify(error, "n");
          console.log("error: " + error);
        });
    },

    getValuesToSave() {
      this.saving = true;
      this.$q.loading.show();

      let data = {
        company_id: this.myCompany.id, // 10122
        people_id: this.item.empresa.id, // 1176
        type: this.item.tipo.value, // 'imposto','declaracao'
        name: this.item.imposto.value, // 'das', 'pis', 'confins'
        date_period: this.item.periodo, // '10/2021'
        status: this.item.status.value, // 'sim','nao'
      };

      if (!fileExists(this.arquivoRecibo)) {
        // Caso não exista um arquivo de recibo, envia um parâmetro para desanexá-lo
        data["detach_receipt"] = "sim";
      }

      // ------ Checa se está no modo de edição e define um 'tmpId'
      let tmpId = this.editMode ? this.idRoute : undefined;

      this.getOrSaveDataToAPI("post", data, tmpId) // ----- Entrada somente para modo edição e inclusão
        .then((data) => {
          if (typeof data !== "undefined") {
            let dado = data.response;
            let msgRet = dado.message;

            if (this.editMode) {
              // ----------- Trata o retorno no modo edição
              if (dado.success && msgRet.length > 3) {
                let fileNameGuide = dado.data.fileName_guide;
                let fileNameReceipt = dado.data.fileName_receipt;
                if (fileNameGuide !== null) {
                  // Quando o arquivo da Guia foi atualizado, sinaliza que não é necessário novo envio até que o usuário defina um arquivo de Guia diferente
                  this.editModeSetFileOnlyName("arquivoGuia", fileNameGuide); // Marca como arquivo fictício
                }
                if (fileNameReceipt !== null) {
                  // Quando o arquivo do Recibo foi atualizado, sinaliza que não é necessário novo envio até que o usuário defina um arquivo de Recibo diferente
                  this.editModeSetFileOnlyName("arquivoRecibo", fileNameReceipt); // Marca como arquivo fictício
                }
                this.alertNotify(msgRet, "p");
              }
            } else {
              // ----------------- Trata o retorno no modo Create (Inclusão)

              if (dado.success && msgRet.length > 3) {
                // ----- Inclusão bem sucedida

                let lastInsertId = dado.data.id;
                let fileNameGuide = dado.data.fileName_guide;
                let fileNameReceipt = dado.data.fileName_receipt;
                let fileGuideCreated = dado.data.file_guide_created; // 'sim','nao'
                let fileReceiptCreated = dado.data.file_receipt_created; // 'sim','nao'

                if (fileGuideCreated === "sim") {
                  // Quando o arquivo da Guia foi atualizado, sinaliza que não é necessário novo envio até que o usuário defina um arquivo de Guia diferente
                  this.editModeSetFileOnlyName("arquivoGuia", fileNameGuide); // Marca como arquivo fictício
                }
                if (fileReceiptCreated === "sim") {
                  // Quando o arquivo do Recibo foi atualizado, sinaliza que não é necessário novo envio até que o usuário defina um arquivo de Recibo diferente
                  this.editModeSetFileOnlyName("arquivoRecibo", fileNameReceipt); // Marca como arquivo fictício
                }

                //this.idRoute = lastInsertId;
                this.$emit("setIdRoute", lastInsertId);
                this.editMode = true;
                this.alertNotify(msgRet, "p");
                this.$router.push({
                  name:
                    this.docs_type[0].toUpperCase() + this.docs_type.substr(1) + "Index",
                  params: { id: lastInsertId },
                });
              }
            }

            if (!dado.success) {
              // Em caso de alguma falha
              this.alertNotify(msgRet, "n");
            }
          }

          this.$q.loading.hide();
          this.saving = false;
        });
    },
    getValuesToLoad() {
      if (this.editMode) {
        // Executa somente no modo Edição

        this.getOrSaveDataToAPI("get", null, this.idRoute) // ------- Modo GET Captura dados de um único registro para edição ou visualização
          .then((data) => {
            if (typeof data !== "undefined") {
              if (data.response.success) {
                // ----------------- success = true

                let dado = data.response.data;
                let companyIdXhr = dado.company_id;

                this.item = {
                  empresa: dado.empresa,
                  tipo: findIn(this.tipos, dado.type),
                  imposto: findIn(this.impostos, dado.name),
                  periodo: dado.date_period,
                  status: findIn(this.statuses, dado.status),
                };

                if (dado.fileName_guide !== null) {
                  this.editModeSetFileOnlyName("arquivoGuia", dado.fileName_guide);
                }
                if (dado.fileName_receipt !== null) {
                  this.editModeSetFileOnlyName("arquivoRecibo", dado.fileName_receipt);
                }

                if (companyIdXhr !== this.myCompanyLocal) {
                  this.alertNotify(
                    "Este registro pertence a outra empresa diferente da empresa selecionada.",
                    "n"
                  );
                  this.$router.push({
                    name:
                      this.docs_type[0].toUpperCase() +
                      this.docs_type.substr(1) +
                      "Index",
                  });
                }
              } else {
                // ----------------- success = false

                let message = data.response.message;
                this.alertNotify(message, "n");
                this.$router.push({
                  name:
                    this.docs_type[0].toUpperCase() + this.docs_type.substr(1) + "Index",
                });
              }
            }

            this.$q.loading.hide();
            this.saving = false;
          });
      } else {
        // ----------------- Modo 'Create' para criar um novo registro

        // ----------- Descomentar preenche automaticamente os dados para criar um novo registro
        /*
        this.item = {
          empresa: {
            'id': 78,
            'name': 'Finger Digital LTDA - 06.311.249/0001-02'
          },
          tipo: {
            label: this.tipos[1].label,
            value: 'declaracao'
          },
          imposto: {
            label: this.impostos[2].label,
            value: 'confins'
          },
          periodo: '10/2019',
          status: {
            label: this.statuses[1].label,
            value: 'sim'
          }
        }

        this.editModeSetFileOnlyName('arquivoGuia', 'guia-marco2021-3.pdf')
        this.editModeSetFileOnlyName('arquivoRecibo', 'recibo-pag-marco2021-3.pdf')

         */

        this.$q.loading.hide();
        this.saving = false;
      }
    },

    searchPeopleByDocumentOrName(val, update, abort) {
      this.searchTmp = val;
      if (val.length < 2 || this.loading === true) {
        if (typeof abort === "function" && this.loading === false) {
          abort();
        }
        return;
      }
      this.getPeopleByDocumentAndNameApi(val, update, abort).then((data) => {
        if (val !== this.searchTmp) {
          this.searchPeopleByDocumentOrName(this.searchTmp, update, abort);
          return;
        }
        update(() => {
          let dataRhesus = [];
          if (data.response.data.total > 0) {
            dataRhesus = data.response.data.members;
          }
          this.optionsQselect = dataRhesus;
        });
      });
    },

    getPeopleByDocumentAndNameApi(search) {
      let params = {
        method: "GET",
        params: { search: search },
      };
      return api.fetch("/docs_files/search-people", params)
        .then((data) => {
          return data;
        })
        .catch((error) => {
          console.log("Error: " + error);
        });
    },

    onSubmit() {
      this.$refs.myForm.validate().then((success) => {
        if (success) {
          let payload = {};
          this.getValuesToSave();
          this.$emit("save", payload);
        }
      });
    },

    downloadFile(file) {
      /*
      return api.fetch(`download/${this.id}/files/${file.id}`)
        .then(response => response.blob())
        .then((blob) => {
          if (!exportFile(file.name, blob, blob.type)) {
            throw new Error(this.$t('Download error'));
          }
        });
      */
    },
    onBlurFunc(key, val) {
      switch (key) {
        case "mesAno":
          this.periodoFocus = false;
          this.$refs.periodoInput.validate();
          break;
        default:
      }
    },
    isInvalid(key) {
      return (val) => {
        switch (key) {
          case "arquivoGuia":
          case "arquivoRecibo":
            if (fileExists(val)) {
              // Quando existe um arquivo no input file
              let size = val.size;
              if (size > 2048 * 1000) {
                this.alertNotify("O Arquivo não pode ser maior do que 2MB", "n");
                this.setFileGuideOrReceipt(key, null);
                return false;
              }
              return true;
            }
            if (key === "arquivoRecibo") {
              // Desobriga a existêcia de um arquivo de Recibo
              return true;
            }
            return false;
          case "periodo":
            if (this.periodoFocus) {
              return true;
            }
            if (val === null) {
              return "Data do período deve ser informada.";
            }
            val = val.trim() !== "" ? val : "";
            let dataVal = "01/" + val;
            if (val === "") {
              return msgErro;
            }
            if (!this.validaData(dataVal)) {
              return "Data Inválida, informe o Mês e o Ano.";
            }
          case "select":
            return val === null ? msgErro : true;
          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
              return "O email informado não é válido";
            break;
          default:
            if (!(val && val.length > 0)) return "Este campo é obrigatório";
        }
        return true;
      };
    },
  },
  created() {
    if (this.idRoute !== null) {
      this.editMode = true;
    }

    this.$q.loading.show();
    this.checkIfChangeMyCompany();
    this.requestStatuses();
  },
};
</script>
