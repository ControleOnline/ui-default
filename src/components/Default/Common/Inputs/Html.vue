<template>
  <label class="bg sticky-top full-width q-mb-lg" :class="{ top: '65px' }">
    {{ $tt("files", "input", "file_name") }}

    <q-input
      outlined
      dense
      lazy-rules
      stack-label
      class="full-width"
      v-model="file_name"
    />
  </label>
  <q-editor
    v-model="editor"
    :definitions="{
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
    }"
    :toolbar="[
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
      ['bold', 'italic', 'strike', 'underline', 'subscript', 'superscript'],
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
    ]"
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

  <div class="row justify-end q-pa-sm bg sticky-bottom full-width">
    <q-btn label="Salvar" color="primary" @click="save" />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  components: {},
  props: {
    data: {
      required: false,

      default() {
        return {
          id: this.data.id,
          extension: "html",
          file_name: "",
          file_type: "text",
          content: this.editor,
          people: "/people/" + myCompany.id,
        };
      },
    },
  },
  data() {
    return {
      editor: "",
      file_name: "",
    };
  },
  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
  },
  created() {
    this.getData();
  },
  methods: {
    ...mapActions({
      getItem: "file/get",
      saveItem: "file/save",
    }),
    getData() {
      if (this.data && this.data["@id"])
        this.getItem(this.data["@id"]).then((data) => {
          this.editor = data.content;
          this.file_name = data.file_name;
        });
    },
    save() {
      let data = this.$copyObject(this.data);
      data.content = this.editor;
      data.file_name = this.file_name;

      this.saveItem(data)
        .then((data) => {
          this.$emit("saved", data);
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
    onPaste(evt) {
      if (evt.target.nodeName === "INPUT") return;
      let text, onPasteStripFormattingIEPaste;
      evt.preventDefault();
      evt.stopPropagation();
      if (evt.originalEvent && evt.originalEvent.clipboardData.getData) {
        text = evt.originalEvent.clipboardData.getData("text/plain");
        editorRef.value.runCmd("insertText", text);
      } else if (evt.clipboardData && evt.clipboardData.getData) {
        text = evt.clipboardData.getData("text/plain");
        editorRef.value.runCmd("insertText", text);
      } else if (window.clipboardData && window.clipboardData.getData) {
        if (!onPasteStripFormattingIEPaste) {
          onPasteStripFormattingIEPaste = true;
          editorRef.value.runCmd("ms-pasteTextOnly", text);
        }
        onPasteStripFormattingIEPaste = false;
      }
    },
  },
};
</script>
