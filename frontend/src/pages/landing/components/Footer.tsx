import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 py-12 text-xs text-muted-foreground bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border/40">
          {/* Brand & Tagline */}
          <div className="space-y-2">
            <Link to="/" className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-bold text-[10px]">
                <Layers className="h-3 w-3" />
              </div>
              <span>DealFlow360</span>
            </Link>
            <p className="text-muted-foreground/80 max-w-sm">
              The intelligent sales operations platform for complex B2B deal lifecycles.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 font-medium">
            <a href="#platform" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Workflow</a>
            <a href="#governance" className="hover:text-foreground transition-colors">Governance</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Log in</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Get Started</Link>
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[11px] text-muted-foreground/60">
          <p>© {new Date().getFullYear()} DealFlow360. All rights reserved.</p>
          <div className="flex gap-6">
            <span>Enterprise B2B Architecture</span>
            <span>PostgreSQL • Prisma • Node.js • React</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
