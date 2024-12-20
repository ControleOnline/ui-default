<template>
  <div>
    <GuideDetailsHeader></GuideDetailsHeader>
    <div>
      <q-carousel
        animated
        v-model="slide"
        navigation
        swipeable
        :fullscreen="fullscreen"
        height="15rem"
        infinite
        class="custom-carousel-guide-details"
      >
        <q-carousel-slide
          v-for="(image, index) in guideDetailsEdit.main_information.images_slide"
          :key="index"
          :name="image.name"
          :img-src="image.src"
        />
        <template v-slot:control>
          <q-carousel-control
            position="bottom-right"
            :offset="[18, 18]"
          >
            <q-btn
              push
              round
              dense
              class="full-screen"
              text-color="white"
              :icon="fullscreen ? 'fullscreen_exit' : 'fullscreen'"
              @click="fullscreen = !fullscreen"
            />
          </q-carousel-control>
        </template>
      </q-carousel>
      <div>
        <h6
          class="q-px-lg q-ma-none q-pa-sm title-list"
          style="font-size: 1.5rem;"
        >
          {{ guideDetailsEdit.main_information.title }}
        </h6>

        <div class="q-px-lg row items-center bg-grey-4">
          <p
            :class="`col-auto bg-${guideDetailsEdit.main_information.difficulty.color}
              text-center text-white q-ma-none text-caption q-pa-sm`"
            style="min-width: 85px;">
              {{ $t(guideDetailsEdit.main_information.difficulty.label) }}
          </p>
          <p class="col text-right text-grey-10 q-ma-none text-caption q-px-sm">
            {{ guideDetailsEdit.main_information.distance }}
            {{ guideDetailsEdit.main_information.distance_option }}
            | {{ guideDetailsEdit.main_information.duration }}
            {{ guideDetailsEdit.main_information.duration_option }}
            | {{ guideDetailsEdit.main_information.vacancies }} vagas
          </p>
        </div>

        <div class="row q-px-lg q-py-sm items-center shadow-6">
          <q-btn
            v-if="userRole === 'cliente'"
            icon="calendar_month"
            label="Reservar"
            flat
            stack
            class="text-secondary col-auto q-pa-none"
            @click="reserve"
          />
          <h5 class="col q-ma-none text-right title-list text-secondary">
            R$ {{ this.$formatter. formatMoney(guideDetailsEdit.main_information.price) }}
          </h5>
        </div>

        <div class="q-px-lg q-py-sm">
          <div class="border-division">
            <div class="flex items-center">
              <p class="q-ma-none title-list">{{ $t('observation') }}</p>
              <q-space></q-space>
              <q-icon size="1.25rem" name="o_report"></q-icon>
            </div>

            <p class="q-ma-none text-grey-9 q-py-sm text-description">
              {{ guideDetailsEdit.comments.recomendation }}
            </p>
          </div>

          <div class="border-division">
            <p class="q-ma-none text-grey-9 q-py-sm text-italic text-description">
              {{ guideDetailsEdit.comments.description }}
            </p>
          </div>

          <div class="border-division">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3065.4832887873113!2d-46.3096501420892!3d-23.978307756806505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce035374538c95%3A0xe13ffb1bd638a35c!2sPraiamar%20Shopping!5e0!3m2!1spt-PT!2sbr!4v1640705385041!5m2!1spt-PT!2sbr"
              width="100%"
              height="50%"
              style="border:0;"
              allowfullscreen=""
              loading="lazy">
            </iframe>
          </div>

          <div class="border-division">
            <p class="q-ma-none title-list">{{ $t('what_is_included') }}</p>
            <div class="q-px-sm text-grey-9 q-py-sm text-italic">
              <p
                v-for="item in guideDetailsEdit.details.included"
                :key="item" class="q-ma-none text-grey-9 text-description"
              >
                &bull; {{ item }}
              </p>
            </div>
          </div>

          <div class="flex items-center border-division">
            <p
              class="q-ma-none title-list"
            >
              {{ $t('we_offer_insurance') }} {{ guideDetailsEdit.details.insurance }}
            </p>
            <q-space></q-space>
            <q-icon name="verified_user" color="green" size="1.5rem"></q-icon>
          </div>

          <div class="full-width flex items-center border-division">
            <div class="flex items-center full-width">
              <p class="q-ma-none title-list">{{ $t('you_can_contract_separately') }}</p>
              <q-space></q-space>
              <q-icon size="1.25rem" name="o_add_shopping_cart"></q-icon>
            </div>

            <div
              v-for="item in guideDetailsEdit.details.additional"
              :key="item.label"
              class="row full-width items-center justify-between"
            >
              <p class="col-4 q-ma-none text-grey-9 text-description">{{ item.label }}</p>
              <div
                class="col-4 flex items-center"
                style="justify-content: right;"
              >
                <q-btn
                  :disable="item.quantity === 0"
                  @click="quantityProduct('remove', item.label)"
                  flat
                  round
                  icon="remove_circle_outline" />
                <p class="q-ma-none text-grey-9 text-description">{{ item.quantity }}</p>
                <q-btn
                  @click="quantityProduct('add', item.label)"
                  flat
                  round
                  icon="add_circle_outline" />
              </div>
              <p class="col-4 q-ma-none text-grey-9 text-right text-description">
                R$ {{ this.$formatter. formatMoney(item.price) }}
              </p>
            </div>
            <div style="justify-content: right;" class="full-width flex items-center">
              <q-icon size="1rem" name="shopping_cart"></q-icon>
              <p class="q-ma-none q-ml-sm text-grey-9">R$ {{ total }}</p>
            </div>
          </div>

          <div class="border-division">
            <p class="q-ma-none text-grey-9 text-description">
              {{ guideDetailsEdit.details.description_road }}
            </p>
          </div>

          <div class="border-division">
            <div class="q-pa-sm q-ma-sm bg-grey-4 shadow-6">
              <div class="q-pb-sm flex items-center">
                <p class="q-ma-none title-list text-secondary">
                  {{ $t('meeting_point_guide_details') }}
                </p>
                <q-space></q-space>
                <q-icon name="place" color="secondary"></q-icon>
              </div>
              <p class="q-ma-none text-grey-9 text-description">
                {{ guideDetailsEdit.details.meeting_point }}
              </p>
            </div>
          </div>

          <div class="border-division">
            <p class="q-ma-none title-list">{{ $t('what_should_you_be_worried_about') }}</p>
            <div class="q-px-sm text-grey-9 q-py-sm text-italic">
              <p
                v-for="item in guideDetailsEdit.details.list_recomendations"
                :key="item"
                class="q-ma-none text-grey-9 text-description"
              >
                &bull; {{ item }}
              </p>
            </div>
          </div>

          <div class="border-division">
            <div class="flex items-center">
              <q-icon size="1.5rem" name="star" color="orange-5"></q-icon>
              <q-item-section
                class="text-grey-9"
              >
                4,5 | {{ guideDetailsEdit.assessments.length }} {{ $t('comments') }}
              </q-item-section>
            </div>

            <div
              class="border-division"
              v-for="item in assessmentsList"
              :key="item"
            >
              <div class="flex items-center">
                <q-avatar size="2.3rem">
                  <img src="https://github.com/CarlosMendesDev.png">
                </q-avatar>

                <div class="q-px-sm">
                  <div class="flex items-center">
                    <q-item-section class="q-ma-none text-grey-9 text-bold">
                      {{ item.user_name }} | {{ item.value }}
                    </q-item-section>
                    <q-icon class="q-px-xs" size="1rem" name="star" color="orange-5"></q-icon>
                  </div>

                  <div>
                    <q-item-section class="q-ma-none text-grey-8 text-caption">
                      {{ item.date }}
                    </q-item-section>
                  </div>
                </div>
              </div>

              <div>
                <q-icon
                  v-for="n in item.value"
                  :key="n"
                  class="q-py-sm"
                  size="1rem"
                  name="star"
                  color="orange-5"
                >
                </q-icon>
                <q-item-section
                  class="q-ma-none text-grey-9 text-caption text-italic text-assessments"
                >
                  {{ item.comment }}
                </q-item-section>
              </div>
            </div>

            <q-btn
              class="full-width q-my-sm q-pa-sm"
              style="text-transform: none;"
              outline
              color="secondary"
              @click="viewMore = !viewMore"
              :label="(!viewMore)
                ? `${$t('show_all')} ${guideDetailsEdit.assessments.length} ${$t('button_commets')}`
                : $t('see_less')"
            >
            </q-btn>
          </div>

          <div class="q-pt-md">
            <div class="flex items-center">
              <q-avatar size="2.3rem">
                <img src="https://github.com/CarlosMendesDev.png">
              </q-avatar>
              <p class="q-ma-none q-px-sm title-list">
                {{ $t('who_is') }} {{ guideDetailsEdit.profile_provider.user_name }} ?
              </p>
            </div>

            <div class="q-py-sm">
              <q-img
                src="https://logodownload.org/wp-content/uploads/2018/02/cadastur-logo.png"
                width="30%">
              </q-img>
              <p class="q-py-sm q-ma-none q-px-sm text-grey-9 text-description">
                {{ guideDetailsEdit.profile_provider.cadastur }}
              </p>
            </div>

            <div>
              <p class="q-py-sm q-ma-none q-px-sm text-grey-9 text-description">
                {{ guideDetailsEdit.profile_provider.description_provider }}
              </p>
            </div>

            <div class="q-pa-sm">
              <p class="q-ma-none title-list">{{ $t('languages') }}</p>
              <div class="q-pa-xs q-gutter-x-sm">
                <q-avatar
                  v-for="lang in guideDetailsEdit.profile_provider.langs"
                  :key="lang"
                  size="2rem"
                >
                  <img :src="`/flags/${lang}.png`">
                </q-avatar>
              </div>
            </div>

            <div
              v-if="guideDetailsEdit.profile_provider.sign_language"
              class="q-pa-sm"
            >
              <p class="q-ma-none title-list">{{ $t('sign_language_guide_details') }}</p>
              <div class="q-pa-xs q-gutter-x-sm">
                <q-icon name="front_hand" color="secondary" size="1.5rem">
                </q-icon>
              </div>
            </div>

            <div
              v-if="guideDetailsEdit.profile_provider.certifications.length"
              class="q-pa-sm"
            >
              <div>
                <p class="q-ma-none title-list">{{ $t('certifications_and_courses') }}</p>
                <div class="q-pa-xs q-gutter-x-sm">
                  <p
                    v-for="item in guideDetailsEdit.profile_provider.certifications"
                    :key="item"
                    class="q-ma-none q-px-sm text-grey-9 text-description"
                  >
                    {{ item }}
                  </p>
                </div>
              </div>
            </div>

            <div class="q-gutter-y-sm">
              <q-btn
                icon="o_local_activity"
                class="full-width q-pa-sm"
                style="text-transform: none;"
                outline
                color="secondary"
                :label="$t('see_more_guides_by') + guideDetailsEdit.profile_provider.user_name"
              >
              </q-btn>

              <q-btn
                icon="feedback"
                class="q-pa-sm"
                style="text-transform: none;"
                flat
                left
                color="grey-9"
                :label="$t('report')"
              >
              </q-btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GuideDetailsHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/GuideDetailsHeader';

export default {
  components: {
    GuideDetailsHeader,
  },

  data() {
    return {
      userRole: null ?? 'cliente',
      viewMore: false,
      fullscreen: false,
      slide: 'mountains',
      total: 0,
      guideDetailsEdit: {},
    };
  },

  computed: {
    assessmentsList() {
      return this.viewMore
        ? this.guideDetailsEdit.assessments
        : this.guideDetailsEdit.assessments.slice(0, 2);
    },
    guide_details: {
      get() { return this.$store.getters['Guides/getGuideDetails']; },
      set(value) { this.$store.commit('Guides/setGuideDetails', { guide_details: value }); },
    },
  },

  methods: {
    quantityProduct(action, item) {
      const itemIndex = this.guideDetailsEdit.details.additional
        .findIndex((product) => product.label === item);

      if (action === 'add') {
        this.guideDetailsEdit.details.additional[itemIndex].quantity += 1;
      } else {
        this.guideDetailsEdit.details.additional[itemIndex].quantity -= 1;
      }

      this.calculateTotal();
    },
    calculateTotal() {
      const sumPrices = this.guideDetailsEdit.details.additional
        .reduce((acc, cur) => {
          if (!cur.quantity) return acc;

          return acc + cur.price * cur.quantity;
        }, 0);

      this.total = this.this.$formatter. formatMoney(sumPrices);
    },
   formatMoney(value) {
      const moneyFormated = value.toLocaleString('pt-br', { minimumFractionDigits: 2 });

      return moneyFormated;
    },
    reserve() {
      this.$router.push({ name: 'cliente-reserve' });
    },
  },

  created() {
    this.userRole = this.$store.getters['User/getUser'].type_account;
    this.guideDetailsEdit = ((this.$store.getters['Guides/getGuideDetails']));
  },
};
</script>

<style lang="scss" scoped>
.title-list {
  font-size: 1.25rem;
  font-weight: 700;
  color: #323232;
  display: block;
}
.text-description {
  font-size: 1rem;
}
.text-assessments {
  font-size: 0.875rem;
}
.border-division {
  padding: 30px 0px 30px 0px;
  border-bottom: solid 1px grey;
}
.full-screen {
  background: rgba(0, 0, 0, 0.5);
}
</style>
