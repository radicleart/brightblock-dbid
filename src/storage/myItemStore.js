// myItemStore.js
import itemSearchService from "@/services/itemSearchService";
import myItemService from "@/services/myItemService";
import moneyUtils from "@/services/moneyUtils";
import { CONSTANTS } from "@/storage/constants";
import _ from "lodash";
import notify from "@/notify";
import store from "@/storage/store";
import moment from "moment";

const myItemStore = {
  namespaced: true,
  state: {
    myItems: [],
    myPreferences: {}
  },
  getters: {
    bcstatus: (state, getters) => id => {
      let item = getters.myItem(id);
      if (item && item.bcitem && item.bcitem.status) {
        return item.bcitem.status;
      }
      return {
        status: "new",
        itemIndex: -1
      };
    },
    canSell: (state, getters) => id => {
      let item = getters.myItem(id);
      let fb = store.state.constants.featureBitcoin;
      let username = store.getters["myAccountStore/getMyProfile"].username;
      if (fb) {
        let registered = item && item.bitcoinTx;
        return typeof (registered) === "string" && item.owner === username;
      }
      return (
        item && item.bcitem &&
        item.bcitem.itemIndex >= 0 &&
        item.owner === username
      );
    },
    canRegister: (state, getters) => id => {
      let item = getters.myItem(id);
      if (!item) {
        return false;
      }
      let fb = store.state.constants.featureBitcoin;
      if (fb) {
        return !(item.bitcoinTx);
      }
      if (item.bcitem && item.bcitem.itemIndex >= 0) {
        return false;
      }
      return true;
    },
    getMyPreferences: state => {
      return state.myPreferences;
    },
    numberItemsSold: (state, getters) => {
      return getters.sold.length;
    },
    numberItemsUnsold: (state, getters) => {
      return getters.unsold.length;
    },
    editable: (state, getters) => id => {
      let item = getters.myItem(id);
      if (!id || !item) return false;
      let userProfile = store.getters["myAccountStore/getMyProfile"];
      return userProfile.username === item.owner;
    },
    myItemOrDefault: (state, getters) => id => {
      let item = getters.myItem(id);
      if (!item) {
        item = {
          keywords: [],
          owner: "unknown",
          medium: "physical",
          saleData: {
            fiatCurrency: state.myPreferences.fiatCurrency
          },
          images: [],
          created: moment({}),
          supportingDocuments: []
        };
      }
      return item;
    },
    myItem: state => id => {
      let item;
      if (id) {
        item = state.myItems.find(myItem => myItem.id === id);
      }
      return item;
    },
    myItemByTimestamp: state => timestamp => {
      if (!timestamp) {
        return;
      }
      let item = state.myItems.find(myItem => myItem.timestamp === timestamp);
      return item;
    },
    unsold: state => {
      let username = store.getters["myAccountStore/getMyProfile"].username;
      let status = store.state.constants.statuses.item.PURCHASE_BEGUN;
      let filtered = state.myItems.filter(item => username === item.owner && item.status !== status);
      filtered = filtered.sort(function compare(a, b) {
        if (a.updated > b.updated) {
          return -1;
        }
        if (a.updated < b.updated) {
          return 1;
        }
        return 0;
      });
      return filtered;
    },
    registered: state => registered => {
      if (registered) {
        return state.myItems.filter(item => item.bitcoinTx);
      } else {
        return state.myItems.filter(item => !item.bitcoinTx);
      }
    },
    selling: state => {
      let username = store.getters["myAccountStore/getMyProfile"].username;
      let status = store.state.constants.statuses.item.PURCHASE_BEGUN;
      let filtered = state.myItems.filter(item => username === item.owner && item.status && item.status === status);
      filtered = filtered.sort(function compare(a, b) {
        if (a.updated > b.updated) {
          return -1;
        }
        if (a.updated < b.updated) {
          return 1;
        }
        return 0;
      });
      return filtered;
    },
    buying: state => {
      let username = store.getters["myAccountStore/getMyProfile"].username;
      let status = store.state.constants.statuses.item.PURCHASE_BEGUN;
      let filtered = state.myItems.filter(item => username === item.buyer && item.status && item.status === status);
      filtered = filtered.sort(function compare(a, b) {
        if (a.updated > b.updated) {
          return -1;
        }
        if (a.updated < b.updated) {
          return 1;
        }
        return 0;
      });
      return filtered;
    },
    sold: state => {
      let username = store.getters["myAccountStore/getMyProfile"].username;
      let filtered = state.myItems.filter(item => username !== item.owner);
      filtered = filtered.sort(function compare(a, b) {
        if (a.updated > b.updated) {
          return -1;
        }
        if (a.updated < b.updated) {
          return 1;
        }
        return 0;
      });
      return filtered;
    },
    available: state => auctionId => {
      // let available = state.myItems.filter(item => typeof (item.saleData.auctionId) === 'undefined')
      let zerro = state.myItems.filter(
        item =>
          typeof item.saleData.auctionId === "undefined" ||
          item.saleData.auctionId === 0 ||
          item.saleData.auctionId !== auctionId
      );
      return zerro;
    }
  },
  mutations: {
    myItems(state, myItems) {
      state.myItems = myItems;
    },
    addMyItem(state, myItem) {
      let index = _.findIndex(state.myItems, function(o) {
        return o.id === myItem.id;
      });
      if (index === -1) {
        state.myItems.splice(0, 0, myItem);
      } else {
        state.myItems.splice(index, 1, myItem);
      }
    },
    updatePreference(state, pref) {
      state.myPreferences[pref.name] = pref.value;
    },
  },
  actions: {
    addToAuction({ commit }, item) {
      return new Promise((resolve, reject) => {
        store
          .dispatch("myAuctionStore/addItem", item)
          .then(() => {
            notify.debug({
              title: "Sell Via Auction",
              text: "Item info added to auction."
            });
            store
              .dispatch("myItemStore/updateItem", {item: item, updateProvData: false})
              .then(item => {
                notify.debug({
                  title: "Sell Via Auction",
                  text: "Auction info added to item."
                });
                commit("addMyItem", item);
                resolve(item);
              })
              .catch(e => {
                reject(e);
              });
          })
          .catch(e => {
            reject(e);
          });
      });
    },
    removeFromAuction({ state }, data) {
      return new Promise((resolve, reject) => {
        let item = state.myItems.filter(
          myItem => myItem.id === data.itemId
        )[0];
        store
          .dispatch("myAuctionStore/removeItem", {
            itemId: data.itemId,
            auctionId: data.auctionId
          })
          .then(() => {
            notify.debug({
              title: "Sell Via Auction",
              text: "Item info removed from auction."
            });
            if (item) {
              // item.saleData = moneyUtils.buildInitialSaleData();
              item.saleData.soid = 0;
              store
                .dispatch("myItemStore/updateItem", {item: item, updateProvData: false})
                .then(item => {
                  notify.debug({
                    title: "Sell Via Auction",
                    text: "Auction info removed from item."
                  });
                  resolve(item);
                })
                .catch(e => {
                  notify.debug({
                    title: "Sell Via Auction",
                    text: "No item."
                  });
                  reject(e);
                });
            } else {
              resolve({});
            }
          })
          .catch(e => {
            reject(e);
          });
      });
    },
    deleteMyItem({ commit, state }, id) {
      myItemService.deleteMyItem(
        id,
        function(result) {
          let myItems = state.myItems;
          let index = _.findIndex(myItems, function(o) {
            return o.id === result.id;
          });
          myItems.splice(index, 1);
          commit("myItems", myItems);
          notify.info({ title: "Delete File.", text: result.message });
        },
        function(error) {
          notify.error({
            title: "Delete File.",
            text: "Error deleting your file: <br>" + error.message
          });
          console.log("Error deleting item.", error);
        }
      );
    },
    fetchMyItems({ commit }) {
      let myProfile = store.getters["myAccountStore/getMyProfile"];
      myItemService.getMyItems(myProfile,
        function(myItem) {
          commit("addMyItem", myItem);
          if (myItem && myItem.saleData) commit("updatePreference", {name: "fiatCurrency", value: myItem.saleData.fiatCurrency});
          store.dispatch("userProfilesStore/fetchUserProfile", { username: myItem.owner }, { root: true });
        },
      );
    },
    fetchMyItem({ commit, getters }, itemId) {
      return new Promise(resolve => {
        let myItem = getters["myItem"](itemId);
        if (myItem && myItem.id) {
          if (myItem && myItem.saleData) commit("updatePreference", {name: "fiatCurrency", value: myItem.saleData.fiatCurrency});
          resolve(myItem);
        } else {
          myItemService.getMyItem(itemId,
            function(myItem) {
              if (myItem) {
                if (myItem && myItem.saleData) commit("updatePreference", {name: "fiatCurrency", value: myItem.saleData.fiatCurrency});
                commit("addMyItem", myItem);
                store.dispatch("userProfilesStore/fetchUserProfile", { username: myItem.owner }, { root: true });
                resolve(myItem);
              } else {
                resolve();
              }
            },
            function(error) {
              console.log("Error fetching item: " + itemId, error);
              resolve();
            }
          );
        }
      });
    },

    fetchMyItemsEth({ commit }) {
      let myProfile = store.getters["myAccountStore/getMyProfile"];
      myItemService.getMyItems(myProfile,
        function(myItem) {
          commit("addMyItem", myItem);
          store.dispatch("ethStore/fetchBlockchainItem", { timestamp: myItem.timestamp }, { root: true })
            .then(blockchainItem => {
              if (blockchainItem && blockchainItem.itemIndex > -1) {
                if (!myItem.bcitem) {
                  myItem.bcitem = {};
                }
                commit("addMyItem", myItem);
              } else {
                myItem.bcitem = {
                  status: "new",
                  itemIndex: -1
                };
              }
            });
        },
        function(error) {
          console.log("Error fetching items", error);
        }
      );
    },
    fetchMyItemEth({ commit }, itemId) {
      return new Promise(resolve => {
        myItemService.getMyItem(
          itemId,
          function(myItem) {
            store.dispatch("ethStore/fetchBlockchainItem", {timestamp: myItem.timestamp})
              .then(blockchainItem => {
                if (blockchainItem && blockchainItem.itemIndex > -1) {
                  myItem.blockchainItem = blockchainItem;
                  let fiatRate = store.getters["conversionStore/getFiatRate"](myItem.saleData.fiatCurrency);
                  let ethToBtc = store.getters["conversionStore/getCryptoRate"]("eth_btc");
                  moneyUtils.convertPrices(myItem, blockchainItem, fiatRate, ethToBtc);
                  if (blockchainItem.blockstackId && myItem.owner !== blockchainItem.blockstackId) {
                    myItem.owner = blockchainItem.blockstackId;
                    store.dispatch("myItemStore/updateItem", {item: myItem, updateProvData: false});
                  }
                }
                commit("addMyItem", myItem);
                resolve(myItem);
              });
          },
          function(error) {
            console.log("Error fetching item: " + itemId, error);
            resolve();
          }
        );
      });
    },

    uploadItem({ commit }, item) {
      return new Promise(resolve => {
        item.saleData = moneyUtils.buildInitialSaleData();
        store.dispatch("contentStore/checkNewCategories", item.keywords);
        myItemService.uploadItem(
          item,
          function(item) {
            commit("addMyItem", item);
            resolve(item);
          },
          function(error) {
            console.log("Error uploading item: ", error);
            resolve();
          }
        );
      });
    },

    transferItem({ commit }, item) {
      return new Promise(resolve => {
        myItemService.transferItem(item,
          function(item) {
            commit("addMyItem", item);
            resolve(item);
          },
          function(error) {
            console.log("Error uploading item: ", error);
            resolve();
          }
        );
      });
    },
    transferItemToBuyer({ commit }, asset) {
      return new Promise(resolve => {
        store.dispatch("myAccountStore/fetchMyAccount").then(profile => {
          if (asset.status === 7) {
            let pc = asset.purchaseCycles[0];
            let iambuyer = profile.username === pc.buyer.did;
            let iamseller = profile.username === pc.seller.did;
            if (iamseller) {
              // mark item as transferred
              let itemId = Number(asset.assetId.split("_::_")[1]);
              myItemService.getMyItem(itemId, function(item) {
                if (item) {
                  item.owner = pc.buyer.did;
                  item.buyer = null;
                  item.saleData = moneyUtils.buildInitialSaleData();
                  item.status = CONSTANTS.statuses.item.PURCHASE_COMPLETE;
                  myItemService.addSaleHistory(item, asset.assetHash, pc.buyer.chainData);
                  myItemService.updateItem(item, false, true, function(item) {
                    commit("addMyItem", item);
                  });
                }
              });
            } else if (iambuyer) {
              let itemId = Number(asset.assetId.split("_::_")[1]);
              itemSearchService.userItem(itemId, pc.seller.did, function(item) {
                if (item) {
                  item.owner = pc.buyer.did;
                  item.buyer = null;
                  item.saleData = moneyUtils.buildInitialSaleData();
                  item.status = CONSTANTS.statuses.item.PURCHASE_COMPLETE;
                  myItemService.addSaleHistory(item, asset.assetHash, pc.buyer.chainData);
                  myItemService.uploadOrTransferItem(item, function(item) {
                    commit("addMyItem", item);
                    store.dispatch("assetStore/markAssetTransferred", asset.assetHash);
                  });
                }
              });
            }
          }
        });
      });
    },

    syncBlockchainState({ commit }, item) {
      return new Promise(resolve => {
        let count = 0;
        if (!item || !item.timestamp) {
          resolve({});
          return;
        }
        let intval = setInterval(function() {
          store.dispatch("ethStore/fetchBlockchainItem", {timestamp: item.timestamp})
            .then(blockchainItem => {
              if (
                blockchainItem &&
                item.bcitem.price === blockchainItem.price
              ) {
                clearInterval(intval);
              }
              if (count >= 5) {
                clearInterval(intval);
              }
              if (blockchainItem) {
                let fiatRate = store.getters["conversionStore/getFiatRate"](item.saleData.fiatCurrency);
                let ethToBtc = store.getters["conversionStore/getCryptoRate"]("eth_btc");
                moneyUtils.convertPrices(item, blockchainItem, fiatRate, ethToBtc);
                commit("addMyItem", item);
                resolve(item);
                notify.info({
                  title: "Blockchain Item Sync",
                  text: "New price has been set in blockchain."
                });
              }
              count++;
            });
        }, 2000);
      });
    },

    updateItem({ commit }, data) {
      return new Promise(resolve => {
        if (!data.item.saleData || !data.item.saleData.soid) {
          data.item.saleData = moneyUtils.buildInitialSaleData();
        }
        store.dispatch("contentStore/checkNewCategories", data.item.keywords);
        commit("updatePreference", {name: "fiatCurrency", value: data.item.saleData.fiatCurrency});

        myItemService.updateItem(
          data.item, true, data.updateProvData,
          function(item) {
            commit("addMyItem", item);
            resolve(item);
          },
          function(error) {
            console.log("Error uploading item: ", error);
            resolve();
          }
        );
      });
    }
  }
};
export default myItemStore;
