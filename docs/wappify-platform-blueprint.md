# Wappify modular platform blueprint

## Product decision

Wappify is a WhatsApp business operating system, not a single dashboard. The platform is structured around one tenant model:

```text
Organization → Workspace → Enabled modules → Module resources
```

An organization owns billing, security, and people. A workspace represents an operational boundary such as a brand, market, or business unit. Modules are independently enabled experiences that share customers, conversations, orders, and activity history.

The existing `Organization` is the initial workspace boundary. Introduce a first-class `Workspace` only through the migration sequence below; do not retrofit it by changing existing `orgId` semantics in place.

## Current implementation status

### Built in the first modular foundation

- Home has become a workspace launcher at `/dashboard`.
- Global navigation separates Home, product modules, and Settings.
- Contextual module navigation appears for the active product area.
- Marketing, Commerce, Customer Support, and CRM have dedicated overview routes.
- Existing functional pages remain available as stable routes: Products, Orders, Inbox, Contacts, Broadcast, Automation, Analytics, Team, Billing, and Settings.
- Future module routes have explicit staged pages rather than misleading empty dashboards.
- Mobile navigation, breadcrumbs, and a local theme control are included in the shell.
- The module registry at `modules/platform/module-config.ts` is the single source of truth for labels, routes, navigation, and migration state.

### Existing production capabilities

- WhatsApp inbox and human escalation.
- Product catalogue, cart/order, Razorpay/UPI payment workflow.
- Contacts and tags.
- Rule-based automation plus Gemini fallback assistant.
- Broadcasts, organization configuration, team membership, billing, and basic analytics.

## Information architecture

```text
Home
├── Marketing: campaigns, broadcasts, audience, templates, flows, reports
├── Commerce: products, orders, customers, inventory, payments, shipping
├── Customer Support: inbox, tickets, knowledge base, agents, reports
├── CRM: leads, contacts, companies, deals, pipeline, activities
├── AI Automation: workflows, triggers, actions, integrations, logs
├── Analytics: revenue, campaigns, funnels, retention, reports
└── Settings: workspace, team, billing, roles, developer, security
```

Navigation rules:

1. Home is a product launcher and attention centre, never a universal data table.
2. The global sidebar only exposes enabled products for the workspace.
3. The contextual navigation only exposes the current product’s resource areas.
4. Every resource follows the same pattern: overview/list → filters/saved views → record detail → activity timeline → actions.
5. Global search eventually indexes authorized resources across all enabled modules.

## Target application architecture

```text
app/
  (auth)/                         # Sign in, registration, onboarding
  (dashboard)/                    # Authenticated workspace shell
    dashboard/                    # Home launcher
    marketing/                    # Marketing routes
    commerce/                     # Commerce routes
    support/                      # Support routes
    crm/                          # CRM routes
    automation/                   # Automation routes
    analytics/                    # Analytics routes
    settings/                     # Workspace management routes
  api/v1/                         # Versioned external/internal API surface

modules/
  platform/                       # Module registry, entitlements, permissions
  marketing/                      # Campaign domain only
  commerce/                       # Catalog, order, payment domain only
  support/                        # Conversation and ticket domain only
  crm/                            # Customer graph and sales domain only
  automation/                     # Event-driven workflows and AI agents
  analytics/                      # Metrics definitions and reporting
  shared/                         # Contact timeline, data tables, activity feed

components/
  ui/                             # shadcn primitives only
  layout/                         # Shell, navigation, command surfaces
  home/                           # Home-only presentation components
  modules/                        # Reusable module overview components

lib/
  auth/ db/ api/ permissions/ queue/ observability/ validators/
store/                            # Zustand only for transient client UI state
```

Server state belongs to React Query/query hooks once client-side data refresh is needed. Zustand must not become a second database. Route-level dynamic imports should be used for visual builders, charts, and large data tables.

## Database evolution plan

### Phase 1: additive tenancy migration

Create these tables without removing current organization fields:

```text
workspaces(id, organization_id, name, slug, timezone, status, created_at)
workspace_modules(workspace_id, module_key, enabled_at, settings_json)
workspace_memberships(workspace_id, organization_member_id, role_id)
roles(id, organization_id nullable, key, name, scope)
permissions(id, key, description)
role_permissions(role_id, permission_id)
member_roles(organization_member_id, role_id, workspace_id nullable)
```

Backfill one default workspace per organization. Add nullable `workspaceId` columns to existing domain tables, backfill from the organization’s default workspace, then make them required. Retain `orgId` for tenancy indexing and authorization.

### Phase 2: shared customer graph

Evolve `Contact` into the shared identity root and add:

```text
contact_identities(contact_id, type, value, normalized_value, verified_at)
companies
company_contacts(company_id, contact_id, role)
tags, contact_tags
custom_field_definitions(workspace_id, resource, key, type, config_json)
custom_field_values(definition_id, entity_id, value_json)
activities(workspace_id, contact_id, actor_id, type, payload_json, occurred_at)
attachments(workspace_id, owner_type, owner_id, storage_key, metadata_json)
```

### Phase 3: module tables

```text
Marketing: campaigns, campaign_variants, segments, segment_rules, templates,
           flows, flow_nodes, flow_edges, broadcasts, message_batches, message_events
Commerce: product_variants, categories, product_categories, inventory_locations,
          inventory_levels, inventory_movements, coupons, checkout_links, shipments, invoices
Support: tickets, ticket_events, ticket_assignments, quick_replies,
         knowledge_base_articles, labels, sla_policies
CRM: leads, deals, pipelines, pipeline_stages, tasks, meetings, notes
Automation: workflows, workflow_versions, workflow_runs, workflow_steps,
            integrations, integration_connections, event_outbox
Analytics: analytics_events, daily_metrics, report_definitions, report_runs
```

