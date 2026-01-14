import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, Sparkles, Loader2, Crown } from "lucide-react";
import { useAuth } from "../hooks/use-auth";
import { subscriptionsApi, usersApi } from "../lib/api";

export function Pricing() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Fetch pricing tiers
  const { data: pricingData } = useQuery({
    queryKey: ["pricing"],
    queryFn: () => subscriptionsApi.getPricing(),
  });

  // Fetch user subscription
  const { data: subscriptionData } = useQuery({
    queryKey: ["subscription", "my"],
    queryFn: () => subscriptionsApi.getMySubscription(),
    enabled: !!user,
  });

  // Create checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (tierId: string) =>
      subscriptionsApi.createCheckout({
        tierId,
        successUrl: `${window.location.origin}/visualizer?success=true`,
        cancelUrl: `${window.location.origin}/pricing?canceled=true`,
      }),
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.sessionUrl;
    },
    onError: () => {
      setIsLoading(null);
    },
  });

  const handleSubscribe = (tierId: string) => {
    if (!user) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    setIsLoading(tierId);
    checkoutMutation.mutate(tierId);
  };

  const currentTier = subscriptionData?.tier || "free";
  const tiers = pricingData?.tiers || [];

  const getTierIcon = (tier: string) => {
    if (tier === "professional") return <Crown className="w-6 h-6" />;
    if (tier === "basic") return <Sparkles className="w-6 h-6" />;
    return null;
  };

  const getTierColor = (tier: string) => {
    if (tier === "professional")
      return "from-purple-600 to-pink-600";
    if (tier === "basic") return "from-blue-600 to-cyan-600";
    return "from-gray-600 to-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your space with AI-powered interior design. Start free or
            upgrade for unlimited access.
          </p>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const isCurrent = currentTier === tier.tier;
            const isProfessional = tier.tier === "professional";
            const isFree = tier.tier === "free";

            return (
              <div
                key={tier.id}
                className={`
                  relative rounded-2xl border-2 bg-white overflow-hidden
                  ${
                    isProfessional
                      ? "border-purple-300 shadow-xl scale-105"
                      : "border-gray-200 shadow-md"
                  }
                `}
              >
                {/* Popular badge */}
                {isProfessional && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                      POPULAR
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  {!isFree && (
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${getTierColor(tier.tier)} text-white mb-4`}
                    >
                      {getTierIcon(tier.tier)}
                    </div>
                  )}

                  {/* Tier name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      ${tier.price}
                    </span>
                    {!isFree && (
                      <span className="text-gray-600 ml-2">/month</span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {isFree ? (
                    isCurrent ? (
                      <div className="w-full py-3 bg-gray-100 text-gray-600 text-center font-medium rounded-lg">
                        Current Plan
                      </div>
                    ) : (
                      <div className="w-full py-3 bg-gray-100 text-gray-600 text-center font-medium rounded-lg">
                        Always Free
                      </div>
                    )
                  ) : isCurrent ? (
                    <div className="w-full py-3 bg-green-100 text-green-700 text-center font-medium rounded-lg flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Current Plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={isLoading === tier.id}
                      className={`
                        w-full py-3 text-white font-bold rounded-lg
                        transition-all shadow-md hover:shadow-lg
                        bg-gradient-to-r ${getTierColor(tier.tier)}
                        hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2
                      `}
                    >
                      {isLoading === tier.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {tier.tier === "professional"
                            ? "Get Premium"
                            : "Upgrade Now"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              How does the credit system work?
            </h3>
            <p className="text-gray-700">
              Free tier users get 3 design generations per month. These credits
              reset at the beginning of each month. Paid subscribers get
              unlimited generations with no credit limits.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Can I cancel my subscription anytime?
            </h3>
            <p className="text-gray-700">
              Yes! You can cancel your subscription at any time. You'll
              continue to have access until the end of your billing period, then
              you'll be downgraded to the free tier.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-700">
              We accept all major credit cards (Visa, Mastercard, American
              Express) through our secure payment processor Stripe.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Do you offer refunds?
            </h3>
            <p className="text-gray-700">
              We offer a 14-day money-back guarantee for new subscriptions. If
              you're not satisfied within the first 14 days, contact us for a
              full refund.
            </p>
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                10,000+
              </div>
              <p className="text-gray-700">Designs Generated</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                4.9/5
              </div>
              <p className="text-gray-700">Average Rating</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">
                24/7
              </div>
              <p className="text-gray-700">Customer Support</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
