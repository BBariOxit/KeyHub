'use client'
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import debounce from 'lodash/debounce';
import { useCallback } from 'react';

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const { user } = useUser()
    const { openSignIn } = useClerk()
    const { getToken } = useAuth()

    const [products, setProducts] = useState([])
    const [sellerProducts, setSellerProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [inventoryReceipts, setInventoryReceipts] = useState([])

    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [sellerProductsLoading, setSellerProductsLoading] = useState(false)
    const [inventoryReceiptsLoading, setInventoryReceiptsLoading] = useState(false)

    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [cartItems, setCartItems] = useState({})
    const isMountedRef = useRef(true)

    const fetchProductData = async () => {
        try {
            const { data } = await axios.get('/api/product/list')
            if (data.success) {
                if (isMountedRef.current) {
                    setProducts(data.products)
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchCategories = useCallback(async ({ silent = false } = {}) => {
        try {
            setCategoriesLoading(true)
            const { data } = await axios.get('/api/category/list')

            if (data.success) {
                if (isMountedRef.current) {
                    setCategories(data.categories || [])
                }
                return data.categories || []
            }

            if (!silent) {
                toast.error(data.message || 'Không thể tải danh mục')
            }
            return []
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || error.message)
            }
            return []
        } finally {
            if (isMountedRef.current) {
                setCategoriesLoading(false)
            }
        }
    }, [])

    const fetchSellerProducts = useCallback(async ({ silent = false } = {}) => {
        try {
            setSellerProductsLoading(true)
            const token = await getToken()
            if (!token) {
                if (isMountedRef.current) {
                    setSellerProducts([])
                }
                return []
            }

            const { data } = await axios.get('/api/product/seller-list', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                const normalizedProducts = (data.products || [])
                    .filter((product) => product?._id)
                    .map((product) => ({
                        ...product,
                        _id: String(product._id),
                        name: product?.name?.trim() || 'Sản phẩm chưa đặt tên'
                    }))

                if (isMountedRef.current) {
                    setSellerProducts(normalizedProducts)
                }

                return normalizedProducts
            }

            if (!silent) {
                toast.error(data.message || 'Không thể tải danh sách sản phẩm')
            }
            return []
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || error.message)
            }
            return []
        } finally {
            if (isMountedRef.current) {
                setSellerProductsLoading(false)
            }
        }
    }, [getToken])

    const fetchInventoryReceipts = useCallback(async ({ silent = false } = {}) => {
        try {
            setInventoryReceiptsLoading(true)
            const token = await getToken()
            if (!token) {
                if (isMountedRef.current) {
                    setInventoryReceipts([])
                }
                return []
            }

            const { data } = await axios.get('/api/inventory-receipt/list', {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                if (isMountedRef.current) {
                    setInventoryReceipts(data.receipts || [])
                }
                return data.receipts || []
            }

            if (!silent) {
                toast.error(data.message || 'Không thể tải danh sách phiếu nhập')
            }
            return []
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || error.message)
            }
            return []
        } finally {
            if (isMountedRef.current) {
                setInventoryReceiptsLoading(false)
            }
        }
    }, [getToken])

    const fetchUserData = async () => {
        try {
            setIsSeller(user?.publicMetadata?.role === 'seller')

            const token = await getToken()
            if (!token) {
                return
            }
            const { data } = await axios.get('/api/user/data', { headers: { Authorization: `Bearer ${token}` } }) 
            if (data.success) {
                if (isMountedRef.current) {
                    setUserData(data.user)
                    setCartItems(data.user.cartItems)
                }
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const debouncedSyncCart = useCallback(
        // sử dụng debounce tránh sapm click
        debounce(async (cartData, oldData) => {
            try {
                const token = await getToken()
                    if (!token) return
                    await axios.post('/api/cart/update', { cartData }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Đã đồng bộ server xong!")
            } catch (error) {
                toast.error("Lỗi đồng bộ: " + error.message)
                setCartItems(oldData)
            }
        }, 500),[]
    )

    useEffect(() => {
        return () => {
            isMountedRef.current = false
            debouncedSyncCart.cancel()
        }
    }, [debouncedSyncCart])

    const addToCart = async (itemId) => {
        if (!user) {
            await openSignIn()
            return false
        }

        const oldCartItems = structuredClone(cartItems)
        let cartData = structuredClone(cartItems);
        cartData[itemId] = (cartData[itemId] || 0) + 1
        setCartItems(cartData)
        toast.success('Sản phẩm đã được thêm vào giỏ hàng')
        debouncedSyncCart(cartData, oldCartItems)
        return true
    }

    const updateCartQuantity = async (itemId, quantity) => {
        const oldCartItems = structuredClone(cartItems)
        let cartData = structuredClone(cartItems)
        if (quantity <= 0) {
            delete cartData[itemId]
        } else {
            cartData[itemId] = quantity
        }
        setCartItems(cartData)
        toast.success('Giỏ hàng đã được cập nhật')
        if (user) {
            debouncedSyncCart(cartData, oldCartItems)
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            if (cartItems[items] > 0) {
                totalCount += cartItems[items];
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (cartItems[items] > 0 && itemInfo) {
                totalAmount += itemInfo.offerPrice * cartItems[items];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData()
        fetchCategories({ silent: true })
    }, [])

    useEffect(() => {
        if (user) {
            fetchUserData()

            if (user?.publicMetadata?.role === 'seller') {
                fetchSellerProducts({ silent: true })
                fetchInventoryReceipts({ silent: true })
            }

            return
        }

        setIsSeller(false)
        setUserData(false)
        setCartItems({})
        setSellerProducts([])
        setInventoryReceipts([])
    }, [user])

    const value = {
        user, getToken,
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData,
        sellerProducts, fetchSellerProducts, sellerProductsLoading,
        categories, fetchCategories, categoriesLoading,
        inventoryReceipts, fetchInventoryReceipts, inventoryReceiptsLoading,
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}