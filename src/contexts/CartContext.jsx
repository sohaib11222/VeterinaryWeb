import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setCartItems(parsed)
      }
    } catch (_) {
      localStorage.removeItem('cart')
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product, quantity = 1, options = {}) => {
    const id = product?._id || product?.id
    if (!id) return

    const variant = options?.variant || null
    const variantId = variant?._id || variant?.id || null
    const cartItemId = variantId ? `${id}:${variantId}` : String(id)

    const seller = product?.sellerId
    const sellerId = seller && typeof seller === 'object' ? seller?._id : seller

    setCartItems((prev) => {
      const existing = prev.find((x) => String(x.cartItemId || x._id) === cartItemId)
      const unitPrice = typeof variant?.discountPrice === 'number' && variant.discountPrice > 0
        ? variant.discountPrice
        : variant?.price ?? (typeof product?.discountPrice === 'number' && product.discountPrice > 0 ? product.discountPrice : product?.price)
      const image = Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null

      if (existing) {
        return prev.map((x) =>
          String(x.cartItemId || x._id) === cartItemId
            ? { ...x, quantity: (x.quantity || 0) + quantity }
            : x
        )
      }

      return [
        ...prev,
        {
          _id: id,
          cartItemId,
          variantId,
          variantName: variant?.name || [
            variant?.strengthValue ? `${variant.strengthValue} ${variant.strengthUnit || ''}`.trim() : '',
            variant?.dosageForm || '',
            variant?.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel || 'units'}` : '',
          ].filter(Boolean).join(' · ') || null,
          variantSnapshot: variant ? {
            strengthValue: variant.strengthValue ?? null,
            strengthUnit: variant.strengthUnit || null,
            dosageForm: variant.dosageForm || null,
            packageType: variant.packageType || null,
            unitsPerPack: variant.unitsPerPack ?? null,
            unitLabel: variant.unitLabel || null,
            packageDescription: variant.packageDescription || null,
          } : null,
          sellerId,
          name: product?.name || 'Product',
          price: typeof unitPrice === 'number' ? unitPrice : Number(unitPrice || 0),
          originalPrice: variant?.price ?? product?.price,
          image,
          quantity,
          sku: variant?.sku || product?.sku,
          stock: variant?.stock ?? product?.stock,
        },
      ]
    })
  }

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((x) => String(x.cartItemId || x._id) !== String(cartItemId)))
  }

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId)
      return
    }

    setCartItems((prev) =>
      prev.map((x) => (String(x.cartItemId || x._id) === String(cartItemId) ? { ...x, quantity } : x))
    )
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
  }

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + Number(item.quantity || 0), 0)
  }

  const isInCart = (productId, variantId = null) => {
    const cartItemId = variantId ? `${productId}:${variantId}` : String(productId)
    return cartItems.some((x) => String(x.cartItemId || x._id) === cartItemId)
  }

  const getCartSellerId = () => {
    return cartItems?.[0]?.sellerId || null
  }

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemCount,
      isInCart,
      getCartSellerId,
    }),
    [cartItems]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
