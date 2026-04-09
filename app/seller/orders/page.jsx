'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { formatVnd } from "@/lib/price";
import axios from "axios";
import toast from "react-hot-toast";
import { Package } from "lucide-react";

const Orders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const hasFetchedRef = useRef(false);

    const fetchSellerOrders = useCallback(async () => {
        try {
            setLoading(true)
            const token = await getToken()
            if (!token) {
                toast.error("Bạn cần đăng nhập để thực hiện thao tác này")
                return
            }
            const { data } = await axios.get('/api/order/seller-orders', {headers: {Authorization: `Bearer ${token}`}})

            if (data.success) {
                setOrders(data.orders)
            } else {
                toast.error(data.message || "Không thể lấy danh sách đơn hàng")
            }
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Đã xảy ra lỗi";
            toast.error(errMsg)
        } finally {
            setLoading(false)
        }
    }, [getToken])

    useEffect(() => {
        if (user && !hasFetchedRef.current) {
            hasFetchedRef.current = true
            fetchSellerOrders()
        }
    }, [user, fetchSellerOrders])

    return (
            <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm bg-gradient-to-b from-orange-50/30 via-white to-white">
                {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
                    <div className="flex items-center justify-between max-w-6xl">
                        <h2 className="text-2xl font-semibold text-gray-800">Đơn hàng</h2>
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                            {orders.length} đơn
                        </span>
                    </div>
                    <div className="max-w-6xl space-y-4">
                        {orders.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                                Không có đơn hàng nào
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:grid md:grid-cols-[2.3fr_1.45fr_1.15fr_1.45fr] gap-5 px-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    <p>Sản phẩm</p>
                                    <p>Thông tin nhận hàng</p>
                                    <p>Tổng tiền</p>
                                    <p>Thanh toán</p>
                                </div>
                    {orders.map((order, index) => (
                            <div key={order._id || index} className="grid grid-cols-1 md:grid-cols-[2.3fr_1.45fr_1.15fr_1.45fr] gap-5 md:gap-x-7 md:gap-y-6 p-6 border border-gray-200 rounded-2xl md:items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-5 md:gap-6 min-w-0">
                                    <div className="w-16 h-16 shrink-0 bg-orange-50 border border-orange-200 rounded-xl p-2 flex items-center justify-center">
                                        <Package className="w-8 h-8 text-orange-500" strokeWidth={2} />
                                    </div>
                                <p className="flex flex-col gap-2 min-w-0 leading-7">
                                        <span className="text-xs font-semibold text-gray-500 md:hidden uppercase">Sản phẩm</span>
                                    <span className="font-medium text-base break-words">
                                        {order.items.map((item) => (item.product?.name || "Sản phẩm đã gỡ") + ` x ${item.quantity}`).join(", ")}
                                    </span>
                                        <span className="text-gray-500">Số sản phẩm: {order.items.length}</span>
                                </p>
                            </div>
                                <div className="leading-7 text-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 mb-1 md:hidden uppercase">Thông tin nhận hàng</p>
                                <p>
                                        <span className="font-semibold text-gray-800">{order.address.fullName}</span>
                                    <br />
                                    <span >{order.address.area}</span>
                                    <br />
                                    <span>{`${order.address.city}, ${order.address.state}`}</span>
                                    <br />
                                    <span>{order.address.phoneNumber}</span>
                                </p>
                            </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1 md:hidden uppercase">Tổng tiền</p>
                                    <p className="font-semibold md:text-2xl text-gray-800">{formatVnd(order.amount)} <span className="text-base">{currency}</span></p>
                                </div>
                                <div className="leading-7 md:pl-2">
                                    <p className="text-xs font-semibold text-gray-500 mb-1 md:hidden uppercase">Thanh toán</p>
                                    <p className="flex flex-col gap-1.5">
                                        <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">Phương thức: COD</span>
                                        <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">Ngày: {new Date(order.date).toLocaleDateString('vi-VN')}</span>
                                        <span className="inline-flex w-fit items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">Thanh toán: Chưa thanh toán</span>
                                </p>
                            </div>
                        </div>
                        ))}
                            </>
                        )}
                </div>
            </div>}
            <Footer />
        </div>
    );
};

export default Orders;