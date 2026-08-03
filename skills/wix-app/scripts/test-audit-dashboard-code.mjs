#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const auditPath = path.join(scriptDirectory, 'audit-dashboard-code.mjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wix-dashboard-audit-'));
const badRoot = path.join(root, 'bad');
const badAutoRoot = path.join(root, 'bad-auto');
const badAnalyticsRoot = path.join(root, 'bad-analytics');
const badRerouteRoot = path.join(root, 'bad-reroute');
const badWorkflowRoot = path.join(root, 'bad-workflow');
const badWritableRoot = path.join(root, 'bad-writable');
const badDecisionEditRoot = path.join(root, 'bad-decision-edit');
const goodDecisionRoot = path.join(root, 'good-decision');
const badActionsRoot = path.join(root, 'bad-actions');
const badSavedViewTransitionRoot = path.join(root, 'bad-saved-view-transition');
const badEarlySavedViewTransitionRoot = path.join(root, 'bad-early-saved-view-transition');
const badSavedViewFilterRoot = path.join(root, 'bad-saved-view-filter');
const badSavedViewFieldRoot = path.join(root, 'bad-saved-view-field');
const goodSavedViewTransitionRoot = path.join(root, 'good-saved-view-transition');
const badRemoveRoot = path.join(root, 'bad-remove');
const badModalRoot = path.join(root, 'bad-modal');
const viewerRoot = path.join(root, 'viewer');
const goodRoot = path.join(root, 'good');
const goodHostRoot = path.join(root, 'good-host');
const weakPermissionRoot = path.join(root, 'weak-permission');
const missingAnalyticsPermissionRoot = path.join(root, 'missing-analytics-permission');
const goodAnalyticsPermissionRoot = path.join(root, 'good-analytics-permission');
const autoRoot = path.join(root, 'auto');
const hybridRoot = path.join(root, 'hybrid');
const codegen50Root = path.join(root, 'codegen-50-regression');
const codegen55Root = path.join(root, 'codegen-55-regression');
fs.mkdirSync(badRoot);
fs.mkdirSync(badAutoRoot);
fs.mkdirSync(badAnalyticsRoot);
fs.mkdirSync(badRerouteRoot);
fs.mkdirSync(badWorkflowRoot);
fs.mkdirSync(badWritableRoot);
fs.mkdirSync(badDecisionEditRoot);
fs.mkdirSync(goodDecisionRoot);
fs.mkdirSync(badActionsRoot);
fs.mkdirSync(badSavedViewTransitionRoot);
fs.mkdirSync(badEarlySavedViewTransitionRoot);
fs.mkdirSync(badSavedViewFilterRoot);
fs.mkdirSync(badSavedViewFieldRoot);
fs.mkdirSync(goodSavedViewTransitionRoot);
fs.mkdirSync(badRemoveRoot);
fs.mkdirSync(badModalRoot);
fs.mkdirSync(viewerRoot);
fs.mkdirSync(goodRoot);
fs.mkdirSync(goodHostRoot);
fs.mkdirSync(weakPermissionRoot);
fs.mkdirSync(missingAnalyticsPermissionRoot);
fs.mkdirSync(goodAnalyticsPermissionRoot);
fs.mkdirSync(autoRoot);
fs.mkdirSync(hybridRoot);
fs.mkdirSync(codegen50Root);
fs.mkdirSync(codegen55Root);

function write(directory, fileName, content) {
  fs.writeFileSync(path.join(directory, fileName), content);
}

