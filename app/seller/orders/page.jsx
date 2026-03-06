'use client';
import React, { useEffect, useState } from "react";
import { assets, orderDummyData } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import { formatVnd } from "@/lib/price";

const Orders = () => {

    const { currency } = useAppContext();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSellerOrders = async () => {
        setOrders(orderDummyData);
        setLoading(false);
    }

    useEffect(() => {
        fetchSellerOrders();
    }, []);

    return (
        <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
            {loading ? <Loading /> : <div className="md:p-10 p-4 space-y-5">
                <h2 className="text-lg font-medium">Đơn hàng</h2>
                <div className="max-w-6xl rounded-md">
                    {orders.map((order, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr_2.2fr_1fr_1.6fr] gap-6 md:gap-8 p-6 border-t border-gray-300">
                            <div className="flex items-start gap-4 min-w-0">
                                <Image
                                    className="w-16 h-16 object-cover shrink-0"
                                    src={assets.box_icon}
                                    alt="box_icon"
                                />
                                <p className="flex flex-col gap-2 min-w-0 leading-7">
                                    <span className="font-medium text-base break-words">
                                        {order.items.map((item) => item.product.name + ` x ${item.quantity}`).join(", ")}
                                    </span>
                                    <span>Số sản phẩm: {order.items.length}</span>
                                </p>
                            </div>
                            <div className="leading-7">
                                <p>
                                    <span className="font-medium">{order.address.fullName}</span>
                                    <br />
                                    <span >{order.address.area}</span>
                                    <br />
                                    <span>{`${order.address.city}, ${order.address.state}`}</span>
                                    <br />
                                    <span>{order.address.phoneNumber}</span>
                                </p>
                            </div>
                            <p className="font-semibold md:text-lg md:self-center">{formatVnd(order.amount)} {currency}</p>
                            <div className="leading-7 md:pl-2">
                                <p className="flex flex-col">
                                    <span>Phương thức: COD</span>
                                    <span>Ngày: {new Date(order.date).toLocaleDateString('vi-VN')}</span>
                                    <span>Thanh toán: Chưa thanh toán</span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>}
            <Footer />
        </div>
    );
};

export default Orders;