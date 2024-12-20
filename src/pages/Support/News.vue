<template>
  <q-page padding>
    <div class="row">
      <div class="col-12">
        <News />
      </div>
    </div>
  </q-page>
</template>

<script>
 import News from '../../components/support/News';

export default {
  name      : 'SupportNews',

  components: {
    News,
  },

  data () {
    return {

    }
  }
}
</script>