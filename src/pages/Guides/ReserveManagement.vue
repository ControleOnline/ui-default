<template>
  <q-page>
    <MenuDefaultHeader
      :title="$t('reserve_management_header')"
      icon="o_calendar_month"
    >
    </MenuDefaultHeader>

    <q-item class="q-px-lg q-pb-lg teste q-pt-lg">
      <q-item-section class="text-bold">
        <div class="flex items-center">
          <q-item-label class="title-list">
            {{ $t('wallet') }}: {{ this.$formatter. formatMoney(reserve_edit.wallet_value) }}
          </q-item-label>
          <q-space></q-space>
          <q-icon size="1.5rem" name="o_account_balance_wallet"></q-icon>
        </div>
      </q-item-section>
    </q-item>

    <div class="q-px-sm q-pt-md">
      <q-item class="column q-gutter-y-sm">
        <q-item-section class="text-bold text-secondary q-pb-md">
          <div class="flex items-center">
            <q-item-label class="title-list">
              {{ $t('my_schedule') }}
            </q-item-label>
            <q-space></q-space>
            <q-icon size="1.5rem" name="o_event"></q-icon>
          </div>
        </q-item-section>

        <q-date
          class="full-width"
          v-model="reserve_edit.date"
          color="secondary"
          minimal
          range
        />

        <q-toggle
          class="text-bold text-secondary justify-between title-list q-pt-md"
          color="secondary"
          v-model="reserve_edit.block"
          :label="$t('block_schedule')"
          left-label
        />

        <div v-if="reserve_edit.block" class="row items-center">
          <q-item-label class="col-10 q-ma-none text-grey-7">
            Atenção: Esta ação <b>não permitirá</b>
              que clientes selecionem uma data em sua agenda.
          </q-item-label>
          <q-icon class="col text-grey-7" size="1.25rem" name="o_report"></q-icon>
        </div>
      </q-item>

      <q-item class="q-pb-md">
        <q-item-section class="q-gutter-y-xs">
          <q-item-label class="text-bold text-secondary title-list">
            {{ $t('next_event') }}
          </q-item-label>
          <div
            v-for="(event, index) in reserve_edit.next_events"
            :key="index"
            class="flex items-center q-gutter-xs cursor-pointer"
            clickable="clickable"
            @click="goDetailsEvent"
          >
            <div>
              <span>
                <span class="items-center" style="display: inline-flex;">
                  <q-icon
                    color="secondary" size="0.8rem"
                    class="icon-margin q-mr-xs" name="open_in_new"
                  ></q-icon>
                  <span v-if="event.final_date" class="text-bold text-description q-mr-xs">
                    {{ event.initial_date }} -
                    {{ event.final_date }}:
                  </span>
                  <span v-else class="text-bold text-description q-mr-xs">
                    {{ event.initial_date }}:
                  </span>
                </span>
              </span>
              <span class="text-description">
                {{ event.guide }}
              </span>
            </div>
          </div>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section class="q-gutter-y-xs">
          <q-item-label class="text-bold text-secondary title-list">
            {{ $t('confirmed_canceled') }}
          </q-item-label>
          <div v-for="n in 3" :key="n" class="flex items-center q-gutter-xs">
            <q-item-label class="text-description q-py-sm">
              <q-icon name="o_arrow_drop_down_circle" size="1.2rem"></q-icon>
              {{ $t('new_sales_after_cancellations') }} 2
            </q-item-label>
          </div>
        </q-item-section>
      </q-item>
    </div>
  </q-page>
</template>

<script>
import MenuDefaultHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/MenuDefaultHeader';

export default {
  components: {
    MenuDefaultHeader,
  },

  data() {
    return {
      reserve_edit: {},
    };
  },

  computed: {
    reserve: {
      get() { return this.$store.getters['Guides/getReserveGuide']; },
      set(value) { this.$store.commit('Guides/setReserveGuide', { reserve: value }); },
    },
  },

  methods: {
   formatMoney(value) {
      const moneyFormated = value.toLocaleString('pt-br', { minimumFractionDigits: 2 });

      return moneyFormated;
    },
    goDetailsEvent() {
      this.$router.push({ name: 'event-details' });
    },
  },

  created() {
    this.reserve_edit = ((this.reserve));
  },
};
</script>

<style lang="scss" scoped>
.q-date {
  width: 90%;
  min-width: 90%;
}
.title-list {
  font-size: 1.25rem;
}
.text-description {
  font-size: 1rem;
}
.link-format {
  text-decoration: none;
}
.icon-margin {
  margin-top: -1px;
}
.teste {
  border-bottom: solid 1px rgb(187, 187, 187);
}
</style>
