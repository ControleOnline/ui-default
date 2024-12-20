<template>
  <q-page padding>
    <div class="row">
      <div class="col-12">
        <FAQ />
      </div>
    </div>
  </q-page>
</template>

<script>
 import FAQ from '../../components/support/FAQ';

export default {
  name      : 'FAQ',

  components: {
    FAQ,
  },

  data () {
    return {

    }
  }
}
</script>