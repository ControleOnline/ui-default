<template>
  <div class="row img-box q-pa-md col-12">
    <q-carousel
      class="full-width default-carousel"
      animated
      v-model="slide"
      v-model:fullscreen="fullscreen"
      :arrows="configs.arrows != false && slides.length > 1"
      infinite
      swipeable
      :thumbnails="configs.thumbnails != false && slides.length > 1"
      :navigation="configs.navigation == true && slides.length > 1"
      :autoplay="configs.autoplay == false ? false : configs.autoplay || 5000"
    >
      <q-carousel-slide
        v-for="(slide, index) in slides"
        :alt="slide.name"
        :name="slide.id"
        :img-src="slide.src"
        class="carosel-image full-width"
        height="300px"
      />
      <template v-slot:control>
        <q-carousel-control position="bottom-right" :offset="[18, 18]">
          <DefaultFile
            v-if="configs.isAdmin"
            :editable="true"
            :data="slide?.file"
            :fileType="['image']"
            :context="configs.context"
            @save="selected"
          />
          <q-btn
            v-if="configs.zoom != false"
            push
            round
            dense
            color="white"
            text-color="primary"
            :icon="fullscreen ? 'fullscreen_exit' : 'fullscreen'"
            @click="fullscreen = !fullscreen"
          />
        </q-carousel-control>
      </template>
    </q-carousel>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  props: {
    files: {
      required: true,
    },
    configs: {
      required: true,
    },
    object: {
      required: true,
    },
  },
  data() {
    return {
      slide: null,
      slides: [],
      fullscreen: false,
      carousel: [],
    };
  },
  created() {
    this.carousel = this.$copyObject(this.files);
    this.init();
  },
  methods: {
    ...mapActions({}),
    selected(selected) {
      const existingItem = this.carousel.find(
        (item) => item.file["@id"] === selected["@id"]
      );

      if (existingItem) {
        this.init(existingItem.file.id);
        return;
      }

      let params = this.$copyObject(this.object);
      params.file = selected["@id"];

      this.$store
        .dispatch(this.configs.store + "/save", params)
        .then((data) => {
          this.carousel.push(data);
          this.init(data.file.id);
        });
    },
    init(slide = null) {
      let slides = [];

      this.carousel.forEach((file, i) => {
        if (!this.slide || slide)
          this.slide = slide || file.file?.id || file?.file.replace(/\D/g, "");
        slides.push({
          id: file.file?.id || file?.file.replace(/\D/g, ""),
          file: file.file,

          src: this.$image(file.file),
        });
      });
      this.slides = slides;
    },
  },
};
</script>
<style>
.img-box > div {
  border: 2px #bcbcbc dotted;
  border-radius: 5px;
}

.carosel-image {
  background-position: center;
  object-fit: cover;
  border-bottom: 1px solid #e0e0e0;
  background-repeat: no-repeat;
  background-size: contain;
}
.q-carousel .q-carousel__control .q-btn i {
  color: var(--primary) !important;
}
</style>
