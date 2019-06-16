<template>
<div class="container-fluid flex-1 pt-5">
  <div class="bg-white mt-5 p-3" v-if="loading">
    <div>Loading item - please wait...</div>
  </div>
  <div v-else>
    <div class="bg-white mt-5 p-3" v-if="!item">
      <div>404 - item not found</div>
    </div>
    <div class="bg-white mt-5 p-3" v-else>
      <my-item-manage v-if="itemAction === 'manage'" :item="item" :asset="asset" :myProfile="myProfile"/>
      <my-item-register v-else-if="itemAction === 'register'" :item="item" :asset="asset" :myProfile="myProfile"/>
      <my-item-coa v-else-if="itemAction === 'coa'" :item="item" :asset="asset" :myProfile="myProfile"/>
      <my-item-set-price v-else-if="itemAction === 'set-price'" :item="item" :asset="asset" :myProfile="myProfile"/>
    </div>
  </div>
</div>
</template>

<script>
import MyItemRegister from "./MyItemRegister";
import MyItemManage from "./MyItemManage";
import MyItemCoa from "./MyItemCoa";
import MyItemSetPrice from "./MyItemSetPrice";
import { mdbContainer, mdbRow,  mdbCard, mdbCardBody, mdbCardTitle, mdbCardText, mdbCardImage, mdbMask, mdbIcon, mdbView, mdbBtn } from 'mdbvue';
import utils from "@/services/utils";

// noinspection JSUnusedGlobalSymbols
export default {
  name: "MyItem",
  bodyClass: "index-page",
  components: {
    MyItemManage, MyItemRegister, MyItemCoa, MyItemSetPrice,
    mdbContainer,
    mdbRow,
    mdbCard,
    mdbCardBody,
    mdbCardTitle,
    mdbCardText,
    mdbCardImage,
    mdbMask,
    mdbIcon,
    mdbView,
    mdbBtn
  },
  props: ["itemAction"],
  data() {
    return {
      item: null,
      asset: null,
      myProfile: {},
      loading: true,
    };
  },
  created() {
    let itemId = Number(this.$route.params.itemId);
    this.$store.dispatch("myItemStore/fetchMyItem", itemId).then((item) => {
      if (item) {
        this.item = item;
        this.$store.dispatch("myAccountStore/fetchMyAccount").then(myProfile => {
          this.myProfile = myProfile;
          let assetHash = utils.buildBitcoinHash(item);
          this.$store.dispatch("assetStore/lookupAssetByHash", assetHash).then(asset => {
            if (asset) {
              this.asset = asset;
              this.loading = false;
            } else {
              this.$store.dispatch("assetStore/initialiseAsset", item).then(asset => {
                this.asset = asset;
                this.loading = false;
              });
            }
          });
        });
      } else {
        this.loading = false;
      }
    });
  },
  methods: {
  },
};
</script>