<template>
<div>
  <div class="mx-md-5" v-if="asset.status > 3">
    <div class="d-flex justify-content-start mb-3">Transaction complete.</div>
  </div>
  <div class="mx-md-5 d-flex justify-content-start">
    <div>Transferred item to your storage.</div>
  </div>
</div>
</template>

<script>
import { mdbBtn } from "mdbvue";
import bitcoinService from "brightblock-lib/src/services/bitcoinService";
import moment from "moment";

// noinspection JSUnusedGlobalSymbols
export default {
  name: "ConfirmationDetailsState7",
  components: {
    mdbBtn
  },
  props: {
    assetHash: null,
  },
  data() {
    return {
    };
  },
  mounted() {
  },
  computed: {
    network() {
      let purchaseCycle = this.$store.getters["assetStore/getCurrentPurchaseCycleByHash"](this.assetHash);
      if (purchaseCycle.buyer.chainData.bitcoinMethod) {
        return "bitcoin";
      }
      if (purchaseCycle.buyer.chainData.lightningMethod) {
        return "lightning";
      }
      return "unknown";
    },
  },
  methods: {
  }
};
</script>
