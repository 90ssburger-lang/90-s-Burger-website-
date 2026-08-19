import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { CouponCodeCard } from '@/components/cart/CouponCodeCard';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, itemCount, subtotal, discount, appliedCoupon } = useCart();
  const total = Math.max(0, subtotal - discount);

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="h-24 w-24 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h1 className="font-display text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you have not added anything to your cart yet.
              Start shopping to fill it up!
            </p>
            <Link to="/shop">
              <Button variant="hero" size="lg">
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold mb-8">
          Shopping Cart ({itemCount} item{itemCount !== 1 ? 's' : ''})
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${(item.addons||[]).map(a=>a.id).join('-')||'default'}`}
                className="glass-card flex gap-4 p-4"
              >
                {/* Image */}
                <Link
                  to={`/product/${item.product.slug}`}
                  className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted border border-gray-200"
                >
                  <img
                    src={item.product.image_url || item.product.images?.[0] || '/placeholder.svg'}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      {item.product.category && (
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          {item.product.category.name}
                        </p>
                      )}
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="font-display font-semibold hover:text-primary transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      {!!item.addons?.length && <p className="mt-1 text-sm text-muted-foreground">Sides: <span className="font-medium text-foreground">{item.addons.map(a=>a.name).join(', ')}</span></p>}
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.addons)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.addons)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.addons)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-display font-bold">
                        {formatCurrency((item.product.price + (item.addons||[]).reduce((s,a)=>s+Number(a.price),0)) * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.product.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 glass-card p-6 space-y-6">
              <h2 className="font-display text-xl font-bold">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-sm font-medium">Calculated by zone</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
              </div>

              <CouponCodeCard className="border-t border-gray-200 pt-4" />

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-display font-bold">Total</span>
                  <span className="font-display font-bold">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button variant="hero" size="lg" className="w-full">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link to="/shop" className="block">
                <Button variant="ghost" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
