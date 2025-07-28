import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from "sonner";

export interface CartItem {
  id: string; // UUID do produto
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number; // Adicionar stock para validação
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: any, quantity: number = 1) => {
    // Validar quantidade
    if (quantity <= 0) {
      console.error('Quantidade inválida:', quantity);
      return;
    }

    // Validar estoque
    const productStock = product.stock || 0;
    if (productStock === 0) {
      toast.error('Produto fora de estoque!');
      return;
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        // Validar se não excede o estoque
        if (newQuantity > productStock) {
          toast.error(`Quantidade máxima disponível: ${productStock} unidades`);
          return prevItems;
        }
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prevItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: quantity,
        stock: productStock
      }];
    });
    
    const message = quantity === 1 
      ? "Adicionado ao carrinho!" 
      : `${quantity} unidades adicionadas ao carrinho!`;
    toast.success(message);
  };

  const removeFromCart = (id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prevItems => {
      const item = prevItems.find(item => item.id === id);
      if (!item) return prevItems;

      // Validar se não excede o estoque
      if (quantity > item.stock) {
        toast.error(`Quantidade máxima disponível: ${item.stock} unidades`);
        return prevItems;
      }

      return prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
