<template>
  <label class="bg sticky-top full-width q-mb-lg" :style="{ top: '65px' }">
    {{ $tt("files", "input", "file_name") }}

    <q-input
      outlined
      dense
      lazy-rules
      stack-label
      class="full-width"
      v-model="file_name"
      :readonly="readonly"
    >
      <File
        v-if="readonly"
        :editable="true"
        :data="item"
        :fileType="['text']"
        store="file"
        @save="changed"
      />
    </q-input>
  </label>
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
    v-if="!readonly"
    class="row justify-end q-pa-sm bg sticky-bottom full-width"
  >
    <q-btn :label="$tt('file', 'btn', 'save')" color="primary" @click="save" />
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
    data: {
      required: false,
      default() {
        return {
          id: this.item?.id,
          extension: "html",
          file_name: "",
          file_type: "text",
          content: this.editor,
          people: "/people/" + this.myCompany?.id,
        };
      },
    },
  },
  data() {
    return {
      file_name: "",
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
    }),
    fetchData() {
      if (this.item && this.item["@id"])
        this.getItem(this.item["@id"]).then((data) => {
          this.editor = data.content;
          this.file_name = data.file_name;
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
          file_name: "",
          file_type: "text",
          content: this.editor,
          people: "/people/" + this.myCompany?.id,
        }
      );
      data.content = this.editor;
      data.file_name = this.file_name;
      return data;
    },
    save() {
      this.saveItem(this.getData())
        .then((data) => {
          this.$emit("saved", data);
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
