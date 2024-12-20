<template>
  <q-page>
    <ProfileHeader></ProfileHeader>
    <div class="q-pa-sm">
      <q-btn
        v-for="(button, index) in buttons"
        :key="index"
        :label="$t(button.label)"
        class="full-width button-menu q-py-md"
        align="between"
        style="text-transform: none;"
        flat
        @click="button.to === 'change-password' ? openDialog = true : openDialog = false"
        :to="{ name: button.to }"
        color="grey-9"
      >
        <q-icon size="1.5rem" color="secondary" :name="button.icon"></q-icon>
      </q-btn>
      <ChangePasswordDialog v-model="openDialog"></ChangePasswordDialog>
    </div>
    <ToolsFooter></ToolsFooter>
  </q-page>
</template>

<script>
import ChangePasswordDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/ChangePasswordDialog';
import ToolsFooter from '@controleonline/ui-legacy/ui-common/src/components/Footer/ToolsFooter';
import ProfileHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/ProfileHeader';

export default {
  components: {
    ProfileHeader,
    ToolsFooter,
    ChangePasswordDialog,
  },

  data() {
    return {
      openDialog: false,
    };
  },

  computed: {
    buttons: {
      get() { return this.$store.getters['Menu/getButtonsProfileMenu']; },
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
