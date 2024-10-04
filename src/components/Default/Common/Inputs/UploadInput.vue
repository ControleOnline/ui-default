<template>
  <div class="upload-bars">
    <q-uploader
      ref="uploader"
      no-thumbnails
      square
      flat
      :url="endpoint || $entrypoint"
      :headers="headers"
      :accept="accept"
      field-name="file"
      @uploaded="fileUploaded"
      @failed="uploadFailed"
      @removed="filesRemoved"
      :multiple="multiple"
      :class="myClass"
      :auto-upload="autoupd"
      :form-fields="getFields"
    >
      <template v-slot:header="scope">
        <div class="row no-wrap items-center justify-end q-pa-sm q-gutter-xs">
          <q-spinner
            v-if="scope.isUploading"
            class="q-uploader__spinner loading-primary"
          />
          <q-btn
            flat
            dense
            rounded
            v-if="scope.canAddFiles"
            type="a"
            icon="add_box"
            class="btn-primary"
          >
            <q-uploader-add-trigger />
            <q-tooltip>{{ $tt(store, "tooltip", "select") }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="scope.isUploading"
            round
            dense
            flat
            icon="clear"
            color="negative"
            @click="scope.abort"
          >
            <q-tooltip>{{ $tt(store, "tooltip", "cancel") }}</q-tooltip>
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
            <span class="text-bold text-uppercase">{{
              $tt(store, "tooltip", "upload_area")
            }}</span>
            <br />{{ $tt(store, "tooltip", "upload_description") }}
          </div>

          <q-list
            separator
            v-if="scope.files.length > 0"
            style="min-width: 100%"
          >
            <q-item v-for="file in scope.files" :key="file.name">
              <q-item-section>
                <q-item-label class="full-width ellipsis">
                  {{ file.name }}
                </q-item-label>

                <q-item-label caption>
                  {{ $tt(store, "tooltip", "status") }}
                  : {{ file.__status }}
                </q-item-label>

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
                  color="negative"
                  @click="scope.removeFile(file)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </template>
    </q-uploader>
  </div>
</template>

<script>
import * as DefaultFiltersMethods from "@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js";
import { mapGetters, mapActions } from "vuex";

export default {
  props: {
    multiple: {
      type: Boolean,
      required: false,
      default: true,
    },
    open: {
      type: Boolean,
      required: false,
      default: false,
    },
    autoupd: {
      type: Boolean,
      required: false,
      default: true,
    },
    extraData: {
      type: Array,
      required: false,
      default: () => [],
    },
    maximized: {
      type: Boolean,
      required: false,
      default: false,
    },
    accept: {
      type: String,
      required: false,
      default: () => ".jpg, .pdf, image/*",
    },
    item: {
      type: Object,
      required: false,
    },
    endpoint: {
      type: String,
      required: false,
    },
    showError: {
      type: Boolean,
      required: false,
      default: true,
    },
    store: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      headers: [
        {
          name: "API-TOKEN",
          value: this.$store.getters["auth/user"].token,
        },
      ],
    };
  },
  watch: {
    open(newVal) {
      if (newVal) this.openUploader();
    },
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),

    myClass() {
      return (
        `q-upd ${this.multiple ? "q-upd-multiple" : "q-upd-single"}` +
        ` ${this.maximized ? "q-upd-maximized" : ""}`
      );
    },
  },
  methods: {
    ...DefaultFiltersMethods,
    getFields() {
      let data = this.$copyObject(this.extraData);
      data.push({ name: "people", value: this.myCompany?.id });
      let item = (this.item.id || this.item["@id"] || this.item).toString();
      if (item)
        data.push({
          name: "id",
          value: item.replace(/\D/g, ""),
        });

      return data;
    },
    openUploader() {
      this.$refs.uploader.$el.querySelector('input[type="file"]').click();
    },
    filesRemoved() {
      this.$emit("filesRemoved");
    },
    fileUploaded(info) {
      let response = JSON.parse(info.xhr.response);
      //this.$refs.uploader.removeUploadedFiles();
      this.$emit("fileUploaded", response);
    },
    uploadFailed(info) {
      let response = JSON.parse(info.xhr.response);

      if (this.showError) {
        this.$q.notify({
          message: this.$tt(this.store, "message", response.error),
          position: "bottom",
          type: "negative",
        });
      }

      this.$emit("uploadFailed", response);
    },
  },
};
</script>

<style lang="stylus">
.q-upd
  min-width : 100% !important
  width     : 100% !important
  &-multiple, &-single
    border    : 1px dashed #cccccc !important
.q-upd-maximized
  min-height: calc(100vh - 150px)!important
.upload-bars
    position: fixed;
    width: 400px;
    bottom: 0px;
    z-index: 999;
</style>
