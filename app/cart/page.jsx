'use client'
import React, { useMemo } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useAppContext } from "@/context/AppContext";
import { formatVnd } from "@/lib/price";
import { optimizeCloudinaryImage } from "@/lib/image";

const Cart = () => {

  const { products, router, cartItems, addToCart, updateCartQuantity, getCartCount } = useAppContext();
  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product._id, product]));
  }, [products]);

  const cartProductRows = useMemo(() => {
    return Object.keys(cartItems)
      .map((itemId) => {
        const quantity = cartItems[itemId];
        const product = productMap.get(itemId);
        return { itemId, product, quantity };
      })
      .filter(({ product, quantity }) => product && quantity > 0);
  }, [cartItems, productMap]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
            <p className="text-2xl md:text-3xl text-gray-500">
              Giỏ <span className="font-medium text-orange-600">hàng</span> của bạn
            </p>
            <p className="text-lg md:text-xl text-gray-500/80">{getCartCount()} sản phẩm</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="text-left">
                <tr>
                  <th className="text-nowrap pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Chi tiết sản phẩm
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Giá
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Số lượng
                  </th>
                  <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                    Tạm tính
                  </th>
                </tr>
              </thead>
              <tbody>
                {cartProductRows.map(({ itemId, product, quantity }) => {
                  const maxStock = Number.isFinite(product?.stock) ? Math.max(0, product.stock) : null
                  const canIncrease = maxStock === null || quantity < maxStock

                  return (
                    <tr key={itemId}>
                      <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                        <div>
                          <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                            <Image
                              src={optimizeCloudinaryImage(product.image[0], { width: 160, quality: "auto" }) || product.image[0]}
                              alt={product.name}
                              className="w-16 h-auto object-cover mix-blend-multiply"
                              width={1280}
                              height={720}
                              sizes="64px"
                              loading="lazy"
                            />
                          </div>
                          <button
                            type="button"
                            className="md:hidden text-xs text-orange-600 mt-1"
                            onClick={() => updateCartQuantity(product._id, 0)}
                          >
                            Xóa
                          </button>
                        </div>
                        <div className="text-sm hidden md:block">
                          <p className="text-gray-800">{product.name}</p>
                          <button
                            type="button"
                            className="text-xs text-orange-600 mt-1"
                            onClick={() => updateCartQuantity(product._id, 0)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-gray-600">{formatVnd(product.offerPrice)} VND</td>
                      <td className="py-4 md:px-4 px-1">
                        <div className="flex items-center md:gap-2 gap-1">
                          <button type="button" onClick={() => updateCartQuantity(product._id, quantity - 1)}>
                            <Image
                              src={assets.decrease_arrow}
                              alt="decrease_arrow"
                              className="w-4 h-4"
                            />
                          </button>
                          <input onChange={e => updateCartQuantity(product._id, Number(e.target.value))} type="number" value={quantity} min={0} max={maxStock ?? undefined} className="w-8 border text-center appearance-none"></input>
                          <button type="button" disabled={!canIncrease} className={!canIncrease ? "opacity-40 cursor-not-allowed" : ""} onClick={() => addToCart(product._id, { showToast: false })}>
                            <Image
                              src={assets.increase_arrow}
                              alt="increase_arrow"
                              className="w-4 h-4"
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-4 md:px-4 px-1 text-gray-600">{formatVnd(product.offerPrice * quantity)} VND</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={()=> router.push('/all-products')} className="group flex items-center mt-6 gap-2 text-orange-600">
            <Image
              className="group-hover:-translate-x-1 transition"
              src={assets.arrow_right_icon_colored}
              alt="arrow_right_icon_colored"
            />
            Tiếp tục mua sắm
          </button>
        </div>
        <OrderSummary />
      </div>
    </>
  );
};

export default Cart;
