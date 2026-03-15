'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import { formatVnd } from "@/lib/price";
import axios from "axios";
import toast from "react-hot-toast";

const MyOrders = () => {

    const { currency, getToken, user } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const token = await getToken()

            const { data } = await axios.get('/api/order/list', {headers: {Authorization: `Bearer ${token}`}})

            if (data.success) {
                setOrders(data.orders)
            } else {
                toast.error(data.message || "Không thể lấy danh sách đơn hàng")
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchOrders()
        }
    }, [user])

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#fafafa] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-6xl">
                    <h2 className="mt-4 text-2xl font-semibold text-gray-800 sm:mt-6">Đơn hàng của tôi</h2>
                    {loading ? <Loading /> : (<div className="mt-6 space-y-4 text-sm">
                        {orders.map((order, index) => (
                            <div key={index} className="grid grid-cols-1 items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-12 lg:items-center lg:gap-6">
                                <div className="flex min-w-0 gap-4 lg:col-span-4">
                                    <Image
                                        className="h-14 w-14 shrink-0 object-contain"
                                        src={assets.box_icon}
                                        alt="box_icon"
                                    />
                                    <div className="flex min-w-0 flex-col gap-2 text-gray-700">
                                        <div className="space-y-1 text-base font-semibold text-gray-800">
                                            {order.items.map((item, itemIndex) => (
                                                <p key={itemIndex} className="leading-7">
                                                    {item.product.name} x {item.quantity}
                                                </p>
                                            ))}
                                        </div>
                                        <span>Sản phẩm: {order.items.length}</span>
                                    </div>
                                </div>
                                <div className="lg:col-span-3">
                                    <p className="leading-6 text-gray-700">
                                        <span className="font-medium">{order.address.fullName}</span>
                                        <br />
                                        <span >{order.address.area}</span>
                                        <br />
                                        <span>{`${order.address.city}, ${order.address.state}`}</span>
                                        <br />
                                        <span>{order.address.phoneNumber}</span>
                                    </p>
                                </div>
                                <p className="text-base font-semibold text-gray-900 lg:col-span-2 lg:text-center">{formatVnd(order.amount)} {currency}</p>
                                <div className="lg:col-span-3 lg:text-right">
                                    <p className="flex flex-col leading-6 text-gray-700">
                                        <span>Phương thức: COD</span>
                                        <span>Ngày đặt: {new Date(order.date).toLocaleDateString()}</span>
                                        <span>Thanh toán: Chờ xử lý</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>)}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default MyOrders;