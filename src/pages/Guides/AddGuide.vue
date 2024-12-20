<template>
  <q-page style="overflow-x: hidden;">
    <MenuDefaultHeader
      :title="$t('add_guide_header')"
      icon="o_note_add"
      @save="saveGuide"
    >
    </MenuDefaultHeader>
    <div class="q-pa-lg">
      <q-item class="q-px-none q-py-sm column">
        <q-item-section class="q-pb-lg">
          <q-item-label class="text-bold text-secondary title-form">
            {{ $t('title') }}
          </q-item-label>
          <q-input
      dense
      outlined
            v-model="guideEdit.main_information.title"
            outlined
            dense
            label-color="secondary"
            color="secondary"
            placeholder="Ex: Travessia Marins x Itaguaré"
            class="q-px-none q-pt-sm full-width"
          />
        </q-item-section>

        <q-item-section class="q-pb-lg section-no-margin">
          <q-item-label class="text-bold text-secondary title-form">
            {{ $t('category') }}
          </q-item-label>
          <q-select dense outlined 
            v-model="guideEdit.main_information.category"
            outlined
            dense
            emit-value
            map-options
            label-color="secondary"
            color="secondary"
            label="Selecione"
            :options="categories_options"
            class="q-px-none q-pt-sm full-width"
          />
        </q-item-section>

        <q-item-section class="q-pb-lg section-no-margin">
          <q-item-label class="text-bold text-secondary title-form">
            {{ $t('type_of_activity') }}
          </q-item-label>
          <q-select dense outlined 
            outlined
            v-model="guideEdit.main_information.type_activity"
            dense
            label-color="secondary"
            color="secondary"
            label="Selecione"
            :options="filteredActivitiesOptions"
            class="q-px-none q-pt-sm full-width"
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="q-pb-lg text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('activity_data') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_vertical_split"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-item-label class="text-secondary text-bold title-form">
            {{ $t('difficulty_level') }}
          </q-item-label>
        </q-item-section>

        <q-item-section class="q-pt-lg q-px-sm section-no-margin">
          <q-slider
            v-model="guide_difficulty"
            markers
            :max="4"
            class="q-mt-md text-bold"
            :color="difficulty[this.guide_difficulty].color"
            :label-value="$t(difficulty[this.guide_difficulty].label)"
            label-always
          />
        </q-item-section>

        <div class="row q-py-lg" style="max-width: max-content;">
          <q-item-section class="col-5 flex items-center">
            <q-item-label class="text-grey-8 text-caption q-mb-sm">
              {{ $t('duration') }}
            </q-item-label>
            <div class="flex" style="flex-wrap: nowrap;">
              <q-input
      dense
      outlined
                v-model="guideEdit.main_information.duration"
                class="q-px-none input-description"
                outlined
                dense
                style="min-width: 60px;"
                color="secondary"
              />
              <q-select dense outlined 
                class="select-description"
                outlined
                dense
                emit-value
                map-options
                color="secondary"
                v-model="guideEdit.main_information.duration_option"
                :options="options_duration"
                label="Selecione"
              />
            </div>
          </q-item-section>
          <q-item-section class="col-5 flex items-center">
            <q-item-label class="text-grey-8 text-caption q-mb-sm">
              {{ $t('distance') }}
            </q-item-label>
            <div class="flex" style="flex-wrap: nowrap;">
              <q-input
      dense
      outlined
                v-model="guideEdit.main_information.distance"
                class="q-px-none input-description"
                outlined
                color="secondary"
                dense
              />
              <q-select dense outlined 
                class="select-description"
                outlined
                dense
                color="secondary"
                emit-value
                map-options
                v-model="guideEdit.main_information.distance_option"
                :options="options_distance"
                label="Selecione"
              />
            </div>
          </q-item-section>
          <q-item-section class="col flex items-center">
            <q-item-label class="text-grey-8 text-caption q-mb-sm">
              {{ $t('vacancies') }}
            </q-item-label>
            <q-input
      dense
      outlined
              v-model="guideEdit.main_information.vacancies"
              class="q-px-none input-description"
              outlined
              color="secondary"
              dense
            />
          </q-item-section>
        </div>

        <q-item-section class="q-pt-md text-bold text-secondary section-no-margin">
          <div class="flex items-center q-pb-lg">
            <q-item-label class="title-section">
              {{ $t('schedule_date') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_today"></q-icon>
          </div>
          <q-date
            class="full-width q-my-sm"
            v-model="guideEdit.event_detail.date"
            color="secondary"
            minimal
            range
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('add_images') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_image_search"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-btn
            icon="add"
            no-caps
            class=" q-ml-sm text-secondary add-button"
            round
            flat
            @click="openUploadDialog = true"
          >
          </q-btn>
          <UploadMultipleArchivesDialog v-model="openUploadDialog" :ok="file">
          </UploadMultipleArchivesDialog>
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('localization') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_add_location_alt"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-input
      dense
      outlined
            v-model="guideEdit.main_information.locality"
            outlined
            dense
            :label="$t('paste_map_link')"
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('what_is_included_add') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_list_bulleted" style="justify-content: left;"></q-icon>
          </div>
        </q-item-section>

        <q-item-section
          class="section-no-margin"
          v-if="guideEdit.details.included.length"
        >
          <div class="q-px-sm text-grey-9 q-py-sm text-italic">
            <q-item-label
              v-for="item in guideEdit.details.included"
              :key="item" class="q-ma-none text-grey-9 text-description"
            >
              &bull; {{ item }}
            </q-item-label>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-btn
            icon="add"
            no-caps
            class=" q-ml-sm text-secondary add-button"
            round
            flat
            @click="openIcludediesDialog = true"
          >
          </q-btn>
          <DefaultAddDialog
            :title="$t('additional')"
            :subtitle="$t('additional')"
            v-model="openIcludediesDialog"
            @add-included="addIncluded($event, 'included')"
          >
          </DefaultAddDialog>
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('does_offer_insurance') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="verified_user"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-select dense outlined 
            v-model="guideEdit.details.insurance"
            outlined
            dense
            label-color="secondary"
            color="secondary"
            label="Selecione"
            :options="options_secure"
            class="q-pa-none full-width"
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('additional_services') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_add_shopping_cart"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="section-no-margin">
          <div class="row q-pt-md">
            <div class="col-6 text-center">
              <q-item-label class="text-grey-8">{{ $t('item_name') }}</q-item-label>
            </div>

            <div class="col-3 text-center">
              <q-item-label class="text-grey-8">{{ $t('units') }}</q-item-label>
            </div>

            <div class="col-3 text-center">
              <q-item-label class="text-grey-8">{{ $t('price') }}</q-item-label>
            </div>
          </div>

          <div
            v-for="item in guideEdit.details.additional"
            :key="item.label"
            class="row items-center"
          >
            <div class="col-6">
              <q-item-label>{{ item.label }}</q-item-label>
            </div>
            <div class="col-3" align="center">
              <q-input
      dense
      outlined
                v-model="item.quantity"
                class="q-px-none input-description"
                outlined
                color="secondary"
                dense
              />
            </div>
            <div class="col-3 flex items-center">
              <q-item-label class="q-mr-xs">
                R$
              </q-item-label>
              <q-input
      dense
      outlined
                v-model="item.price"
                class="q-px-none input-description"
                outlined
                color="secondary"
                dense
              />
            </div>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-btn
            icon="add"
            no-caps
            class=" q-ml-sm text-secondary add-button"
            round
            flat
            @click="openAdditionalDialog = true"
          >
          </q-btn>
          <AdditionalDialog
            v-model="openAdditionalDialog"
            @add-item="addItem"
          >
          </AdditionalDialog>
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('description') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_format_align_left"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <div class="flex items-center">
            <p class="q-ma-none title-form">{{ $t('do_you_want_to_include_any_remarks') }}</p>
            <q-space></q-space>
            <q-icon size="1.25rem" name="o_report"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-input
      dense
      outlined
            v-model="guideEdit.comments.recomendation"
            outlined
            dense
            maxlength="200"
            label-color="secondary"
            color="secondary"
            autogrow
            counter
            placeholder="Ex: Disposição para encarar desafios físicos"
            class="q-px-none q-my-xs full-width text-description"
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('meeting_point_add_guide') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="place"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-input
      dense
      outlined
            v-model="guideEdit.details.meeting_point"
            outlined
            dense
            maxlength="150"
            label-color="secondary"
            color="secondary"
            autogrow
            counter
            placeholder="Ex: Rodoviária da cidade de Jacareí - às 8h"
            class="q-px-none q-my-xs full-width text-description"
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="row flex items-center">
            <q-item-label class="col-10 title-section">
              {{ $t('include_checklist_for_your_customers') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon
              class="col-2"
              size="1.5rem"
              name="o_fact_check"
              style="justify-content: right; margin-top: -24px;"
            ></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="section-no-margin">
          <q-item-label
            v-for="(item, index) in guideEdit.details.list_recomendations"
            :key="index"
          >
            &bull; {{ item }}
          </q-item-label>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-btn
            icon="add"
            no-caps
            class=" q-ml-sm text-secondary add-button"
            round
            flat
            @click="openRecomendationsDialog = true"
          >
          </q-btn>
          <DefaultAddDialog
            :title="$t('recomendations')"
            :subtitle="$t('item_recomendation')"
            v-model="openRecomendationsDialog"
            @add-included="addIncluded($event, 'list_recomendations')"
          >
          </DefaultAddDialog>
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column border-division">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('tell_summary_of_activity') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="drag_handle"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-input
      dense
      outlined
            v-model="guideEdit.comments.description"
            outlined
            dense
            maxlength="500"
            label-color="secondary"
            color="secondary"
            autogrow
            counter
            placeholder="Ex: A Travessia Marins Itaguaré está entre as mais clássicas expedições..."
            class="q-px-none q-my-xs full-width text-description"
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-pt-lg column">
        <q-item-section class="text-bold text-secondary">
          <div class="flex items-center">
            <q-item-label class="title-section">
              {{ $t('activity_detail') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="notes"></q-icon>
          </div>
        </q-item-section>

        <q-item-section class="q-pt-md section-no-margin">
          <q-input
      dense
      outlined
            v-model="guideEdit.details.description_road"
            outlined
            dense
            maxlength="2500"
            label-color="secondary"
            color="secondary"
            autogrow
            counter
            placeholder="Ex: Durante o caminho teremos muitos visuais deslumbrantes como o..."
            class="q-px-none q-my-xs full-width text-description"
          />
        </q-item-section>
      </q-item>

      <q-item class="q-px-none q-py-sm column">
        <div class="flex items-center q-gutter-x-md" style="justify-content: right;">
          <q-btn
            class="q-py-sm q-px-md text-capitalize"
            outline
            color="secondary"
            :label="$t('save_button_add_guide')"
          >
          </q-btn>
          <q-btn
            class="q-py-sm q-px-md text-capitalize"
            color="secondary"
            :label="$t('publish_button_add_guide')"
            v-close-popup
          >
          </q-btn>
        </div>
      </q-item>
    </div>
  </q-page>
</template>

<script>
import { api } from "app/modules/controleonline/ui-common/src/api";
import AdditionalDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/AdditionalDialog';
import DefaultAddDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/DefaultAddDialog';
import UploadMultipleArchivesDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/UploadMultipleArchivesDialog';
import MenuDefaultHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/MenuDefaultHeader';

export default {
  components: {
    MenuDefaultHeader,
    UploadMultipleArchivesDialog,
    DefaultAddDialog,
    AdditionalDialog,
  },

  data() {
    return {
      guideEdit: {},
      openUploadDialog: false,
      openIcludediesDialog: false,
      openAdditionalDialog: false,
      openRecomendationsDialog: false,
      model: '',
      text: '',
      options_duration: [
        {
          label: this.$t('days'),
          value: this.$t('days'),
        },
        {
          label: this.$t('hours'),
          value: this.$t('hours'),
        },
      ],
      options_distance: [
        {
          label: this.$t('km'),
          value: this.$t('km'),
        },
        {
          label: this.$t('meters'),
          value: this.$t('meters'),
        },
      ],
      options_secure: [
        {
          label: this.$t('adventure'),
          value: this.$t('adventure'),
        },
        {
          label: this.$t('trip'),
          value: this.$t('trip'),
        },
        {
          label: this.$t('adventure_and_travel'),
          value: this.$t('adventure_and_travel'),
        },
      ],
      categories_options: [
        {
          label: this.$t('adventure_sports_optins'),
          value: this.$t('adventure_sports_optins'),
        },
        {
          label: this.$t('ecotourism_optins'),
          value: this.$t('ecotourism_optins'),
        },
        {
          label: this.$t('whole_family_optins'),
          value: this.$t('whole_family_optins'),
        },
      ],
      activities_options: [
        {
          label: this.$t('mountaineering_options'),
          value: this.$t('mountaineering_options'),
          category: this.$t('adventure_sports_optins'),
        },
        {
          label: this.$t('climbing_options'),
          value: this.$t('climbing_options'),
          category: this.$t('adventure_sports_optins'),
        },
        {
          label: this.$t('rafting_options'),
          value: this.$t('rafting_options'),
          category: this.$t('adventure_sports_optins'),
        },
        {
          label: this.$t('mountain_bike_options'),
          value: this.$t('mountain_bike_options'),
          category: this.$t('adventure_sports_optins'),
        },
        {
          label: this.$t('national_parks_options'),
          value: this.$t('national_parks_options'),
          category: this.$t('ecotourism_optins'),
        },
        {
          label: this.$t('state_parks_options'),
          value: this.$t('state_parks_options'),
          category: this.$t('ecotourism_optins'),
        },
        {
          label: this.$t('bird_watching_options'),
          value: this.$t('bird_watching_options'),
          category: this.$t('ecotourism_optins'),
        },
        {
          label: this.$t('trails_hikes_options'),
          value: this.$t('trails_hikes_options'),
          category: this.$t('ecotourism_optins'),
        },
        {
          label: this.$t('ecological_tours_options'),
          value: this.$t('ecological_tours_options'),
          category: this.$t('whole_family_optins'),
        },
        {
          label: this.$t('museums_options'),
          value: this.$t('museums_options'),
          category: this.$t('whole_family_optins'),
        },
        {
          label: this.$t('excursions_options'),
          value: this.$t('excursions_options'),
          category: this.$t('whole_family_optins'),
        },
        {
          label: this.$t('cultural_tours_options'),
          value: this.$t('cultural_tours_options'),
          category: this.$t('whole_family_optins'),
        },
      ],
      guide_difficulty: 0,
    };
  },

  computed: {
    difficulty: {
      get() {
        const difficultyOptions = [
          {
            label: 'very_light',
            color: 'teal-4',
          },
          {
            label: 'light',
            color: 'lime-9',
          },
          {
            label: 'moderate',
            color: 'amber-5',
          },
          {
            label: 'difficult',
            color: 'orange-14',
          },
          {
            label: 'very_difficult',
            color: 'red-14',
          },
        ];

        return difficultyOptions;
      },
    },
    filteredActivitiesOptions() {
      const { category } = this.guideEdit.main_information;

      const categorySearch = this.categories_options.find((cat) => cat.value === category);

      if (categorySearch) {
        return this.activities_options
          .filter((activities) => activities.category === categorySearch.label);
      }

      return this.activities_options;
    },
    list: {
      get() { return this.$store.getters['Guides/getGuidesList']; },
      set(value) { this.$store.commit('Guides/addGuide', { guide: value }); },
    },
  },

  methods: {
    addIncluded(value, module) {
      this.guideEdit.details[module].push(value);
    },
    addItem(additional) {
      this.guideEdit.details.additional = [
        ...this.guideEdit.details.additional,
        additional,
      ];
    },
    saveGuide() {
      this.guideEdit.main_information.difficulty = this.difficulty[this.guide_difficulty];

      this.list = this.guideEdit.main_information;

      this.$router.push({ name: 'guides', params: { id: this.guideEdit.main_information.category } });
    },
    api.fetchGuide() {
      const getterString = this.$route.query.id ? 'Guides/getGuideDetails' : 'Guides/getNewGuide';

      this.guideEdit = ((this.$store.getters[getterString]));
    },
  },

  created() {
    api.fetchGuide();
  },
};
</script>

<style lang="scss" scoped>
.border-division {
  padding: 30px 0px 30px 0px;
  border-bottom: solid 1px rgb(187, 187, 187);
}
.section-no-margin {
  margin: 0!important;
}
.input-description {
  width: 2.8rem;
  font-size: 12px;
}
.select-description {
  width: 5rem;
  font-size: 12px;
}
.add-button {
  width: 1rem;
  height: 1rem;
}
.title-form {
  font-size: 1rem;
}
.title-section {
  font-size: 20px;
}
</style>
