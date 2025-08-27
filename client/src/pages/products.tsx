import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, Tags } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductModal from "@/components/product-modal";
import { useAuth } from "@/hooks/use-auth";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  categoryId?: string;
  isActive: boolean;
}

export default function Products() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: "Produto deletado",
        description: "O produto foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/categories", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setNewCategoryName("");
      setIsCategoryModalOpen(false);
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja deletar "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  const canAddMore = user?.plan === 'premium' || products.length < 5;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os itens do seu cardápio</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="manage-categories-button">
                <Tags className="w-4 h-4 mr-2" />
                Categorias
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerenciar Categorias</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nome da Categoria</Label>
                  <Input
                    id="category-name"
                    placeholder="Ex: Bebidas, Pratos Principais..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                    data-testid="input-category-name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                    data-testid="create-category-button"
                  >
                    {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCategoryModalOpen(false)}
                    data-testid="cancel-category-button"
                  >
                    Cancelar
                  </Button>
                </div>
                {categories.length > 0 && (
                  <div className="mt-4">
                    <Label>Categorias Existentes</Label>
                    <div className="mt-2 space-y-2">
                      {categories.map((category: any) => (
                        <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                          <span>{category.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleAdd} 
            disabled={!canAddMore}
            data-testid="add-product-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Filters */}
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
                data-testid="search-products"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-category">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product: Product) => (
          <Card key={product.id} className="overflow-hidden" data-testid={`product-card-${product.id}`}>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-80 object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                data-testid={`product-image-${product.id}`}
                onClick={() => window.open(product.imageUrl, '_blank')}
                loading="lazy"
              />
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold" data-testid={`product-name-${product.id}`}>
                  {product.name}
                </h3>
                <span className="text-lg font-bold text-primary" data-testid={`product-price-${product.id}`}>
                  R$ {product.price}
                </span>
              </div>
              {product.description && (
                <p className="text-sm text-muted-foreground mb-3" data-testid={`product-description-${product.id}`}>
                  {product.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Produto</Badge>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(product)}
                    data-testid={`edit-product-${product.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(product.id, product.name)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`delete-product-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Product Card (only show if can add more) */}
        {canAddMore && (
          <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
              <Plus className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Adicionar Produto</h3>
              {user?.plan === 'free' && (
                <p className="text-sm text-muted-foreground mb-4">
                  {5 - products.length} produto(s) restante(s) no plano gratuito
                </p>
              )}
              <Button onClick={handleAdd} size="sm" data-testid="add-product-card">
                Adicionar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
}
