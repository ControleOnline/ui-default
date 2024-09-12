<template>
  <div class="image-upload-wrapper" @click="triggerFileUpload">
    <img :src="getImage()" alt="Imagetipo ou Foto" class="default-image" />
    <div class="upload-icon">📤</div>
    <UploadForm
          @click="onFileChange"
          accept="image/*"
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
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters({}),
  },
  created() {},
  methods: {
    ...mapActions({}),
    getImage() {
      return ENTRYPOINT + "/files/download/" + this.item?.image?.id;
    },
  },
};
</script>

<style scoped>
.image-upload-wrapper {
  position: relative; /* Para posicionar o ícone sobre a imagem */
  cursor: pointer; /* Indica que a imagem é clicável */
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
