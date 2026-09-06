import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Menu, X, ArrowRight, Layers } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'Features', href: '#features' },
    { label: 'Workflow', href: '#how-it-works' },
    { label: 'Governance', href: '#governance' },
    { label: 'Intelligence', href: '#intelligence' },
    { label: 'FAQ', href: '#faq' },
  ];

  const getPortalPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'CUSTOMER':
        return '/customer/dashboard';
      case 'SALES_REP':
      case 'SALES_MANAGER':
        return '/sales/dashboard';
      case 'OPERATIONS':
      case 'FINANCE':
        return '/operations/dashboard';
      case 'ADMIN':
      case 'MANAGER_ADMIN':
        return '/management/dashboard';
      default:
        return '/sales/dashboard';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-background/85 backdrop-blur-md border-b border-border/60 py-3.5 shadow-2xs'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 text-foreground font-semibold tracking-tight text-base group">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background font-bold text-xs tracking-tighter shadow-xs">
            <Layers className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">DealFlow360</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] text-muted-foreground font-medium">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate(getPortalPath())}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors shadow-2xs cursor-pointer"
            >
              Open Workspace <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-1.5 text-xs font-medium text-background hover:bg-foreground/90 transition-colors shadow-2xs"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-muted-foreground hover:text-foreground focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/60 bg-card/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col gap-2.5 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground py-1"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="border-t border-border/50 pt-4 flex flex-col gap-2">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(getPortalPath());
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-medium text-background"
              >
                Open Workspace <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-medium text-foreground border border-border/60 rounded-lg hover:bg-muted/40"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-xs font-medium text-background bg-foreground rounded-lg"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
