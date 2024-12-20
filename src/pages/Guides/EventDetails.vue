<template>
  <q-page>
    <MenuDefaultHeader
      :title="$t('event_details_header')"
      icon="o_calendar_month"
    >
    </MenuDefaultHeader>
    <q-item class="q-pa-md q-px-lg">
      <q-item-section class="text-secondary">
        <q-item-label class="text-bold title-list">{{ event_detail.title }}</q-item-label>
        <div class="flex items-center">
          <q-item-label class="text-caption text-description">
            {{ event_detail.date.from }} à
            {{ event_detail.date.to }}
          </q-item-label>
          <q-space></q-space>
          <q-btn
            icon="edit"
            no-caps
            round
            color="secondary"
            flat
            @click="calendar = !calendar">
          </q-btn>
        </div>
      </q-item-section>
    </q-item>

    <q-item v-if="calendar" class="column q-gutter-y-md q-px-lg">
      <q-date
          class="full-width"
          v-model="event_detail.date"
          minimal
          range
          color="secondary"
        />
      <q-btn
        class="q-py-sm q-px-md text-capitalize"
        color="secondary"
        style="width: 40%; align-self: end;"
        :label="$t('save_reserve')"
        @click="openRescheduleDialog = true"
      >
      </q-btn>
    </q-item>

    <div class="q-pa-md q-px-lg">
      <q-item class="column q-gutter-y-sm border-division">
        <div>
          <q-item-section>
            <q-item-label class="text-bold text-secondary title-list">
              {{ event_detail.participants.length }} {{ $t('confirmed_participants') }}
            </q-item-label>
          </q-item-section>
        </div>
        <div class="row" style="margin-left: -0.5rem;">
          <q-item-section
            v-for="(participant, index) in event_detail.participants"
            :key="index"
            class="col-auto items-center q-gutter-sm"
            style="margin: 0px;"
          >
            <q-avatar size="2rem">
              <q-img :src="participant.image_profile"></q-img>
            </q-avatar>
            <q-item-label class="text-caption">{{ participant.user_name }}</q-item-label>
          </q-item-section>
        </div>
      </q-item>

      <q-item class="column q-gutter-y-sm border-division">
        <q-item-section>
          <q-item-label class="text-bold text-secondary title-list">
            {{ $t('additional_contracts') }}
          </q-item-label>
        </q-item-section>

        <div
          v-for="(participant, index) in event_detail.participants"
          :key="index"
          class="row items-center q-col-gutter-x-md"
        >
          <q-item-section
            v-if="participant.additional"
            class="col-auto items-center q-gutter-y-xs"
          >
            <q-avatar size="2rem">
              <q-img :src="participant.image_profile"></q-img>
            </q-avatar>
            <q-item-label class="text-caption">
              {{ participant.user_name }}
            </q-item-label>
          </q-item-section>

          <q-item-section
            v-for="(additional, index) in participant.additional"
            :key="index"
            class="col"
          >
            <q-item-label class="text-description">
              {{ additional.quantity }} - {{ additional.label }}
            </q-item-label>
          </q-item-section>
        </div>
      </q-item>

      <q-item class="border-division">
        <q-item-section class="q-pa-sm q-ma-sm bg-grey-4 shadow-6">
          <div class="q-pb-sm flex items-center">
            <q-item-label class="q-ma-none text-bold text-secondary title-list">
              {{ $t('meeting_point') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon name="place" color="secondary"></q-icon>
          </div>
          <q-item-label class="q-ma-none text-grey-9 text-description">
            {{ event_detail.meeting_point }}
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

        <q-item-section class="q-px-sm text-grey-9 q-py-sm text-italic">
          <q-item-label
            v-for="(item_recomendation, index) in event_detail.list_recomendations"
            :key="index"
            class="q-ma-none text-grey-10 text-description">
              &bull; {{ item_recomendation }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item class="q-px-sm q-py-md">
        <q-btn
          class="q-py-sm q-px-md text-capitalize"
          outline
          color="secondary"
          :label="$t('cancel')"
          @click="openCancelEventDialog = true"
        >
        </q-btn>
        <CancelEventDialog v-model="openCancelEventDialog"></CancelEventDialog>
        <q-space></q-space>
        <q-btn
          class="q-py-sm q-px-md text-capitalize"
          color="secondary"
          :label="$t('reschedule_reserve')"
          @click="openRescheduleDialog = true"
        >
        </q-btn>
        <RescheduleDialog
          v-if="openRescheduleDialog"
          v-model="openRescheduleDialog"
        ></RescheduleDialog>
      </q-item>
    </div>
  </q-page>
</template>

<script>
import CancelEventDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/CancelEventDialog';
import RescheduleDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/RescheduleDialog';
import MenuDefaultHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/MenuDefaultHeader';

export default {
  components: {
    MenuDefaultHeader,
    RescheduleDialog,
    CancelEventDialog,
  },

  data() {
    return {
      openRescheduleDialog: false,
      openCancelEventDialog: false,
      calendar: false,
    };
  },

  computed: {
    event_detail: {
      get() { return this.$store.getters['Guides/getEventDetail']; },
      set(value) { this.$store.commit('Guides/setEventDetail', { event_detail: value }); },
    },
  },
};
</script>

<style lang="scss" scoped>
.border-division {
  padding: 30px 0px 30px 0px;
  border-bottom: solid 1px rgb(187, 187, 187);
}
.title-list {
  font-size: 1.25rem;
}
.text-description {
  font-size: 1rem;
}
</style>