### Data and scale rules

- Every record has `organization_id`, `workspace_id`, timestamps, and immutable audit information for sensitive mutations.
- Use composite indexes that start with tenant scope, for example `(workspace_id, created_at DESC)`.
- Use an outbox table to publish reliable WhatsApp, payment, and integration events.
- Keep PostgreSQL for transactions, Redis for queues/rate limits/cache, object storage for files, and ClickHouse or a warehouse for event analytics.
- Partition message events and analytics events by time before scale makes a one-table design expensive.

## RBAC and entitlements

Replace the current three-role model gradually with these roles:

| Role | Scope |
| --- | --- |
| Owner | Organization ownership, billing, security, destructive actions |
| Admin | Workspace/module configuration and full operational control |
| Manager | Team/resource management, approvals, reporting |
| Employee | Assigned operational records and approved create/edit permissions |
| Viewer | Read-only module access |
| Support | Scoped inbox/ticket access without billing/security authority |

Use permission keys such as `marketing.campaign.publish`, `commerce.order.refund`, `support.ticket.assign`, `crm.deal.edit`, `automation.workflow.publish`, and `workspace.member.invite`. The API enforces permissions. The frontend only reflects the server-issued capability map; it never becomes the authorization source.

Modules are entitlements. A workspace without `commerce` should not receive navigation, API access, events, or background jobs for Commerce.

## API standard

Use `/api/v1` with request context derived from the authenticated organization/workspace. Avoid unscoped `orgId` passed by the client.

```text
GET/POST  /api/v1/contacts
GET/PATCH /api/v1/contacts/:contactId
GET/POST  /api/v1/marketing/campaigns
POST      /api/v1/marketing/campaigns/:campaignId/validate
POST      /api/v1/marketing/campaigns/:campaignId/schedule
GET/POST  /api/v1/commerce/products
GET/PATCH /api/v1/commerce/orders/:orderId
GET/POST  /api/v1/support/tickets
POST      /api/v1/support/conversations/:conversationId/messages
GET/POST  /api/v1/crm/deals
PATCH     /api/v1/crm/deals/:dealId/stage
POST      /api/v1/automation/workflows/:workflowId/publish
GET       /api/v1/automation/workflow-runs
GET       /api/v1/analytics/overview
POST      /api/v1/reports
```

All list endpoints require cursor pagination, field allowlisted sorting, filters, and limits. Writes that communicate externally or move money use idempotency keys. Long work (campaign sends, export generation, report builds, workflow executions) becomes a queued job with observable status.

## AI architecture

AI is an optional capability layer, not a dependency for core operations.

### Existing AI

Gemini handles a WhatsApp commerce assistant using the organization context, active product catalogue, conversation memory, and a human escalation guard.

### Required next layer

```text
AI gateway
├── provider adapters (Gemini first; provider-neutral contract)
├── prompt/version registry
├── knowledge retrieval service (approved source documents only)
├── tools (catalog search, order status, CRM record lookup, ticket creation)
├── policy and PII redaction layer
├── evaluation suite and quality scorecards
├── usage/budget controls per workspace
└── trace, feedback, and audit records
```

AI actions must disclose automation, preserve source links where applicable, respect approval requirements, hand off to people, and avoid creating uncontrolled external side effects. Never send full customer data to a model by default. Add explicit retention, model, and data-processing controls for Enterprise workspaces.

## Delivery sequence

### Foundation — current work

- Modular navigation, Home launcher, route registry, responsive shell.
- Preserve all current live routes and data.
- Establish module-level route boundaries and staged route placeholders.

### MVP modules

1. Marketing: campaign data model, templates, audience segments, scheduling, delivery states.
2. Commerce: variants, inventory movement, payment lifecycle, checkout links, invoice records.
3. Support: ticket objects, shared-inbox assignment, quick replies, labels, SLA status.
4. CRM: leads, deals, pipeline stages, activities, tasks, contact timeline.
5. Platform: Workspace table, RBAC capability map, audit explorer, module entitlements.

### Growth

- Visual workflow builder, integration marketplace, webhooks/API explorer.
- Saved views, custom fields, report builder, scheduled exports.
- Multi-location inventory, returns, omnichannel support, lead scoring.
- SSO providers, usage metering, feature flags, product analytics.

### Enterprise

- SAML SSO, SCIM, IP allowlists, data retention, data residency, audit exports.
- Multi-brand workspaces, custom roles, approval workflows, sandbox environments.
- Warehouse connector, semantic metrics layer, row-level report sharing.

### AI

- Agent reply drafts and summaries.
- Campaign copy and performance insights.
- AI classification, routing, lead scoring, and next-best action.
- Natural-language workflow building and governed AI agents.
- Natural-language analytics and anomaly detection.

## Quality bar

- Accessible keyboard-first tables, focus management, contrast, and reduced-motion support.
- Page states for loading, empty, onboarding, error, permissions, and asynchronous processing.
- Event-level observability with correlation IDs across webhook, queue, AI, and user requests.
- Feature flags and migration rollback plans for every cross-module release.
- Contract tests for webhooks/API, integration tests for RBAC, and end-to-end tests for campaign/payment/support flows.
- Security review before exposing public API, AI tools, exports, or enterprise access controls.
