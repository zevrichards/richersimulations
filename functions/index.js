/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

admin.initializeApp();

const FYGARO_SECRET = defineSecret("FYGARO_SECRET");
const FYGARO_API_KEY = defineSecret("FYGARO_API_KEY");
const PAYPAL_CLIENT_ID = defineSecret("PAYPAL_CLIENT_ID");
const PAYPAL_SECRET = defineSecret("PAYPAL_SECRET");
const PAYPAL_WEBHOOK_ID = defineSecret("PAYPAL_WEBHOOK_ID");

const db = admin.firestore();

/**
 * Completes the order after payment is received
 * @param {object} param0
 */
async function fulfillOrder({orderNumber, transactionId, amount, provider}) {
  // console.log(orderNumber, transactionId, amount, provider)

  const pendingRef = db.collection("PendingOrders").doc(orderNumber);
  const pendingSnap = await pendingRef.get();

  if (!pendingSnap.exists) {
    // logger.error("Order not found:", orderNumber);
    // res.status(404).send("Order not found");
    // return;
    throw new Error(`Order not found: ${orderNumber}`);
  }

  const pendingOrder = pendingSnap.data();
  const userId = pendingOrder.userId;

  // 🔍 Resolve user
  const userRef = db.collection("Users").doc(userId);
  const userSnap = await userRef.get();
  const user = userSnap.data();

  if (!userSnap.exists) {
    // logger.error("User not found:", userId);
    // res.status(404).send("User not found");
    // return;
    throw new Error(`User not found: ${userId}`);
  }


  // 🛒 Load pending user order
  const pendingOrderSnap = await userRef.collection("Orders").get();

  if (pendingOrderSnap.empty) {
    // logger.warn("Orders empty, skipping fulfillment");
    // res.status(404).send("User orders empty, skipping fulfillment");
    // return;
    throw new Error(`User orders empty, skipping fulfillment.`);
  }

  // 🧾 Update order to "Completed"
  const pendingOrderRef = userRef
      .collection("Orders")
      .doc(orderNumber);


  // console.log(pendingOrder)
  // console.log(userSnap.data())
  await pendingOrderRef.update({
    transactionId: transactionId,
    amount: Number(amount),
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "Completed",
    paymentProvider: provider,
  });

  // 📦 Copy cart items + update stock + empty cart
  const batch = db.batch();
  const ItemsArray = [];
  const ItemSnap = await pendingOrderRef.collection("Items").get();

  for (const doc of ItemSnap.docs) {
    // push the item to the order list for the email body
    ItemsArray.push({text: doc.data().Name,
      image: doc.data().ItemImg,
      // quantity: 1,
      price: "$"+(doc.data().Price*(1-doc.data().Discount)).toFixed(2),
      URL: doc.data().URL,
    });
  }

  // update promocode quantity if one was used
  if (pendingOrder.PromoCode) {
    ItemsArray.push({text: pendingOrderRef.PromoCode});

    const promoRef = db.collection("PromoCodes")
        .doc(pendingOrderRef.PromoCode);
    batch.update(promoRef, {
      Quantity: admin.firestore.FieldValue.increment(
          -1,
      ),
    });
  }

  batch.delete(pendingRef);

  // add the filename IDs to the customers FileIDs array
  //   to grant them the necessary permissions to the repository
  const newIDs = ItemsArray.map((item) =>
    item.URL
        .split("%2F")
        .pop()
        .split("?alt")[0]
        .replaceAll("%20", " "),
  );
  
  batch.update(userRef, {
    FileIDs: admin.firestore.FieldValue.arrayUnion(...newIDs),
  });

  // commit all changes to the database
  await batch.commit();


  // SEND EMAILS

  // queue the mail to mail collection
  db.collection("mail").add({
    to: user.email,
    cc: "richersimulations@gmail.com",
    template: {
      name: "receipt",
      data: {
        ordernumber: orderNumber,
        total: amount,
        items: ItemsArray,
        receipt: true,
        name: user.name,
      },
    },
  }).then(() => console.log("Queued email for delivery!"));

  logger.info("Order completed", {
    transactionId,
    orderNumber,
  });
}

/** Creates a JWT on request, to send the user
 *  to a pre-filled Fygaro payment link */
exports.createFygaroJWT = onRequest(
    {
      secrets: [FYGARO_SECRET, FYGARO_API_KEY],
    },
    (req, res) => {
      /* ===== CORS HEADERS (MANDATORY) ===== */
      res.set("Access-Control-Allow-Origin", "*");
      // res.set("Access-Control-Allow-Origin", "http://localhost:3000");
      // res.set("Access-Control-Allow-Origin", "http://richersimulations.com");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");

      // Handle preflight
      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }
      /* =================================== */

      const {amount, orderNumber} = req.body;

      const secret = FYGARO_SECRET.value();
      const apiKey = FYGARO_API_KEY.value();


      if (!secret || !apiKey) {
        console.error("❌ Secrets not injected");
        return res.status(500).json({error: "Server misconfigured"});
      }

      const payload = {
        amount: amount,
        currency: "USD",
        custom_reference: orderNumber,
      };

      const token = jwt.sign(payload, secret, {
        algorithm: "HS256",
        header: {
          typ: "JWT",
          kid: apiKey,
        },
      });

      res.json({token});
    },
);

/** Performs verification on a received
 *  webhook
 *  to verify that it came from PayPal
 * @param {object} req
 * @return {string}
 */
