import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  const { portal } = useAuth();
  const homePath = portal?.route || '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-5 bg-background">
      <div className="w-full max-w-[420px] rounded-2xl border border-border/60 bg-card p-10 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/30">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have the required permissions or role to access this workspace resource.
        </p>
        <div className="mt-6">
          <Link
            to={homePath}
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
