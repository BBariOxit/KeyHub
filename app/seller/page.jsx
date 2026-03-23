'use client'
import React, { useEffect, useMemo, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";
import { formatThousandsInput, getNumericString } from "@/lib/price";

const AddProduct = () => {

  const { getToken } = useAppContext()

  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Keyboard');
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const previewUrls = useMemo(() => {
    return files.map((file) => (file ? URL.createObjectURL(file) : null));
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previewUrls]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    formData.append('category', category)
    formData.append('price', getNumericString(price))
    formData.append('offerPrice', getNumericString(offerPrice))

    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i])
    }

    try {
      const token = await getToken()
      const { data } = await axios.post('/api/product/add', formData, {headers: {Authorization: `Bearer ${token}`}})

      if (data.success) {
        toast.success(data.message)
        setFiles([])
        setName('')
        setDescription('')
        setCategory('Keyboard')
        setPrice('')
        setOfferPrice('')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }

  };

  return (
    <div className="flex-1 min-h-screen flex flex-col justify-between">
      <form onSubmit={handleSubmit} className="md:p-10 p-4 space-y-5 max-w-lg">
        <div>
          <p className="text-base font-medium">Hình ảnh sản phẩm</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">

            {[...Array(4)].map((_, index) => (
              <label key={index} htmlFor={`image${index}`}>
                <input onChange={(e) => {
                  const updatedFiles = [...files];
                  updatedFiles[index] = e.target.files[0];
                  setFiles(updatedFiles);
                }} type="file" id={`image${index}`} hidden />
                <Image
                  className="max-w-24 cursor-pointer"
                  src={previewUrls[index] || assets.upload_area}
                  alt=""
                  width={100}
                  height={100}
                />
              </label>
            ))}

          </div>
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="product-name">
            Tên sản phẩm
          </label>
          <input
            id="product-name"
            type="text"
            placeholder="Nhập tại đây"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>
        <div className="flex flex-col gap-1 max-w-md">
          <label
            className="text-base font-medium"
            htmlFor="product-description"
          >
            Mô tả sản phẩm
          </label>
          <textarea
            id="product-description"
            rows={4}
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            placeholder="Nhập tại đây"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
          ></textarea>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="category">
              Danh mục
            </label>
            <select
              id="category"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="Keyboard">Bàn phím</option>
              <option value="Mechanical Keyboard">Bàn phím cơ</option>
              <option value="Wireless Keyboard">Bàn phím không dây</option>
              <option value="Gaming Keyboard">Bàn phím gaming</option>
              <option value="Office Keyboard">Bàn phím văn phòng</option>
              <option value="Keycap">Keycap</option>
              <option value="Accessories">Phụ kiện</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="product-price">
              Giá sản phẩm
            </label>
            <input
              id="product-price"
              type="text"
              inputMode="numeric"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setPrice(getNumericString(e.target.value))}
              value={formatThousandsInput(price)}
              required
            />
          </div>
          <div className="flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offer-price">
              Giá ưu đãi
            </label>
            <input
              id="offer-price"
              type="text"
              inputMode="numeric"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              onChange={(e) => setOfferPrice(getNumericString(e.target.value))}
              value={formatThousandsInput(offerPrice)}
              required
            />
          </div>
        </div>
        <button type="submit" className="px-8 py-2.5 bg-orange-600 text-white font-medium rounded">
          THÊM
        </button>
      </form>
      {/* <Footer /> */}
    </div>
  );
};

export default AddProduct;