import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root path to web src
const WEB_SRC_DIR = path.resolve(__dirname, '../../web/src');

function getAllSourceFiles(dir: string): string[] {
  let results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllSourceFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      results.push(fullPath);
    }
  }

  return results;
}

test('WP7 Invariant: Product pages must not import from components/console or pages/console', () => {
  assert.ok(fs.existsSync(WEB_SRC_DIR), `Web source directory exists at ${WEB_SRC_DIR}`);

  const allFiles = getAllSourceFiles(WEB_SRC_DIR);
  const violations: Array<{ file: string; line: number; text: string }> = [];

  for (const filePath of allFiles) {
    const relative = path.relative(WEB_SRC_DIR, filePath).replace(/\\/g, '/');

    // Permitted console-internal files and the root App router
    const isConsoleInternal =
      relative.startsWith('pages/console/') ||
      relative.startsWith('components/console/') ||
      relative === 'App.tsx';

    if (isConsoleInternal) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      const trimmed = lineText.trim();
      // Match import statement targeting console
      if (
        trimmed.startsWith('import ') &&
        (trimmed.includes('/console') || trimmed.includes("components/console") || trimmed.includes("pages/console"))
      ) {
        violations.push({
          file: relative,
          line: idx + 1,
          text: trimmed,
        });
      }
    });
  }

  if (violations.length > 0) {
    const errorDetails = violations
      .map((v) => `  - ${v.file}:${v.line} -> "${v.text}"`)
      .join('\n');
    assert.fail(
      `Console boundary test failed: Product files must not import from components/console or pages/console:\n${errorDetails}`
    );
  }

  assert.equal(violations.length, 0, 'No product page imports from console packages');
});

test('WP7 Invariant: Product pages must not contain chain-internals widgets', () => {
  const allFiles = getAllSourceFiles(WEB_SRC_DIR);
  const prohibitedWidgets = [
    'SystemTopologyCanvas',
    'TopologyNodeInspector',
    'ActionTraceEngine',
    'IsometricBlockStream',
    'CryptoBlock3D',
    'ReplayController',
  ];

  const violations: Array<{ file: string; widget: string; line: number }> = [];

  for (const filePath of allFiles) {
    const relative = path.relative(WEB_SRC_DIR, filePath).replace(/\\/g, '/');

    // Only test product pages (exclude console, landing page, App router, and UI library definitions)
    const isProductArea =
      relative.startsWith('pages/borrower/') ||
      relative.startsWith('pages/lender/') ||
      relative.startsWith('pages/supplier/') ||
      relative.startsWith('pages/verification/') ||
      relative === 'pages/LoanDetailPage.tsx' ||
      relative === 'pages/CreateLoanPage.tsx';

    if (!isProductArea) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((lineText, idx) => {
      for (const widget of prohibitedWidgets) {
        if (lineText.includes(widget)) {
          violations.push({
            file: relative,
            widget,
            line: idx + 1,
          });
        }
      }
    });
  }

  if (violations.length > 0) {
    const errorDetails = violations
      .map((v) => `  - ${v.file}:${v.line} uses prohibited widget "${v.widget}"`)
      .join('\n');
    assert.fail(
      `Console boundary test failed: Chain internal widgets found in product pages:\n${errorDetails}`
    );
  }

  assert.equal(violations.length, 0, 'Zero chain internals widgets in product pages');
});
