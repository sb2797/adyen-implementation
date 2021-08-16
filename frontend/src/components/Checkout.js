import { useState, useEffect } from "react";
import React from "react";
import { getPayments, makePayment, makeDetailsCall } from "../actions/payments";
import AdyenCheckout from "@adyen/adyen-web";
import "@adyen/adyen-web/dist/adyen.css";

const Checkout = () => {
  const [values, setValues] = useState({
    paymentSubmitted: false,
  });

  const { paymentSubmitted } = values;

  useEffect(() => {
    loadPayments();
  }, [paymentSubmitted]);

  const loadPayments = () => {
    if (!paymentSubmitted) {
      getPayments().then((data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          createDropin(data.response);
        }
      });
    }
  };

  const createDropin = (paymentMethodsResponse) => {
    const configuration = {
      paymentMethodsResponse: paymentMethodsResponse,
      clientKey: "test_QFGJGRQZERFWNFYWKEZSQL3E342QEDNU",
      locale: "en-US",
      openFirstStoredPaymentMethod: true,
      environment: "test",
      amount: { value: 1000, currency: "USD" },
      onSubmit: (state, dropin) => {
        makePayment(state.data)
          .then((response) => {
            if (response.action) {
              dropin.handleAction(response.action);
            } else {
              if (state.isValid) {
                //Here we would pass the state.data to our servers if required
              }
              if (response.resultCode) {
                responseHandler(dropin, response);
              }
            }
          })
          .catch((error) => {
            throw Error(error);
          });
      },
      onAdditionalDetails: (state, dropin) => {
        makeDetailsCall(state.data)
          .then((response) => {
            if (response.action) {
              dropin.handleAction(response.action);
            } else {
              if (state.isValid) {
                //Here we would pass the state.data to our servers if required
              }
              if (response.resultCode) {
                responseHandler(dropin, response);
              }
              return null;
            }
          })
          .catch((error) => {
            throw Error(error);
          });
      },
      onError: (error) => {
        console.error("Adyen Error: ", error);
      },
      paymentMethodsConfiguration: {
        card: {
          hasHolderName: true,
          holderNameRequired: true,
          enableStoreDetails: true,
          hideCVC: false,
          name: "Credit or debit card",
        },
      },
    };
    const checkout = new AdyenCheckout(configuration);
    try {
      const dropin = checkout
        .create("dropin", {
          openFirstPaymentMethod: true,
          setStatusAutomatically: false,
        })
        .mount("#dropin-container");
    } catch (error) {
      console.error(error);
    }
  };

  const redirectHandler = () => {
    if (/success/.test(document.location.pathname)) {
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const orderRef = params.get("orderRef");

      document.getElementById("dropin-container").style.display = "none";
      return (
        <div className="alert alert-success mr-5 ml-5 pr-5 pl-5" role="alert">
          Order Confirmed
        </div>
      );
    } else if (/pending/.test(document.location.pathname)) {
      document.getElementById("dropin-container").style.display = "none";
      return (
        <div className="alert alert-warning mr-5 ml-5 pr-5 pl-5" role="alert">
          Your order has been placed. 
        </div>
      );
    } else if (
      /failed/.test(document.location.pathname) ||
      /error/.test(document.location.pathname)
    ) {
      //We could pass errors in the form of query params to display the error message
      return (
        <div className="alert alert-danger mr-5 ml-5 pr-5 pl-5" role="alert">
          Unable to place order
        </div>
      );
    }
  };

  const responseHandler = (dropin, response) => {
    if (response.resultCode === "Authorised") {
      dropin.setStatus("success", {
        message: "Payment successful! Order Ref#: " + response.pspReference,
      });
    } else if (
      response.resultCode === "Error" ||
      response.resultCode === "Refused" ||
      response.resultCode === "Cancelled"
    ) {
      dropin.setStatus("error", {
        message: "Error: " + response.refusalReason,
      });
    }
  };
  return (
    <React.Fragment>
      <h1 className="text-center mt-4 mb-0">
        {paymentSubmitted ? "Order Confirmation" : "Subscription Checkout"}
      </h1>
      <hr className="mt-0 mb-5 ml-5 mr-5 pl-5 pr-5" />
      {redirectHandler()}
    </React.Fragment>
  );
};
export default Checkout;
