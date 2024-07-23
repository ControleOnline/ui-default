<template>
    <div class="row outlined-div">
        <div class="col-11 col-sm-11col-md-11 col-lg-11 col-xg-11 col-xs-11 flex">
            <div class="label-range-date row" v-if="labelType == 'stack-label'">
                {{ $translate(configs.store, column.label, 'input') }}
            </div>
            <q-input borderless stack-label readonly :label="$translate(configs.store, 'dateFrom', 'input')"
                class="q-pa-none custom-input" dense v-model="from" mask="##/##/####"></q-input>
            <q-input borderless stack-label readonly :label="$translate(configs.store, 'dateTo', 'input')"
                class="q-pa-none custom-input" dense v-model="to" mask="##/##/####"></q-input>
        </div>
        <div class="col-1 col-sm-1 col-md-1 col-lg-1 col-xg-1 col-xs-1 q-pa-sm  flex flex-end justify-end items-center">
            <q-icon :clickable="true" name="event" class="vertical-middle cursor-pointer" size="sm">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale" @close="apply">
                    <q-date v-model="dateModel" range mask="DD/MM/YYYY">
                        <div class="row justify-center items-center">
                            <q-btn v-close-popup @click="clear(); apply()"
                                :label="$translate(configs.store, 'clear', 'btn')" class="btn-primary" flat />

                            <q-btn v-close-popup @click="apply" :label="$translate(configs.store, 'apply', 'btn')"
                                class="btn-primary" flat />
                        </div>
                    </q-date>
                </q-popup-proxy>
            </q-icon>
        </div>
    </div>
</template>   
<script>
import * as DefaultFiltersMethods from '@controleonline/ui-default/src/components/Default/Scripts/DefaultFiltersMethods.js';

export default {
    props: {
        initialRange: {
            type: Object,
            required: true,
        },
        labelType: {
            type: String,
            required: false,
            default: 'stack-label'
        },
        column: {
            type: Object,
            required: true,
        },
        configs: {
            type: Object,
            required: true,
        },
    },
    computed: {

    },
    data() {
        return {
            listObject: {},
            from: null,
            to: null,
            dateModel: {},
            initied: false
        }
    },
    created() {

    },
    mounted() {
        this.dateModel = this.rangeDate(this.initialRange);
        this.setinputDate();
        this.initied = true;
    },
    watch: {
    },
    methods: {
        ...DefaultFiltersMethods,
        apply() {
            this.setinputDate();
            this.$emit('changedDateInput', this.dateModel);
        },
        clear() {
            this.dateModel = { from: null, to: null };
        },
        rangeDate(range) {
            let filters = this.$copyObject(range);
            let initialDate = {};
            initialDate.from = this.$formatter.formatDateYmdTodmY(filters?.after);
            initialDate.to = this.$formatter.formatDateYmdTodmY(filters?.before);
            return initialDate;
        },
        setinputDate() {
            let dateModel = {};
            if (typeof this.dateModel !== 'object') {
                dateModel = {
                    from: this.dateModel,
                    to: this.dateModel,
                }
                this.dateModel = dateModel;
            }
            this.from = this.dateModel.from;
            this.to = this.dateModel.to;
        }
    }
}

</script>
<style>
.outlined-div {
    border: 1px solid #aaa;
    padding: 0px 10px 0px 10px;
    border-radius: 5px;
}

.label-range-date {
    position: absolute;
    font-size: 10px;
    margin-top: 3px;
}


.outlined-div>div {
    padding: 0px;
}

.custom-input {
    width: 50%;
}

.custom-input .q-field__native {
    padding-top: 18px;
    padding-left: 25px;
    width: 100px;
}

.custom-input .q-field__label {
    top: 25px;
    font-size: 14px;
}
</style>