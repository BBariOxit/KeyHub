import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, List, Tags, Users, Boxes, ShoppingCart } from 'lucide-react';

const SideBar = () => {
    const pathname = usePathname()
    const menuItems = [
        { name: 'Thêm sản phẩm', path: '/seller', icon: PlusCircle },
        { name: 'Danh sách sản phẩm', path: '/seller/product-list', icon: List },
        { name: 'Danh mục', path: '/seller/categories', icon: Tags },
        { name: 'Nhà cung cấp', path: '/seller/suppliers', icon: Users },
        { name: 'Nhập kho', path: '/seller/inventory', icon: Boxes },
        { name: 'Đơn hàng', path: '/seller/orders', icon: ShoppingCart },
    ];

    return (
        <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-300 py-2 flex flex-col'>
            {menuItems.map((item) => {

                const isActive = pathname === item.path;

                return (
                    <Link href={item.path} key={item.name} passHref>
                        <div
                            className={
                                `flex items-center py-3 px-4 gap-3 ${isActive
                                    ? "border-r-4 md:border-r-[6px] bg-orange-600/10 border-orange-500/90"
                                    : "hover:bg-gray-100/90 border-white"
                                }`
                            }
                        >
                            <item.icon className="w-6 h-6" strokeWidth={2} />
                            <p className='md:block hidden text-center'>{item.name}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default SideBar;
