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
  Cpu,
  BookOpen,
  Rocket,
  HeartHandshake,
  IndianRupee,
  Bot,
  Megaphone,
  ChevronDown,
  Star,
  Users,
  Clock
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
            <a href="#jaaniye" className="hover:text-emerald-600 transition-colors">Janiye</a>
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
                <a href="#jaaniye">
                  <Button variant="outline" className="h-14 px-8 text-lg rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                    <BookOpen className="mr-2 h-5 w-5 text-emerald-500" />
                    Janiye Kaise Kaam Karta Hai
                    <ChevronDown className="ml-2 h-4 w-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                  </Button>
                </a>
              </motion.div>
              <motion.div variants={fadeIn}>
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

      {/* ── Hinglish Explainer Section ──────── */}
      <section id="jaaniye" className="py-24 scroll-mt-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-50 rounded-full blur-[100px] opacity-50" />
          <div className="absolute bottom-[10%] left-[-5%] w-[25%] h-[25%] bg-amber-50 rounded-full blur-[100px] opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-5"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-100">
              <Star className="h-3 w-3 fill-current" />
              Product Explained in Hinglish
            </span>
            <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Wappify Kya Hai Aur <br /><span className="text-emerald-500">Yeh Kaise Kaam Karta Hai?</span>
            </h3>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Ek baar samajh lo, phir aap khud bologe — &ldquo;Yeh toh chahiye tha!&rdquo;
            </p>
          </motion.div>

          {/* What is Wappify - Big Explainer Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-10 lg:p-16 mb-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-500/10 blur-[100px] -z-0" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-blue-500/10 blur-[100px] -z-0" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-emerald-400" />
                </div>
                <h4 className="text-3xl font-extrabold text-white">Wappify Kya Hai?</h4>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <p className="text-slate-300 text-lg leading-relaxed font-medium">
                    Socho aapka ek <span className="text-emerald-400 font-bold">WhatsApp number</span> hai jahan se aap apna business chalate ho. Ab socho ki woh WhatsApp number itna smart ho jaye ki woh <span className="text-emerald-400 font-bold">khud se customers se baat kare, unhe products dikhaye, aur payment bhi le le</span> — bina aapko phone uthaye.
                  </p>
                  <p className="text-slate-300 text-lg leading-relaxed font-medium">
                    <span className="text-white font-bold">Yahi hai Wappify!</span> Ek AI-powered platform jo aapke WhatsApp ko ek <span className="text-amber-400 font-bold">full automatic dukaan</span> bana deta hai. Customer message kare, AI usse baat kare, product recommend kare, aur payment link bhej de. Aapko sirf dashboard pe order dekhna hai! 😎
                  </p>
                </div>
                <div className="space-y-6">
                  <p className="text-slate-300 text-lg leading-relaxed font-medium">
                    Chahe aap <span className="text-white font-bold">clothes becho, jewelry, electronics, food, ya koi bhi service</span> — Wappify har business ke liye kaam karta hai. Bas apna WhatsApp connect karo, products add karo, aur AI ko kaam pe lagao! 🚀
                  </p>
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mb-3">Simple formula</p>
                    <p className="text-2xl font-extrabold text-white">
                      WhatsApp + AI + Payments = <span className="text-emerald-400">Wappify</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* How It Works - Step by Step */}
          <div className="mb-16">
            <motion.h4
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-extrabold text-center mb-12"
            >
              Kaise Kaam Karta Hai? <span className="text-emerald-500">4 Simple Steps</span>
            </motion.h4>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Sign Up Karo",
                  desc: "Bas apna email aur WhatsApp number dalo. 2 minute mein account ready. Koi coding nahi, koi technical gyaan nahi chahiye.",
                  icon: Users,
                  color: "emerald"
                },
                {
                  step: "02",
                  title: "Products Add Karo",
                  desc: "Dashboard pe jaake apne products ya services add karo — naam, photo, price. Jaise Instagram pe post karte ho, utna aasan.",
                  icon: ShoppingBag,
                  color: "blue"
                },
                {
                  step: "03",
                  title: "AI Ko Train Karo",
                  desc: "Apne business ke baare mein AI ko batao — woh sab seekh lega. Phir customers ke sawalon ka jawab khud dega, 24x7.",
                  icon: Bot,
                  color: "purple"
                },
                {
                  step: "04",
                  title: "Paisa Kamao! 💰",
                  desc: "Customer WhatsApp pe message kare, AI baat kare, product dikhaye, payment link bheje — aur order aa jaye. Automatic!",
                  icon: IndianRupee,
                  color: "amber"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="bg-white rounded-3xl border border-slate-100 p-8 h-full hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1">
                    <span className={cn(
                      "text-6xl font-black opacity-10 absolute top-4 right-6",
                      item.color === "emerald" && "text-emerald-500",
                      item.color === "blue" && "text-blue-500",
                      item.color === "purple" && "text-purple-500",
                      item.color === "amber" && "text-amber-500"
                    )}>{item.step}</span>
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform",
                      item.color === "emerald" && "bg-emerald-50 text-emerald-600",
                      item.color === "blue" && "bg-blue-50 text-blue-600",
                      item.color === "purple" && "bg-purple-50 text-purple-600",
                      item.color === "amber" && "bg-amber-50 text-amber-600"
                    )}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <h5 className="text-xl font-bold mb-3">{item.title}</h5>
                    <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Why Wappify is Important */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-emerald-50 rounded-[2.5rem] p-10 lg:p-16 mb-12 border border-emerald-100"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <HeartHandshake className="h-6 w-6 text-emerald-600" />
              </div>
              <h4 className="text-3xl font-extrabold text-slate-900">Yeh Zaroori Kyun Hai?</h4>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "WhatsApp pe 500 Million+ Indians hai",
                  desc: "Aapke customers already WhatsApp pe hai. Instagram pe ad dene se acha, seedha unke WhatsApp pe pahuncho. Open rate 98% hota hai — email ka sirf 20% hota hai!"
                },
                {
                  title: "Manual replies se time waste hota hai",
                  desc: "Roz 100+ messages ka reply karna mushkil hai. AI yeh kaam 24x7 karta hai — aap so jao, AI bechta rahe. Time bachao, revenue badhao."
                },
                {
                  title: "Customer experience game-changer hai",
                  desc: "Jab customer ko turant reply mile, product photos mile, aur payment link mile — woh khareedta hai. Delay hua toh woh competitor pe chala gaya."
                },
                {
                  title: "Small business ka digital dukaan",
                  desc: "Website banana mehenga hai, app banana aur mehenga. WhatsApp pe dukaan? Bilkul free-like feel. Aur customer ko koi naya app download bhi nahi karna."
                }
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100/50">
                  <h5 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h5>
                  <p className="text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Benefits - What You Get */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h4 className="text-3xl font-extrabold text-center mb-4">
              Wappify Use Karne Se <span className="text-emerald-500">Kya Milega?</span>
            </h4>
            <p className="text-center text-slate-500 font-medium mb-12 text-lg">
              Yeh sirf ek tool nahi, yeh aapka <span className="font-bold text-slate-700">digital salesman</span> hai jo kabhi thakta nahi.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "🤖",
                  title: "24x7 AI Sales Assistant",
                  desc: "Raat ko 2 baje bhi customer aaye toh AI baat karega, product recommend karega, aur order le lega. Aap tension-free so jao.",
                  highlight: "Sleep while AI sells!"
                },
                {
                  emoji: "📢",
                  title: "Bulk WhatsApp Broadcasts",
                  desc: "Ek click mein 1000+ customers ko message bhejo — new product launch, sale, ya festival offer. 98% log padhte hai!",
                  highlight: "98% open rate!"
                },
                {
                  emoji: "💳",
                  title: "Instant Payment Collection",
                  desc: "Chat ke andar hi Razorpay payment link. Customer ko kahin aur jaane ki zaroorat nahi. UPI, cards, net banking — sab chalega.",
                  highlight: "In-chat payments!"
                },
                {
                  emoji: "📊",
                  title: "Full Analytics Dashboard",
                  desc: "Kitne orders aaye, kitna revenue hua, konsa product best sell ho raha — sab ek dashboard pe. Data-driven decisions lo.",
                  highlight: "Real-time insights!"
                },
                {
                  emoji: "🛍️",
                  title: "Product Catalog Management",
                  desc: "Products add karo, stock manage karo, prices update karo — sab dashboard se. Customer ko always latest catalog dikhe.",
                  highlight: "Easy inventory!"
                },
                {
                  emoji: "⚡",
                  title: "Zero Technical Knowledge",
                  desc: "Koi coding nahi, koi website banana nahi, koi app development nahi. Bas sign up karo aur shuru ho jao. Itna aasan hai!",
                  highlight: "No coding needed!"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-3xl border border-slate-100 p-8 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group"
                >
                  <span className="text-4xl block mb-4">{item.emoji}</span>
                  <h5 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h5>
                  <p className="text-slate-500 font-medium leading-relaxed mb-4">{item.desc}</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                    <CheckCircle2 className="h-3 w-3" />
                    {item.highlight}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Who Can Use - Industries */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-50 rounded-[2.5rem] p-10 lg:p-16 border border-slate-100"
          >
            <h4 className="text-3xl font-extrabold text-center mb-4">
              Kaun Kaun Use Kar Sakta Hai?
            </h4>
            <p className="text-center text-slate-500 font-medium mb-12 text-lg">
              Sirf e-commerce nahi — <span className="font-bold text-slate-700">har woh business</span> jahan customers WhatsApp pe baat karte hai!
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { emoji: "👗", label: "Fashion & Clothing" },
                { emoji: "💎", label: "Jewelry Business" },
                { emoji: "🍕", label: "Food & Restaurant" },
                { emoji: "🏥", label: "Clinics & Doctors" },
                { emoji: "🎓", label: "Coaching & EdTech" },
                { emoji: "💇", label: "Salons & Beauty" },
                { emoji: "🏋️", label: "Gyms & Fitness" },
                { emoji: "🏠", label: "Real Estate" },
                { emoji: "🔧", label: "Home Services" },
                { emoji: "📱", label: "Electronics" },
                { emoji: "🎉", label: "Event Management" },
                { emoji: "🌿", label: "Grocery & Organic" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-100 p-5 text-center hover:shadow-lg hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 cursor-default"
                >
                  <span className="text-3xl block mb-2">{item.emoji}</span>
                  <p className="text-sm font-bold text-slate-700">{item.label}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Link href="/register">
                <Button className="h-14 px-10 text-lg bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-200 transition-all hover:scale-105 group">
                  Abhi Free Trial Shuru Karo
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-sm text-slate-400 font-medium mt-4">14 din ka free trial. Koi credit card nahi chahiye.</p>
            </div>
          </motion.div>
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
                  Managing a store shouldn&apos;t be hard. Our unified dashboard gives you a birds-eye view of your growth, performance, and customer engagement.
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
