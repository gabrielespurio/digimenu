import { useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, Utensils, Plus } from "lucide-react";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  categoryId?: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  order: number;
}

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  hours?: string;
  logoUrl?: string;
  primaryColor?: string;
  menuStyle?: string;
}

interface MenuData {
  restaurant: Restaurant;
  products: Product[];
  categories: Category[];
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: menuData, isLoading, error } = useQuery({
    queryKey: ['/api/menu', slug],
    enabled: !!slug,
  });

  useEffect(() => {
    // Record menu view when component loads
    if (slug && menuData) {
      // View is automatically recorded by the API call
    }
  }, [slug, menuData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Menu não encontrado</h1>
            <p className="text-muted-foreground">
              Este estabelecimento não foi encontrado ou não está mais ativo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { restaurant, products, categories }: MenuData = menuData;

  // Filter products based on search and category
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  // Get unique categories from products
  const availableCategories = categories.filter(category => 
    products.some(product => product.categoryId === category.id && product.isActive)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-background">
      {/* Header */}
      <div className="bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center overflow-hidden">
              {restaurant.logoUrl ? (
                <img 
                  src={restaurant.logoUrl} 
                  alt={`${restaurant.name} logo`} 
                  className="w-full h-full object-cover"
                  data-testid="restaurant-logo"
                />
              ) : (
                <Utensils className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-card-foreground" data-testid="restaurant-name">
                {restaurant.name}
              </h1>
              {restaurant.description && (
                <p className="text-muted-foreground" data-testid="restaurant-description">
                  {restaurant.description}
                </p>
              )}
              {restaurant.hours && (
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" data-testid="restaurant-hours">
                    {restaurant.hours}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48" data-testid="category-filter">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        {availableCategories.length > 0 && (
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="whitespace-nowrap"
              data-testid="category-all"
            >
              Todos
            </Button>
            {availableCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
                data-testid={`category-${category.id}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {/* Menu Items Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow"
                data-testid={`menu-item-${product.id}`}
              >
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-56 object-cover"
                    data-testid={`product-image-${product.id}`}
                  />
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg" data-testid={`product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
                      R$ {product.price}
                    </span>
                  </div>
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`product-description-${product.id}`}>
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {product.categoryId && (
                      <Badge variant="secondary" data-testid={`product-category-${product.id}`}>
                        {categories.find(c => c.id === product.categoryId)?.name || "Produto"}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="ml-auto"
                      data-testid={`add-to-cart-${product.id}`}
                      onClick={() => {
                        // This could be extended with cart functionality in the future
                        // For now, we'll just show a toast or similar feedback
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              Nenhum produto encontrado
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar sua busca ou filtros
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-medium text-primary">MenuQR</span> •{" "}
            <a 
              href="/" 
              className="text-primary hover:underline"
              data-testid="create-menu-link"
            >
              Crie seu cardápio digital
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
