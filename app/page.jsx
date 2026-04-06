import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import FeaturedProduct from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export const revalidate = 60;
async function getInitialProducts() {
  try {
    await connectDB();

    const productDocs = await Product.find(
      {},
      {
        name: 1,
        description: 1,
        price: 1,
        offerPrice: 1,
        image: 1,
        categoryId: 1,
        category: 1,
        stock: 1,
        date: 1,
      }
    )
      .populate({ path: 'categoryId', select: 'name slug' })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    return productDocs.map((product) => ({
      ...product,
      _id: product._id.toString(),
      category: product?.categoryId?.name || product.category || '',
      categorySlug: product?.categoryId?.slug || null
    }));
  } catch (error) {
    console.error("Home product prefetch error:", error);
    return [];
  }
}

const Home = async () => {
  const initialProducts = await getInitialProducts();

  return (
    <>
      <Navbar/>
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />
        <HomeProducts initialProducts={initialProducts} />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;