function writeNested(directory, relativePath, content) {
  const filePath = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

try {
  write(
    badRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'custom-table-panel',
      sourceCount: 1,
      sources: ['Order Exceptions'],
      fallbackCategory: 'multi-source',
      firstUnsupportedCapability: 'OR filters with an elapsed-time predicate',
      checkedReference: 'auto-patterns-dashboard/collection-workflows.md',
      whyDataAdaptationCannotSolve: 'The date comparison is complex',
      hostApiCheck: {
        executionHost: 'Dashboard Page',
        requiredCapability: 'List all regular site pages',
        selectedApi: '@wix/urls listPublishedSiteUrls + sitemap.xml parsing',
        hostEvidence: 'Published URL documentation only',
        requiredScopes: [],
        permissionStatus: 'assumed',
        permissionEvidence: 'Scope named in documentation but not verified on the app',
        capabilityStatus: 'assumed',
        canonicalUrlSource: '@wix/urls',
      },
    }),
  );
  write(
    badRoot,
    'SessionsTable.tsx',
    `export default function SessionsTable() {
  return <Table onRowClick={() => {}} columns={[
    { width: '55%' }, { width: '50%' }, { width: '0' }
  ]}>
    {!loading && sessions.length === 0 && (
      <EmptyState title="No sessions found"><TextButton>Clear filters</TextButton></EmptyState>
    )}
    <Table.Content />
  </Table>;
}`,
  );
  write(
    badRoot,
    'SessionDetail.tsx',
    `export default function SessionDetail() {
  return <SidePanel skin="floating">
    <SidePanel.Header title="Session"><Badge>Overbooked</Badge></SidePanel.Header>
    <SidePanel.Content>Details</SidePanel.Content>
    <SidePanel.Divider />
    <SidePanel.Content>Coach</SidePanel.Content>
    <SidePanel.Footer><button>Close</button></SidePanel.Footer>
  </SidePanel>;
}`,
  );
  write(
    badRoot,
    'CapacityPlanner.tsx',
    `import SessionDetail from './SessionDetail';
export default function CapacityPlanner() {
  return <><Page /><SessionDetail /></>;
}`,
  );
  write(
    badRoot,
    'BrokenAnalytics.tsx',
    `export default function BrokenAnalytics() {
  const options = { responsive: true, maintainAspectRatio: true };
  return <Card><Box height="260px"><Bar options={options} /></Box></Card>;
}`,
  );
  write(
    badRoot,
    'BrokenMetrics.tsx',
    `export default function BrokenMetrics() {
  return <Box>
    <Card><StatisticsWidget items={[{ value: '1', description: 'Active' }]} /></Card>
    <StatisticsWidget items={[{ value: '2', description: 'At risk' }]} />
  </Box>;
}`,
  );
  write(
    badRoot,
    'InteractiveTable.tsx',
    `export default function InteractiveTable() {
  return <Table isRowActive={() => false} columns={[{ width: '82%' }, { width: '18%' }]}>
    <TableActionCell primaryAction={{ text: 'View', visibility: 'always' }} />
  </Table>;
}`,
  );
  write(
    badRoot,
    'BrokenEmptyStateTable.tsx',
    `export default function BrokenEmptyStateTable() {
  return <Table data={rows} columns={columns}>
    {!hasSource && <Table.EmptyState title="No records" />}
    {!hasFiltered && hasSource && <Table.EmptyState title="No results" />}
  </Table>;
}`,
  );
  write(
    badRoot,
    'BrokenSelectionTable.tsx',
    `export default function BrokenSelectionTable() {
  const handleSelectionChanged = (selection) => {
    setSelectedIds((selection.selectedRows ?? []).map((row) => row._id));
  };
  return <Table showSelection selectedIds={selectedIds} onSelectionChanged={handleSelectionChanged} />;
}`,
  );
  write(
    badRoot,
    'BrokenHostApi.tsx',
    `import { site as siteSite } from '@wix/site-site';
export default function BrokenHostApi() {
  async function loadPages() {
    try {
      const structure = await siteSite.getSiteStructure();
      const publicUrl = window.location.origin.replace('www.wix.com', 'www.wixsite.com');
      return { structure, publicUrl };
    } catch (error) {
      setError('Failed to load site pages. Please try again.');
    }
  }
  return null;
}`,
  );
  write(
    goodHostRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'custom-table',
      sourceCount: 2,
      sources: [
        'Verified dashboard-compatible site page service',
        'Verified canonical published URL service',
      ],
      fallbackCategory: 'external-data',
      hostApiCheck: {
        executionHost: 'Dashboard Page via backend',
        requiredCapability: 'Load verified published page records',
        selectedApi: 'Verified dashboard-compatible service',
        hostEvidence: 'Installed service schema',
        requiredScopes: [],
        permissionStatus: 'verified',
        permissionEvidence: {
          requestStatus: 'not-required',
          installationStatus: 'not-required',
          verificationMethod: 'not-required',
          verificationResult: 'not-required',
          details: 'The selected service documents no required app scopes.',
        },
        capabilityStatus: 'verified',
        canonicalUrlSource: 'Verified service response',
      },
    }),
  );

  write(
    weakPermissionRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'custom-table',
      sourceCount: 2,
      sources: ['External source A', 'External source B'],
      fallbackCategory: 'external-data',
      hostApiCheck: {
        executionHost: 'Dashboard Page',
        requiredCapability: 'Read approved business records',
        selectedApi: '@wix/example approvedMethod',
        hostEvidence: 'Exact method documentation lists Dashboard Page support.',
        requiredScopes: ['SCOPE.EXAMPLE.READ'],
        permissionStatus: 'verified',
        permissionEvidence: {
          requestStatus: 'recorded',
          installationStatus: 'unknown',
          verificationMethod: 'runtime-request',
          verificationResult: 'blocked',
          details: 'The permission tool recorded the scope and auth.elevate() is used.',
        },
        capabilityStatus: 'verified',
        canonicalUrlSource: 'not applicable',
      },
    }),
  );
  write(weakPermissionRoot, 'Dashboard.tsx', 'export default function Dashboard() { return null; }');

  const analyticsRoute = {
    route: 'analytics',
    sourceCount: 1,
    sources: ['Wix Analytics Semantic Model API'],
    regionOwners: {
      collection: null,
      metrics: null,
      chart: null,
      detail: null,
    },
    tableUnsupportedCapability: 'Session rows require grouped semantic-model results with no CMS collection.',
    tableCheckedReference: 'AUTO_PATTERNS_DASHBOARD.md collection source requirement.',
    whyAutoPatternsTableCannotBeUsed: 'The source is a backend API response rather than a CMS collection.',
    fallbackCategory: 'external-data',
    firstUnsupportedCapability: 'The source has no CMS collection.',
    checkedReference: 'AUTO_PATTERNS_DASHBOARD.md',
    whyDataAdaptationCannotSolve: 'Adapting the response does not create a supported collection source.',
    hostApiCheck: {
      executionHost: 'backend Astro API route',
      requiredCapability: 'List traffic semantic models and query grouped session data',
      selectedApi: '@wix/analytics-semantic-model listSemanticModels + querySemanticModelData',
      hostEvidence: 'Exact SDK methods documented for backend use.',
      requiredScopes: ['SCOPE.DC-ANALYTICS-AND-REPORTS.READ-SITE-ANALYTICS'],
      permissionStatus: 'verified',
      capabilityStatus: 'verified',
      canonicalUrlSource: 'not applicable',
    },
  };

  write(
    missingAnalyticsPermissionRoot,
    '.dashboard-route.json',
    JSON.stringify({
      ...analyticsRoute,
      hostApiCheck: {
        ...analyticsRoute.hostApiCheck,
        permissionEvidence: {
          requestStatus: 'applied',
          installationStatus: 'current',
          verificationMethod: 'app-configuration-and-installation',
          verificationResult: 'succeeded',
          details: 'Scope declared via required-permissions tool and applied to app configuration.',
        },
      },
    }),
  );
  writeNested(
    missingAnalyticsPermissionRoot,
    'src/modules/visitor-analytics.ts',
    `import { analyticsSemanticModel } from '@wix/analytics-semantic-model';
const TRAFFIC_MODEL_ID = 'cad7fd34-2c8b-4dda-8296-3f9d47fb484d';
export async function getVisitorAnalytics() {
  return analyticsSemanticModel.querySemanticModelData(TRAFFIC_MODEL_ID, {
    fields: ['traffic.sessions_count', 'traffic.views_count'],
  });
}`,
  );
  writeNested(
    missingAnalyticsPermissionRoot,
    'src/extensions/dashboard/pages/site-visitors.tsx',
    `import { getVisitorAnalytics } from '../../../modules/visitor-analytics';
export default function SiteVisitors() {
  async function loadData() {
    try {
      return await getVisitorAnalytics();
    } catch {
      setState('error');
    }
  }
  return state === 'error' ? <EmptyState title="Failed to load analytics"><Button>Retry</Button></EmptyState> : null;
}`,
  );

  write(
    goodAnalyticsPermissionRoot,
    '.dashboard-route.json',
    JSON.stringify({
      ...analyticsRoute,
      hostApiCheck: {
        ...analyticsRoute.hostApiCheck,
        permissionEvidence: {
          requestStatus: 'applied',
          installationStatus: 'current',
          verificationMethod: 'runtime-request',
          verificationResult: 'succeeded',
          details: 'Authenticated listSemanticModels request returned 200 with request ID analytics-test-42.',
        },
      },
    }),
  );
  write(
    goodAnalyticsPermissionRoot,
    'visitor-activity.ts',
    `import type { APIRoute } from 'astro';
import { analyticsSemanticModel } from '@wix/analytics-semantic-model';
import { auth } from '@wix/essentials';
const requiredScopes = ['SCOPE.DC-ANALYTICS-AND-REPORTS.READ-SITE-ANALYTICS'];
export const GET: APIRoute = async () => {
  try {
    const models = await auth.elevate(analyticsSemanticModel.listSemanticModels)();
    const modelId = models.semanticModels?.[0]?._id ?? '';
    const model = await auth.elevate(analyticsSemanticModel.getSemanticModel)(modelId);
    const fieldName = model.measures?.[0]?.name ?? '';
    const data = await auth.elevate(analyticsSemanticModel.querySemanticModelData)(
      modelId,
      { fields: [fieldName] },
    );
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('[visitor-activity API] Error:', error);
    const status = error?.status ?? error?.response?.status;
    if (status === 401 || status === 403) {
      return new Response(
        JSON.stringify({
          code: 'MISSING_PERMISSION',
          message: 'Analytics access must be granted to this app.',
          requiredScopes,
        }),
        { status: 403 },
      );
    }
    return new Response(
      JSON.stringify({ code: 'TRANSIENT_FAILURE', message: 'Analytics is temporarily unavailable.' }),
      { status: 503 },
    );
  }
};`,
  );

  write(
    goodHostRoot,
    'VerifiedHostApi.tsx',
    `export default function VerifiedHostApi() {
  async function loadPages() {
    try {
      return await loadPublishedPagesFromVerifiedDashboardService();
    } catch (error) {
      console.error('Failed to load published pages', error);
      setError('Failed to load site pages. Please try again.');
    }
  }
  return null;
}`,
  );

  write(
    badAutoRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'auto-patterns',
      sourceCount: 1,
      sources: ['Order Exceptions'],
      secondary: 'SidePanel detail via row action',
      detailSurface: 'side-panel',
      detailSurfaceReason: 'Preserve table context while inspecting one exception',
    }),
  );

  write(
    badAnalyticsRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'analytics',
      sourceCount: 1,
      sources: ['Subscriptions'],
      regionOwners: {
        collection: 'custom-wds-table',
        metrics: 'wds-statistics-widget',
        chart: 'custom-chart',
        detail: null,
      },
      firstUnsupportedCapability: 'Chart region is not supported by Auto Patterns',
      checkedReference: 'AUTO_PATTERNS_DASHBOARD.md',
      tableUnsupportedCapability: 'Chart.js monthly time-series chart cannot be expressed in Auto Patterns',
      tableCheckedReference: 'AUTO_PATTERNS_DASHBOARD.md',
      whyAutoPatternsTableCannotBeUsed: 'The primary workflow is analytical with KPI and chart regions',
      metricSurface: 'StatisticsWidget',
      metricCheckedExample: 'StatisticsWidget contained composition',
      metricContainmentOwner: 'component',
      metricLayoutOwner: 'Layout/Cell',
    }),
  );

  write(
    codegen50Root,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'analytics',
      sourceCount: 1,
      sources: ['Wix Stores Products'],
      regionOwners: {
        collection: 'custom-wds-table',
        metrics: null,
        chart: null,
        detail: null,
      },
      tableUnsupportedCapability: 'Product health flags are computed from a Stores API response.',
      tableCheckedReference: 'AUTO_PATTERNS_DASHBOARD.md',
      whyAutoPatternsTableCannotBeUsed: 'The source is a Stores API response rather than a CMS collection.',
    }),
  );
  write(
    codegen50Root,
    'CatalogHealth.tsx',
    `async function getCatalogVersion() {
  try {
    return await stores.getCatalogVersion();
  } catch (error) {
    return 'STORES_NOT_INSTALLED';
  }
}

const products = apiProducts.map((product) => ({
  id: product._id,
  name: product.name,
  productUrl: '',
}));

export default function CatalogHealth() {
  const [selectedIds, setSelectedIds] = useState([]);
  const handleViewProduct = useCallback((product) => {
    if (product.productUrl) window.open(product.productUrl, '_blank');
    else dashboard.showToast({ message: \`Product: \${product.name}\`, type: 'standard' });
  }, []);
  const loadSampleData = async () => {
    await items.bulkInsert('catalog-health-issues', sampleProducts);
  };

  return <Table
    data={products}
    showSelection
    selectedIds={selectedIds}
    onSelectionChanged={setSelectedIds}
    columns={[{ width: '82%' }, { width: '18%' }]}
  >
    <TableActionCell primaryAction={{ text: 'View Product', onClick: handleViewProduct }} />
    <Table.Content />
    <Table.EmptyState title="No product issues"><Button onClick={loadSampleData}>Load sample data</Button></Table.EmptyState>
  </Table>;
}`,
  );

  write(
    badRerouteRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'custom-table-panel',
      sourceCount: 1,
      sources: ['Order Exceptions'],
      fallbackCategory: 'unsupported-presentation',
      firstUnsupportedCapability: 'Bulk multi-select with a Mark as Reviewed action and contextual SidePanel detail',
      checkedReference: 'AUTO_PATTERNS_DASHBOARD.md AP-02 and collection-workflows.md',
      whyDataAdaptationCannotSolve: 'The workflow combines a bulk transition with per-row SidePanel detail',
    }),
  );
  write(
    badAnalyticsRoot,
    'SubscriptionHealth.tsx',
    `export default function SubscriptionHealth() {
  return <><StatisticsWidget items={items} /><Card><Bar data={chartData} /></Card><Table data={rows} columns={columns}><Table.Content /></Table></>;
}`,
  );
  write(
    badAutoRoot,
    'patterns.json',
    JSON.stringify({
      pages: [
        {
          type: 'collectionPage',
          collectionPage: {
            components: [{
              type: 'collection',
              onRowClick: { type: 'custom', id: 'openOrderDetail' },
            }],
          },
        },
        {
          type: 'entityPage',
          entityPage: {
            title: { text: 'Order', badges: { id: 'orderBadges' } },
            subtitle: { text: 'Order details', id: 'orderSubtitle' },
            actions: {
              primaryActions: {
                type: 'action',
                action: {
                  item: {
                    id: 'reviewOrder',
                    type: 'custom',
                    label: 'Review',
                    biName: 'review-order',
                  },
                },
              },
            },
          },
        },
      ],
    }),
  );
  write(
    badAutoRoot,
    'OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export const openOrderDetail = ({ actionParams }) => ({
  label: 'View details',
  biName: 'view-details',
  onClick: () => { void actionParams; },
});
export const orderBadges = (entity) => entity.isReviewed ? [{ text: 'Reviewed', skin: 'destructive' }] : [];
export const orderSubtitle = (entity) => ({ text: entity.orderNumber });
export const reviewOrder = ({ actionParams: { entity } }) => ({
  label: entity.isReviewed ? 'Unreview' : 'Review',
  biName: 'review-order',
  onClick: () => update(entity.id),
});
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );

  write(
    badWorkflowRoot,
    'patterns.json',
    JSON.stringify({
      pages: [
        {
          id: 'orders',
          type: 'collectionPage',
          collectionPage: {
            components: [{
              type: 'collection',
              entityPageId: 'order-detail',
              actionCell: {
                secondaryActions: {
                  items: [{
                    id: 'reviewOrder',
                    type: 'custom',
                    label: 'Mark as Reviewed',
                    biName: 'review-order',
                  }],
                },
              },
            }],
          },
        },
        {
          id: 'order-detail',
          type: 'entityPage',
          entityPage: {
            mode: 'view',
            parentPageId: 'orders',
            collectionId: 'orders',
            route: { path: '/order/:entityId', params: { id: 'entityId' } },
          },
        },
      ],
    }),
  );
  write(
    badWorkflowRoot,
    'Orders.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export default function Orders() {
  return <AutoPatternsApp />;
}`,
  );

  writeNested(
    badWritableRoot,
    'src/extensions/dashboard-pages/order-exceptions/patterns.json',
    JSON.stringify({
      pages: [
        {
          id: 'orders',
          type: 'collectionPage',
          collectionPage: {
            components: [{
              type: 'collection',
              entityPageId: 'order-detail',
            }],
          },
        },
        {
          id: 'order-detail',
          type: 'entityPage',
          entityPage: {
            mode: 'view',
            parentPageId: 'orders',
            collectionId: 'app-id/order-exceptions',
            route: { path: '/order/:entityId', params: { id: 'entityId' } },
            actions: {
              primaryActions: {
                type: 'action',
                action: {
                  item: {
                    id: 'reviewOrder',
                    type: 'custom',
                    label: 'Mark as Reviewed',
                    biName: 'review-order',
                  },
                },
              },
            },
          },
        },
      ],
    }),
  );
  writeNested(
    badWritableRoot,
    'src/extensions/dashboard-pages/order-exceptions/OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export const reviewOrder = ({ actionParams: { entity } }) => {
  if (!entity) return { label: 'Review', biName: 'review-order', disabled: true, onClick: () => {} };
  return { label: 'Review', biName: 'review-order', onClick: () => update(entity.id) };
};
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );
  writeNested(
    badWritableRoot,
    'src/extensions/backend/data-collections/OrderExceptions.ts',
    `const collectionIdSuffix = 'order-exceptions';
