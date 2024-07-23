<template>
    <q-select outlined dense :stack-label="labelType" lazy-rules use-input :use-chips="multiple == true" map-options
        options-cover transition-show="flip-down" transition-hide="flip-up" @filter="searchList" :options="options"
        label-color="black" input-debounce="700" :loading="isLoadingList" :multiple="multiple == true"
        :label="labelType != 'stack-label' ? '' : $translate(store, label, 'input')" v-model="data"
        @blur="this.$emit('blur', $event)" @focus="this.$emit('focus', $event)">
        <template v-slot:no-option v-if="!isLoadingList">
            <q-item>
                <q-item-section class="text-grey">
                    No results
                </q-item-section>
            </q-item>
        </template>
    </q-select>
</template>


<script>


export default {
    props: {
        multiple: {
            required: false,
            default: false
        },
        searchAction: {
            required: true,
        },
        labelType: {
            type: String,
            required: false,
            default: 'stack-label'
        },
        label: {
            type: String,
            required: true,
        },
        filters: {
            type: Object,
            required: false,
            default: {}
        },
        initialValue: {
            type: Object,
            required: false,
            default: []
        },
        searchParam: {
            type: String,
            required: false,
            default: 'search'
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
        isLoadingList() {
            return this.$store.getters[this.store + '/isLoadingList']
        },
    },
    data() {
        return {
            data: [],
            options: [],
        }
    },
    created() {
        this.data = this.$copyObject(this.initialValue);
    },
    watch: {
        data: {
            handler: function (data) {
                this.$emit('selected', data);
            },
            deep: true,
        }
    },
    methods: {
        searchList(input, update, abort) {
            let params = this.filters;
            if (input.length > 0) params[this.searchParam] = input;
            if (typeof this.searchAction == "string") {
                this.$store.commit(this.store + "/SET_ISLOADINGLIST", true);
                this.options = [];
                if (this.$store.getters[this.searchAction]) {
                    this.$store.getters[this.searchAction].forEach((item) => {
                        this.options.push(this.formatOptions(item));
                    });
                    update();
                    this.$store.commit(this.store + "/SET_ISLOADINGLIST", false);
                } else {
                    this.$store.dispatch(this.searchAction, params)
                        .then((result) => {
                            //this.options.push(null);
                            result.forEach((item) => {
                                this.options.push(this.formatOptions(item));
                            });
                            update();
                        })
                        .finally(() => {
                            this.$store.commit(this.store + "/SET_ISLOADINGLIST", false);
                        });
                }

            } else {
                this.options = this.searchAction
                    .filter((item) => {
                        return (
                            item,
                            !input ||
                            this.formatOptions(item)
                                .value.toString()
                                .toLowerCase()
                                .includes(input.toLowerCase()) ||
                            this.formatOptions(item)
                                .label.toString()
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        );
                    })
                    .map((item) => {
                        if (typeof this.formatOptions == "function")
                            return this.formatOptions(item);
                        else
                            return item;
                    });
                update();
            }
        },
    }
}
</script>
