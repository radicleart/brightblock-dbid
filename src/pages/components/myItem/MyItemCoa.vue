<template>
<div class="row">
  <div class="col-lg-5 col-xl-4 mb-4">
    <item-image-list-view :item="item"/>
  </div>
  <div class="col-lg-7 col-xl-7 ml-xl-4 mb-4">
    <item-action-links :item="item" :itemAction="'coa'" :asset="asset" :buttonMode="false"/>
    <p><strong><a @click.prevent="" slot="reference">Certificate of Authenticity</span></a></strong></p>
    <p class="text-muted" v-if="!item.coa">
      Generate a certificate of authenticity for this item - we will generate a hash from your data
      and store this in the blockchain.
    </p>
    <p class="text-muted" v-else>
      A certificate of authenticity has been generated - and can be opened / downloaded here.
    </p>

    <div class="d-flex justify-content-start">
      <button v-if="item.coa" class="btn btn-primary btn-sm" @click="openCoa()">Open COA</button>
      <button class="btn btn-primary btn-sm" @click="generateCoa()">Generate COA</button>
    </div>
  </div>
</div>
</template>

<script>
import xhrService from "@/services/xhrService";
import { mdbPopover, mdbIcon, mdbCardBody, mdbCardTitle, mdbCardText, mdbBtn } from "mdbvue";
import ItemImageListView from "./ItemImageListView";
import ItemActionLinks from "./ItemActionLinks";

// noinspection JSUnusedGlobalSymbols
export default {
  name: "MyItemCoa",
  components: {
    ItemImageListView, ItemActionLinks,
    mdbCardBody,
    mdbPopover,
    mdbIcon,
    mdbCardTitle,
    mdbCardText,
    mdbBtn
  },
  props: {
    myProfile: {
      type: Object,
      default() {
        return {};
      }
    },
    asset: {
      type: Object,
      default() {
        return {};
      }
    },
    item: {
      type: Object,
      default() {
        return {};
      }
    },
  },
  data() {
    return {
      result: null,
      downloadLink: null,
      validBitcoinAdress: false,
      message: null,
    };
  },
  mounted() {
  },
  computed: {
    myItemUrl() {
      return `/my-items/${this.item.id}`;
    },
  },
  methods: {
    setByEventCoa (coa) {
      let item = this.item;
      item.coa = coa;
      this.$store.dispatch("myItemStore/updateItem", {item: item, updateProvData: true})
        .then((item) => {
          this.$emit("reload");
        });
    },
    generateCoa: function() {
      let canvas, qrCodeDataUrl;
      try {
        canvas = document.getElementById('qrcode');
        qrCodeDataUrl = canvas.toDataURL();
      } catch (err) {
        // no canvas - ie bitcoin address.
      }
      let item = this.item;
      let $self = this;
      let siteLogo = require("@/assets/img/logo/logo-black-256x256.png");
      let data = {
        item: item,
        qrCodeDataUrl: qrCodeDataUrl,
        siteName: "dbidio",
        siteLogo: siteLogo,
      }
      let endPoint = this.$store.state.apiConstants.ethGatewayUrl + "/api/convert/coa";
      xhrService.makePostCall(endPoint, data).then((response) => {
        $self.downloadLink = $self.getPdfLink(item);
        // $self.$emit('updateCoa', response.data);
        $self.setByEventCoa(response.data);
        this.$notify({type: 'success', title: 'Certificate Generated', text: 'Your certificate is ready to downlod.'});
      });
    },
    getPdfLink: function(item) {
      let url = this.$store.state.apiConstants.ethGatewayUrl + "/api/getpdf/";
      if (item) {
        let title = item.title;
        title = title.replace(/\s/g, '_');
        let filename = title + "_" + item.id + ".pdf";
        return url + filename;
      }
    },
    openCoa () {
      let pdfWindow = window.open("")
      pdfWindow.document.write("<iframe width='100%' height='100%' src='data:application/pdf;base64, " + encodeURI(this.item.coa)+"'></iframe>")
    },
  }
};
</script>
