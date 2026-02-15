# Stripe Payment Modal & Custom Product Cards

**Date:** 2026-02-15
**Author:** Fred 🦅
**Tags:** stripe, payments, e-commerce, integration
**Category:** api-research

---

## TL;DR

Yes — Stripe supports custom product cards with custom products in multiple ways. The three main approaches are:

| Approach | Code Required | Max Products | Customization | Best For |
|----------|--------------|--------------|---------------|----------|
| **Pricing Table** | None (embed only) | 4 per interval | Colors, fonts, features list | Subscription plans |
| **Buy Button** | None (embed only) | 1 per button | Button/card layout, colors | Single product sales |
| **Embedded Checkout** | Server + client | Unlimited | Full control over product display | Custom storefronts |

---

## Option 1: Stripe Pricing Table (No Code)

The simplest approach. You create product cards directly in the Stripe Dashboard and embed them with a single HTML snippet.

### How It Works

1. Go to Stripe Dashboard → Product Catalog → Pricing Tables
2. Click "Create" → add up to **4 products per pricing interval**
3. Customize colors, fonts, button design, language
4. Add feature lists for each product (marketing bullet points)
5. Copy the embed code

### Embed Code

```html
<script async src="https://js.stripe.com/v3/pricing-table.js"></script>
<stripe-pricing-table
  pricing-table-id="prctbl_1234"
  publishable-key="pk_live_..."
>
</stripe-pricing-table>
```

### Customization

- **Visual:** Colors, fonts, button design, highlight a specific product
- **Features:** Add bullet point feature lists per product
- **CTA:** Custom call-to-action buttons with dynamic variables (`{PRODUCT_ID}`, `{CUSTOMER_EMAIL}`)
- **Custom fields:** Text, number, or dropdown (up to 10 options)
- **Multi-currency:** Automatic local currency display
- **Pre-fill email:** Pass `customer-email` attribute

### Limitations

- Max **4 products** per pricing table
- Max **3 prices** per product
- Max **3 unique pricing intervals**
- No usage-based pricing
- No intermediate account creation step
- Not compatible with Stripe Connect
- 50 reads/second rate limit

### Best For

Subscription-based products where you want a clean comparison table (e.g., Basic / Pro / Enterprise plans).

---

## Option 2: Stripe Buy Button (No Code)

A simpler version — one button per product. Can display as a **button** or a **product card**.

### How It Works

1. Go to Stripe Dashboard → Payment Links
2. Create a payment link for your product
3. Click "Buy button" → choose layout (button or card)
4. Customize colors, shape, font, CTA text
5. Copy the embed code

### Embed Code

```html
<script async src="https://js.stripe.com/v3/buy-button.js"></script>
<stripe-buy-button
  buy-button-id="buy_btn_1234"
  publishable-key="pk_live_..."
>
</stripe-buy-button>
```

### Layout Options

- **Simple button** — Just a "Buy Now" style button
- **Card widget** — Shows product name, price, image, and buy button (this is the "custom card" look)

### Customization

- Brand colors, shapes, fonts (inherited from payment link branding)
- Localization (language matching)
- Custom CTA text
- Pre-fill customer email
- Client reference ID for tracking

### Best For

Selling individual products/services embedded on any page. Multiple buy buttons on one page = a product catalog.

---

## Option 3: Embedded Checkout (Code Required)

Full control. You build your own product cards/UI and use Stripe's embedded checkout for the payment form.

### Architecture

```
Your Product Cards (custom UI)
    ↓ (user clicks "Buy")
Your Server creates Checkout Session
    ↓ (returns client_secret)
Stripe Embedded Checkout mounts in your page
    ↓ (user pays)
Redirect to your return page
```

### Server-Side (Next.js API Route)

```typescript
// app/api/checkout/route.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { priceId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'payment', // or 'subscription'
    return_url: `${process.env.NEXT_PUBLIC_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
    automatic_tax: { enabled: true },
  });

  return Response.json({ clientSecret: session.client_secret });
}
```

### Client-Side (React/Next.js)

```tsx
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage({ priceId }: { priceId: string }) {
  const fetchClientSecret = () =>
    fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    })
      .then((res) => res.json())
      .then((data) => data.clientSecret);

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
```

### Custom Product Cards

With this approach, **you design your own product cards entirely**. Stripe only handles the checkout form. Example:

```tsx
// Your custom product card component
function ProductCard({ product }) {
  return (
    <div className="border rounded-xl p-6 shadow-lg">
      <img src={product.image} className="w-full rounded-lg" />
      <h3 className="text-xl font-bold mt-4">{product.name}</h3>
      <p className="text-gray-600">{product.description}</p>
      <div className="text-3xl font-bold mt-2">{product.price} kr</div>
      <ul className="mt-4 space-y-2">
        {product.features.map(f => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <button
        onClick={() => openCheckout(product.priceId)}
        className="w-full mt-6 bg-cyan-600 text-white py-3 rounded-lg"
      >
        Kjøp nå
      </button>
    </div>
  );
}
```

### Customization

- **Product display:** 100% your own design (cards, grids, carousels, anything)
- **Checkout form:** Colors, fonts via Stripe Dashboard branding
- **Address collection:** Billing and/or shipping
- **Button text:** 'pay', 'donate', or 'book'
- **Tax:** Automatic with Stripe Tax
- **Customer data:** Pre-fill email, link existing customers

### Dependencies

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### Environment Variables

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # For order fulfillment
```

### Test Cards

| Scenario | Card Number |
|----------|------------|
| Success | 4242 4242 4242 4242 |
| Auth required | 4000 0025 0003 155 |
| Declined | 4000 0000 0000 9995 |

---

## Recommendation for Kvitfjellhytter

If you want to sell cabin stays or experiences with custom branded cards:

**Best approach: Embedded Checkout (Option 3)**

- Full design control over how cabins/products look
- Stays on your site (no redirect)
- Works perfectly with Next.js (which you're already using)
- Supports both one-time payments and subscriptions
- Automatic tax calculation

For a quick MVP, **Buy Buttons (Option 2)** would work — you can create card-style widgets in minutes with zero code, then upgrade to Embedded Checkout later for full design control.

---

## Key Links

- [Stripe Pricing Table Docs](https://docs.stripe.com/payments/checkout/pricing-table)
- [Stripe Buy Button Docs](https://docs.stripe.com/payment-links/buy-button)
- [Stripe Embedded Checkout Quickstart](https://docs.stripe.com/checkout/embedded/quickstart)
- [Stripe Elements (Custom Forms)](https://stripe.com/payments/elements)
- [Stripe Sessions 2025 Updates](https://stripe.com/blog/top-product-updates-sessions-2025)
