<template>
<div>
  <div class="mx-md-5">
    <div class="d-flex justify-content-start mb-3">We have detected your payment.</div>
    <div class="d-flex justify-content-start mb-3" v-if="buyerConfirmations > 2"><a @click.prevent="showContactSeller = !showContactSeller"><u>Contact seller</u></a></div>
    <contact-seller :assetHash="assetHash" v-if="showContactSeller" />
  </div>
  <div class="mx-md-5">
    <!-- <div class="d-flex justify-content-start text-muted">Note: If the seller fails to send you your goods you will be given a full refund!</div> -->
    <div class="d-flex justify-content-between text-muted">
      <div>Confirmations {{buyerConfirmations}} / 6 (apprx 1 hour)</div>
      <div class="text-muted"><a :href="buyerBlockchainUrl" target="_blank">Check chain <i class="fas fa-external-link-alt"></i></a></div>
    </div>
  </div>
</div>
</template>

<script>
import { mdbBtn } from "mdbvue";
import bitcoinService from "brightblock-lib/src/services/bitcoinService";
import moment from "moment";
import ContactSeller from "@/pages/components/orders/ContactSeller";

// noinspection JSUnusedGlobalSymbols
export default {
  name: "ConfirmationDetailsState4",
  components: {
    mdbBtn, ContactSeller
  },
  props: {
    assetHash: null,
    item: null
  },
  data() {
    return {
      showContactSeller: false,
    };
  },
  mounted() {
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