export default {
  idSuffix: collectionIdSuffix,
  fields: [],
  dataPermissions: {
    itemRead: 'CMS_EDITOR',
    itemInsert: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
  },
};`,
  );
  writeNested(
    badWritableRoot,
    'src/extensions/dashboard-pages/order-exceptions/dashboard-contract.json',
    JSON.stringify({
      workflow: {
        journey: {
          outcome: {
            actorRole: 'order exception editor',
            desiredOutcome: 'correct authoritative order exception fields',
          },
          understand: {
            questions: ['Which exceptions require correction?'],
            signals: ['reason', 'isReviewed'],
          },
          focus: { defaultWorkset: 'Open exceptions', controls: ['status'] },
          investigate: {
            questions: ['Which source field is incorrect?'],
            evidenceFields: ['reason', 'isReviewed'],
            contextPriority: 'low',
          },
          act: { actions: [{
            id: 'reviewOrder',
            kind: 'mutation',
            operation: 'update',
            target: 'persist review state',
            surfaces: ['row', 'detail', 'edit'],
            decisionInputFields: [],
            transitionFields: ['isReviewed'],
            authoritativeEditableFields: ['reason'],
          }] },
          verify: {
            visibleResult: 'Review state reloads',
            postconditions: ['isReviewed is persisted'],
            refresh: ['collection', 'detail'],
          },
        },
        implementation: {
          investigationSurface: 'entity-page',
          surfaceReason: 'Field correction requires a structured record surface',
          preserveCollectionContext: false,
          evidenceMode: 'editable',
          identityField: '_id',
        },
      },
    }),
  );

  const decisionWorkflow = {
    journey: {
      outcome: {
        actorRole: 'content reviewer',
        desiredOutcome: 'inspect submitted content and approve it or request changes',
      },
      understand: {
        questions: ['Which submissions need review?'],
        signals: ['risk', 'status'],
      },
      focus: { defaultWorkset: 'Pending review', controls: ['risk', 'status'] },
      investigate: {
        questions: ['Is this submission publication-ready?'],
        evidenceFields: ['content', 'risk', 'reviewerNotes'],
        contextPriority: 'medium',
      },
      act: { actions: [{
        id: 'approveSubmission',
        kind: 'mutation',
        operation: 'transition',
        target: 'set status to approved',
        surfaces: ['row', 'detail'],
        decisionInputFields: ['reviewerNotes'],
        transitionFields: ['status'],
        authoritativeEditableFields: [],
      }] },
      verify: {
        visibleResult: 'Approved item leaves pending review',
        postconditions: ['approved status is persisted'],
        refresh: ['collection', 'detail'],
      },
    },
    implementation: {
      investigationSurface: 'entity-page',
      surfaceReason: 'The submission is deep enough for a dedicated read-only detail view',
      preserveCollectionContext: false,
      evidenceMode: 'read-only',
      identityField: '_id',
    },
  };

  for (const [fixtureRoot, entityMode] of [
    [badDecisionEditRoot, 'edit'],
    [goodDecisionRoot, 'view'],
  ]) {
    writeNested(
      fixtureRoot,
      'src/extensions/dashboard-pages/content-review/dashboard-contract.json',
      JSON.stringify({ workflow: decisionWorkflow }),
    );
    writeNested(
      fixtureRoot,
      'src/extensions/dashboard-pages/content-review/patterns.json',
      JSON.stringify({
        pages: [
          {
            id: 'content-review',
            type: 'collectionPage',
            collectionPage: {
              components: [{
                type: 'collection',
                entityPageId: 'submission-detail',
                collection: {
                  collectionId: 'app-id/content-submissions',
                  entityTypeSource: 'cms',
                },
                actionCell: {
                  primaryAction: {
                    item: {
                      id: 'approveSubmission',
                      type: 'custom',
                      label: 'Approve',
                      biName: 'approve-submission-action',
                    },
                  },
                },
              }],
            },
          },
          {
            id: 'submission-detail',
            type: 'entityPage',
            entityPage: {
              mode: entityMode,
              parentPageId: 'content-review',
              collectionId: 'app-id/content-submissions',
              route: { path: '/submission/:entityId', params: { id: 'entityId' } },
              ...(entityMode === 'view' ? {
                actions: {
                  primaryActions: {
                    type: 'action',
                    action: {
                      item: {
                        id: 'approveSubmission',
                        type: 'custom',
                        label: 'Approve',
                        biName: 'approve-submission-action',
                      },
                    },
                  },
                },
              } : {}),
            },
          },
        ],
      }),
    );
    writeNested(
      fixtureRoot,
      'src/extensions/dashboard-pages/content-review/ContentReview.tsx',
      `import { AutoPatternsApp } from '@wix/auto-patterns';
