import type { ProductDTO } from "@/lib/types";

export interface CartLine {
  product: ProductDTO;
  quantity: number;
  lineDiscount: number;
}

export function addProductToCart(cart: CartLine[], product: ProductDTO): CartLine[] {
  const existingIndex = cart.findIndex((line) => line.product.id === product.id);

  if (existingIndex >= 0) {
    return cart.map((line, i) => (i === existingIndex ? { ...line, quantity: line.quantity + 1 } : line));
  }

  return [...cart, { product, quantity: 1, lineDiscount: 0 }];
}

export function updateCartQuantity(cart: CartLine[], productId: string, quantity: number): CartLine[] {
  if (quantity <= 0) {
    return cart.filter((line) => line.product.id !== productId);
  }
  return cart.map((line) => (line.product.id === productId ? { ...line, quantity } : line));
}

export function updateCartDiscount(cart: CartLine[], productId: string, lineDiscount: number): CartLine[] {
  return cart.map((line) => (line.product.id === productId ? { ...line, lineDiscount } : line));
}

export function removeFromCart(cart: CartLine[], productId: string): CartLine[] {
  return cart.filter((line) => line.product.id !== productId);
}

export function cartSubtotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + Number(line.product.sellingPrice) * line.quantity - line.lineDiscount, 0);
}
