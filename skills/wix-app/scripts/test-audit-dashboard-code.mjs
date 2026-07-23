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
const badActionsRoot = path.join(root, 'bad-actions');
const badRemoveRoot = path.join(root, 'bad-remove');
const viewerRoot = path.join(root, 'viewer');
const goodRoot = path.join(root, 'good');
const autoRoot = path.join(root, 'auto');
const hybridRoot = path.join(root, 'hybrid');
fs.mkdirSync(badRoot);
fs.mkdirSync(badAutoRoot);
fs.mkdirSync(badAnalyticsRoot);
fs.mkdirSync(badRerouteRoot);
fs.mkdirSync(badWorkflowRoot);
fs.mkdirSync(badWritableRoot);
fs.mkdirSync(badActionsRoot);
fs.mkdirSync(badRemoveRoot);
fs.mkdirSync(viewerRoot);
fs.mkdirSync(goodRoot);
fs.mkdirSync(autoRoot);
fs.mkdirSync(hybridRoot);

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
    }),
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

  write(
    goodRoot,
    '.dashboard-route.json',
    JSON.stringify({
      route: 'custom-table-panel',
      sourceCount: 2,
      sources: ['Orders', 'Customers'],
      fallbackCategory: 'multi-source',
      secondary: 'SidePanel detail via row action',
      detailSurface: 'side-panel',
      detailSurfaceReason: 'Moderate detail while preserving table context',
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
  return <>
    <Table showSelection selectedIds={selectedIds} onSelectionChanged={setSelectedIds} onRowClick={(row) => setSelectedItem(row)} isRowActive={(row) => row.id === selectedItem?.id} columns={[{ width: '82%' }, { width: '18%' }]}>
      <TableActionCell primaryAction={{ text: 'View', onClick: () => {} }} />
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

  const bad = spawnSync(process.execPath, [auditPath, badRoot], { encoding: 'utf8' });
  const badOutput = `${bad.stdout}\n${bad.stderr}`;
  const expectedRules = ['RT-02', 'RT-04', 'RT-05', 'CT-08', 'CT-10', 'CT-11', 'CT-12', 'TP-01', 'TP-03', 'TP-05', 'TP-08', 'TP-10', 'TP-11', 'TP-14', 'AN-11', 'AN-13'];
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
    console.error('Dashboard audit self-test accepted a CMS_EDITOR-writable collection with no editing surface.');
    console.error(badWritableOutput.trim());
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

  const hybrid = spawnSync(process.execPath, [auditPath, hybridRoot], { encoding: 'utf8' });
  if (hybrid.status !== 0) {
    console.error('Dashboard audit self-test rejected the valid Auto Patterns collection with supplemental analytics regions.');
    console.error(`${hybrid.stdout}\n${hybrid.stderr}`.trim());
    process.exit(1);
  }

  console.log('Dashboard audit self-test passed: bad routes, broken action wiring, missing editor/delete surfaces, native panel controls, and unnecessary custom analytics tables rejected; viewer, custom, Auto Patterns, and hybrid fixtures accepted.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
