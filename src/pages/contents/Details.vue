<template>
  <Contents :context="context" />
</template>

<script>
import Contents from "@controleonline/ui-ead/src/components/contents/Table";

export default {
  components: {
    Contents,
  },

  computed: {},

  data() {
    return {
      context: "contents",
    };
  },

  methods: {},
};
</script>
