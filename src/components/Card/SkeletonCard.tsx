import './SkeletonCard.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card" role="status" aria-label="Loading content">
      <div className="skeleton skeleton-image" />
      <div className="card-content" style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
      </div>
    </div>
  );
}
