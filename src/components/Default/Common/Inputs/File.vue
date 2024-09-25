<template>
  <div
    class="image-upload-wrapper"
    @click="openUpload"
    @blur="this.$emit('blur', $event)"
  >
    <img v-if="item?.id" :src="getImage()" :alt="label" class="default-image" />
    <div class="upload-icon" v-if="editable" @click="this.open = true">📤</div>

    <UploadForm
      :open="open"
      :multiple="multiple"
      :accept="accept"
      :style="{ display: 'none' }"
    />
  </div>
</template>

<script>
import UploadForm from "@controleonline/ui-default/src/components/Default/Common/Inputs/UploadInput.vue";
import { ENTRYPOINT } from "app/config/entrypoint";
import { mapGetters, mapActions } from "vuex";

export default {
  components: {
    UploadForm,
  },
  props: {
    item: {
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
    accept: {
      required: false,
      default: () => ".jpg, .pdf, image/*",
    },
  },
  data() {
    return { open: false };
  },
  computed: {
    ...mapGetters({}),
  },
  created() {
    console.log(this.item);
  },
  methods: {
    ...mapActions({}),
    openUpload() {
      if (!this.disable) this.open = true;
      setTimeout(() => {
        this.open = false;
      }, 300);
    },
    getImage() {
      return ENTRYPOINT + "/files/download/" + this.item?.id;
    },
  },
};
</script>

<style scoped>
.image-upload-wrapper {
  position: relative; /* Para posicionar o ícone sobre a imagem */
  cursor: pointer; /* Indica que a imagem é clicável */
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
  background: rgba(0, 0, 0, 0.6); /* Fundo semi-transparente */
  color: #fff; /* Cor do ícone */
  padding: 5px;
  border-radius: 50%;
  font-size: 18px; /* Tamanho do ícone */
  pointer-events: none; /* Não interferir no clique da imagem */
}

@media (max-width: 768px) {
  .default-image {
    width: 100px; /* Reduz a largura da imagem no mobile */
  }
}
</style>
