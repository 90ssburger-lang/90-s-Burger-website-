import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef } from 'react';
import { Product, CartItem, AppliedCoupon, ProductAddon } from '@/types';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, addons?: ProductAddon[]) => void;
  removeItem: (productId: string, addons?: ProductAddon[]) => void;
  updateQuantity: (productId: string, quantity: number, addons?: ProductAddon[]) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  discount: number;
  isApplyingCoupon: boolean;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '90s-burger-cart';
const COUPON_STORAGE_KEY = '90s-burger-cart-coupon';

// Helper to create a unique key for cart items (product + size + color)
const getCartItemKey = (productId: string, addons: ProductAddon[] = []) =>
  `${productId}::${addons.map(a=>a.id).sort().join(',') || 'noaddons'}`;

const buildItemsSignature = (items: CartItem[]) =>
  items
    .map((item) => `${getCartItemKey(item.product.id, item.addons)}::${item.quantity}`)
    .sort()
    .join('|');

const buildCouponPayload = (items: CartItem[]) =>
  items.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
  }));

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(() => {
    const stored = localStorage.getItem(COUPON_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const itemsSignature = useMemo(() => buildItemsSignature(items), [items]);
  const validationKey = useMemo(
    () => `${itemsSignature}::${token ?? 'guest'}`,
    [itemsSignature, token]
  );
  const lastValidatedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon]);

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCouponError('Enter a coupon code.');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);

    try {
      const resp = await fetch('/api/cart/apply-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: trimmed,
          items: buildCouponPayload(items),
        }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data?.coupon) {
        setAppliedCoupon(null);
        const message = data?.reason || data?.error || 'Invalid coupon code.';
        setCouponError(message);
        toast.error(message);
        return;
      }

      setAppliedCoupon({
        id: data.coupon.id,
        code: data.coupon.code,
        type: data.coupon.type,
        value: Number(data.coupon.value),
        discount_amount: Number(data.discountAmount || 0),
        eligible_subtotal: Number(data.eligibleSubtotal || 0),
      });

      lastValidatedSignatureRef.current = validationKey;
      toast.success(`Coupon ${data.coupon.code} applied!`);
    } catch (error: any) {
      const message = error?.message || 'Failed to apply coupon.';
      setCouponError(message);
      toast.error(message);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
    toast.message('Coupon removed');
  };

  useEffect(() => {
    if (!appliedCoupon) return;
    if (validationKey === lastValidatedSignatureRef.current) return;

    const revalidate = async () => {
      try {
        const resp = await fetch('/api/cart/apply-coupon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            code: appliedCoupon.code,
            items: buildCouponPayload(items),
          }),
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok || !data?.coupon) {
          setAppliedCoupon(null);
          const message = data?.reason || data?.error || 'Coupon removed due to cart changes.';
          setCouponError(message);
          toast.message(message);
          return;
        }

        setAppliedCoupon({
          id: data.coupon.id,
          code: data.coupon.code,
          type: data.coupon.type,
          value: Number(data.coupon.value),
          discount_amount: Number(data.discountAmount || 0),
          eligible_subtotal: Number(data.eligibleSubtotal || 0),
        });

        setCouponError(null);
        lastValidatedSignatureRef.current = validationKey;
      } catch {
        // Ignore background validation errors.
      }
    };

    revalidate();
  }, [appliedCoupon, validationKey, items, token]);

  const addItem = (product: Product, quantity = 1, addons: ProductAddon[] = []) => {
    trackEvent('add_to_cart', { productId: product.id });
    setItems(prev => {
      // Find existing item with same product AND size
      const existingItem = prev.find(
        item => getCartItemKey(item.product.id,item.addons) === getCartItemKey(product.id,addons)
      );
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const label = addons.map(a=>a.name).join(', ');
        
        toast.success(`Updated ${product.name}${label ? ` (${label})` : ''} quantity`);
        return prev.map(item =>
          getCartItemKey(item.product.id,item.addons) === getCartItemKey(product.id,addons)
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      const label = addons.map(a=>a.name).join(', ');
      toast.success(`Added ${product.name}${label ? ` (${label})` : ''} to cart`);
      return [...prev, { product, quantity, addons }];
    });
  };

  const removeItem = (productId: string, addons: ProductAddon[] = []) => {
    setItems(prev => {
      const item = prev.find(
        i => getCartItemKey(i.product.id,i.addons) === getCartItemKey(productId,addons)
      );
      if (item) {
        const label = addons.map(a=>a.name).join(', ');
        toast.success(`Removed ${item.product.name}${label ? ` (${label})` : ''} from cart`);
      }
      return prev.filter(
        item => getCartItemKey(item.product.id,item.addons) !== getCartItemKey(productId,addons)
      );
    });
  };

  const updateQuantity = (productId: string, quantity: number, addons: ProductAddon[] = []) => {
    if (quantity < 1) {
      removeItem(productId, addons);
      return;
    }

    setItems(prev => {
      return prev.map(item =>
        getCartItemKey(item.product.id,item.addons) === getCartItemKey(productId,addons)
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponError(null);
    toast.success('Cart cleared');
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.product.price + (item.addons||[]).reduce((s,a)=>s+Number(a.price),0)) * item.quantity, 0);
  const discount = appliedCoupon?.discount_amount ?? 0;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      appliedCoupon,
      discount,
      isApplyingCoupon,
      couponError,
      applyCoupon,
      removeCoupon,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
