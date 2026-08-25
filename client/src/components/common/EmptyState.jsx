export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <span className="empty-state__icon"><Icon aria-hidden="true" size={31} strokeWidth={2.1} /></span>}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
