<template>
  <div class="bg sticky-top full-width" :style="{ top: '64px', 'z-index': 2 }">
    <label class="q-mb-lg">
      {{ $tt("files", "input", "fileName") }}
      <q-input
        outlined
        dense
        lazy-rules
        stack-label
        class="full-width"
        v-model="fileName"
        :readonly="readonly"
      >
        <File
          v-if="readonly || editInline == true"
          :editable="true"
          :data="item"
          :fileType="['text']"
          @save="changed"
        />
      </q-input>
    </label>
  </div>
  <q-editor
    v-model="editor"
    :readonly="readonly"
    :definitions="
      readonly
        ? false
        : {
            save: {
              tip: 'Save your work',
              icon: 'save',
              label: 'Save',
              handler: saveWork,
            },
            upload: {
              tip: 'Upload to cloud',
              icon: 'cloud_upload',
              label: 'Upload',
              handler: uploadIt,
            },
          }
    "
    :toolbar="
      readonly
        ? false
        : [
            ['upload', 'save'],
            [
              {
                label: $q.lang.editor.align,
                icon: $q.iconSet.editor.align,
                fixedLabel: true,
                list: 'only-icons',
                options: ['left', 'center', 'right', 'justify'],
              },
              {
                label: $q.lang.editor.align,
                icon: $q.iconSet.editor.align,
                fixedLabel: true,
                options: ['left', 'center', 'right', 'justify'],
              },
            ],
            [
              'bold',
              'italic',
              'strike',
              'underline',
              'subscript',
              'superscript',
            ],
            ['token', 'hr', 'link', 'custom_btn'],
            ['print', 'fullscreen'],
            [
              {
                label: $q.lang.editor.formatting,
                icon: $q.iconSet.editor.formatting,
                list: 'no-icons',
                options: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code'],
              },
              {
                label: $q.lang.editor.fontSize,
                icon: $q.iconSet.editor.fontSize,
                fixedLabel: true,
                fixedIcon: true,
                list: 'no-icons',
                options: [
                  'size-1',
                  'size-2',
                  'size-3',
                  'size-4',
                  'size-5',
                  'size-6',
                  'size-7',
                ],
              },
              {
                label: $q.lang.editor.defaultFont,
                icon: $q.iconSet.editor.font,
                fixedIcon: true,
                list: 'no-icons',
                options: [
                  'default_font',
                  'arial',
                  'arial_black',
                  'comic_sans',
                  'courier_new',
                  'impact',
                  'lucida_grande',
                  'times_new_roman',
                  'verdana',
                ],
              },
              'removeFormat',
            ],
            ['quote', 'unordered', 'ordered', 'outdent', 'indent'],

            ['undo', 'redo'],
            ['viewsource'],
          ]
    "
    :fonts="{
      arial: 'Arial',
      arial_black: 'Arial Black',
      comic_sans: 'Comic Sans MS',
      courier_new: 'Courier New',
      impact: 'Impact',
      lucida_grande: 'Lucida Grande',
      times_new_roman: 'Times New Roman',
      verdana: 'Verdana',
    }"
    class="full-width"
  />

  <div
    v-if="
      !readonly &&
      ((generatePDF && originalEditor == editor) || originalEditor != editor)
    "
    class="row justify-end bg sticky-bottom full-width"
    :style="{
      'z-index': 2,
      position: 'fixed !important',
      left: 0,
      'padding-right': '35px',
    }"
  >
    <q-btn
      v-if="generatePDF && originalEditor == editor"
      icon="picture_as_pdf"
      :label="$tt('file', 'btn', 'pdf')"
      color="primary"
      @click="toPdf"
    />
    <q-btn
      v-if="originalEditor != editor"
      icon="save"
      :label="$tt('file', 'btn', 'save')"
      color="primary"
      @click="save"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  components: {},
  props: {
    readonly: {
      required: false,
      default: false,
    },
    editInline: {
      required: false,
      default: false,
    },
    generatePDF: {
      required: false,
      default: false,
    },
    data: {
      required: false,
      default() {
        return {
          id: this.item?.id,
          extension: "html",
          fileName: "",
          fileType: "text",
          content: this.editor,
          people: "/people/" + this.myCompany?.id,
        };
      },
    },
  },
  data() {
    return {
      originalEditor: "",
      fileName: "",
      editor: "",
      item: {},
    };
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
  },
  created() {
    this.item = this.$copyObject(this.data);
    this.fetchData();
  },

  watch: {
    item: {
      handler: function () {
        this.$emit("changed", this.getData());
      },
      deep: true,
    },
  },
  methods: {
    ...mapActions({
      getItem: "file/get",
      saveItem: "file/save",
      convert: "file/convert",
    }),
    fetchData() {
      if (this.item && this.item["@id"])
        this.getItem(this.item["@id"]).then((data) => {
          this.originalEditor = data.content;
          this.editor = data.content;
          this.fileName = data.fileName;
        });
    },

    changed(data) {
      this.item = data;
      this.fetchData();
    },
    getData() {
      let data = this.$copyObject(
        this.item || {
          id: this.item?.id,
          extension: "html",
          fileName: "",
          fileType: "text",
          content: this.editor,
          people: "/people/" + this.myCompany?.id,
        }
      );
      data.content = this.editor;
      data.fileName = this.fileName;
      return data;
    },
    toPdf() {
      this.convert({ id: this.item?.id }).then((data) => {
        this.$emit("converted", data);
      });
    },
    save() {
      this.saveItem(this.getData())
        .then((data) => {
          this.$emit("saved", data);
          this.originalEditor = this.editor;
          //this.$emit("changed", data);
          this.$q.notify({
            message: this.$tt("file", "message", "success"),
            position: "bottom",
            type: "positive",
          });
        })
        .catch((error) => {
          this.$emit("error", error);
          this.$q.notify({
            message: this.$tt("file", "message", "error"),
            position: "bottom",
            type: "negative",
          });
        });
    },
  },
};
</script>
