const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const { v4: uuid } = require("uuid");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const { response } = require("express");
require("dotenv").config();

//app
const app = express();

// middlewares
app.use(morgan("dev"));
app.use(bodyParser.json());

// cors
if (process.env.NODE_ENV === 'development') {
  app.use(cors({ origin: `${process.env.CLIENT_URL}` }));
}

// routes
app.get("/api", (req, res) => {
  res.json({ time: Date().toString() });
});

const config = new Config();
config.apiKey = process.env.API_KEY;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

const paymentDataStore = {};

app.get("/rest/api/GetPayment", async (req, res) => {
  try {
    const adyenResponse = await checkout.paymentMethods({
      channel: "Web",
      merchantAccount: process.env.MERCHANT_ACCOUNT,
      allowedPaymentMethods:["scheme"]
    });
    res.json({
      response: adyenResponse
    });
  } catch (error) {
    console.error(error);
  }
});

app.post("/rest/api/InitiatePayment", async (req, res) => {
  try {
    const orderRef = uuid();

    const adyenResponse = await checkout.payments({
        amount: {
            currency: "EUR",
            value: 1000
        },
        reference: orderRef,
        merchantAccount: process.env.MERCHANT_ACCOUNT,
        channel: 'Web',
        additionalData: {
            allow3DS2: true
        },
        returnUrl: `${process.env.SERVICE_URL}/rest/api/HandleShopperRedirect?orderRef=${orderRef}`,
        browserInfo: req.body.browserInfo,
        paymentMethod: req.body.paymentMethod
    });

    let resultCode = adyenResponse.resultCode;
    let action = null;

    if(adyenResponse.action){
        action = adyenResponse.action;
        paymentDataStore[orderRef] = action.paymentData;
    }
    res.json({resultCode,action,pspReference: adyenResponse.pspReference, refusalReason: adyenResponse.refusalReason});
  } catch (error) {
      console.error(error);
  }
});

app.post("/rest/api/submitAdditionalDetails", async (req, res) => {
    const payload = {
      details: req.body.details,
      paymentData: req.body.paymentData,
    };
   
    try {
      const response = await checkout.paymentsDetails(payload);
      res.json(response);
    } catch (err) {
      console.error(`Error: ${err.message}, error code: ${err.errorCode}`);
      res.status(err.statusCode).json(err.message);
    }
  });
  

app.all('/rest/api/HandleShopperRedirect', async (req,res) => {
    const payload = {};
    payload['details'] = req.method === 'GET' ? req.query : req.body;

    const orderRef = req.query.orderRef;
    payload['paymentData'] = paymentDataStore[orderRef];
    delete paymentDataStore[orderRef];
    delete payload.details.orderRef;
    try{
        const response = await checkout.paymentsDetails(payload);
        if(response.resultCode === 'Authorised'){
            res.redirect(`${process.env.CLIENT_URL}/redirect/success?orderRef=${orderRef}`);
        }else if(response.resultCode === 'Pending' || response.resultCode === 'Received'){
            res.redirect(`${process.env.CLIENT_URL}/redirect/pending?orderRef=${orderRef}`);
        }else if(response.resultCode === 'Refused'){
            res.redirect(`${process.env.CLIENT_URL}/redirect/failed?orderRef=${orderRef}`);
        }else{
            res.redirect(`${process.env.CLIENT_URL}/redirect/error?orderRef=${orderRef}`);
        }
    }catch(error){
        console.error(error);
    }
});

//port
const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
