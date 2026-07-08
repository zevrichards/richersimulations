import { render, cleanup } from '@testing-library/react';
import PayPal from './PayPal';

// Captures the config object PayPal.js hands to window.paypal.Buttons(...)
// so we can invoke createOrder/onApprove exactly as the real SDK would.
function mockPaypalSdk() {
  let capturedConfig;
  const close = jest.fn();
  window.paypal = {
    Buttons: jest.fn((config) => {
      capturedConfig = config;
      return { render: jest.fn(), close };
    }),
  };
  return { getConfig: () => capturedConfig, close };
}

describe('PayPal', () => {
  afterEach(() => {
    delete window.paypal;
    cleanup();
  });

  test('sets custom_id to orderNumber, so the backend webhook can match ' +
    'the capture to the pending order (regression test: this field was ' +
    'previously never set, so paypalWebhook always failed with ' +
    "'Order not found: undefined' and no order was ever completed)", () => {
    const sdk = mockPaypalSdk();

    render(
      <PayPal value="19.99" orderNumber="1751234567" OrderApproved={jest.fn()} />,
    );

    const actions = { order: { create: jest.fn((payload) => payload) } };
    const createdOrder = sdk.getConfig().createOrder(null, actions);

    expect(createdOrder.purchase_units[0].custom_id).toBe('1751234567');
    expect(createdOrder.purchase_units[0].amount.value).toBe('19.99');
  });

  test('calls OrderApproved after a successful capture', async () => {
    const sdk = mockPaypalSdk();
    const onApproved = jest.fn();

    render(
      <PayPal value="19.99" orderNumber="1751234567" OrderApproved={onApproved} />,
    );

    const actions = { order: { capture: jest.fn().mockResolvedValue({ id: 'CAP123' }) } };
    await sdk.getConfig().onApprove(null, actions);

    expect(onApproved).toHaveBeenCalledTimes(1);
  });

  test('closes the PayPal button widget on unmount, so it cannot be ' +
    'reused to fire a second real charge after the component is done ' +
    'with it', () => {
    const sdk = mockPaypalSdk();

    const { unmount } = render(
      <PayPal value="19.99" orderNumber="1751234567" OrderApproved={jest.fn()} />,
    );
    unmount();

    expect(sdk.close).toHaveBeenCalledTimes(1);
  });
});
