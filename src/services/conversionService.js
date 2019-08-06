import SockJS from "sockjs-client";
import Stomp from "@stomp/stompjs";
import { CONSTANTS } from "@/storage/constants";

const conversionService = {
  subscribeExchangeRateNews: function() {
    let socket = new SockJS(CONSTANTS.ethGatewayUrl + "/exchanges");
    let stompClient = Stomp.over(socket);
    stompClient.debug = null;
    let connectSuccess = function() {
      stompClient.subscribe("/topic/exchanges", function(response) {
        conversionService.fiatRates = JSON.parse(response.body);
      });
    };
    let connectError = function(error) {
      if (error.headers) {
        console.log("[SysadmOnly] WebSocket Error: " + error);
      } else {
        console.log("[SysadmOnly] WebSocket Error: " + error);
      }
    };
    stompClient.connect(
      {},
      connectSuccess,
      connectError
    );
  }
};
export default conversionService;
