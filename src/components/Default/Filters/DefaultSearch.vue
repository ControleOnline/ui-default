<template>
    <q-input outlined class="q-pa-xs" v-if="configs.search != false" borderless dense @keyup.enter="onSearch" v-model="search"
        :placeholder="
        $translate(configs.store, 'search', 'input')
        ">
        <template v-slot:append>
            <q-btn flat icon="search" @click="onSearch"></q-btn>
        </template>
    </q-input>
</template>
<script>
import * as DefaultFiltersMethods from '@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js';

export default {
    props: {
        configs: {
            type: Object,
            required: true,
        },
    },
    computed: {
        columns() {
            return this.$copyObject(this.$store.getters[this.configs.store + '/columns'])
        },
        filters() {
            return this.$store.getters[this.configs.store + '/filters'] || {}
        },
    },
    created() {
        this.search = this.$copyObject(this.filters).search;
    },

    watch: {
        filters: {
            handler: function (dateModel) {
                this.search = this.$copyObject(this.filters).search;
            },
            deep: true,
        },
    },
    data() {
        return {
            search: '',
        }
    },
    methods: {
        ...DefaultFiltersMethods,
    }
}

</script>