import { AutoTrigger, MatchMode, AutoAction } from "@prisma/client";

export interface TemplateRule {
  name: string;
  trigger: AutoTrigger;
  matchMode: MatchMode;
  keywords: string[];
  action: AutoAction;
  responseText?: string | null;
  priority: number;
}

export interface TemplateTag {
  name: string;
  color: string;
}

export interface UseCaseTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  exampleUseCases: string[];
  defaultRules: TemplateRule[];
  defaultTags: TemplateTag[];
  defaultAiContext: string;
}

export const ONBOARDING_TEMPLATES: UseCaseTemplate[] = [
  {
    id: "sell_products",
    name: "Sell Products (E-commerce)",
    description: "Ideal for retail brands. Automate product discovery and answer common questions about orders and pricing.",
    icon: "ShoppingBag",
    exampleUseCases: ["Share catalog", "Check order status", "Handle sizing queries"],
    defaultTags: [
      { name: "High Intent", color: "#10b981" }, // green
      { name: "Order Query", color: "#3b82f6" }, // blue
      { name: "VIP Customer", color: "#8b5cf6" }, // purple
    ],
    defaultRules: [
      {
        name: "Welcome Greeting",
        trigger: "FIRST_MESSAGE",
        matchMode: "EXACT",
        keywords: [],
        action: "SEND_GREETING",
        priority: 10,
      },
      {
        name: "Product Inquiry",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["price", "cost", "catalog", "products", "buy", "show me"],
        action: "SEND_CATALOG",
        priority: 20,
      },
      {
        name: "Order Tracking",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["track", "order", "status", "delivery", "when"],
        action: "SEND_TEXT",
        responseText: "To track your order, please reply with your Order ID or email address.",
        priority: 30,
      },
      {
        name: "AI Fallback",
        trigger: "ALL_MESSAGES",
        matchMode: "EXACT",
        keywords: [],
        action: "FORWARD_TO_AI",
        priority: 100,
      },
    ],
    defaultAiContext: "You are a friendly sales assistant for an e-commerce store. Focus on converting visitors into buyers by highlighting product benefits, return policies (7 days), and shipping times (typically 3-5 days).",
  },
  {
    id: "customer_inquiries",
    name: "Manage Customer Inquiries",
    description: "Perfect for service businesses. Answer FAQs automatically and route complex issues to human agents.",
    icon: "MessageCircleQuestion",
    exampleUseCases: ["Business hours", "Location", "General questions"],
    defaultTags: [
      { name: "Urgent", color: "#ef4444" }, // red
      { name: "General Question", color: "#6b7280" }, // gray
      { name: "Needs Follow-up", color: "#f59e0b" }, // amber
    ],
    defaultRules: [
      {
        name: "Welcome & Menu",
        trigger: "FIRST_MESSAGE",
        matchMode: "EXACT",
        keywords: [],
        action: "SEND_GREETING",
        priority: 10,
      },
      {
        name: "Talk to Human",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["human", "agent", "support", "help", "representative"],
        action: "ESCALATE_TO_HUMAN",
        priority: 20,
      },
      {
        name: "Location Info",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["where", "address", "location", "visit"],
        action: "SEND_TEXT",
        responseText: "We are located at [Your Address Here]. We are open Monday to Friday, 9 AM to 6 PM.",
        priority: 30,
      },
      {
        name: "AI Assistant",
        trigger: "ALL_MESSAGES",
        matchMode: "EXACT",
        keywords: [],
        action: "FORWARD_TO_AI",
        priority: 100,
      },
    ],
    defaultAiContext: "You are a helpful customer service representative. Your primary goal is to provide accurate information about the business, its location, and services. If you cannot answer a question, advise the customer to type 'human' to speak to staff.",
  },
  {
    id: "book_appointments",
    name: "Book Appointments",
    description: "Designed for clinics, salons, and consultants. Automate scheduling and send booking reminders.",
    icon: "CalendarCheck",
    exampleUseCases: ["Schedule visits", "Check availability", "Rescheduling"],
    defaultTags: [
      { name: "New Patient/Client", color: "#0ea5e9" }, // light blue
      { name: "Booked", color: "#22c55e" }, // green
      { name: "Cancelled", color: "#ef4444" }, // red
    ],
    defaultRules: [
      {
        name: "Booking Request",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["book", "appointment", "schedule", "visit", "consultation"],
        action: "SEND_TEXT",
        responseText: "Hi! To book an appointment, please visit our scheduling page at [Your Link Here] or tell us your preferred date and time.",
        priority: 20,
      },
      {
        name: "Reschedule/Cancel",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["cancel", "reschedule", "change"],
        action: "ESCALATE_TO_HUMAN",
        priority: 30,
      },
      {
        name: "AI Receptionist",
        trigger: "ALL_MESSAGES",
        matchMode: "EXACT",
        keywords: [],
        action: "FORWARD_TO_AI",
        priority: 100,
      },
    ],
    defaultAiContext: "You are a virtual receptionist. Your goal is to help clients understand available services and guide them toward booking an appointment. Be polite, professional, and clear about cancellation policies (24 hours notice required).",
  },
  {
    id: "capture_leads",
    name: "Capture Leads (B2B/Real Estate)",
    description: "Capture contact details, qualify leads, and schedule demos automatically.",
    icon: "Magnet",
    exampleUseCases: ["Collect emails", "Qualify prospects", "Book demos"],
    defaultTags: [
      { name: "Hot Lead", color: "#ef4444" }, // red
      { name: "Warm Lead", color: "#f59e0b" }, // amber
      { name: "Cold Lead", color: "#3b82f6" }, // blue
    ],
    defaultRules: [
      {
        name: "Demo Request",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["demo", "trial", "presentation", "meeting"],
        action: "SEND_TEXT",
        responseText: "Thanks for your interest! You can book a live demo directly here: [Your Calendly Link].",
        priority: 20,
      },
      {
        name: "Pricing Details",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["pricing", "cost", "quote", "estimate"],
        action: "SEND_TEXT",
        responseText: "Our pricing depends on your specific needs. Please share your email address and company name, and a sales rep will reach out shortly.",
        priority: 30,
      },
      {
        name: "AI Lead Qualifier",
        trigger: "ALL_MESSAGES",
        matchMode: "EXACT",
        keywords: [],
        action: "FORWARD_TO_AI",
        priority: 100,
      },
    ],
    defaultAiContext: "You are a sales development representative. Your goal is to qualify inbound leads by asking about their company size, current challenges, and timeline. Encourage them to book a demo once qualified.",
  },
  {
    id: "customer_support",
    name: "Customer Support (Helpdesk)",
    description: "A robust setup for handling technical support, troubleshooting, and ticket routing.",
    icon: "Headset",
    exampleUseCases: ["Troubleshooting", "Returns", "Warranty claims"],
    defaultTags: [
      { name: "Bug Report", color: "#ef4444" }, // red
      { name: "Feature Request", color: "#8b5cf6" }, // purple
      { name: "Resolved", color: "#10b981" }, // green
    ],
    defaultRules: [
      {
        name: "Issue Reporting",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["broken", "not working", "bug", "issue", "error", "fail"],
        action: "SEND_TEXT",
        responseText: "I'm sorry you're experiencing issues. Please provide a brief description of the problem and any error codes, and an agent will assist you shortly.",
        priority: 20,
      },
      {
        name: "Escalate to Tier 2",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["manager", "escalate", "human", "agent"],
        action: "ESCALATE_TO_HUMAN",
        priority: 30,
      },
      {
        name: "AI Support Bot",
        trigger: "ALL_MESSAGES",
        matchMode: "EXACT",
        keywords: [],
        action: "FORWARD_TO_AI",
        priority: 100,
      },
    ],
    defaultAiContext: "You are a tier-1 technical support agent. Try to solve basic issues by asking troubleshooting questions (e.g., Have you tried restarting? Are you on the latest version?). If the issue seems complex, advise them that a human agent will take over.",
  },
  {
    id: "marketing",
    name: "Marketing Campaigns",
    description: "Optimize for outbound broadcasts, managing opt-ins, and handling promotional replies.",
    icon: "Megaphone",
    exampleUseCases: ["Promotions", "Newsletters", "Event invites"],
    defaultTags: [
      { name: "Opted In", color: "#22c55e" }, // green
      { name: "Opted Out", color: "#9ca3af" }, // gray
      { name: "Promo Engaged", color: "#f59e0b" }, // amber
    ],
    defaultRules: [
      {
        name: "Opt-Out Handler",
        trigger: "KEYWORD",
        matchMode: "EXACT",
        keywords: ["stop", "unsubscribe", "opt out"],
        action: "SEND_TEXT",
        responseText: "You have been unsubscribed from our promotional messages. You will only receive transactional updates.",
        priority: 10,
      },
      {
        name: "Promo Reply",
        trigger: "KEYWORD",
        matchMode: "CONTAINS",
        keywords: ["offer", "discount", "coupon", "sale"],
        action: "SEND_TEXT",
        responseText: "Use code WELCOME20 for 20% off your next purchase! Valid until the end of the month.",
        priority: 20,
      },
      {
        name: "AI Brand Ambassador",
        trigger: "ALL_MESSAGES",
        matchMode: "EXACT",
        keywords: [],
        action: "FORWARD_TO_AI",
        priority: 100,
      },
    ],
    defaultAiContext: "You are an enthusiastic brand ambassador. Respond to customer inquiries about our latest marketing campaigns and promotions. Keep the tone energetic, upbeat, and persuasive.",
  },
];
