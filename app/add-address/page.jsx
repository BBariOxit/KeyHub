'use client'
import { assets } from "@/assets/assets";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { addressSchema, mapZodIssuesToFieldErrors } from "@/lib/validators/addressSchema";
import axios from "axios";
import toast from "react-hot-toast";

const AddAddress = () => {
    
    const { getToken, router } = useAppContext()

    const [address, setAddress] = useState({
        fullName: '',
        phoneNumber: '',
        pinCode: '',
        area: '',
        city: '',
        state: '',
    })

    const [fieldErrors, setFieldErrors] = useState({})

    const handleFieldChange = (field, value) => {
        setAddress((prev) => ({ ...prev, [field]: value }))
        setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }

    const getFieldClassName = (field) => {
        const hasError = Boolean(fieldErrors[field])
        return `px-2 py-2.5 transition border rounded outline-none w-full text-gray-500 ${
            hasError ? 'border-red-500 focus:border-red-500' : 'border-gray-500/30 focus:border-orange-500'
        }`
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setFieldErrors({})

        const validation = addressSchema.safeParse(address)
        if (!validation.success) {
            setFieldErrors(mapZodIssuesToFieldErrors(validation.error.issues))
            return
        }

        try {
            const token = await getToken()
            const { data } = await axios.post('/api/user/add-address', {address}, {headers: {Authorization: `Bearer ${token}`}} )

            if (data.success) {
                toast.success(data.message)
                router.push('/cart')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            if (error.response && error.response.data) {
                const { errors, message } = error.response.data
                const normalizedErrors = Array.isArray(errors)
                    ? errors
                    : Array.isArray(error.response.data?.error?.issues)
                        ? error.response.data.error.issues
                        : []

                if (normalizedErrors.length > 0) {
                    const mappedErrors = mapZodIssuesToFieldErrors(normalizedErrors)
                    if (Object.keys(mappedErrors).length > 0) {
                        setFieldErrors(mappedErrors)
                    } else {
                        toast.error(message || "Dữ liệu chưa hợp lệ")
                    }
                } else {
                    toast.error(message || "Đã có lỗi xảy ra")
                }
            } else {
                toast.error(error.message)
            }
            
        }
    }

    return (
        <>
            <Navbar />
            <div className="px-6 md:px-16 lg:px-32 py-16 flex flex-col md:flex-row justify-between">
                <form onSubmit={onSubmitHandler} className="w-full">
                    <p className="text-2xl md:text-3xl text-gray-500">
                        Thêm <span className="font-semibold text-orange-600">Địa chỉ giao hàng</span>
                    </p>
                    <div className="space-y-3 max-w-sm mt-10">
                        <div>
                            <input
                                className={getFieldClassName('fullName')}
                                type="text"
                                placeholder="Họ và tên"
                                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                value={address.fullName}
                            />
                            {fieldErrors.fullName && <p className="mt-1 text-sm text-red-500">{fieldErrors.fullName}</p>}
                        </div>
                        <div>
                            <input
                                className={getFieldClassName('phoneNumber')}
                                type="text"
                                placeholder="Số điện thoại"
                                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                                value={address.phoneNumber}
                            />
                            {fieldErrors.phoneNumber && <p className="mt-1 text-sm text-red-500">{fieldErrors.phoneNumber}</p>}
                        </div>
                        <div>
                            <input
                                className={getFieldClassName('pinCode')}
                                type="text"
                                placeholder="Mã bưu chính"
                                onChange={(e) => handleFieldChange('pinCode', e.target.value)}
                                value={address.pinCode}
                            />
                            {fieldErrors.pinCode && <p className="mt-1 text-sm text-red-500">{fieldErrors.pinCode}</p>}
                        </div>
                        <div>
                            <textarea
                                className={`${getFieldClassName('area')} resize-none`}
                                rows={4}
                                placeholder="Địa chỉ (số nhà, đường/phố)"
                                onChange={(e) => handleFieldChange('area', e.target.value)}
                                value={address.area}
                            ></textarea>
                            {fieldErrors.area && <p className="mt-1 text-sm text-red-500">{fieldErrors.area}</p>}
                        </div>
                        <div className="flex space-x-3">
                            <div className="w-full">
                                <input
                                    className={getFieldClassName('city')}
                                    type="text"
                                    placeholder="Quận/Huyện/Thị xã"
                                    onChange={(e) => handleFieldChange('city', e.target.value)}
                                    value={address.city}
                                />
                                {fieldErrors.city && <p className="mt-1 text-sm text-red-500">{fieldErrors.city}</p>}
                            </div>
                            <div className="w-full">
                                <input
                                    className={getFieldClassName('state')}
                                    type="text"
                                    placeholder="Tỉnh/Thành phố"
                                    onChange={(e) => handleFieldChange('state', e.target.value)}
                                    value={address.state}
                                />
                                {fieldErrors.state && <p className="mt-1 text-sm text-red-500">{fieldErrors.state}</p>}
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="max-w-sm w-full mt-6 bg-orange-600 text-white py-3 hover:bg-orange-700 uppercase">
                        Lưu địa chỉ
                    </button>
                </form>
                <Image
                    className="md:mr-16 mt-16 md:mt-0"
                    src={assets.my_location_image}
                    alt="my_location_image"
                />
            </div>
            <Footer />
        </>
    );
};

export default AddAddress;