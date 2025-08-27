import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Eye, QrCode, CreditCard, Plus, Settings, ExternalLink, AlertTriangle, Download } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: qrData } = useQuery({
    queryKey: ['/api/qr-code'],
  });

  const downloadQR = () => {
    if (qrData?.qrCode) {
      const link = document.createElement('a');
      link.download = 'menu-qr-code.png';
      link.href = qrData.qrCode;
      link.click();
    }
  };

  if (statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const showPlanWarning = user?.plan === 'free' && stats?.products >= 4;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu cardápio digital</p>
      </div>

      {/* Plan Status Alert */}
      {showPlanWarning && (
        <Alert className="mb-6 border-amber-200 bg-amber-50" data-testid="plan-warning">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Plano Gratuito - Limite de Produtos</strong>
            <br />
            Você está usando <span className="font-semibold">{stats?.products}</span> de 5 produtos permitidos.{' '}
            <Link href="/subscription">
              <span className="font-medium underline cursor-pointer">Upgrade para Premium</span>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produtos Cadastrados</p>
              <p className="text-2xl font-bold" data-testid="stat-products">{stats?.products || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visualizações do Menu</p>
              <p className="text-2xl font-bold" data-testid="stat-views">{stats?.views || 0}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">QR Code Escaneado</p>
              <p className="text-2xl font-bold" data-testid="stat-scans">{stats?.scans || 0}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
              <p className="text-2xl font-bold" data-testid="stat-plan">
                {user?.plan === 'premium' ? 'Premium' : 'Gratuito'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and QR Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/products">
              <Button 
                className="w-full justify-start bg-primary/5 hover:bg-primary/10 text-primary border-primary/20" 
                variant="outline"
                data-testid="action-add-product"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Novo Produto
              </Button>
            </Link>
            
            <Link href="/settings">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                data-testid="action-configure"
              >
                <Settings className="w-5 h-5 mr-2" />
                Configurar Restaurante
              </Button>
            </Link>
            
            <Button 
              className="w-full justify-start bg-secondary/5 hover:bg-secondary/10 text-secondary border-secondary/20" 
              variant="outline"
              onClick={() => qrData?.menuUrl && window.open(qrData.menuUrl, '_blank')}
              data-testid="action-view-menu"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Ver Menu Público
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code do Menu</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center border rounded-lg bg-muted/50">
              {qrData?.qrCode ? (
                <img 
                  src={qrData.qrCode} 
                  alt="QR Code do Menu" 
                  className="w-full h-full object-contain"
                  data-testid="qr-code-image"
                />
              ) : (
                <QrCode className="w-16 h-16 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Compartilhe este QR Code com seus clientes
            </p>
            <Button 
              size="sm" 
              onClick={downloadQR}
              disabled={!qrData?.qrCode}
              data-testid="download-qr"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar QR Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
