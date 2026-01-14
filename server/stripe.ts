import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

/**
 * Subscription Tier Definitions
 * Supports Canada (CAD) and US (USD)
 */
export interface PricingTier {
  id: string;
  name: string;
  price: number; // In dollars/month
  currency: string;
  interval: "month" | "year";
  stripePriceId: string;
  features: string[];
  designLimit: number | "unlimited";
  watermark: boolean;
  tier: "free" | "basic" | "india" | "professional";
}

export const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month",
    stripePriceId: "",
    features: [
      "3 designs per month",
      "Basic styles only",
      "Watermarked images",
      "720p resolution",
    ],
    designLimit: 3,
    watermark: true,
    tier: "free",
  },
  {
    id: "basic",
    name: "Basic",
    price: 19,
    currency: "USD",
    interval: "month",
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || "",
    features: [
      "Unlimited designs",
      "All styles (10+)",
      "No watermark",
      "1080p resolution",
      "Download in PNG/JPG",
      "Shopping integration",
    ],
    designLimit: "unlimited",
    watermark: false,
    tier: "basic",
  },
  {
    id: "professional",
    name: "Professional",
    price: 99,
    currency: "USD",
    interval: "month",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || "",
    features: [
      "All Basic features",
      "HD 4K renders",
      "Client project management",
      "White-label option",
      "Commercial license",
      "Priority AI queue",
      "API access",
    ],
    designLimit: "unlimited",
    watermark: false,
    tier: "professional",
  },
];

/**
 * Get pricing tier by ID
 */
export function getPricingTier(tierId: string): PricingTier | undefined {
  return pricingTiers.find((tier) => tier.id === tierId);
}

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createSubscriptionCheckoutSession(
  userId: number,
  userEmail: string,
  tierId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const tier = getPricingTier(tierId);

  if (!tier) {
    throw new Error(`Invalid tier ID: ${tierId}`);
  }

  if (tier.tier === "free") {
    throw new Error("Cannot create checkout session for free tier");
  }

  if (!tier.stripePriceId) {
    throw new Error(`Stripe Price ID not configured for tier: ${tierId}`);
  }

  // Create or retrieve customer
  const customer = await getOrCreateCustomer(userId, userEmail);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [
      {
        price: tier.stripePriceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId.toString(),
    metadata: {
      userId: userId.toString(),
      tier: tier.tier,
    },
    subscription_data: {
      metadata: {
        userId: userId.toString(),
        tier: tier.tier,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });

  return session;
}

/**
 * Create or retrieve Stripe customer
 */
export async function getOrCreateCustomer(
  userId: number,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  return await stripe.customers.create({
    email: email,
    name: name || email,
    metadata: {
      userId: userId.toString(),
    },
  });
}

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${(err as Error).message}`);
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });
}

/**
 * Reactivate cancelled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Retrieve subscription
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Create a billing portal session for customer to manage subscription
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
