<template>
  <div>
    <MenuDefaultHeader :save_button="false"></MenuDefaultHeader>
    <q-item>
      <q-item-section>
        <q-item-label class="text-grey-8 q-py-sm">
          {{ formatDate(guide_details.event_detail.date.from) }} a
          {{ formatDate(guide_details.event_detail.date.to) }}
        </q-item-label>
        <q-item-label class="text-bold q-py-sm title-guide">
          {{ guide_details.main_information.title }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-carousel
      animated
      v-model="slide"
      navigation
      swipeable
      :fullscreen="fullscreen"
      height="15rem"
      infinite
      class="rounded-borders q-pb-sm q-px-md custom-carousel-guide-details"
    >
      <q-carousel-slide
        v-for="(image, index) in guide_details.main_information.images_slide"
        :key="index"
        :name="image.name"
        :img-src="image.src"
        class="rounded-borders"
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

    <q-item class="column">
      <q-item-section>
        <q-item-label class="text-bold">
          {{ $t('responsible') }}:
        </q-item-label>
      </q-item-section>

      <div class="section-no-margin row items-center q-py-md">
          <q-avatar size="2.3rem" class="col-auto">
            <img src="https://github.com/CarlosMendesDev.png">
          </q-avatar>

        <q-item-label class="q-px-sm text-secondary text-bold col-auto">
          {{ guide_details.profile_provider.user_name }} |
          {{ guide_details.profile_provider.assessment }}
        </q-item-label>

        <q-space></q-space>

        <div class="col-auto">
          <q-btn
            icon="o_question_answer"
            :label="$t('message_button')"
            flat
            style="text-transform: none;"
            class="text-secondary"
            stack
          />
        </div>

        <div class="col-auto">
          <q-btn
            icon="o_smartphone"
            :label="$t('call_button')"
            flat
            style="text-transform: none;"
            class="text-secondary"
            stack
          />
        </div>
      </div>
    </q-item>

    <q-item class="border-division">
      <q-item-section class="q-pa-md bg-grey-4 shadow-6">
        <div class="q-pb-sm flex items-center">
          <q-item-label class="q-ma-none text-bold text-secondary title-list">
            {{ $t('meeting_point') }}
          </q-item-label>
          <q-space></q-space>
          <q-icon name="place" color="secondary"></q-icon>
        </div>
        <q-item-label class="q-ma-none text-grey-9 text-description">
          {{ guide_details.event_detail.meeting_point }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item class="column border-division">
      <div class="flex items-center">
        <p class="q-ma-none text-secondary text-bold title-list">
          {{ $t('checklist_for_customers') }}
        </p>
        <q-space></q-space>
        <q-icon size="1.5rem" color="secondary" name="o_fact_check"></q-icon>
      </div>
    </q-item>

    <q-item class="column border-division">
      <q-item-section class="q-px-sm text-grey-9 q-py-sm text-italic">
        <q-item-label
          v-for="(item_recomendation, index) in event_detail.list_recomendations"
          :key="index"
          class="q-ma-none text-grey-10 text-description">
            &bull; {{ item_recomendation }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item>
      <div class="row">
        <q-btn
          class="q-py-sm q-px-md text-capitalize col-12"
          color="secondary"
          :label="$t('cancel')"
          @click="openCancelEventDialog = true"
        >
        </q-btn>
        <CancelEventDialog
          v-if="openCancelEventDialog"
          v-model="openCancelEventDialog"
        ></CancelEventDialog>
      </div>
    </q-item>
  </div>
</template>

<script>
import CancelEventDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/CancelEventDialog';
import MenuDefaultHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/MenuDefaultHeader';
import { date } from 'quasar';

export default {
  components: {
    MenuDefaultHeader,
    CancelEventDialog,
  },

  data() {
    return {
      slide: 'mountains',
      openCancelEventDialog: false,
      fullscreen: false,
    };
  },

  methods: {
    formatDate(value) {
      const dateEnd = date.formatDate(value, this.$t('mask_date'), {
        monthsShort: [
          this.$t('jan'),
          this.$t('feb'),
          this.$t('mar'),
          this.$t('apr'),
          this.$t('may'),
          this.$t('june'),
          this.$t('july'),
          this.$t('aug'),
          this.$t('sept'),
          this.$t('oct'),
          this.$t('nov'),
          this.$t('dec'),
        ],
      });

      return dateEnd;
    },
  },

  computed: {
    guide_details: {
      get() { return this.$store.getters['Guides/getGuideDetails']; },
      set(value) { this.$store.commit('Guides/setGuideDetails', { guide_details: value }); },
    },
    event_detail: {
      get() { return this.$store.getters['Guides/getEventDetail']; },
      set(value) { this.$store.commit('Guides/setEventDetail', { event_detail: value }); },
    },
  },
};
</script>

<style lang="scss" scoped>
.title-guide {
  font-size: 1.25rem;
  color: #323232;
}
.full-screen {
  background: rgba(0, 0, 0, 0.5);
  margin-right: 0.7rem;
}
</style>