export const approveSubmission = ({ actionParams: { entity, item } }) => {
  const record = entity ?? item;
  if (!record) throw new Error('Submission is required');
  return { label: 'Approve', biName: 'approve-submission-action', onClick: () => update(record._id) };
};
export default function ContentReview() { return <AutoPatternsApp />; }`,
    );
    writeNested(
      fixtureRoot,
      'src/extensions/backend/data-collections/ContentSubmissions.ts',
      `export default {
  idSuffix: 'content-submissions',
  fields: [{ key: 'status' }, { key: 'reviewerNotes' }],
  dataPermissions: {
    itemRead: 'CMS_EDITOR',
    itemInsert: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
  },
};`,
    );
  }

  write(
    badActionsRoot,
    'patterns.json',
    JSON.stringify({
      pages: [{
        id: 'orders',
        type: 'collectionPage',
        collectionPage: {
          components: [{
            type: 'collection',
            collection: {
              collectionId: 'app-id/order-exceptions',
              entityTypeSource: 'cms',
            },
            actionCell: {
              primaryAction: {
                item: {
                  id: 'view-order',
                  type: 'custom',
                  label: 'View',
                  biName: 'view-order',
                },
              },
            },
            table: {
              bulkActionToolbar: {
                primaryActions: [{
                  type: 'action',
                  action: {
                    item: {
                      id: 'markReviewedBulk',
                      type: 'custom',
                      label: 'Mark as Reviewed',
                      biName: 'bulk-mark-reviewed',
                    },
                  },
                }],
              },
            },
          }],
        },
      }],
    }),
  );
  write(
    badActionsRoot,
    'OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export const viewOrder = ({ actionParams }) => ({
  label: 'View',
  biName: 'view-order',
  onClick: () => { void actionParams; },
});
export const markReviewedBulk = ({ actionParams }) => ({
  label: 'Mark as Reviewed',
  biName: 'bulk-mark-reviewed',
  onClick: () => { void actionParams; },
});
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );

  const savedViewPatterns = JSON.stringify({
    pages: [{
      id: 'orders',
      type: 'collectionPage',
      collectionPage: {
        components: [{
          type: 'collection',
          collection: {
            collectionId: 'app-id/order-exceptions',
            entityTypeSource: 'cms',
          },
          filters: {
            items: [
              { id: 'reviewed-filter', fieldId: 'isReviewed' },
              { id: 'attention-filter', fieldId: 'needsAttention' },
            ],
          },
          views: {
            enabled: true,
            presets: {
              type: 'views',
              views: [{
                id: 'needs-attention',
                label: 'Needs Attention',
                filters: {
                  'reviewed-filter': {
                    filterType: 'boolean',
                    value: [{ id: 'unchecked', name: 'Not Reviewed' }],
                  },
                  'attention-filter': {
                    filterType: 'boolean',
                    value: [{ id: 'checked', name: 'Needs Attention' }],
                  },
                },
              }],
            },
          },
          actionCell: {
            primaryAction: {
              item: {
                id: 'markReviewed',
                type: 'custom',
                label: 'Mark as Reviewed',
                biName: 'mark-reviewed',
              },
            },
          },
        }],
      },
    }],
  });
  const alignedSavedViewPatterns = savedViewPatterns
    .replaceAll('reviewed-filter', 'isReviewed')
    .replaceAll('attention-filter', 'needsAttention');
  write(badSavedViewTransitionRoot, 'patterns.json', savedViewPatterns);
  write(
    badSavedViewTransitionRoot,
    'OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export const markReviewed = ({ actionParams, sdk }) => ({
  label: 'Mark as Reviewed',
  biName: 'mark-reviewed',
  onClick: () => sdk.getOptimisticActions(sdk.collectionId).updateOne(
    { ...actionParams.item, isReviewed: true, needsAttention: false },
    { submit: async ([item]) => items.update('orders', item) },
  ),
});
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );

  write(badEarlySavedViewTransitionRoot, 'patterns.json', savedViewPatterns);
  write(
    badEarlySavedViewTransitionRoot,
    'OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export const markReviewed = ({ actionParams, sdk }) => ({
  label: 'Mark as Reviewed',
  biName: 'mark-reviewed',
  onClick: () => sdk.getOptimisticActions(sdk.collectionId).updateOne(
    { ...actionParams.item, isReviewed: true, needsAttention: false },
    {
      submit: async ([item]) => {
        const updated = await items.update('orders', item);
        sdk.refreshCollection();
        return updated;
      },
    },
  ),
});
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );

  write(
    badSavedViewFilterRoot,
    'patterns.json',
    JSON.stringify({
      pages: [{
        id: 'orders',
        type: 'collectionPage',
        collectionPage: {
          components: [{
            type: 'collection',
            collection: {
              collectionId: 'app-id/order-exceptions',
              entityTypeSource: 'cms',
            },
            filters: {
              items: [{ id: 'channel-filter', fieldId: 'channel' }],
            },
            views: {
              enabled: true,
              presets: {
                type: 'views',
                views: [{
                  id: 'reviewed',
                  label: 'Reviewed',
                  filters: {
                    'reviewed-filter': {
                      filterType: 'boolean',
                      value: [{ id: 'checked', name: 'Reviewed' }],
                    },
                  },
                }],
              },
            },
          }],
        },
      }],
    }),
  );

  writeNested(
    badSavedViewFieldRoot,
    'src/extensions/backend/data-collections/order-exceptions.ts',
    `export const config = {
  idSuffix: 'order-exceptions',
  fields: [
    { key: 'isReviewed', displayName: 'Reviewed', type: 'BOOLEAN' },
  ],
};`,
  );
  writeNested(
    badSavedViewFieldRoot,
    'src/extensions/dashboard-pages/order-exceptions/patterns.json',
    JSON.stringify({
      pages: [{
        id: 'orders',
        type: 'collectionPage',
        collectionPage: {
          components: [{
            type: 'collection',
            collection: {
              collectionId: 'app-id/order-exceptions',
              entityTypeSource: 'cms',
            },
            filters: {
              items: [{ id: 'attention-filter', fieldId: 'needsAttention' }],
            },
            views: {
              enabled: true,
              presets: {
                type: 'views',
                views: [{
                  id: 'needs-attention',
                  label: 'Needs Attention',
                  filters: {
                    'attention-filter': {
                      filterType: 'boolean',
                      value: [{ id: 'checked', name: 'Needs Attention' }],
                    },
                  },
                }],
              },
            },
          }],
        },
      }],
    }),
  );

  write(goodSavedViewTransitionRoot, 'patterns.json', alignedSavedViewPatterns);
  write(
    goodSavedViewTransitionRoot,
    'OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export const markReviewed = ({ actionParams, sdk }) => ({
  label: 'Mark as Reviewed',
  biName: 'mark-reviewed',
  onClick: () => sdk.getOptimisticActions(sdk.collectionId).updateOne(
    { ...actionParams.item, isReviewed: true, needsAttention: false },
    {
      submit: async ([item]) => {
        const updated = await items.update('orders', item);
        setTimeout(() => sdk.refreshCollection(), 0);
        return updated;
      },
      successToast: 'Item reviewed',
      errorToast: (_error, { retry }) => ({
        message: 'Could not review item',
        action: { text: 'Retry', onClick: retry },
      }),
    },
  ),
});
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );

  writeNested(
    codegen55Root,
    'src/extensions/backend/data-collections/content-submissions.ts',
    `export default {
  idSuffix: 'content-submissions',
  fields: [
    { key: 'title', type: 'TEXT' },
    { key: 'status', type: 'TEXT' },
    { key: 'needsAttention', type: 'BOOLEAN' },
  ],
  dataPermissions: {
    itemRead: 'CMS_EDITOR',
    itemInsert: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
  },
};`,
  );
  writeNested(
    codegen55Root,
    'src/extensions/dashboard/pages/content-review/patterns.json',
    JSON.stringify({
      pages: [
        {
          id: 'content-review',
          type: 'collectionPage',
          collectionPage: {
            components: [{
              type: 'collection',
              entityPageId: 'content-detail',
              collection: {
                collectionId: 'app-id/content-submissions',
                entityTypeSource: 'cms',
              },
              filters: { items: [{ id: 'status', fieldId: 'status' }] },
              views: {
                enabled: true,
                presets: {
                  type: 'views',
                  views: [{
                    id: 'pending',
                    label: 'Pending Review',
                    isDefaultView: true,
                    filters: {
                      status: {
                        filterType: 'enum',
                        value: [{ id: 'pending', name: 'Pending' }],
                      },
                    },
                  }],
                },
              },
              actionCell: {
                primaryAction: {
                  item: {
                    id: 'approve',
                    type: 'custom',
                    label: 'Approve',
                    biName: 'approve-action',
                  },
                },
              },
            }],
          },
        },
        {
          id: 'content-detail',
          type: 'entityPage',
          entityPage: {
            mode: 'view',
            parentPageId: 'content-review',
            collectionId: 'app-id/content-submissions',
            entityTypeSource: 'cms',
            route: { path: '/submission/:entityId', params: { id: 'entityId' } },
            actions: {
              primaryActions: {
                type: 'action',
                action: {
                  item: {
                    id: 'approveEntity',
                    type: 'custom',
                    label: 'Approve',
                    biName: 'approve-entity-action',
                  },
                },
              },
            },
          },
        },
      ],
    }),
  );
  writeNested(
    codegen55Root,
    'src/extensions/dashboard/pages/content-review/dashboard-contract.json',
    JSON.stringify({
      dataFoundation: { capabilities: { read: true, insert: true, update: true, remove: true } },
      workflow: {
        journey: {
          outcome: { actorRole: 'reviewer', desiredOutcome: 'approve pending submissions' },
          understand: { questions: ['What needs review?'], signals: ['status'] },
          focus: { defaultWorkset: 'Pending Review', controls: ['status'] },
          investigate: {
            questions: ['Is this ready?'],
            evidenceFields: ['title', 'status'],
            contextPriority: 'high',
          },
          act: { actions: [{
            id: 'approveEntity',
            kind: 'mutation',
            operation: 'transition',
            target: 'content-submissions collection',
            surfaces: ['row', 'detail'],
            decisionInputFields: [],
            transitionFields: ['status', 'needsAttention'],
            authoritativeEditableFields: [],
          }] },
          verify: {
            visibleResult: 'Approved item leaves Pending Review',
            postconditions: ['status is persisted', 'title remains populated'],
            refresh: ['collection', 'views', 'detail'],
          },
        },
        implementation: {
          investigationSurface: 'entity-page',
          surfaceReason: 'Review requires full content evidence',
          preserveCollectionContext: false,
          evidenceMode: 'read-only',
          identityField: '_id',
        },
      },
    }),
  );
  writeNested(
    codegen55Root,
    'src/extensions/dashboard/pages/content-review/actions.tsx',
    `export const approve = ({ actionParams, sdk }) => ({
  label: 'Approve',
  biName: 'approve-action',
  onClick: () => sdk.getOptimisticActions(sdk.collectionId).updateOne(
    { ...actionParams.item, status: 'approved', needsAttention: false },
    {
      submit: async () => {
        await items.update('content-submissions', {
          _id: actionParams.item._id,
          status: 'approved',
          needsAttention: false,
        });
        setTimeout(() => sdk.refreshCollection(), 0);
      },
      successToast: 'Submission approved',
      errorToast: (_error, { retry }) => ({ message: 'Failed', action: { text: 'Retry', onClick: retry } }),
    },
  ),
});
export const approveEntity = ({ actionParams, sdk }) => ({
  label: 'Approve',
  biName: 'approve-entity-action',
  disabled: !actionParams.entity?._id,
  onClick: async () => {
    if (!actionParams.entity?._id) return;
    await items.update('content-submissions', {
      _id: actionParams.entity._id,
      status: 'approved',
      needsAttention: false,
    });
    setTimeout(() => sdk.refreshCollection(), 0);
  },
});`,
  );

  writeNested(
    badRemoveRoot,
    'src/extensions/dashboard-pages/order-exceptions/patterns.json',
    JSON.stringify({
      pages: [{
        id: 'orders',
        type: 'collectionPage',
        collectionPage: {
          components: [{
            type: 'collection',
            collection: {
              collectionId: 'app-id/order-exceptions',
              entityTypeSource: 'cms',
            },
          }],
        },
      }],
    }),
  );
  writeNested(
    badRemoveRoot,
    'src/extensions/dashboard-pages/order-exceptions/OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );
  writeNested(
    badRemoveRoot,
    'src/extensions/backend/data-collections/OrderExceptions.ts',
    `export default {
  idSuffix: 'order-exceptions',
  fields: [],
  dataPermissions: {
    itemRead: 'CMS_EDITOR',
    itemInsert: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
    itemRemove: 'PRIVILEGED',
  },
};`,
  );

  writeNested(
    viewerRoot,
    'src/extensions/dashboard-pages/catalog/patterns.json',
    JSON.stringify({
      pages: [{
        id: 'catalog-detail',
        type: 'entityPage',
        entityPage: {
          mode: 'view',
          parentPageId: 'catalog',
          collectionId: 'app-id/catalog',
          route: { path: '/catalog/:entityId', params: { id: 'entityId' } },
        },
      }],
    }),
  );
  writeNested(
    viewerRoot,
    'src/extensions/dashboard-pages/catalog/Catalog.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export default function Catalog() {
  return <AutoPatternsApp />;
}`,
  );
  writeNested(
    viewerRoot,
    'src/extensions/backend/data-collections/Catalog.ts',
    `export default {
  idSuffix: 'catalog',
  fields: [],
  dataPermissions: {
    itemRead: 'CMS_EDITOR',
    itemInsert: 'PRIVILEGED',
    itemUpdate: 'PRIVILEGED',
    itemRemove: 'PRIVILEGED',
  },
};`,
  );

  writeNested(
    badModalRoot,
    'src/extensions/dashboard/pages/subscription-health/.dashboard-route.json',
    JSON.stringify({
      route: 'custom-table-panel',
      sourceCount: 2,
      sources: ['Subscriptions', 'Payments'],
      fallbackCategory: 'multi-source',
      secondary: 'Dashboard Modal detail',
      detailSurface: 'modal',
      detailSurfaceReason: 'Focused subscription inspection',
    }),
  );
  writeNested(
    badModalRoot,
    'src/extensions/dashboard/pages/subscription-health/SubscriptionHealth.tsx',
    `const MODAL_ID = 'wrong-subscription-detail-id';
export default function SubscriptionHealth() {
  return <Table onRowClick={(subscription) => dashboard.openModal({
    modalId: MODAL_ID,
    params: { subscription },
  })}><Table.Content /></Table>;
}`,
  );
  writeNested(
    badModalRoot,
    'src/extensions/dashboard/modals/subscription-detail/subscription-detail.extension.ts',
    `export default extensions.dashboardModal({
  id: 'subscription-detail-id',
  title: 'Subscription detail',
  component: './extensions/dashboard/modals/subscription-detail/subscription-detail.tsx',
});`,
  );
  writeNested(
    badModalRoot,
    'src/extensions/dashboard/modals/subscription-detail/subscription-detail.tsx',
    `export default function SubscriptionDetail() {
  const [subscription, setSubscription] = useState(null);
  useEffect(() => {
    dashboard.observeState((state) => {
      if (state.subscription) setSubscription(state.subscription);
    });
  }, []);
  return <CustomModalLayout
    title="Subscription detail"
    secondaryButtonText="Close"
    secondaryButtonOnClick={() => setSubscription(null)}
    content={subscription ? <Text>{subscription.name}</Text> : <Text>Loading</Text>}
  />;
}`,
  );

  write(
    goodRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'custom-table-panel',
      sourceCount: 2,
      sources: ['Orders', 'Customers'],
      resolvedCollections: [
        {
          system: 'orders',
          mechanism: 'native-cms',
          collectionId: 'orders',
          schemaStatus: 'verified',
          read: true,
          write: true,
          freshness: 'source-managed',
        },
        {
          system: 'customers',
          mechanism: 'wix-app-collection',
          collectionId: 'customers',
          schemaStatus: 'verified',
          read: true,
          write: false,
          freshness: 'source-managed',
        },
      ],
      fallbackCategory: 'multi-source',
      secondary: 'SidePanel detail via row action',
      workflow: {
        journey: {
          outcome: {
            actorRole: 'operations manager',
            desiredOutcome: 'inspect orders and assign them without editing source order content',
          },
          understand: {
            questions: ['Which orders require assignment?'],
            signals: ['status', 'assigneeId'],
          },
          focus: { defaultWorkset: 'Orders requiring assignment', controls: ['search', 'status'] },
          investigate: {
            questions: ['Who should own this order?'],
            evidenceFields: ['status', 'customer', 'assigneeId'],
            contextPriority: 'high',
          },
          act: { actions: [{
            id: 'assign-orders',
            kind: 'mutation',
            operation: 'transition',
            target: 'bulkAssign',
            surfaces: ['row', 'detail', 'bulk'],
            decisionInputFields: [],
            transitionFields: ['assigneeId'],
            authoritativeEditableFields: [],
          }] },
          verify: {
            visibleResult: 'Assigned orders reload with their new owner',
            postconditions: ['assigneeId is persisted'],
            refresh: ['table', 'detail', 'selection'],
          },
        },
        implementation: {
          investigationSurface: 'side-panel',
          surfaceReason: 'Moderate evidence and quick assignment benefit from retaining table context',
          preserveCollectionContext: true,
          evidenceMode: 'read-only',
          identityField: 'id',
        },
      },
    }),
  );
  write(
    goodRoot,
    'Dashboard.tsx',
    `function DashboardSidePanelHost({ children }) {
  return <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', alignItems: 'stretch' }}>{children}</div>;
}
export default function Dashboard() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const openItem = (row) => setSelectedItem(row);
  const bulkAssign = async (ids) => {
    await updateAssignments(ids);
    await reloadRows();
    setSelectedIds([]);
  };
  return <>
    <Button onClick={() => bulkAssign(selectedIds)}>Assign selected</Button>
    <Table showSelection selectedIds={selectedIds} onSelectionChanged={setSelectedIds} onRowClick={openItem} isRowActive={(row) => row.id === selectedItem?.id} columns={[{ width: '82%' }, { width: '18%' }]}>
      <TableActionCell primaryAction={{ text: 'View', onClick: openItem }} />
    </Table>
    <DashboardSidePanelHost>
      <SidePanel skin="floating">
        <SidePanel.Header title="Session" />
        <SidePanel.Content><Badge>Overbooked</Badge><Divider /></SidePanel.Content>
        <SidePanel.Footer><Button priority="secondary">Close</Button></SidePanel.Footer>
      </SidePanel>
    </DashboardSidePanelHost>
  </>;
}`,
  );

  write(
    autoRoot,
    'patterns.json',
    JSON.stringify({
      pages: [{
        type: 'entityPage',
        entityPage: {
          title: { text: 'Order', badges: { id: 'safeOrderBadges' } },
          actions: {
            primaryActions: {
              type: 'action',
              action: {
                item: {
                  id: 'safeReviewOrder',
                  type: 'custom',
                  label: 'Review',
                  biName: 'safe-review-order',
                },
              },
            },
          },
        },
      }],
    }),
  );
  write(
    autoRoot,
    'OrderExceptions.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export const safeOrderBadges = (entity) => {
  if (!entity) return [];
  return entity.isReviewed ? [{ text: 'Reviewed' }] : [];
};
export const safeReviewOrder = ({ actionParams: { entity } }) => {
  if (!entity) {
    return {
      label: 'Review',
      biName: 'safe-review-order',
      disabled: true,
      onClick: () => {},
    };
  }
  return {
    label: entity.isReviewed ? 'Unreview' : 'Review',
    biName: 'safe-review-order',
    onClick: () => update(entity.id),
  };
};
export default function OrderExceptions() {
  return <AutoPatternsApp />;
}`,
  );

  write(
    hybridRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'analytics',
      sourceCount: 1,
      sources: ['Subscriptions'],
      regionOwners: {
        collection: 'auto-patterns',
        metrics: 'wds-statistics-widget',
        chart: 'custom-chart',
        detail: null,
      },
      firstUnsupportedCapability: 'Chart region is not supported by Auto Patterns',
      checkedReference: 'auto-patterns-dashboard/extensions.md',
      metricSurface: 'StatisticsWidget',
      metricCheckedExample: 'StatisticsWidget contained composition',
      metricContainmentOwner: 'component',
      metricLayoutOwner: 'Layout/Cell',
    }),
  );
  write(hybridRoot, 'patterns.json', JSON.stringify({ collection: { id: 'subscriptions' } }));
  write(
    hybridRoot,
    'SubscriptionHealth.tsx',
    `import { AutoPatternsApp } from '@wix/auto-patterns';
