<template>
  <div
    :class="
      data && data['@id'] && data.fileType == 'image'
        ? 'image-upload-wrapper'
        : 'q-pt-xs'
    "
    :style="size"
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

export default {
  components: {
    
  },
  props: {
    data: {
      required: true,
    },
    context: {
      required: true,
    },
    disable: {
      required: false,
    },
    multiple: {
      required: false,
      default: false,
    },
    editable: {
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
    size: {
      required: false,
    }
  },
  data() {
    return { open: false };
  },
  computed: {
    ...mapGetters({}),
    configs() {
      return {
       // icon:
       //   this.data && this.data.fileType == "image" ? "image" : "description",
       icon: "upload",
        context: this.context,
        "full-height": true,
        class: "upload-icon q-pa-xs btn-primary full-width",
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
    save(data) {
      this.$emit("save", data);
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
