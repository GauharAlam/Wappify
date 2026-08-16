"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Menu,
  MessageSquareMore,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
  Workflow,
  X,
  Zap,
} from "lucide-react";

const modules = [
  {
    title: "Sell on WhatsApp",
    description: "Share a shoppable catalogue, collect orders, and help customers check out without leaving the chat.",
    icon: ShoppingBag,
    tone: "bg-emerald-500",
    status: "Available now",
  },
  {
    title: "Shared Team Inbox",
    description: "Give every customer a fast, personal reply with assignments, notes, and seamless human handoff.",
    icon: MessageSquareMore,
    tone: "bg-sky-500",
    status: "Available now",
  },
  {
    title: "Campaigns that convert",
    description: "Launch targeted broadcasts for launches, restocks, offers, and abandoned carts—at the right moment.",
    icon: Zap,
    tone: "bg-violet-500",
    status: "Growing next",
  },
  {
    title: "Customer intelligence",
    description: "Keep every customer’s conversations, orders, tags, and preferences in one living profile.",
    icon: UsersRound,
    tone: "bg-amber-500",
    status: "Growing next",
  },
  {
    title: "Always-on automation",
    description: "Answer FAQs, qualify intent, recover carts, and route shoppers to your team automatically.",
    icon: Bot,
    tone: "bg-fuchsia-500",
    status: "Available now",
  },
  {
    title: "Revenue analytics",
    description: "See which conversations, campaigns, and products are turning into revenue.",
    icon: BarChart3,
    tone: "bg-indigo-500",
    status: "Available now",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect your WhatsApp",
    description: "Bring the business number your customers already know into one secure workspace.",
    icon: MessageSquareMore,
  },
  {
    number: "02",
    title: "Add what you sell",
    description: "Upload products, prices, and offers so every chat can become a buying moment.",
    icon: Package,
  },
  {
    number: "03",
    title: "Turn on your growth flows",
    description: "Set up campaigns and smart automations for the customer moments that matter most.",
    icon: Workflow,
  },
];

const faqs = [
  {
    question: "Who is Wappify for?",
    answer: "Wappify is for any business that wants to use WhatsApp as a serious sales, marketing, and customer relationship channel—not just a support inbox.",
  },
  {
    question: "Do I need to use AI?",
    answer: "No. Start with campaigns, catalogue selling, and a shared inbox. AI is there when you want to automate repetitive conversations at scale.",
  },
  {
    question: "Can a human take over a conversation?",
    answer: "Yes. Your team can take over any automated conversation, with the full customer and order context ready to go.",
  },
];

function LandingButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "dark";
}) {
  const styles = {
    primary: "bg-emerald-500 text-white shadow-[0_16px_30px_-14px_rgba(16,185,129,0.8)] hover:bg-emerald-600",
    secondary: "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
    dark: "bg-slate-950 text-white shadow-[0_16px_30px_-14px_rgba(15,23,42,0.75)] hover:bg-slate-800",
  };

  return (
    <Link href={href} className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 ${styles[variant]}`}>
      {children}
    </Link>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfdfb] text-slate-950 selection:bg-emerald-100 selection:text-emerald-950 dark:bg-[#fcfdfb] dark:text-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fcfdfb]/90 backdrop-blur-xl dark:border-slate-200/70 dark:bg-[#fcfdfb]/90">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Wappify home">
            <Image src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10" priority />
            <span className="text-xl font-semibold tracking-tight text-slate-950">Wappify</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#product" className="transition-colors hover:text-slate-950">Product</a>
            <a href="#how-it-works" className="transition-colors hover:text-slate-950">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-slate-950">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-slate-950">FAQ</a>
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            <Link href="/login" className="px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-950">Log in</Link>
            <LandingButton href="/register" variant="dark">Start selling <ArrowRight className="h-4 w-4" /></LandingButton>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 md:hidden">
            <div className="flex flex-col gap-1">
              {[
                ["Product", "#product"],
                ["How it works", "#how-it-works"],
                ["Pricing", "#pricing"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {label}
                </a>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <LandingButton href="/login" variant="secondary">Log in</LandingButton>
                <LandingButton href="/register" variant="dark">Get started</LandingButton>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="relative isolate overflow-hidden pb-16 pt-16 sm:pb-24 sm:pt-24 lg:pb-32 lg:pt-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_24%,rgba(167,243,208,0.5),transparent_23%),radial-gradient(circle_at_85%_20%,rgba(219,234,254,0.58),transparent_27%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.96fr_1.04fr] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                The WhatsApp growth platform
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl lg:leading-[0.98]">
                Turn WhatsApp chats into <span className="text-emerald-500">revenue, repeat sales, and loyal customers.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                Wappify is the all-in-one WhatsApp platform for businesses that want to market, sell, and support from the channel customers already love.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LandingButton href="/register">Start growing on WhatsApp <ArrowRight className="h-4 w-4" /></LandingButton>
                <LandingButton href="#how-it-works" variant="secondary">Explore the platform <ChevronDown className="h-4 w-4" /></LandingButton>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> Sell without sending shoppers elsewhere</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-600" /> One view of every customer moment</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="relative mx-auto w-full max-w-[620px]">
              <div className="absolute -inset-7 -z-10 rounded-[2.5rem] bg-emerald-200/35 blur-3xl" />
              <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-2.5 shadow-[0_32px_80px_-28px_rgba(15,23,42,0.32)] sm:rounded-[2.25rem] sm:p-3">
                <Image src="/assets/hero.png" alt="A WhatsApp shopping conversation powered by Wappify" width={1024} height={1024} priority className="aspect-square w-full rounded-[1.35rem] object-cover sm:rounded-[1.8rem]" />
              </div>
              <div className="absolute -bottom-5 -left-3 hidden max-w-[210px] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/70 sm:block">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">One workspace</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Campaigns, conversations, orders, and automation—connected.</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-slate-200/80 bg-white py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 text-center text-sm font-medium text-slate-500 sm:justify-between sm:px-8">
            <span className="inline-flex items-center gap-2"><MessageSquareMore className="h-4 w-4 text-emerald-600" /> Market in the channel customers open first</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Personal service at every scale</span>
            <span className="inline-flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-emerald-600" /> Make every chat shoppable</span>
          </div>
        </section>

        <section id="product" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">Built for every customer moment</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Your WhatsApp business, finally in one place.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">From a product question to a repeat purchase, Wappify gives your team the tools to create a better buying journey.</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module, index) => {
                const Icon = module.icon;
                return (
                  <motion.article key={module.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.3, delay: index * 0.035 }} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60">
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${module.tone}`}><Icon className="h-5 w-5" /></div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{module.status}</span>
                    </div>
                    <h3 className="mt-8 text-lg font-semibold tracking-tight text-slate-950">{module.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-400">Simple by design</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Your customers keep chatting. You keep growing.</h2>
                <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">Wappify puts your sales, marketing, and service tools behind WhatsApp, so every reply can lead somewhere valuable.</p>
                <div className="mt-8"><LandingButton href="/register">Get started <ArrowRight className="h-4 w-4" /></LandingButton></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.number} className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
                      <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-emerald-400" /><span className="text-xs font-bold tracking-widest text-slate-500">{step.number}</span></div>
                      <h3 className="mt-12 text-lg font-semibold">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100 p-2 shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)]">
                <Image src="/assets/dashboard.png" alt="Wappify WhatsApp growth workspace dashboard" width={1024} height={1024} className="aspect-square w-full rounded-[1.35rem] object-cover" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">A clearer way to grow</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Less tool-hopping. More conversations that convert.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Give marketing, sales, and service one shared command centre—with every conversation, customer detail, and order within reach.</p>
              <ul className="mt-8 space-y-4">
                {["One shared home for marketing, sales, and support", "Live customer and order context in every chat", "Campaigns and automations built around conversion"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-3.5 w-3.5" /></span>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 border-y border-slate-200 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">Plans for every stage</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">Start selling. Scale your conversations.</h2><p className="mt-5 text-lg leading-8 text-slate-600">Choose the plan that fits your current volume, then grow without changing platforms.</p></div>
            <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-3">
              {[
                { name: "Starter", price: "₹2,499", note: "For businesses ready to start selling on WhatsApp.", features: ["Product catalogue and orders", "Shared team inbox", "Essential automations"] },
                { name: "Growth", price: "₹5,999", note: "For teams ready to turn chats into a growth engine.", features: ["Everything in Starter", "Broadcasts and AI workflows", "Campaign performance insights"], featured: true },
                { name: "Scale", price: "Let’s talk", note: "For high-volume teams with advanced needs.", features: ["Tailored platform plan", "Guided onboarding", "Priority success support"] },
              ].map((plan) => (
                <div key={plan.name} className={`flex flex-col rounded-2xl border p-7 ${plan.featured ? "border-slate-950 bg-slate-950 text-white shadow-2xl shadow-slate-300" : "border-slate-200 bg-[#fcfdfb] text-slate-950"}`}>
                  {plan.featured && <span className="mb-5 w-fit rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-950">Most popular</span>}
                  <h3 className="text-xl font-semibold">{plan.name}</h3><p className={`mt-2 text-sm leading-6 ${plan.featured ? "text-slate-300" : "text-slate-600"}`}>{plan.note}</p>
                  <p className="mt-7 text-3xl font-semibold tracking-tight">{plan.price}{plan.price.startsWith("₹") && <span className="ml-1 text-sm font-medium opacity-60">/ month</span>}</p>
                  <ul className="mt-7 flex-1 space-y-3">{plan.features.map((feature) => <li key={feature} className={`flex gap-2 text-sm ${plan.featured ? "text-slate-200" : "text-slate-700"}`}><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{feature}</li>)}</ul>
                  <Link href="/register" className={`mt-8 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${plan.featured ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300" : "bg-slate-900 text-white hover:bg-slate-800"}`}>{plan.name === "Scale" ? "Contact us" : "Get started"}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">Frequently asked questions</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">A growth platform should be easy to understand.</h2><p className="mt-6 text-lg leading-8 text-slate-600">Still deciding whether Wappify fits your business? Start here.</p></div><div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-6">{faqs.map((faq, index) => <div key={faq.question} className="py-5"><button type="button" onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex w-full items-center justify-between gap-5 text-left text-base font-semibold text-slate-900"><span>{faq.question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${openFaq === index ? "rotate-180" : ""}`} /></button>{openFaq === index && <p className="pr-8 pt-3 text-sm leading-6 text-slate-600">{faq.answer}</p>}</div>)}</div></div>
        </section>

        <section className="pb-20 sm:pb-28"><div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="relative overflow-hidden rounded-[2rem] bg-emerald-500 px-7 py-12 text-center sm:px-12 sm:py-16"><div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-white/15 blur-2xl" /><div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-slate-950/10 blur-2xl" /><div className="relative mx-auto max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-950/70">Ready when you are</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">Make WhatsApp your best growth channel.</h2><p className="mt-5 text-lg leading-8 text-emerald-50">Bring marketing, selling, and customer care together in Wappify—then turn every chat into momentum.</p><div className="mt-8"><LandingButton href="/register" variant="dark">Start selling on WhatsApp <ArrowRight className="h-4 w-4" /></LandingButton></div></div></div></div></section>
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div className="flex items-center gap-2.5"><Image src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8" /><span className="text-sm font-semibold text-slate-900">Wappify</span></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-500"><Link href="/blog" className="hover:text-slate-900">Blog</Link><a href="mailto:gauhar54995@gmail.com" className="hover:text-slate-900">Contact</a><a href="#faq" className="hover:text-slate-900">Help</a></div><p className="text-xs text-slate-400">© 2026 Wappify. All rights reserved.</p></div></footer>
    </div>
  );
}
