import React, { useRef, useEffect } from "react";

export default function PayPal(props) {
  const paypal = useRef();

  useEffect(() => {
    const buttons = window.paypal.Buttons({
        createOrder: (data, actions, err) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description: "Richer Simulations",
                // custom_id is echoed back on the capture webhook payload
                // (resource.custom_id) so the backend can match this
                // transaction to the right PendingOrders/Orders doc.
                custom_id: props.orderNumber,
                amount: {
                  currency_code: "USD",
                  value: props.value,
                  // value: 1,
                },
              },
            ],
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          props.OrderApproved();
          console.log(order);
        },
        onError: (err) => {
          console.log(err);
          alert(err);
        },
      });
    buttons.render(paypal.current);
    // prevent stacking a second live button widget if this component
    // ever re-mounts (e.g. React StrictMode double-invoke in dev)
    return () => { try { buttons.close(); } catch (_) {} };
  }, []);

  return (
    <div>
      <div className='center' ref={paypal}></div>
    </div>
  );
}