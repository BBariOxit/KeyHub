import { useAppContext } from "@/context/AppContext";
import { formatVnd } from "@/lib/price";
import axios from "axios";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";

const CHECKOUT_IDEMPOTENCY_STORAGE_KEY = 'checkout-idempotency-key'
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const OrderSummary = () => {

  const { currency, router, getCartCount, getCartAmount, getToken, user, cartItems, setCartItems, fetchProductData } = useAppContext()
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const idempotencyKeyRef = useRef('')

  const [userAddresses, setUserAddresses] = useState([])
  const subtotal = useMemo(() => getCartAmount(), [getCartAmount])
  const itemsCount = useMemo(() => getCartCount(), [getCartCount])
  const taxAmount = useMemo(() => Math.floor(subtotal * 0.02), [subtotal])
  const totalAmount = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount])

  const resetCheckoutIdempotencyKey = useCallback(() => {
    idempotencyKeyRef.current = ''
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY)
    }
  }, [])

  const getOrCreateCheckoutIdempotencyKey = useCallback(() => {
    if (idempotencyKeyRef.current) {
      return idempotencyKeyRef.current
    }

    if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
      throw new Error('Trình duyệt không hỗ trợ crypto.randomUUID')
    }

    if (typeof window !== 'undefined') {
      const existing = window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY)
      if (existing && uuidV4Regex.test(existing)) {
        idempotencyKeyRef.current = existing
        return existing
      }
    }

    const generated = crypto.randomUUID()
    idempotencyKeyRef.current = generated

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY, generated)
    }

    return generated
  }, [])

  const fetchUserAddresses = useCallback(async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/user/get-address', {headers:{Authorization: `Bearer ${token}`}})
      if (data.success) {
        const addressList = data.addresses || []
        setUserAddresses(addressList)
        if (addressList.length > 0) {
          // Tự động chọn địa chỉ đầu tiên đã sort ở backend
          setSelectedAddress(addressList[0])
        }
      } else{
        toast.error(data.message || "Không thể lấy danh sách địa chỉ")
      }
    } catch (error) {
        toast.error(error.response?.data?.message || error.message)
    }
  }, [getToken])

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
    resetCheckoutIdempotencyKey()
  };

  const createOrder = async () => {
    if (loading) {
      return
    }

    if (!selectedAddress) {
      return toast.error('Vui lòng chọn địa chỉ giao hàng')
    }

    let cartItemsArray = Object.keys(cartItems).map((key) => ({product:key, quantity: cartItems[key]}))
      cartItemsArray = cartItemsArray.filter(item => item.quantity > 0)

    if (cartItemsArray.length === 0) {
      return toast.error('Giỏ hàng trống!')
    }

    try {
      setLoading(true)
      const token = await getToken()
      if (!token) {
        return toast.error("Vui lòng đăng nhập để đặt hàng")
      }

      const idempotencyKey = getOrCreateCheckoutIdempotencyKey()

      const { data } = await axios.post('/api/order/create', {
        address: selectedAddress._id,
        items: cartItemsArray
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-idempotency-key': idempotencyKey
        }
      })

      if (data.success) {
        toast.success(data.message || 'Đặt hàng thành công!')
        setCartItems({})
        resetCheckoutIdempotencyKey()
        await fetchProductData()
        router.push('/order-placed')
      } else {
        toast.error(data.message || 'Có lỗi xảy ra khi đặt hàng')
        resetCheckoutIdempotencyKey()
      }

    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Lỗi kết nối server';
      toast.error(msg)
      const errorStatus = error.response?.status
      if (errorStatus && errorStatus < 500) {
        resetCheckoutIdempotencyKey()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserAddresses()
    }
  }, [user, fetchUserAddresses])

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Tóm tắt đơn hàng
      </h2>
      <hr className="border-gray-500/30 my-5" />
      <div className="space-y-6">
        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Chọn địa chỉ
          </label>
          <div className="relative inline-block w-full text-sm border">
            <button
              className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              <span>
                {selectedAddress
                  ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                  : "Chọn địa chỉ"}
              </span>
              <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={address._id || `${address.phoneNumber || "phone"}-${index}`}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Thêm địa chỉ mới
                </li>
              </ul>
            )}
          </div>
        </div>

        <div>
          <label className="text-base font-medium uppercase text-gray-600 block mb-2">
            Mã giảm giá
          </label>
          <div className="flex flex-col items-start gap-3">
            <input
              type="text"
              placeholder="Nhập mã giảm giá"
              className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
            />
            <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
              Áp dụng
            </button>
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <p className="uppercase text-gray-600">Sản phẩm {itemsCount}</p>
            <p className="text-gray-800">{formatVnd(subtotal)} {currency}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Phí vận chuyển</p>
            <p className="font-medium text-gray-800">Miễn phí</p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Thuế (2%)</p>
            <p className="font-medium text-gray-800">{formatVnd(taxAmount)} {currency}</p>
          </div>
          <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
            <p>Tổng cộng</p>
            <p>{formatVnd(totalAmount)} {currency}</p>
          </div>
        </div>
      </div>

      <button
        onClick={createOrder}
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Đang xử lý..." : "Đặt hàng"}
      </button>
    </div>
  );
};

export default OrderSummary;