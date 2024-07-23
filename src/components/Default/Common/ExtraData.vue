<template>
  <template v-for="(field, index) in extraFields" :key="key">
    <div :class="(field.formClass || getFilterSize()) + ' q-pa-xs'">
      <FormInputs
        :editable="true"
        :inputType="field.fieldType"
        :rules="field.rules"
        :labelType="'outer-label'"
        :label="field.label"
        :initialValue="extraData.data[field.id]"
        @changed="
          (value) => {
            extraData.data[field.id] = value;
          }
        "
      />
    </div>
  </template>
</template>

<script>
import FormInputs from "@controleonline/ui-default/src/components/Default/Common/FormInputs";
import { mapActions, mapGetters } from "vuex";

export default {
  props: {
    configs: {
      type: Object,
      required: true,
    },
    entity: {
      type: Object,
      required: true,
    },
  },
  components: {
    FormInputs,
  },
  data() {
    return {
      key: 0,
      extraFields: null,
      extraData: { data: {} },
    };
  },
  created() {
    this.init();
  },
  mounted() {},

  computed: {
    ...mapGetters({
      myCompany: "people/currentCompany",
    }),
  },
  watch: {
    extraData: {
      handler: function (current, preview) {
        this.$emit("changedExtraData", this.extraData);
      },
      deep: true,
    },
  },
  methods: {
    ...mapActions({
      getExtraFields: "extra_fields/getItems",
      getExtraData: "extra_data/getItems",
    }),
    init() {
      if (this.configs.extraFields)
        this.getExtraFields({
          context: this.configs?.extraFields?.context || this.configs.store,
        }).then((result) => {
          this.extraFields = result;
          if (this.extraFields?.length > 0 && this.entity?.id)
            this.getExtraData({
              entity_id: this.entity.id,
              entity_name: this.entity["@type"],
              "extra_fields.context":
                this.configs?.extraFields?.context || this.configs.store,
            }).then((data) => {
              let ed = {
                entity_id: this.entity.id,
                entity_name: this.entity["@type"],
                context:
                  this.configs?.extraFields?.context || this.configs.store,
                data: {},
              };

              data.forEach((element) => {
                ed.data[element.extra_fields.id] = element.value;
              });

              this.extraData = ed;
              this.key++;
            });
        });
    },
    getFilterSize() {
      let size = 0;
      let number = this.extraFields.length;

      if (number > 0) size = Math.floor(12 / (number + 1));

      if (this.$q.screen.gt.sm) {
        if (size < 4) size = 4;
      } else {
        if (size < 6) size = 6;
      }

      return (
        "col-xs-12 col-sm-4 col-md-" +
        size +
        " col-lg-" +
        size +
        " col-xl-" +
        size
      );
    },
  },
};
</script>
