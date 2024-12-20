<template>
  <q-page>
    <MenuDefaultHeader
      :title="$t('your_guides_header')"
      :save_button="false"
      icon="o_local_activity"
    >
    </MenuDefaultHeader>

    <div class="q-pa-md">
      <q-btn
        v-for="(button, index) in (userRole === 'provider') ? buttons : buttons_customers"
        :key="index"
        :label="$t(button.label)"
        class="full-width button-menu text-capitalize q-py-md"
        style="text-transform: none;"
        align="between"
        flat
        :to="{ name: button.to }"
        color="grey-9"
      >
        <q-icon color="secondary" :name="button.icon"></q-icon>
      </q-btn>
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
      userRole: null ?? 'cliente',
    };
  },

  computed: {
    buttons: {
      get() { return this.$store.getters['Menu/getButtonsYourGuides']; },
    },
    buttons_customers: {
      get() { return this.$store.getters['Menu/getButtonsYourGuidesCustomers']; },
    },
  },

  created() {
    this.userRole = this.$store.getters['User/getUser'].type_account;
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
