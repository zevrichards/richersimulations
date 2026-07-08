import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import { Cart } from './Cart';

// Cart.js imports firebase/compat/firestore via ../config/config.js, which
// doesn't work under jsdom. Stub it out so we can test Cart's own logic in
// isolation, the way any component touching Firestore has to be tested here.
// Plain functions, not jest.fn() — react-scripts' Jest config sets
// resetMocks: true, which strips mockImplementations before every test.
// This mock only needs to always behave the same way; call assertions in
// these tests are made against createPendingOrderSpy instead.
jest.mock('../config/config.js', () => {
  // Serves both GetCart (which needs .forEach over cart items) and
  // CartItem's own Sales/Storewide discount lookup (which needs .data())
  // — this mock isn't collection-name-aware, so one shape has to satisfy
  // every .get() caller in the tree.
  const genericSnapshot = {
    forEach: (cb) => cb({
      data: () => ({ Name: 'Test Item', Price: 10, Discount: 0, ItemImg: '', URL: '' }),
    }),
    data: () => ({ Discount: 0 }),
    exists: true,
  };
  const chain = {
    collection: () => chain,
    doc: () => chain,
    where: () => chain,
    get: () => Promise.resolve(genericSnapshot),
    set: () => Promise.resolve(undefined),
    update: () => Promise.resolve(undefined),
  };

  return {
    firestore: {
      collection: () => chain,
      batch: () => ({
        set: () => {},
        delete: () => {},
        commit: () => Promise.resolve(undefined),
      }),
    },
    Timestamp: { now: () => ({ seconds: Math.floor(Date.now() / 1000) }) },
    auth: {},
  };
});

// Finds the "Paypal" checkout button by its text content — it's not a
// simple accessible name because of the <FaPaypal/> icon and <br/> tags
// mixed into the button's children.
function getPaypalButton(container) {
  return Array.from(container.querySelectorAll('button'))
      .find((btn) => btn.textContent.includes('Paypal'));
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Cart — Paypal button click guard', () => {
  let createPendingOrderSpy;

  beforeEach(() => {
    window.alert = jest.fn();
    // Only reached if a test lets checkout flip to true, at which point
    // Cart swaps in the real <PayPal/> widget.
    window.paypal = { Buttons: () => ({ render: () => {}, close: () => {} }) };
    createPendingOrderSpy = jest
        .spyOn(Cart.prototype, 'createPendingOrder')
        .mockResolvedValue('ORDER-1');
  });

  afterEach(() => {
    createPendingOrderSpy.mockRestore();
    delete window.paypal;
  });

  async function renderCartWithItemInCart() {
    const ref = React.createRef();
    const user = { uid: 'test-uid', isAnonymous: false, email: 'someone@example.com' };

    const { container } = render(<Cart ref={ref} user={user} />);
    // let componentDidMount's async GetCart() populate state.Items
    await act(() => flush());

    // ValidateCustomerData requires a non-empty name before it'll proceed.
    act(() => {
      ref.current.setState({ CustomerName: 'Test User' });
    });

    return { ref, container };
  }

  test('clicking Paypal disables the button synchronously, before ' +
    'createPendingOrder resolves — this is what closes the click-race ' +
    'that used to create 2-3 duplicate pending orders per checkout', async () => {
    const { ref, container } = await renderCartWithItemInCart();
    const button = getPaypalButton(container);
    expect(button.disabled).toBe(false);

    fireEvent.click(button);

    expect(ref.current.state.processing).toBe(true);
    expect(button.disabled).toBe(true);
  });

  test('a second click received while still processing does not call ' +
    'createPendingOrder again (the button being disabled blocks the ' +
    'event, same as a real browser)', async () => {
    const { ref, container } = await renderCartWithItemInCart();
    const button = getPaypalButton(container);

    act(() => {
      ref.current.setState({ processing: true });
    });
    expect(button.disabled).toBe(true);

    fireEvent.click(button);
    await act(() => flush());

    expect(createPendingOrderSpy).not.toHaveBeenCalled();
  });

  test('a normal (single) click proceeds to create exactly one pending order', async () => {
    const { container } = await renderCartWithItemInCart();
    const button = getPaypalButton(container);

    fireEvent.click(button);
    // handleSendToPayPal chains several unawaited .then()s (validate ->
    // set customer data -> setState); give them a macrotask to settle.
    await act(() => flush());

    expect(createPendingOrderSpy).toHaveBeenCalledTimes(1);
  });
});
