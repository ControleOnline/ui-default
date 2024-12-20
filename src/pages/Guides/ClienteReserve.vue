<template>
  <q-page>
    <MenuDefaultHeader
      :save_button="false"
    >
    </MenuDefaultHeader>

    <q-item class="q-pa-md">
      <q-item-section class="border-division q-pb-md">
        <q-date
          class="full-width q-my-md"
          v-model="reserveEdit.date"
          color="secondary"
          minimal
          range
        />
      </q-item-section>
    </q-item>

    <q-item class="column">
      <q-item-section class="text-bold q-my-md">
        <div class="flex items-center">
          <q-item-label class="title-list">
            {{ $t('booking_details') }}
          </q-item-label>
          <q-space></q-space>
          <q-icon size="1.5rem" name="o_date_range"></q-icon>
        </div>
      </q-item-section>

      <div class="row full-width items-center justify-between">
        <p class="col-4 q-ma-none text-grey-9 text-description">
          {{ $t('many_people') }}
        </p>
        <div
          class="col-4 flex items-center"
          style="justify-content: right;"
        >
          <q-btn
            :disable="reserveEdit.quantity_customers.quantity === 0"
            @click="quantityCustomers('remove')"
            flat
            round
            icon="remove_circle_outline" />
          <p class="q-ma-none text-grey-9 text-description">
            {{ reserveEdit.quantity_customers.quantity }}
          </p>
          <q-btn
            @click="quantityCustomers('add')"
            flat
            round
            icon="add_circle_outline" />
        </div>
        <p class="col-4 q-ma-none text-grey-9 text-right text-description">
          R$ {{ this.$formatter. formatMoney(reserveEdit.quantity_customers.price) }}
        </p>
      </div>

      <q-item-section class="text-bold q-my-md q-pt-xl">
        <div class="flex items-center">
          <q-item-label class="title-list">
            {{ $t('hiring_separately') }}
          </q-item-label>
          <q-space></q-space>
          <q-icon size="1.5rem" name="o_add_shopping_cart"></q-icon>
        </div>
      </q-item-section>

      <div
        v-for="item in reserveEdit.additional"
        :key="item.label"
        class="row full-width items-center justify-between"
      >
        <p class="col-4 q-ma-none text-grey-9 text-description">{{ item.label }}</p>

        <div
          class="col-4 flex items-center"
          style="justify-content: right;"
        >
          <q-btn
            :disable="item.quantity === 0"
            @click="quantityProduct('remove', item.label)"
            flat
            round
            icon="remove_circle_outline" />
          <p class="q-ma-none text-grey-9 text-description">{{ item.quantity }}</p>
          <q-btn
            @click="quantityProduct('add', item.label)"
            flat
            round
            icon="add_circle_outline" />
        </div>

        <p class="col-4 q-ma-none text-grey-9 text-right text-description">
          R$ {{ this.$formatter. formatMoney(item.price) }}
        </p>
      </div>
    </q-item>

    <q-item class="q-pa-none">
      <div class="flex items-center q-pa-md full-width shadow-6">
        <q-icon name="shopping_cart" color="secondary" size="2.3rem"></q-icon>
        <q-item-label class="q-mx-sm text-bold text-secondary title-list">
          {{ total }}
        </q-item-label>

        <q-space></q-space>

        <q-btn
          class="q-py-sm q-px-md text-capitalize"
          color="secondary"
          label="Reservar"
          @click="openPaymentDialog = true"
        >
        </q-btn>
        <PaymentDialog
          v-if="openPaymentDialog"
          v-model="openPaymentDialog"
          :total="total"
        ></PaymentDialog>
      </div>
    </q-item>
  </q-page>
</template>

<script>
import PaymentDialog from '@controleonline/ui-legacy/ui-common/src/components/Dialog/PaymentDialog';
import MenuDefaultHeader from '@controleonline/ui-legacy/ui-common/src/components/Header/MenuDefaultHeader';

export default {
  components: {
    MenuDefaultHeader,
    PaymentDialog,
  },

  data() {
    return {
      openPaymentDialog: false,
      total: 0,
      reserveEdit: {},
    };
  },

  computed: {
    reserve: {
      get() { return this.$store.getters['Guides/getClienteReserve']; },
      set(value) { this.$store.commit('Guides/setClienteReserve', { clienteReserve: value }); },
    },
  },

  methods: {
    quantityCustomers(action) {
      if (action === 'add') {
        this.reserveEdit.quantity_customers.quantity += 1;
      } else {
        this.reserveEdit.quantity_customers.quantity -= 1;
      }

      this.calculateTotal();
    },
    quantityProduct(action, item) {
      const itemIndex = this.reserveEdit.additional
        .findIndex((product) => product.label === item);

      if (action === 'add') {
        this.reserveEdit.additional[itemIndex].quantity += 1;
      } else {
        this.reserveEdit.additional[itemIndex].quantity -= 1;
      }

      this.calculateTotal();
    },
    calculateTotal() {
      const sumCostumers = this.reserveEdit.quantity_customers.quantity > 0
        ? this.reserveEdit.quantity_customers.quantity * this.reserveEdit.quantity_customers.price
        : 0;

      const sumPrices = this.reserveEdit.additional
        .reduce((acc, cur) => {
          if (!cur.quantity) return acc;

          return acc + cur.price * cur.quantity;
        }, 0);

      this.total = this.this.$formatter. formatMoney(sumPrices + sumCostumers);
    },
   formatMoney(value) {
      const moneyFormated = value.toLocaleString('pt-br', { minimumFractionDigits: 2 });

      return moneyFormated;
    },
  },

  created() {
    this.reserveEdit = ((this.$store.getters['Guides/getClienteReserve']));
  },
};
</script>

<style lang="scss" scoped>
.border-division {
  padding-top: 30px 10px 30px 10px;
  border-bottom: solid 1px rgb(187, 187, 187);
}
.title-list {
  font-size: 1.25rem;
}
.text-description {
  font-size: 1rem;
}
</style>
