<template>
  <div class="image-upload-wrapper" @blur="this.$emit('blur', $event)">
    <img
      v-if="data && data['@id']"
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
import FileExplorer from "@controleonline/ui-common/src/components/Common/FileExplorer";
import DefaultButtonDialog from "@controleonline/ui-default/src/components/Default/DefaultButtonDialog";

export default {
  components: {
    FileExplorer,
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
    filters: {
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
        icon: "settings",
        store: "file",
        context: "file",
        index: this.index,
        "full-height": true,
        class: "upload-icon q-pa-xs btn-primary",
        label: this.label,
        component: FileExplorer,
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

.upload-icon {
  position: absolute; /* Sobrepõe a imagem */
  top: 10px; /* Ajusta conforme necessário */
  right: 10px; /* Ajusta conforme necessário */
}

@media (max-width: 768px) {
  .default-image {
    width: 100px; /* Reduz a largura da imagem no mobile */
  }
}
</style>
