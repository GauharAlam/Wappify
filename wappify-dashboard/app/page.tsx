"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Zap, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Smartphone,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ── Navigation ────────────────────── */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 outline-none">
            <img src="/logo.svg" alt="Wappify Logo" className="w-9 h-9 rounded-xl shrink-0" />
            <span className="text-xl font-bold tracking-tight">Wappify</span>
          </a>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#demo" className="hover:text-emerald-600 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex text-slate-600 h-10 px-4">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6 h-10 shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────── */}
      <header id="top" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeIn}>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                  <Zap className="h-3 w-3 fill-current" />
                  Now with Gemini 1.5 Pro
                </span>
              </motion.div>
              
              <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Scale Your D2C Brand on <span className="text-emerald-500">WhatsApp.</span>
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-xl text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Turn your WhatsApp into a high-revenue storefront. Automate catalogs, support, and payments with the power of AI.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/register">
                  <Button className="h-14 px-8 text-lg bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-105 group">
                    Launch Your Store
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <p className="text-sm text-slate-400 font-medium">No credit card required. 14-day free trial.</p>
              </motion.div>

              <motion.div variants={fadeIn} className="flex items-center justify-center lg:justify-start gap-6 pt-4">
                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Trusted by 500+ D2C Brands</p>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex gap-4 opacity-40 grayscale">
                    <Smartphone className="h-5 w-5" />
                    <Cpu className="h-5 w-5" />
                    <Globe className="h-5 w-5" />
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto max-w-full overflow-hidden"
            >
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border-8 border-white bg-white">
                <img 
                  src="/assets/hero.png" 
                  alt="Wappify WhatsApp Interface" 
                  className="w-full h-auto aspect-square object-cover"
                />
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </header>

      {/* ── Features Section ──────────────── */}
      <section id="features" className="py-24 bg-slate-50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-[0.2em]">The Future of Commerce</h2>
            <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Everything you need to sell <br /> where your customers are.
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Support",
                desc: "Integrated Gemini AI handles customer queries, product recommendations, and FAQs 24/7.",
                icon: Cpu,
                bg: "bg-emerald-50 text-emerald-600"
              },
              {
                title: "Smart Catalogs",
                desc: "Sync your inventory and present your products in a beautiful, shoppable WhatsApp catalog.",
                icon: ShoppingBag,
                bg: "bg-blue-50 text-blue-600"
              },
              {
                title: "Bulk Broadcasts",
                desc: "Send high-converting marketing campaigns with segmented customer targets and 98% open rates.",
                icon: Zap,
                bg: "bg-purple-50 text-purple-600"
              },
              {
                title: "One-Tap Payments",
                desc: "Native Razorpay integration allows customers to pay directly within the WhatsApp chat flow.",
                icon: ShieldCheck,
                bg: "bg-orange-50 text-orange-600"
              },
              {
                title: "Advanced Analytics",
                desc: "Track every click, conversion, and rupee earned with our high-fidelity dashboard.",
                icon: TrendingUp,
                bg: "bg-pink-50 text-pink-600"
              },
              {
                title: "Global Scalability",
                desc: "Sell across borders with multi-currency support and localized WhatsApp Cloud API nodes.",
                icon: Globe,
                bg: "bg-cyan-50 text-cyan-600"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-8 bg-white rounded-3xl border border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300", feature.bg)}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo/Dashboard Section ────────── */}
      <section id="demo" className="py-24 overflow-hidden scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] px-8 py-20 lg:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[60%] h-full bg-emerald-500/10 blur-[150px] -z-0" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
              <div className="space-y-8">
                <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight">
                  Powerful Insights at <br /> your fingertips.
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  Managing a store shouldn't be hard. Our unified dashboard gives you a birds-eye view of your growth, performance, and customer engagement.
                </p>
                <ul className="space-y-4">
                  {[
                    "Real-time revenue tracking",
                    "Customer interaction heatmaps",
                    "Broadcast ROI analytics",
                    "Automated stock alerts"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-white font-medium">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-400/10" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-bold">
                    View Live Preview
                </Button>
              </div>
              
              <motion.div 
                initial={{ x: 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800">
                  <img 
                    src="/assets/dashboard.png" 
                    alt="Wappify Dashboard Mockup" 
                    className="w-full h-auto aspect-[4/3] object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ───────────────── */}
      <section id="pricing" className="py-24 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-center">
            <h2 className="text-4xl font-extrabold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-500 mb-16 text-lg font-medium">Scales with your business, from MVP to Enterprise.</p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
                {[
                    { name: "Starter", price: "₹2,499", desc: "For emerging D2C brands.", features: ["500 Monthly Broadcasts", "Basic AI Logic", "2 Product Catalogs", "Standard Support"] },
                    { name: "Pro", price: "₹5,999", desc: "For scaling retailers.", featured: true, features: ["Unlimited Broadcasts", "Gemini 1.5 Pro AI", "Unlimited Catalogs", "Priority Support", "Advanced Analytics"] },
                    { name: "Enterprise", price: "Custom", desc: "For large organizations.", features: ["Dedicated Account Manager", "Custom AI Training", "API Access", "SLA Guarantees", "Whitelabeling"] }
                ].map((tier, i) => (
                    <div key={i} className={cn(
                        "p-8 rounded-[2rem] border transition-all duration-300 flex flex-col",
                        tier.featured ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-blue-200 scale-105 z-10" : "bg-white text-slate-900 border-slate-100 hover:border-emerald-200"
                    )}>
                        <h4 className="text-xl font-bold mb-2">{tier.name}</h4>
                        <p className={cn("text-sm mb-6 font-medium", tier.featured ? "text-slate-400" : "text-slate-500")}>{tier.desc}</p>
                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-4xl font-extrabold">{tier.price}</span>
                            <span className="text-sm opacity-60">/month</span>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 text-sm font-medium">
                            {tier.features.map((f, j) => (
                                <li key={j} className="flex items-center gap-3">
                                    <CheckCircle2 className={cn("h-4 w-4", tier.featured ? "text-emerald-400" : "text-emerald-600")} />
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <Link href="/register" className="w-full">
                            <Button className={cn(
                                "w-full h-12 rounded-2xl font-bold",
                                tier.featured ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                            )}>
                                Get Started
                            </Button>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────── */}
      <footer className="bg-slate-50 border-t border-slate-100 pt-20 pb-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
                <div className="space-y-6">
                    <a href="#" className="flex items-center gap-2.5">
                        <img src="/logo.svg" alt="Wappify Logo" className="w-9 h-9 rounded-xl shrink-0" />
                        <span className="text-xl font-bold tracking-tight">Wappify</span>
                    </a>
                    <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                        Empowering D2C brands with AI-driven commerce. Built for the modern seller.
                    </p>
                </div>
                <div>
                    <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Product</h5>
                    <ul className="space-y-4 text-sm text-slate-500 font-bold">
                        <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
                        <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
                        <li><a href="#demo" className="hover:text-emerald-600 transition-colors">How it works</a></li>
                        <li><Link href="/register" className="hover:text-emerald-600 transition-colors">Get Started</Link></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Company</h5>
                    <ul className="space-y-4 text-sm text-slate-500 font-bold">
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Legal</a></li>
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest">Support</h5>
                    <ul className="space-y-4 text-sm text-slate-500 font-bold">
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Help Center</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">API Docs</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Status</a></li>
                        <li><a href="#" className="hover:text-emerald-600 transition-colors">Contact</a></li>
                    </ul>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-slate-200 gap-4">
                <p className="text-xs text-slate-400 font-extrabold tracking-tight">
                    &copy; 2026 Wappify Technology Solutions. All rights reserved.
                </p>
                <div className="flex gap-6 grayscale opacity-40">
                    <Smartphone className="h-5 w-5" />
                    <Cpu className="h-5 w-5" />
                    <Globe className="h-5 w-5" />
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
