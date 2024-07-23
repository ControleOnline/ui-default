<template>
  <label v-if="labelType != 'stack-label'">
    {{ $translate(store, label, "input") }}
  </label>
  <q-input
    :disable="editable == false"
    outlined
    v-if="inputType == 'date-range'"
    filled
    v-model="data"
    mask="##/##/####"
    :rules="['validateBRDate']"
    @keydown="this.$emit('keydown', $event)"
  >
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date
            v-model="tempDate"
            @update:modelValue="(val) => (data = formatDateToBR(val))"
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                label="Close"
                @click="this.$emit('apply')"
                class="btn-primary"
                flat
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>

  <SelectInput
    :disable="editable == false"
    v-else-if="inputType == 'list'"
    :store="store"
    :labelType="labelType"
    :label="label"
    multiple
    :searchAction="searchAction"
    :filters="filters"
    :initialValue="initialValue"
    :formatOptions="formatOptions"
    :searchParam="searchParam"
    @keydown="this.$emit('keydown', $event)"
    @blur="this.$emit('blur', $event)"
    @update="this.$emit('update', $event)"
    @selected="
      (value) => {
        this.data = value;
      }
    "
  />
  <q-input
    outlined
    v-else
    :disable="editable == false"
    dense
    :stack-label="labelType == 'stack-label'"
    lazy-rules
    v-model="data"
    :type="inputType == 'number' ? 'number' : 'text'"
    @keydown="this.$emit('keydown', $event)"
    :prefix="prefix"
    :sufix="sufix"
    @blur="this.$emit('blur', $event)"
    :label="labelType == 'stack-label' ? label : ''"
    :rules="rules"
    :reverse-fill-mask="inputType == 'float' || inputType == 'number'"
    :mask="mask || inputType == 'float' ? '#,##' : mask"
    :fill-mask="inputType == 'float' || inputType == 'number' ? 0 : ''"
  >
    <template v-slot:before v-if="icon">
      <q-icon name="icon" />
    </template>
  </q-input>
</template>
<script>
import SelectInput from "../Common/Inputs/SelectInput";

export default {
  components: {
    SelectInput,
  },
  props: {
    editable: {
      type: Boolean,
    },
    prefix: {},
    sufix: {},
    inputType: {
      type: String,
      required: true,
    },
    mask: {},
    rules: {},
    searchAction: {
      required: true,
    },
    labelType: {
      type: String,
      required: false,
      default: "stack-label",
    },
    label: {
      type: String,
      required: true,
    },
    filters: {
      type: Object,
      required: false,
      default: {},
    },
    initialValue: {
      required: false,
      default: null,
    },
    searchParam: {
      type: String,
      required: false,
      default: "search",
    },
    formatOptions: {
      type: Function,
      required: true,
    },
    store: {
      type: String,
      required: true,
    },
  },
  computed: {
    isLoading() {
      return this.$store.getters[this.store + "/isLoading"];
    },
    isLoadingList() {
      return this.$store.getters[this.store + "/isLoadingList"];
    },
  },
  data() {
    return {
      data: null,
    };
  },
  created() {
    this.data = this.initialValue;
  },

  watch: {
    data: {
      handler: function (data) {
        this.$emit("changed", data);
      },
      deep: true,
    },
  },
  methods: {
    formatDateToBR(dateISO) {
      if (!dateISO) return "";
      const [year, month, day] = dateISO.split("/");
      return `${day}/${month}/${year}`;
    },
    validateBRDate(value) {
      if (!value) return true; // considera válido se estiver vazio, ajuste conforme necessário

      value = formatDateToBR(value);
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!regex.test(value))
        return "Data inválida. Formato esperado: DD/MM/YYYY";

      const [day, month, year] = value.split("/").map(Number);
      const date = new Date(year, month - 1, day);

      if (
        date.getFullYear() !== year ||
        date.getMonth() + 1 !== month ||
        date.getDate() !== day
      ) {
        return "Data inválida";
      }

      return true; // a data é válida
    },
  },
};
</script>
