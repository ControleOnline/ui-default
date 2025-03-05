<template>
  <q-input
    :disable="column.editable == false"
    outlined
    dense
    v-model="data[column.key || column.name]"
    mask="##/##/####"
    :rules="['$formatter.validateBRDate']"
    @keydown.enter="save(data[column.key || column.name])"
  >
    <template v-slot:append v-if="isSavingItem(data)">
      <q-spinner-ios class="loading-primary" size="2em" />
    </template>
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            v-model="tempDate"
            @update:modelValue="
              (val) =>
                (data[column.key || column.name] =
                  $formatter.formatDateToBR(val))
            "
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                :label="$tt(configs.store, 'btn', 'apply')"
                @click="save(data[column.key || column.name])"
                class="btn-primary"
                flat
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
<script>
export default {
  props: {
    column: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: true,
    },
    isItemSaved: {
      required: true,
    },
    configs: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      data: null,
    };
  },
  created() {
    this.data = this.$copyObject(this.row);
  },
  methods: {
    save(data) {
      this.$emit("save", data);
    },
  },
};
</script>
