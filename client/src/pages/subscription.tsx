import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, CreditCard, Smartphone, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Stripe public key (this should be in environment variables)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_...");

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento realizado",
        description: "Sua assinatura foi ativada com sucesso!",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isLoading}
        data-testid="confirm-payment-button"
      >
        {isLoading ? "Processando..." : "Confirmar Pagamento"}
      </Button>
    </form>
  );
}

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await apiRequest("POST", "/api/create-subscription");
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast({
        title: "Erro ao iniciar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const isPremium = user?.plan === 'premium';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upgrade para o plano Premium e tenha acesso ilimitado a produtos e recursos avançados
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="mb-8">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              Plano Atual: 
              <Badge variant={isPremium ? "default" : "secondary"} data-testid="current-plan">
                {isPremium ? "Premium" : "Gratuito"}
              </Badge>
            </h3>
            {!isPremium && (
              <p className="text-sm text-muted-foreground mt-1">
                Você está usando <span data-testid="product-usage">{stats?.products || 0}</span> de 5 produtos permitidos
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold" data-testid="current-price">
              R$ {isPremium ? "24,90" : "0,00"}
            </div>
            <div className="text-sm text-muted-foreground">por mês</div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Free Plan */}
        <Card className={!isPremium ? "ring-2 ring-primary" : ""}>
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Plano Gratuito</h3>
              <div className="text-4xl font-bold mb-2">R$ 0</div>
              <div className="text-muted-foreground">por mês</div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Até 5 produtos no cardápio</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>QR Code básico</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Menu responsivo</span>
              </li>
              <li className="flex items-center space-x-3">
                <X className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Produtos ilimitados</span>
              </li>
              <li className="flex items-center space-x-3">
                <X className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Personalização avançada</span>
              </li>
              <li className="flex items-center space-x-3">
                <X className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">Suporte prioritário</span>
              </li>
            </ul>

            <Button 
              className="w-full" 
              variant={!isPremium ? "default" : "outline"}
              disabled={!isPremium}
              data-testid="free-plan-button"
            >
              {!isPremium ? "Plano Atual" : "Fazer Downgrade"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className={`relative ${isPremium ? "ring-2 ring-primary" : "border-primary"}`}>
          {!isPremium && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge>Recomendado</Badge>
            </div>
          )}

          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">Plano Premium</h3>
              <div className="text-4xl font-bold text-primary mb-2">R$ 24,90</div>
              <div className="text-muted-foreground">por mês</div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Produtos ilimitados</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>QR Code personalizado</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Menu responsivo avançado</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Personalização completa</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Estatísticas detalhadas</span>
              </li>
              <li className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500" />
                <span>Suporte prioritário</span>
              </li>
            </ul>

            <Button
              className="w-full"
              onClick={handleUpgrade}
              disabled={isPremium || isUpgrading}
              data-testid="upgrade-button"
            >
              {isPremium 
                ? "Plano Atual"
                : isUpgrading 
                  ? "Carregando..."
                  : "Upgrade para Premium"
              }
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Form */}
      {clientSecret && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Finalizar Assinatura Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Métodos de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <CreditCard className="w-6 h-6 text-primary" />
              <span>Cartão de Crédito</span>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Smartphone className="w-6 h-6 text-primary" />
              <span>PIX</span>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
              <Building className="w-6 h-6 text-primary" />
              <span>Boleto Bancário</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Posso cancelar a qualquer momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sim, você pode cancelar sua assinatura a qualquer momento. Após o cancelamento, 
                você voltará automaticamente para o plano gratuito.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">O que acontece se eu exceder o limite do plano gratuito?</h4>
              <p className="text-sm text-muted-foreground">
                No plano gratuito, você pode ter até 5 produtos. Para adicionar mais, 
                é necessário fazer upgrade para o plano Premium.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Como funciona a cobrança?</h4>
              <p className="text-sm text-muted-foreground">
                A cobrança é feita mensalmente de forma automática. Você receberá um e-mail 
                de confirmação a cada pagamento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