async function verifyPaypalWebhook(req) {
  const fetch = (await import("node-fetch")).default;

  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
  const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

  // 1. Get access token
  const auth = Buffer.from(
      `${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`,
  ).toString("base64");

  const tokenRes = await fetch(
      "https://api-m.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      },
  );

  const {accessToken} = await tokenRes.json();

  // 2. Verify webhook signature
  const verifyRes = await fetch(
      "https://api-m.paypal.com/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: req.headers["paypal-auth-algo"],
          cert_url: req.headers["paypal-cert-url"],
          transmission_id: req.headers["paypal-transmission-id"],
          transmission_sig: req.headers["paypal-transmission-sig"],
          transmission_time: req.headers["paypal-transmission-time"],
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: req.body,
        }),
      },
  );

  const result = await verifyRes.json();
  return result.verification_status === "SUCCESS";
  // for testing since paypal does not allow
  // verification of simulated webhooks
  // return true;
}

/** Captures paypal webhook for
 *  later verification of payment */
exports.paypalWebhook = onRequest(
    {
      rawRequestBody: true,
      secrets: [
        PAYPAL_CLIENT_ID,
        PAYPAL_SECRET,
        PAYPAL_WEBHOOK_ID,
      ],
    },
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          return res.status(405).send("Method Not Allowed");
        }

        const valid = await verifyPaypalWebhook(req);
        if (!valid) {
          logger.warn("Invalid PayPal webhook");
          return res.status(400).send("Invalid signature");
        }

        const event = req.body;

        if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
          return res.status(200).send("Ignored");
        }

        const resource = event.resource;
        // console.log(event.resource)

        await fulfillOrder({
          orderNumber: resource.custom_id,
          transactionId: resource.id,
          amount: resource.amount.value,
          provider: "PayPal",
        });

        return res.status(200).send("Order processed via Paypal");
      } catch (error) {
        logger.error("Paypal webhook error", error);
        return res.status(500).send("Server error");
      }
    },
);

/** converts JSON to text
 * @param {object} rawBody
 * @return {string}
 */
function normalizeBody(rawBody) {
  const text = rawBody.toString("utf8");
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
}

/**
 * performs cryptographics verifcation
 *  of a Fygaro signature to verify payment
 * @param {object} param0
 * @return {Boolean}
 */
function verifyFygaroSignature({secret, signatureHeader, rawBody}) {
  if (!signatureHeader) return false;

  const parts = signatureHeader.split(",");
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Part = parts.find((p) => p.startsWith("v1="));

  if (!tPart || !v1Part) return false;

  const timestamp = tPart.split("=")[1];
  const receivedSig = v1Part.split("=")[1];

  // 🔑 MATCH POSTMAN EXACTLY
  const normalizedPayload = normalizeBody(rawBody);
  const signedPayload = `${timestamp}.${normalizedPayload}`;

  const expectedSig = crypto
      .createHmac("sha256", Buffer.from(secret, "utf8"))
      .update(signedPayload, "utf8")
      .digest("hex");

  const a = Buffer.from(expectedSig, "hex");
  const b = Buffer.from(receivedSig, "hex");

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

/** Captures fygaro webhook for later verification */
exports.fygaroWebhook = onRequest(
    {
    // REQUIRED for raw buffer body
      rawRequestBody: true,
      secrets: [FYGARO_SECRET, FYGARO_API_KEY],
    },
    async (req, res) => {
    // console.log("FULL PAYLOAD", JSON.stringify(req.body, null, 2));

      try {
      // Fygaro uses POST
        if (req.method !== "POST") {
          return res.status(405).send("Method Not Allowed");
        }

        // Optional shared-secret protection
        if (
          process.env.WEBHOOK_SECRET &&
        req.query.token !== process.env.WEBHOOK_SECRET
        ) {
          logger.warn("Unauthorized webhook call");
          return res.status(401).send("Unauthorized");
        }


        // console.log("HEADERS:", req.headers);
        // 1. Get signature header & raw body
        const signatureHeader = req.headers["fygaro-signature"];
        // console.log(signatureHeader)
        const rawBody = req.rawBody;
        const secret = FYGARO_SECRET.value();


        const valid = verifyFygaroSignature({
          secret,
          signatureHeader,
          rawBody,
        });

        if (!valid) {
          return res.status(400).send("Invalid signature");
        }

        console.log("✔️ Fygaro signature verified");

        // 3. Now it's safe to parse the body
        const payload = req.body;
        logger.info("Fygaro webhook received", payload);


        // //4. Process payment event
        const {
          transactionId,
          amount,
        } = payload;

        const orderNumber = payload.customReference;

        if (!transactionId) {
          logger.error("Missing transactionId");
          return res.status(400).send("Invalid payload");
        }

        if (!orderNumber) {
          logger.error("Missing customReference");
          res.status(400).send("Missing customReference");
          return;
        }

        // // 🔒 Idempotency: never process the same transaction twice
        // const txRef = db.collection("fygaroTransactions").doc(transactionId);
        // const txSnap = await txRef.get();

        // if (txSnap.exists) {
        //   logger.warn("Duplicate webhook ignored", transactionId);
        //   return res.status(200).send("Already processed");
        // }

        await fulfillOrder({
          orderNumber,
          transactionId,
          amount,
          provider: "Fygaro",
        });

        return res.status(200).send("Order processed via Fygaro");
      } catch (error) {
        logger.error("Fygaro webhook error", error);
        return res.status(500).send("Server error");
      }
    },
);
