interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/90 px-6 py-12 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
