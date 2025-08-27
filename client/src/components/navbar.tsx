import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { QrCode, Menu, LogOut, User, Settings, Package, CreditCard, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/subscription", label: "Planos", icon: CreditCard },
];

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className={`flex ${mobile ? 'flex-col space-y-2' : 'space-x-1'}`}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              size={mobile ? "default" : "sm"}
              className={mobile ? "w-full justify-start" : ""}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">MenuQR</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <NavContent />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="user-menu">
                <User className="w-4 h-4 mr-2" />
                {user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Plano: {user?.plan === 'premium' ? 'Premium' : 'Gratuito'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} data-testid="logout-button">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="mobile-menu">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <QrCode className="w-6 h-6 text-primary" />
                  <span className="font-bold text-lg">MenuQR</span>
                </div>
                
                <NavContent mobile />
                
                <div className="border-t pt-4 mt-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    {user?.email}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Plano: {user?.plan === 'premium' ? 'Premium' : 'Gratuito'}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={logout} 
                    className="w-full justify-start"
                    data-testid="mobile-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
