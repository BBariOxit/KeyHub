"use client"
import React, { useState, useEffect } from "react";
import { assets, BagIcon, BoxIcon, CartIcon, HeartIcon, HomeIcon} from "@/assets/assets";
import Link from "next/link"
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { useClerk, UserButton } from "@clerk/nextjs";
import { Trash2 } from "lucide-react";

const Navbar = () => {

  const { isSeller, router, user, getCartCount, cartItems, products, getCartAmount, currency, updateCartQuantity } = useAppContext();
  const { openSignIn } = useClerk()
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="relative flex items-center justify-between px-6 md:px-16 lg:px-32 py-3 border-b border-gray-300 text-gray-700">
      <Link href="/">
        <Image
          className="cursor-pointer w-28 md:w-32"
          src={assets.logo}
          alt="logo"
          sizes="(max-width: 768px) 112px, 128px"
          priority
        />
      </Link>
      <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-4 lg:gap-8">
        <Link href="/" className="hover:text-gray-900 transition">
          Trang chủ
        </Link>
        <Link href="/all-products" className="hover:text-gray-900 transition">
          Cửa hàng
        </Link>
        <Link href="/about" className="hover:text-gray-900 transition">
          Giới thiệu
        </Link>
        <Link href="/contact" className="hover:text-gray-900 transition">
          Liên hệ
        </Link>

        {user && isSeller && <Link href="/seller" className="text-xs border px-4 py-1.5 rounded-full inline-block">Kênh người bán</Link>}

      </div>

      <ul className="hidden md:flex items-center gap-4 ">
        <div className="relative group pb-2 cursor-pointer pt-2 mr-4">
          <Link href="/cart" className="relative p-1 flex items-center">
            <Image className="w-5 h-5" src={assets.cart_icon} alt="cart icon" />
            {isMounted && getCartCount() > 0 && (
              <span className="absolute top-0 right-0 translate-x-1 -translate-y-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                {getCartCount() > 99 ? '99+' : getCartCount()}
              </span>
            )}
          </Link>

          {/* POPUP MINI CART */}
          <div className="absolute right-0 top-full w-80 bg-white border border-gray-100 shadow-xl rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            {!isMounted ? (
               <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>
            ) : getCartCount() === 0 ? (
               <div className="p-8 text-center text-gray-500 text-sm">
                 <div className="text-4xl mb-2 opacity-50">🛒</div>
                 Chưa có sản phẩm trong giỏ
               </div>
            ) : (
              <div className="p-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                <h4 className="text-sm text-gray-500 mb-3 font-medium">Sản phẩm mới thêm</h4>
                <ul className="max-h-60 overflow-y-auto mb-4 space-y-3">
                  {Object.keys(cartItems)
                    .filter(itemId => cartItems[itemId] > 0)
                    .map(itemId => {
                      const product = products.find(p => p._id === itemId);
                      return product ? { ...product, quantity: cartItems[itemId] } : null;
                    })
                    .filter(Boolean)
                    .reverse()
                    .slice(0, 5)
                    .map((item) => (
                    <li key={item._id} className="flex items-center gap-3 group/item">
                      <div className="w-12 h-12 flex-shrink-0 border border-gray-100 rounded overflow-hidden">
                        <Image src={item.image[0]} alt={item.name} width={48} height={48} className="w-full h-full object-cover" />
                      </div> 
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm text-gray-800 line-clamp-2 leading-snug" title={item.name}>{item.name}</p>
                        <div className="text-orange-500 text-sm font-semibold mt-0.5">
                          {item.offerPrice.toLocaleString()} {currency}
                          <span className="text-xs text-gray-400 ml-1 font-normal">x{item.quantity}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateCartQuantity(item._id, 0); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover/item:opacity-100 focus:opacity-100 flex-shrink-0"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mb-4 border-t pt-3">
                    <span className="text-sm text-gray-600">Tổng tạm tính:</span>
                    <span className="text-lg font-bold text-orange-500">{getCartAmount().toLocaleString()} {currency}</span>
                </div>
                <Link 
                  href="/cart"
                  className="block w-full text-center py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded transition"
                >
                  Xem Giỏ Hàng
                </Link>
              </div>
            )}
          </div>
          {/* END POPUP */}
        </div>
        <Image className="w-4 h-4 cursor-pointer" src={assets.search_icon} alt="search icon" />
        {
          user
            ? <>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="My Favorites" labelIcon={<HeartIcon />} onClick={() => router.push('/favorites')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')}/>
                </UserButton.MenuItems>
              </UserButton>
            </> 
            : <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 transition">
              <Image src={assets.user_icon} alt="user icon" />
              Tài khoản
            </button>
        }
      </ul>

      <div className="flex items-center md:hidden gap-3">
        {user && isSeller && <Link href="/seller" className="text-xs border px-4 py-1.5 rounded-full inline-block">Kênh người bán</Link>}
        <Link href="/cart" className="relative p-1 mr-2">
          <Image className="w-5 h-5" src={assets.cart_icon} alt="cart icon" />
          {isMounted && getCartCount() > 0 && (
            <span className="absolute top-0 right-0 translate-x-1 -translate-y-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
              {getCartCount() > 99 ? '99+' : getCartCount()}
            </span>
          )}
        </Link>
        <Image className="w-4 h-4 cursor-pointer" src={assets.search_icon} alt="search icon" />
        { 
          user
            ? <>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Action label="Home" labelIcon={<HomeIcon />} onClick={() => router.push('/')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="Products" labelIcon={<BoxIcon />} onClick={() => router.push('/all-products')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="About" labelIcon={<BoxIcon />} onClick={() => router.push('/about')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="Contact" labelIcon={<BoxIcon />} onClick={() => router.push('/contact')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="Cart" labelIcon={<CartIcon />} onClick={() => router.push('/cart')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="My Favorites" labelIcon={<HeartIcon />} onClick={() => router.push('/favorites')}/>
                </UserButton.MenuItems>
                <UserButton.MenuItems>
                  <UserButton.Action label="My Orders" labelIcon={<BagIcon />} onClick={() => router.push('/my-orders')}/>
                </UserButton.MenuItems>
              </UserButton>
            </> 
            : <button onClick={openSignIn} className="flex items-center gap-2 hover:text-gray-900 transition">
              <Image src={assets.user_icon} alt="user icon" />
              Tài khoản
            </button>
        }
      </div>
    </nav>
  );
};

export default Navbar;