import React, { useRef, useEffect } from "react";

export default function PayPal(props) {
  const paypal = useRef();

  useEffect(() => {
    window.paypal.Buttons({
        createOrder: (data, actions, err) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description: "Richer Simulations",
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
      })
      .render(paypal.current);
  }, []);

  return (
    <div>
      <div className='center' ref={paypal}></div>
    </div>
  );
}