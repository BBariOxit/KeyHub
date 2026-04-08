'use client'

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useAppContext } from '@/context/AppContext'
import { useClerk } from '@clerk/nextjs'

const FavoritesPage = () => {
    const { user, getToken, favoriteIds, isSignedIn, isAuthLoaded } = useAppContext()
    const { openSignIn } = useClerk()

    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        const fetchFavorites = async () => {
            if (!user) {
                if (!cancelled) {
                    setProducts([])
                    setLoading(false)
                }
                return
            }

            try {
                setLoading(true)
                const token = await getToken?.()

                if (!token) {
                    if (!cancelled) {
                        setProducts([])
                    }
                    return
                }

                const { data } = await axios.get('/api/user/favorite/list', {
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (!cancelled) {
                    setProducts(data.success ? (data.products || []) : [])
                }
            } catch {
                if (!cancelled) {
                    setProducts([])
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchFavorites()

        return () => {
            cancelled = true
        }
    }, [getToken, user])

    const visibleProducts = useMemo(() => {
        return products.filter((product) => favoriteIds.includes(String(product?._id || '')))
    }, [favoriteIds, products])

    return (
        <>
            <Navbar />
            <div className="flex flex-col items-start px-6 md:px-16 lg:px-32 min-h-[58vh]">
                <div className="flex flex-col items-end pt-12">
                    <p className="text-2xl font-medium">Sản phẩm yêu thích</p>
                    <div className="w-20 h-0.5 bg-orange-600 rounded-full"></div>
                </div>

                {isAuthLoaded && isSignedIn === false && (
                    <div className="w-full mt-10 p-6 border rounded-lg bg-orange-50/40">
                        <p className="text-gray-700">Bạn cần đăng nhập để xem danh sách yêu thích.</p>
                        <button
                            onClick={openSignIn}
                            className="mt-4 px-5 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition"
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                )}

                {user && loading && (
                    <div className="w-full mt-12 text-gray-500">Đang tải danh sách yêu thích...</div>
                )}

                {user && !loading && visibleProducts.length === 0 && (
                    <div className="w-full mt-12 p-6 border rounded-lg text-gray-600 bg-gray-50">
                        Bạn chưa thả tim sản phẩm nào.
                    </div>
                )}

                {user && !loading && visibleProducts.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center gap-6 mt-12 pb-14 w-full">
                        {visibleProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </>
    )
}

export default FavoritesPage
