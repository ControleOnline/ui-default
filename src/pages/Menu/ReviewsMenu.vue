<template>
  <q-page>
    <MenuDefaultHeader
      :title="$t('reviews')"
      icon="star"
      :save_button="false"
    >
    </MenuDefaultHeader>
    <div class="q-pa-sm">
      <q-btn
        v-for="(button, index) in buttons"
        :key="index"
        :label="$t(button.label)"
        class="full-width button-menu q-py-md"
        align="between"
        style="text-transform: none;"
        flat
        :to="{ name: button.to }"
        color="grey-9"
      >
        <q-icon size="1.5rem" color="secondary" :name="button.icon"></q-icon>
      </q-btn>
    </div>
    <ToolsFooter></ToolsFooter>
  </q-page>
</template>

<script>
import ToolsFooter from '@controleonline/ui-legacy/ui-common/src/components/Footer/ToolsFooter';
import MenuDefaultHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/MenuDefaultHeader';

export default {
  components: {
    MenuDefaultHeader,
    ToolsFooter,
  },

  computed: {
    buttons: {
      get() { return this.$store.getters['Menu/getButtonsReviewsMenu']; },
    },
  },
};
</script>

<style lang="scss" scoped>
.button-menu {
  font-size: 1rem;
  border-bottom: solid 1px #C4C4C4;
  border-radius: 0!important;
}
</style>
