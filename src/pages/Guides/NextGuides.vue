<template>
  <q-page>
    <MenuDefaultHeader
      :title="$t('next_guides_header')"
      :save_button="false"
      icon="o_local_activity"
    >
    </MenuDefaultHeader>

    <q-item>
      <q-item-section>
        <q-item-label class="text-bold">{{ $t('your_next_destinations') }}</q-item-label>
      </q-item-section>
    </q-item>

    <CardGuidesCustomers
      v-for="(guide, index) in next_guides"
      :key="index"
      :image_guide="guide.image_guide"
      :title_guide="guide.title_guide"
      :provider="guide.provider"
      :date="guide.date"
    >
    </CardGuidesCustomers>
  </q-page>
</template>

<script>
import CardGuidesCustomers from '@controleonline/ui-legacy/ui-common/src/components/Card/CardGuidesCustomers';
import MenuDefaultHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/MenuDefaultHeader';

export default {
  components: {
    MenuDefaultHeader,
    CardGuidesCustomers,
  },

  computed: {
    next_guides: {
      get() { return this.$store.getters['Guides/getNextGuides']; },
      set(value) { this.$store.commit('Guides/setNextGuides', { next_guides: value }); },
    },
  },
};
</script>
