<template>
  <div
    :class="
      (!data || !data['@id'] ?'full-width ':'') +( data && data['@id'] && data.file_type == 'image'
        ? 'image-upload-wrapper'
        : 'q-pt-xs')
    "
    @blur="this.$emit('blur', $event)"
  >
    <img
      v-if="data && data['@id'] && data.file_type == 'image'"
      :src="getImage(data)"
      :alt="label"
      class="default-image"
    />

    <DefaultButtonDialog
      :configs="configs"
      :row="data"
      v-if="editable"
      @save="save"
    />
  </div>
</template>

<script>
import { ENTRYPOINT } from "app/config/entrypoint";
import { mapGetters, mapActions } from "vuex";
import DefaultButtonDialog from "@controleonline/ui-default/src/components/Default/DefaultButtonDialog";

export default {
  components: {
    DefaultButtonDialog,
  },
  props: {
    data: {
      required: true,
    },
    disable: {
      required: false,
    },
    multiple: {
      required: false,
      default: false,
    },
    index: {
      required: false,
    },
    editable: {
      required: false,
    },
    store: {
      required: false,
    },
    labelType: {
      required: false,
    },
    label: {
      required: false,
    },
    fileType: {
      required: false,
      default: () => ["image"],
    },
  },
  data() {
    return { open: false };
  },
  computed: {
    ...mapGetters({}),
    configs() {
      return {
        icon:
          this.data && this.data.file_type == "image" ? "image" : "description",
        store: "file",
        context: "file",
        index: this.index,
        "full-height": true,
        class: "upload-icon q-pa-xs btn-primary",
        label: this.label,
        fileType: this.fileType,
        component: this.$components.FileExplorer,
      };
    },
  },
  created() {},
  methods: {
    ...mapActions({}),
    openFileExplorer() {
      if (!this.disable) this.open = true;
    },
    getImage(file) {
      return (
        ENTRYPOINT +
        "/files/download/" +
        file["@id"].replace(/\D/g, "") +
        "?_=" +
        btoa(file.file_name)
      );
    },
    save(data, editIndex) {
      this.$emit("save", data, editIndex);
    },
  },
};
</script>

<style>
.image-upload-wrapper {
  position: relative; /* Para posicionar o ícone sobre a imagem */
  min-height: 80px;
}

.default-image {
  width: 150px; /* Largura da imagem */
  height: auto; /* Mantém a proporção da imagem */
  margin-bottom: 10px;
  display: block;
}

@media (max-width: 768px) {
  .default-image {
    width: 100px; /* Reduz a largura da imagem no mobile */
  }
}
</style>
