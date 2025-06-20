import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import CheckoutForm from "./CheckoutForm";
const Cart = () => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    totalItems,
    totalPrice
  } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  if (showCheckout) {
    return <CheckoutForm onBack={() => setShowCheckout(false)} />;
  }
  return <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2 text-zinc-100 bg-transparent">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white border-2 border-white">
              {totalItems}
            </Badge>}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl font-bold">Carrinho de Compras</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {items.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
              <p className="text-gray-400 text-sm mt-2">Adicione produtos para continuar</p>
            </div> : <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {items.map(item => <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
                      <p className="text-violet-600 font-bold text-lg">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>)}
              </div>
              
              <div className="border-t pt-4 space-y-4 bg-white">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-violet-600">
                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <Button className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700" onClick={() => setShowCheckout(true)}>
                  Finalizar Compra
                </Button>
              </div>
            </>}
        </div>
      </SheetContent>
    </Sheet>;
};
export default Cart;