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

const normalizeFavoriteIds = (favoriteIds = []) => (
    Array.isArray(favoriteIds)
        ? favoriteIds.map((id) => String(id)).filter(Boolean)
        : []
)

export const AppContextProvider = (props) => {
    const { initialFavoriteIds = [], children } = props

    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const { user, isLoaded: isUserLoaded } = useUser()
    const { openSignIn } = useClerk()
    const { getToken, isSignedIn } = useAuth()
    const getTokenRef = useRef(getToken)
    const userId = user?.id || null
    const roleString = user?.publicMetadata?.role;
    const userRole = typeof roleString === 'string' ? roleString.toLowerCase() : '';

    const [products, setProducts] = useState([])
    const [sellerProducts, setSellerProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [inventoryReceipts, setInventoryReceipts] = useState([])

    const [productsLoading, setProductsLoading] = useState(false)
    const [categoriesLoading, setCategoriesLoading] = useState(false)
    const [sellerProductsLoading, setSellerProductsLoading] = useState(false)
    const [suppliersLoading, setSuppliersLoading] = useState(false)
    const [inventoryReceiptsLoading, setInventoryReceiptsLoading] = useState(false)

    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [cartItems, setCartItems] = useState({})
    const cartItemsRef = useRef({})
    const [favoriteIds, setFavoriteIds] = useState(() => normalizeFavoriteIds(initialFavoriteIds))
    const isMountedRef = useRef(true)
    const lastFavoriteMutationAtRef = useRef(0)
    const isAuthLoaded = isUserLoaded

    useEffect(() => {
        setFavoriteIds(normalizeFavoriteIds(initialFavoriteIds))
    }, [initialFavoriteIds])

    useEffect(() => {
        getTokenRef.current = getToken
    }, [getToken])

    useEffect(() => {
        cartItemsRef.current = cartItems
    }, [cartItems])

    const fetchProductData = async () => {
        try {
            setProductsLoading(true)
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
        } finally {
            if (isMountedRef.current) {
                setProductsLoading(false)
            }
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
            const token = await getTokenRef.current?.()
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
    }, [])

    const fetchSuppliers = useCallback(async ({ silent = false, includeInactive = false } = {}) => {
        try {
            setSuppliersLoading(true)
            const token = await getTokenRef.current?.()
            if (!token) {
                if (isMountedRef.current) {
                    setSuppliers([])
                }
                return []
            }

            const { data } = await axios.get('/api/supplier/list', {
                params: includeInactive ? { includeInactive: 'true' } : undefined,
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                const normalizedSuppliers = (data.suppliers || [])
                    .filter((supplier) => supplier?._id)
                    .map((supplier) => ({
                        ...supplier,
                        _id: String(supplier._id),
                        name: supplier?.name?.trim() || 'Nhà cung cấp'
                    }))

                if (isMountedRef.current) {
                    setSuppliers(normalizedSuppliers)
                }

                return normalizedSuppliers
            }

            if (!silent) {
                toast.error(data.message || 'Không thể tải danh sách nhà cung cấp')
            }
            return []
        } catch (error) {
            if (!silent) {
                toast.error(error.response?.data?.message || error.message)
            }
            return []
        } finally {
            if (isMountedRef.current) {
                setSuppliersLoading(false)
            }
        }
    }, [])

    const fetchInventoryReceipts = useCallback(async ({ silent = false } = {}) => {
        try {
            setInventoryReceiptsLoading(true)
            const token = await getTokenRef.current?.()
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
    }, [])

    const fetchUserData = async (role) => {
        try {
            const requestStartedAt = Date.now()
            setIsSeller(role === 'seller')

            const token = await getTokenRef.current?.()
            if (!token) {
                return
            }
            const { data } = await axios.get('/api/user/data', { headers: { Authorization: `Bearer ${token}` } }) 
            if (data.success) {
                if (isMountedRef.current) {
                    const serverFavorites = Array.isArray(data.user?.favorites)
                        ? data.user.favorites.map((id) => String(id)).filter(Boolean)
                        : []

                    setUserData(data.user)
                    setCartItems(data.user.cartItems)

                    // Skip stale favorite data if user toggled favorite after this request started.
                    if (requestStartedAt >= lastFavoriteMutationAtRef.current) {
                        setFavoriteIds(serverFavorites)
                    }
                }
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    const debouncedSyncCart = useCallback(
        // sử dụng debounce tránh spam click
        debounce(async (cartData, oldData) => {
            try {
                const token = await getTokenRef.current?.()
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

    const addToCart = async (itemId, options = {}) => {
        const { showToast = true } = options
        if (!user) {
            if (isSignedIn === false) {
                await openSignIn()
            }
            return false
        }

        const product = products.find((item) => item._id === itemId)
        const maxStock = Number.isFinite(product?.stock) ? Math.max(0, product.stock) : null

        const oldCartItems = structuredClone(cartItemsRef.current)
        const cartData = structuredClone(cartItemsRef.current)

        const currentQuantity = cartData[itemId] || 0
        const nextQuantity = maxStock === null
            ? currentQuantity + 1
            : Math.min(currentQuantity + 1, maxStock)

        if (maxStock !== null && maxStock <= 0) {
            return false
        }

        if (nextQuantity === currentQuantity) {
            return false
        }

        cartData[itemId] = nextQuantity
        cartItemsRef.current = cartData
        setCartItems(cartData)
        if (showToast) {
            toast.success('Sản phẩm đã được thêm vào giỏ hàng')
        }
        debouncedSyncCart(cartData, oldCartItems)
        return true
    }

    const isFavorite = useCallback((productId) => {
        const normalizedProductId = String(productId || '')
        if (!normalizedProductId) {
            return false
        }

        return favoriteIds.includes(normalizedProductId)
    }, [favoriteIds])

    const toggleFavorite = useCallback(async (productId, options = {}) => {
        const { showToast = false } = options

        if (!user) {
            if (isSignedIn === false) {
                await openSignIn()
            }
            return false
        }

        const normalizedProductId = String(productId || '').trim()
        if (!normalizedProductId) {
            return false
        }

        const previousFavorites = [...favoriteIds]
        const shouldAdd = !previousFavorites.includes(normalizedProductId)
        const nextFavorites = shouldAdd
            ? [...previousFavorites, normalizedProductId]
            : previousFavorites.filter((id) => id !== normalizedProductId)

        lastFavoriteMutationAtRef.current = Date.now()
        setFavoriteIds(nextFavorites)

        try {
            const token = await getTokenRef.current?.()
            if (!token) {
                setFavoriteIds(previousFavorites)
                return false
            }

            const { data } = await axios.post(
                '/api/user/favorite/toggle',
                { productId: normalizedProductId },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (!data.success) {
                throw new Error(data.message || 'Không thể cập nhật yêu thích')
            }

            const serverFavorites = Array.isArray(data.favorites)
                ? data.favorites.map((id) => String(id)).filter(Boolean)
                : nextFavorites

            lastFavoriteMutationAtRef.current = Date.now()
            setFavoriteIds(serverFavorites)
            setUserData((prev) => prev ? { ...prev, favorites: serverFavorites } : prev)

            if (showToast && data.message) {
                toast.success(data.message)
            }

            return data.isFavorite
        } catch (error) {
            setFavoriteIds(previousFavorites)
            toast.error(error.response?.data?.message || error.message)
            return false
        }
    }, [favoriteIds, openSignIn, user])

    const updateCartQuantity = async (itemId, quantity, options = {}) => {
        const { showToast = false } = options
        const oldCartItems = structuredClone(cartItemsRef.current)
        const cartData = structuredClone(cartItemsRef.current)

        const parsedQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 0
        const product = products.find((item) => item._id === itemId)
        const maxStock = Number.isFinite(product?.stock) ? Math.max(0, product.stock) : null
        const safeQuantity = maxStock === null
            ? parsedQuantity
            : Math.min(Math.max(parsedQuantity, 0), maxStock)

        if (safeQuantity <= 0) {
            delete cartData[itemId]
        } else {
            cartData[itemId] = safeQuantity
        }
        cartItemsRef.current = cartData
        setCartItems(cartData)
        if (showToast) {
            toast.success('Giỏ hàng đã được cập nhật')
        }
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
        // Keep SSR-seeded favorites until auth state is resolved to avoid white-heart flash.
        if (!isAuthLoaded || typeof isSignedIn === 'undefined') {
            return
        }

        if (isSignedIn === false) {
            setIsSeller(false)
            setUserData(false)
            setCartItems({})
            setFavoriteIds([])
            setSellerProducts([])
            setSuppliers([])
            setInventoryReceipts([])
            return
        }

        if (userId) {
            fetchUserData(userRole)

            if (userRole === 'seller') {
                fetchSellerProducts({ silent: true })
                fetchSuppliers({ silent: true })
                fetchInventoryReceipts({ silent: true })
            }

            return
        }
    }, [
        isAuthLoaded,
        isSignedIn,
        userId,
        userRole,
        fetchSellerProducts,
        fetchSuppliers,
        fetchInventoryReceipts
    ])

    const value = {
        user, getToken, isSignedIn, isAuthLoaded,
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData, productsLoading,
        sellerProducts, fetchSellerProducts, sellerProductsLoading,
        categories, fetchCategories, categoriesLoading,
        suppliers, fetchSuppliers, suppliersLoading,
        inventoryReceipts, fetchInventoryReceipts, inventoryReceiptsLoading,
        cartItems, setCartItems,
        favoriteIds, isFavorite, toggleFavorite,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}