export default function SubscriptionHealth() {
  return <AutoPatternsApp><StatisticsWidget items={items} /><Card><Bar data={chartData} /></Card></AutoPatternsApp>;
}`,
  );

  const badReroute = spawnSync(
    process.execPath,
    [auditPath, '--route-only', badRerouteRoot],
    { encoding: 'utf8' },
  );
  const badRerouteOutput = `${badReroute.stdout}\n${badReroute.stderr}`;
  if (badReroute.status === 0 || !badRerouteOutput.includes('RT-05')) {
    console.error('Dashboard route preflight accepted a rephrased one-source custom fallback.');
    console.error(badRerouteOutput.trim());
    process.exit(1);
  }

  const goodPreflight = spawnSync(
    process.execPath,
    [auditPath, '--route-only', goodRoot],
    { encoding: 'utf8' },
  );
  if (goodPreflight.status !== 0) {
    console.error('Dashboard route preflight rejected the valid multi-source route.');
    console.error(`${goodPreflight.stdout}\n${goodPreflight.stderr}`.trim());
    process.exit(1);
  }

  const goodHost = spawnSync(
    process.execPath,
    [auditPath, goodHostRoot],
    { encoding: 'utf8' },
  );
  if (goodHost.status !== 0) {
    console.error('Dashboard audit self-test rejected a verified host service that preserves its runtime error.');
    console.error(`${goodHost.stdout}\n${goodHost.stderr}`.trim());
    process.exit(1);
  }

  const weakPermission = spawnSync(
    process.execPath,
    [auditPath, weakPermissionRoot],
    { encoding: 'utf8' },
  );
  const weakPermissionOutput = `${weakPermission.stdout}\n${weakPermission.stderr}`;
  if (weakPermission.status === 0 || !weakPermissionOutput.includes('HC-06')) {
    console.error('Dashboard audit self-test accepted weak permission evidence as a verified grant.');
    console.error(weakPermissionOutput.trim());
    process.exit(1);
  }

  const missingAnalyticsPermission = spawnSync(
    process.execPath,
    [auditPath, missingAnalyticsPermissionRoot],
    { encoding: 'utf8' },
  );
  const missingAnalyticsPermissionOutput =
    `${missingAnalyticsPermission.stdout}\n${missingAnalyticsPermission.stderr}`;
  const missedAnalyticsPermissionRules = ['HC-06', 'HC-07', 'HC-08', 'HC-09'].filter(
    (rule) => !missingAnalyticsPermissionOutput.includes(rule),
  );
  if (missingAnalyticsPermission.status === 0 || missedAnalyticsPermissionRules.length) {
    console.error('Dashboard audit self-test accepted the Visitor Activity missing-permission failure.');
    if (missedAnalyticsPermissionRules.length) {
      console.error(`Missing rules: ${missedAnalyticsPermissionRules.join(', ')}`);
    }
    console.error(missingAnalyticsPermissionOutput.trim());
    process.exit(1);
  }

  const goodAnalyticsPermission = spawnSync(
    process.execPath,
    [auditPath, goodAnalyticsPermissionRoot],
    { encoding: 'utf8' },
  );
  if (goodAnalyticsPermission.status !== 0) {
    console.error('Dashboard audit self-test rejected valid Analytics permission evidence and error mapping.');
    console.error(
      `${goodAnalyticsPermission.stdout}\n${goodAnalyticsPermission.stderr}`.trim(),
    );
    process.exit(1);
  }

  const bad = spawnSync(process.execPath, [auditPath, badRoot], { encoding: 'utf8' });
  const badOutput = `${bad.stdout}\n${bad.stderr}`;
  const expectedRules = ['RT-02', 'RT-04', 'RT-05', 'WF-01', 'CT-08', 'CT-10', 'CT-11', 'CT-12', 'TP-01', 'TP-03', 'TP-05', 'TP-08', 'TP-10', 'TP-11', 'TP-14', 'AN-11', 'AN-13', 'HC-01', 'HC-02', 'HC-03', 'HC-04', 'HC-05'];
  const missedRules = expectedRules.filter((rule) => !badOutput.includes(rule));
  if (bad.status === 0 || missedRules.length) {
    console.error('Dashboard audit self-test failed to reject the bad fixture.');
    if (missedRules.length) console.error(`Missing rules: ${missedRules.join(', ')}`);
    console.error(badOutput.trim());
    process.exit(1);
  }

  const badAuto = spawnSync(process.execPath, [auditPath, badAutoRoot], { encoding: 'utf8' });
  const badAutoOutput = `${badAuto.stdout}\n${badAuto.stderr}`;
  const missedAutoRules = ['RT-07', 'AP-07', 'AP-08', 'AP-09', 'AP-11'].filter((rule) => !badAutoOutput.includes(rule));
  if (badAuto.status === 0 || missedAutoRules.length) {
    console.error('Dashboard audit self-test failed to reject the broken Auto Patterns detail route.');
    if (missedAutoRules.length) console.error(`Missing rules: ${missedAutoRules.join(', ')}`);
    console.error(badAutoOutput.trim());
    process.exit(1);
  }

  const badWorkflow = spawnSync(
    process.execPath,
    [auditPath, badWorkflowRoot],
    { encoding: 'utf8' },
  );
  const badWorkflowOutput = `${badWorkflow.stdout}\n${badWorkflow.stderr}`;
  if (badWorkflow.status === 0 || !badWorkflowOutput.includes('AP-10')) {
    console.error('Dashboard audit self-test accepted a mutating collection linked to a view-only actionless entity page.');
    console.error(badWorkflowOutput.trim());
    process.exit(1);
  }

  const badWritableDashboard = path.join(
    badWritableRoot,
    'src/extensions/dashboard-pages/order-exceptions',
  );
  const badWritable = spawnSync(
    process.execPath,
    [auditPath, badWritableDashboard],
    { encoding: 'utf8' },
  );
  const badWritableOutput = `${badWritable.stdout}\n${badWritable.stderr}`;
  if (badWritable.status === 0 || !badWritableOutput.includes('AP-12')) {
    console.error('Dashboard audit self-test accepted declared authoritative editing with no editing surface.');
    console.error(badWritableOutput.trim());
    process.exit(1);
  }

  const badDecisionEditDashboard = path.join(
    badDecisionEditRoot,
    'src/extensions/dashboard-pages/content-review',
  );
  const badDecisionEdit = spawnSync(
    process.execPath,
    [auditPath, badDecisionEditDashboard],
    { encoding: 'utf8' },
  );
  const badDecisionEditOutput = `${badDecisionEdit.stdout}\n${badDecisionEdit.stderr}`;
  if (badDecisionEdit.status === 0 || !badDecisionEditOutput.includes('AP-19')) {
    console.error('Dashboard audit self-test accepted a read-only decision workflow that resolves only to a generic edit page.');
    console.error(badDecisionEditOutput.trim());
    process.exit(1);
  }

  const badActions = spawnSync(
    process.execPath,
    [auditPath, badActionsRoot],
    { encoding: 'utf8' },
  );
  const badActionsOutput = `${badActions.stdout}\n${badActions.stderr}`;
  const missedActionRules = ['AP-07', 'AP-16'].filter(
    (rule) => !badActionsOutput.includes(rule),
  );
  if (badActions.status === 0 || missedActionRules.length) {
    console.error('Dashboard audit self-test accepted broken row and bulk action wiring.');
    if (missedActionRules.length) console.error(`Missing rules: ${missedActionRules.join(', ')}`);
    console.error(badActionsOutput.trim());
    process.exit(1);
  }

  const badSavedViewTransition = spawnSync(
    process.execPath,
    [auditPath, badSavedViewTransitionRoot],
    { encoding: 'utf8' },
  );
  const badSavedViewTransitionOutput =
    `${badSavedViewTransition.stdout}\n${badSavedViewTransition.stderr}`;
  if (
    badSavedViewTransition.status === 0
    || !badSavedViewTransitionOutput.includes('AP-17')
  ) {
    console.error('Dashboard audit self-test accepted a Saved View transition without collection refresh.');
    console.error(badSavedViewTransitionOutput.trim());
    process.exit(1);
  }

  const badEarlySavedViewTransition = spawnSync(
    process.execPath,
    [auditPath, badEarlySavedViewTransitionRoot],
    { encoding: 'utf8' },
  );
  const badEarlySavedViewTransitionOutput =
    `${badEarlySavedViewTransition.stdout}\n${badEarlySavedViewTransition.stderr}`;
  if (
    badEarlySavedViewTransition.status === 0
    || !badEarlySavedViewTransitionOutput.includes('AP-17')
    || !badEarlySavedViewTransitionOutput.includes('synchronously inside an optimistic action')
    || !badEarlySavedViewTransitionOutput.includes('does not match that record field')
  ) {
    console.error('Dashboard audit self-test accepted the stale Codegen 52 Saved View transition shape.');
    console.error(badEarlySavedViewTransitionOutput.trim());
    process.exit(1);
  }

  const badSavedViewFilter = spawnSync(
    process.execPath,
    [auditPath, badSavedViewFilterRoot],
    { encoding: 'utf8' },
  );
  const badSavedViewFilterOutput =
    `${badSavedViewFilter.stdout}\n${badSavedViewFilter.stderr}`;
  if (badSavedViewFilter.status === 0 || !badSavedViewFilterOutput.includes('AP-18')) {
    console.error('Dashboard audit self-test accepted a Saved View with an undeclared filter.');
    console.error(badSavedViewFilterOutput.trim());
    process.exit(1);
  }

  const badSavedViewField = spawnSync(
    process.execPath,
    [auditPath, badSavedViewFieldRoot],
    { encoding: 'utf8' },
  );
  const badSavedViewFieldOutput =
    `${badSavedViewField.stdout}\n${badSavedViewField.stderr}`;
  if (badSavedViewField.status === 0 || !badSavedViewFieldOutput.includes('AP-18')) {
    console.error('Dashboard audit self-test accepted a filter for an unknown collection field.');
    console.error(badSavedViewFieldOutput.trim());
    process.exit(1);
  }

  const goodSavedViewTransition = spawnSync(
    process.execPath,
    [auditPath, goodSavedViewTransitionRoot],
    { encoding: 'utf8' },
  );
  if (goodSavedViewTransition.status !== 0) {
    console.error('Dashboard audit self-test rejected a field-aligned Saved View transition with deferred canonical refresh.');
    console.error(
      `${goodSavedViewTransition.stdout}\n${goodSavedViewTransition.stderr}`.trim(),
    );
    process.exit(1);
  }

  const codegen55Dashboard = path.join(
    codegen55Root,
    'src/extensions/dashboard/pages/content-review',
  );
  const codegen55 = spawnSync(
    process.execPath,
    [auditPath, codegen55Dashboard],
    { encoding: 'utf8' },
  );
  const codegen55Output = `${codegen55.stdout}\n${codegen55.stderr}`;
  const missedCodegen55Rules = ['AP-18', 'AP-19', 'AP-20'].filter(
    (rule) => !codegen55Output.includes(rule),
  );
  if (codegen55.status === 0 || missedCodegen55Rules.length) {
    console.error('Dashboard audit self-test accepted the destructive Codegen 55 action lifecycle.');
    if (missedCodegen55Rules.length) {
      console.error(`Missing rules: ${missedCodegen55Rules.join(', ')}`);
    }
    console.error(codegen55Output.trim());
    process.exit(1);
  }

  const badRemoveDashboard = path.join(
    badRemoveRoot,
    'src/extensions/dashboard-pages/order-exceptions',
  );
  const badRemove = spawnSync(
    process.execPath,
    [auditPath, badRemoveDashboard],
    { encoding: 'utf8' },
  );
  const badRemoveOutput = `${badRemove.stdout}\n${badRemove.stderr}`;
  if (badRemove.status === 0 || !badRemoveOutput.includes('AP-15')) {
    console.error('Dashboard audit self-test accepted an editor collection with silently restricted removal.');
    console.error(badRemoveOutput.trim());
    process.exit(1);
  }

  const badAnalytics = spawnSync(process.execPath, [auditPath, badAnalyticsRoot], { encoding: 'utf8' });
  const badAnalyticsOutput = `${badAnalytics.stdout}\n${badAnalytics.stderr}`;
  if (badAnalytics.status === 0 || !badAnalyticsOutput.includes('RT-06')) {
    console.error('Dashboard audit self-test failed to reject analytics fallback that unnecessarily replaces an Auto Patterns table.');
    console.error(badAnalyticsOutput.trim());
    process.exit(1);
  }

  const codegen50 = spawnSync(process.execPath, [auditPath, codegen50Root], { encoding: 'utf8' });
  const codegen50Output = `${codegen50.stdout}\n${codegen50.stderr}`;
  const missedCodegen50Rules = ['DF-01', 'DF-03', 'DF-04', 'WF-01', 'WF-02', 'WF-03'].filter(
    (rule) => !codegen50Output.includes(rule),
  );
  if (codegen50.status === 0 || missedCodegen50Rules.length) {
    console.error('Dashboard audit self-test accepted the Codegen 50 catalog-health regression.');
    if (missedCodegen50Rules.length) {
      console.error(`Missing rules: ${missedCodegen50Rules.join(', ')}`);
    }
    console.error(codegen50Output.trim());
    process.exit(1);
  }

  const badAnalyticsPreflight = spawnSync(
    process.execPath,
    [auditPath, '--route-only', badAnalyticsRoot],
    { encoding: 'utf8' },
  );
  const badAnalyticsPreflightOutput =
    `${badAnalyticsPreflight.stdout}\n${badAnalyticsPreflight.stderr}`;
  if (badAnalyticsPreflight.status === 0 || !badAnalyticsPreflightOutput.includes('RT-06')) {
    console.error('Dashboard route preflight accepted chart-only evidence for replacing a one-source table.');
    console.error(badAnalyticsPreflightOutput.trim());
    process.exit(1);
  }

  const badModalDashboard = path.join(
    badModalRoot,
    'src/extensions/dashboard/pages/subscription-health',
  );
  const badModal = spawnSync(
    process.execPath,
    [auditPath, badModalDashboard],
    { encoding: 'utf8' },
  );
  const badModalOutput = `${badModal.stdout}\n${badModal.stderr}`;
  const missingModalRules = ['MD-01', 'MD-02', 'MD-03'].filter(
    (rule) => !badModalOutput.includes(rule),
  );
  if (badModal.status === 0 || missingModalRules.length) {
    console.error(
      `Dashboard audit self-test accepted an invalid modal contract; missing findings: ${missingModalRules.join(', ') || 'non-zero exit'}.`,
    );
    console.error(badModalOutput.trim());
    process.exit(1);
  }

  const good = spawnSync(process.execPath, [auditPath, goodRoot], { encoding: 'utf8' });
  if (good.status !== 0) {
    console.error('Dashboard audit self-test rejected the good fixture.');
    console.error(`${good.stdout}\n${good.stderr}`.trim());
    process.exit(1);
  }

  const auto = spawnSync(process.execPath, [auditPath, autoRoot], { encoding: 'utf8' });
  if (auto.status !== 0) {
    console.error('Dashboard audit self-test rejected the Auto Patterns fixture.');
    console.error(`${auto.stdout}\n${auto.stderr}`.trim());
    process.exit(1);
  }

  const viewerDashboard = path.join(viewerRoot, 'src/extensions/dashboard-pages/catalog');
  const viewer = spawnSync(process.execPath, [auditPath, viewerDashboard], { encoding: 'utf8' });
  if (viewer.status !== 0) {
    console.error('Dashboard audit self-test rejected a CMS viewer with no update permission.');
    console.error(`${viewer.stdout}\n${viewer.stderr}`.trim());
    process.exit(1);
  }

  const goodDecisionDashboard = path.join(
    goodDecisionRoot,
    'src/extensions/dashboard-pages/content-review',
  );
  const goodDecision = spawnSync(
    process.execPath,
    [auditPath, goodDecisionDashboard],
    { encoding: 'utf8' },
  );
  if (goodDecision.status !== 0) {
    console.error('Dashboard audit self-test rejected a CMS_EDITOR-writable decision workflow with read-only evidence and detail actions.');
    console.error(`${goodDecision.stdout}\n${goodDecision.stderr}`.trim());
    process.exit(1);
  }

  const hybrid = spawnSync(process.execPath, [auditPath, hybridRoot], { encoding: 'utf8' });
  if (hybrid.status !== 0) {
    console.error('Dashboard audit self-test rejected the valid Auto Patterns collection with supplemental analytics regions.');
    console.error(`${hybrid.stdout}\n${hybrid.stderr}`.trim());
    process.exit(1);
  }

  console.log('Dashboard audit self-test passed: bad routes, incompatible host APIs, unverified permissions, generic permission failures, speculative page-list fallbacks, fabricated public URLs, swallowed load errors, chart-only table fallbacks, unsafe modal state, broken action wiring, destructive replacement mutations, incomplete row/detail lifecycles, invalid Saved View enums, mismatched decision/edit surfaces, missing declared editor/delete surfaces, native panel controls, and unnecessary custom analytics tables rejected; verified scoped and no-scope, viewer, decision, custom, Auto Patterns, and hybrid fixtures accepted.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
