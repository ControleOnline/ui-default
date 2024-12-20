<template>
  <div
    :class="
      data && data['@id'] && data.fileType == 'image'
        ? 'image-upload-wrapper'
        : 'q-pt-xs'
    "
    @blur="this.$emit('blur', $event)"
  >
    <img
      v-if="data && data['@id'] && data.fileType == 'image'"
      :src="$image(data)"
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
          this.data && this.data.fileType == "image" ? "image" : "description",
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
    save(data, editIndex) {
      this.$emit("save", data, editIndex);
    },
  },
};
</script>

<style>
.image-upload-wrapper {
  position: relative;
  min-height: 80px;
}

.default-image {
  width: 150px;
  height: auto;
  margin-bottom: 10px;
  display: block;
}
.image-upload-wrapper .upload-icon {
  position: absolute;
  top: calc(50% - 15px);
  right: 5px;
}
@media (max-width: 768px) {
  .default-image {
    width: 100px;
  }
}
</style>
