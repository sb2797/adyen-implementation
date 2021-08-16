import fetch from "isomorphic-fetch";

export const getPayments = () => {
  return fetch(`https://fierce-beach-07017.herokuapp.com/rest/api/GetPayment`, {
    method: "GET",
  })
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.json();
      } else {
        console.error("rest/api/GetPayments http error: ", response.code);
      }
    })
    .catch((err) => {
      console.error(err);
    });
};

export const makePayment = (data) => {
  return fetch(`https://fierce-beach-07017.herokuapp.com/rest/api/InitiatePayment`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.json();
      } else {
        console.error("rest/api/InitiatePayment http error: ", response.code);
      }
    })
    .catch((err) => console.error(err));
};

export const makeDetailsCall = (data) => {
  return fetch(`https://fierce-beach-07017.herokuapp.com/rest/api/submitAdditionalDetails`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return response.json();
      } else {
        console.error(
          "rest/api/submitAdditionalDetails http error: ",
          response.code
        );
      }
    })
    .catch((err) => console.error(err));
};
