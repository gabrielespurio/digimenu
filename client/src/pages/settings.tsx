import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Image, Link, Download, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const restaurantSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  hours: z.string().optional(),
  primaryColor: z.string().optional(),
  menuStyle: z.string().optional(),
});

type RestaurantForm = z.infer<typeof restaurantSchema>;

const colorOptions = [
  { name: "Teal", value: "#059669", class: "bg-teal-600" },
  { name: "Blue", value: "#2563eb", class: "bg-blue-600" },
  { name: "Green", value: "#16a34a", class: "bg-green-600" },
  { name: "Purple", value: "#9333ea", class: "bg-purple-600" },
  { name: "Red", value: "#dc2626", class: "bg-red-600" },
  { name: "Amber", value: "#d97706", class: "bg-amber-600" },
];

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState("#059669");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['/api/restaurant'],
  });

  const { data: qrData } = useQuery({
    queryKey: ['/api/qr-code'],
  });

  const form = useForm<RestaurantForm>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      hours: "Segunda a Sábado: 11h às 23h",
      primaryColor: "#059669",
      menuStyle: "cards",
    },
  });

  // Set form values when restaurant data is loaded
  useState(() => {
    if (restaurant) {
      form.reset({
        name: restaurant.name || "",
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        hours: restaurant.hours || "Segunda a Sábado: 11h às 23h",
        primaryColor: restaurant.primaryColor || "#059669",
        menuStyle: restaurant.menuStyle || "cards",
      });
      setSelectedColor(restaurant.primaryColor || "#059669");
      setLogoPreview(restaurant.logoUrl || null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RestaurantForm) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      if (logoFile) formData.append('logo', logoFile);

      const response = await fetch('/api/restaurant', {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar configurações');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant'] });
      toast({
        title: "Configurações salvas",
        description: "As alterações foram aplicadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const copyLink = async () => {
    if (qrData?.menuUrl) {
      await navigator.clipboard.writeText(qrData.menuUrl);
      toast({
        title: "Link copiado",
        description: "O link do menu foi copiado para a área de transferência.",
      });
    }
  };

  const downloadQR = () => {
    if (qrData?.qrCode) {
      const link = document.createElement('a');
      link.download = 'menu-qr-code.png';
      link.href = qrData.qrCode;
      link.click();
    }
  };

  const onSubmit = (data: RestaurantForm) => {
    updateMutation.mutate({ ...data, primaryColor: selectedColor });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize seu restaurante e cardápio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Restaurante</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Restaurante</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  data-testid="input-restaurant-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Descreva seu restaurante..."
                  {...form.register("description")}
                  data-testid="input-restaurant-description"
                />
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro"
                  {...form.register("address")}
                  data-testid="input-restaurant-address"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  {...form.register("phone")}
                  data-testid="input-restaurant-phone"
                />
              </div>

              <div>
                <Label>Logo do Restaurante</Label>
                <div className="space-y-4">
                  {logoPreview && (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-full h-full object-cover"
                        data-testid="logo-preview"
                      />
                    </div>
                  )}
                  
                  <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 block text-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                    <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Clique para fazer upload do logo
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      data-testid="input-logo-upload"
                    />
                  </label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={updateMutation.isPending}
                data-testid="save-restaurant-button"
              >
                {updateMutation.isPending ? "Salvando..." : "Salvar Informações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Visual Customization */}
        <Card>
          <CardHeader>
            <CardTitle>Personalização Visual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block">Cor Principal</Label>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${color.class} ${
                      selectedColor === color.value 
                        ? 'border-foreground ring-2 ring-offset-2 ring-foreground' 
                        : 'border-transparent hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedColor(color.value)}
                    data-testid={`color-${color.name.toLowerCase()}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Estilo do Menu</Label>
              <RadioGroup
                value={form.watch("menuStyle")}
                onValueChange={(value) => form.setValue("menuStyle", value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <RadioGroupItem value="cards" id="cards" />
                  <Label htmlFor="cards" className="flex-1 cursor-pointer">
                    <div className="font-medium">Cards com Imagem</div>
                    <div className="text-sm text-muted-foreground">
                      Layout em cards com fotos dos produtos
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <RadioGroupItem value="list" id="list" />
                  <Label htmlFor="list" className="flex-1 cursor-pointer">
                    <div className="font-medium">Lista Simples</div>
                    <div className="text-sm text-muted-foreground">
                      Layout em lista, mais compacto
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-3 block">Horário de Funcionamento</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="show-hours" defaultChecked />
                  <Label htmlFor="show-hours" className="text-sm">
                    Exibir horário de funcionamento no menu
                  </Label>
                </div>
                <Input
                  {...form.register("hours")}
                  className="text-sm"
                  data-testid="input-restaurant-hours"
                />
              </div>
            </div>

            <Button 
              onClick={form.handleSubmit(onSubmit)}
              className="w-full"
              disabled={updateMutation.isPending}
              data-testid="save-customization-button"
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Personalização"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>QR Code do Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground mb-4">
                Use este QR Code para que seus clientes acessem o cardápio digital diretamente pelo celular.
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Link className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Link do menu:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs" data-testid="menu-url">
                    {qrData?.menuUrl || "Carregando..."}
                  </code>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyLink}
                  disabled={!qrData?.menuUrl}
                  data-testid="copy-link-button"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </Button>
              </div>
            </div>
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center border rounded-lg bg-muted/50">
                {qrData?.qrCode ? (
                  <img 
                    src={qrData.qrCode} 
                    alt="QR Code do Menu" 
                    className="w-full h-full object-contain"
                    data-testid="qr-code-display"
                  />
                ) : (
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                )}
              </div>
              <Button
                variant="secondary"
                onClick={downloadQR}
                disabled={!qrData?.qrCode}
                data-testid="download-qr-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
