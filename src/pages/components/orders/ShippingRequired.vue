<template>
<div v-if="!loading">
  <div class="mx-md-5 mb-3" v-if="buyerConfirmations > 3">
    <div class="mb-3"><h5>Please ship to:</h5></div>
    <div class="mb-1"><strong>{{buyer.did}}</strong></div>
    <address-view :address="myProfile.auxiliaryProfile.shippingAddress" />
  </div>
  <div class="mx-md-5" v-if="buyerConfirmations < 6">
    <div class="d-flex justify-content-between text-muted">
      <div>Confirmations {{buyerConfirmations}} / 6</div>
      <div class="text-muted"><a :href="buyerBlockchainUrl" target="_blank">Check chain <i class="fas fa-external-link-alt"></i></a></div>
    </div>
  </div>
</div>
</template>

<script>
import bitcoinService from "brightblock-lib/src/services/bitcoinService";
import moment from "moment";
import AddressView from "@/pages/components/user-settings/AddressView";

// noinspection JSUnusedGlobalSymbols
export default {
  name: "ShippingRequired",
  components: {
    AddressView
  },
  props: {
    assetHash: null,
    myProfile: null
  },
  data() {
    return {
      loading: true,
    };
  },
  mounted() {
    let purchaseCycle = this.$store.getters["assetStore/getCurrentPurchaseCycleByHash"](this.assetHash);
    this.$store.dispatch("userProfilesStore/fetchShippingDetails", {username: this.myProfile.username, buyer: purchaseCycle.buyer.did}).then(() => {
      this.loading = false;
    });
  },
  computed: {
    buyerBlockchainUrl() {
      let purchaseCycle = this.$store.getters["assetStore/getCurrentPurchaseCycleByHash"](this.assetHash);
      let bitcoinConfig = this.$store.getters["assetStore/getBitcoinConfig"];
      let txid = purchaseCycle.buyer.chainData.txid;
      if (bitcoinConfig.chain === "test") {
        return "https://testnet.smartbit.com.au/tx/" + txid;
      }
      return "https://www.blockchain.com/btc/tx/" + txid;
    },
    buyerConfirmations() {
      let purchaseCycle = this.$store.getters["assetStore/getCurrentPurchaseCycleByHash"](this.assetHash);
      return purchaseCycle.buyer.chainData.confirmations;
    },
    buyer() {
      let purchaseCycle = this.$store.getters["assetStore/getCurrentPurchaseCycleByHash"](this.assetHash);
      return purchaseCycle.buyer;
    },
    network() {
      let purchaseCycle = this.$store.getters["assetStore/getCurrentPurchaseCycleByHash"](this.assetHash);
      if (purchaseCycle.buyer.chainData.bitcoinMethod) {
        return "bitcoin";
      }
      if (purchaseCycle.buyer.chainData.lightningMethod) {
        return "lightning";
      }
      return;
    },
  },
  methods: {
  }
};
</script>
