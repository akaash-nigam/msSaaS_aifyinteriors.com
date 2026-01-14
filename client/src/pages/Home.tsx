import { Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/use-auth";

export function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Space with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Magic
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
              Upload a photo of your room and watch as our AI instantly generates
              stunning interior design ideas in any style you choose.
            </p>

            <div className="flex items-center justify-center gap-4">
              {user ? (
                <a
                  href="/visualizer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <Sparkles className="w-6 h-6" />
                  Start Creating
                  <ArrowRight className="w-6 h-6" />
                </a>
              ) : (
                <>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <Sparkles className="w-6 h-6" />
                    Get Started Free
                    <ArrowRight className="w-6 h-6" />
                  </a>
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 text-lg font-bold rounded-xl border-2 border-gray-300 hover:border-blue-600 hover:shadow-lg transition-all"
                  >
                    View Pricing
                  </a>
                </>
              )}
            </div>

            {/* Free tier callout */}
            {!user && (
              <p className="mt-6 text-sm text-gray-600">
                🎉 Start with 3 free designs per month. No credit card required.
              </p>
            )}
          </div>
        </div>

        {/* Demo image placeholder */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <p className="text-2xl font-bold text-gray-500">
                [Demo Design Showcase]
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose AIfy Interiors?
            </h2>
            <p className="text-xl text-gray-600">
              Powered by advanced AI to bring your design vision to life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Instant Results
              </h3>
              <p className="text-gray-600">
                Get professional-quality interior designs in seconds, not days.
                Our AI processes your room and generates beautiful designs instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                10+ Design Styles
              </h3>
              <p className="text-gray-600">
                From Modern Minimalist to Japanese Zen, choose from a wide variety
                of professionally curated design styles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your photos and designs are private and secure. We never share
                your data without permission.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Styles Showcase */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Design Styles
            </h2>
            <p className="text-xl text-gray-600">
              Transform any room into your dream space
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: "Modern", emoji: "✨" },
              { name: "Scandinavian", emoji: "🌲" },
              { name: "Industrial", emoji: "🏭" },
              { name: "Bohemian", emoji: "🌺" },
              { name: "Coastal", emoji: "🌊" },
            ].map((style) => (
              <div
                key={style.name}
                className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="text-5xl mb-3">{style.emoji}</div>
                <h4 className="font-semibold text-gray-900">{style.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Space?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of homeowners who have already redesigned their spaces
            with AI
          </p>

          {user ? (
            <a
              href="/visualizer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-6 h-6" />
              Create Your First Design
              <ArrowRight className="w-6 h-6" />
            </a>
          ) : (
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-6 h-6" />
              Get Started Free
              <ArrowRight className="w-6 h-6" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
