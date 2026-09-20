import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { truncateAddress } from '../../lib/utils';

const routeNameMap: Record<string, string> = {
  app: 'App',
  borrower: 'Borrower',
  overview: 'Overview',
  agreements: 'Agreements',
  new: 'Create Agreement',
  spending: 'Spending',
  repayments: 'Repayments',
  reputation: 'Reputation',
  lender: 'Lender',
  portfolio: 'Portfolio',
  explore: 'Find Agreements',
  positions: 'Positions',
  claims: 'Claims',
  governance: 'Governance',
  supplier: 'Supplier',
  profile: 'Business Profile',
  disbursements: 'Disbursements',
  verify: 'Identity & Verification',
  activity: 'Activity & Audit',
  evaluator: 'Evaluator Console',
  settings: 'Settings',
  loans: 'Agreements',
};

export const Breadcrumbs: React.FC<{ className?: string }> = ({ className }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  // We only show breadcrumbs for authenticated application routes starting with 'app'
  if (segments[0] !== 'app' || segments.length <= 1) {
    return null;
  }

  // Build breadcrumbs path items
  const breadcrumbItems = segments.slice(1).map((segment, index) => {
    // Reconstruct URL path up to this segment
    const path = `/${segments.slice(0, index + 2).join('/')}`;
    const isLast = index === segments.length - 2;

    // Determine label
    let label = routeNameMap[segment.toLowerCase()] || segment;
    if (segment.startsWith('0x') && segment.length >= 10) {
      label = `Agreement #${truncateAddress(segment, 4)}`;
    } else if (/^\d+$/.test(segment)) {
      label = `#${segment}`;
    }

    return { label, path, isLast };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs font-medium text-dark-text-muted select-none ${className || ''}`}
    >
      {breadcrumbItems.map((item, idx) => (
        <React.Fragment key={item.path}>
          {idx > 0 && (
            <ChevronRight className="w-3 h-3 text-dark-text-muted/60 shrink-0" />
          )}

          {item.isLast ? (
            <span className="font-semibold text-dark-text-primary truncate max-w-[180px] sm:max-w-xs">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="text-dark-text-secondary hover:text-dark-text-primary transition-colors truncate max-w-[120px] sm:max-w-none"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
