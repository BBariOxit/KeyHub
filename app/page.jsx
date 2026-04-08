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
const HOME_PRODUCTS_PER_PAGE = 15

async function getInitialProductsPage() {
  try {
    await connectDB();

    const hasMultiCategorySchema = Boolean(Product.schema.path('categoryIds'))
    const categoryProjection = hasMultiCategorySchema ? { categoryIds: 1 } : { categoryId: 1 }
    const populatePath = hasMultiCategorySchema ? 'categoryIds' : 'categoryId'

    const productDocs = await Product.find(
      {},
      {
        name: 1,
        description: 1,
        price: 1,
        offerPrice: 1,
        image: 1,
        ...categoryProjection,
        category: 1,
        stock: 1,
        date: 1,
      }
    )
      .populate({ path: populatePath, select: 'name slug' })
      .sort({ date: -1 })
      .limit(HOME_PRODUCTS_PER_PAGE)
      .lean();

    const total = await Product.countDocuments({})

    const normalizedProducts = productDocs.map((product) => {
      const populatedCategoryDocs = hasMultiCategorySchema
        ? (Array.isArray(product?.categoryIds) ? product.categoryIds : [])
        : (product?.categoryId ? [product.categoryId] : [])

      const populatedCategoryNames = populatedCategoryDocs
        .map((item) => item?.name)
        .filter(Boolean)

      const fallbackCategoryNames = Array.isArray(product?.category)
        ? product.category.filter(Boolean)
        : product?.category
          ? [product.category]
          : []

      const resolvedCategoryNames = populatedCategoryNames.length > 0
        ? populatedCategoryNames
        : fallbackCategoryNames

      const serializedCategoryIds = populatedCategoryDocs
        .map((item) => ({
          _id: item?._id ? item._id.toString() : null,
          name: item?.name || '',
          slug: item?.slug || null
        }))
        .filter((item) => item._id)

      return {
        ...product,
        _id: product._id.toString(),
        categoryIds: serializedCategoryIds,
        categoryNames: resolvedCategoryNames,
        category: resolvedCategoryNames.join(', '),
        categorySlugs: serializedCategoryIds.map((item) => item.slug).filter(Boolean),
        categorySlug: serializedCategoryIds[0]?.slug || null
      }
    })

    return {
      products: normalizedProducts,
      pagination: {
        page: 1,
        limit: HOME_PRODUCTS_PER_PAGE,
        total,
        hasMore: HOME_PRODUCTS_PER_PAGE < total
      }
    };
  } catch (error) {
    console.error("Home product prefetch error:", error);
    return {
      products: [],
      pagination: {
        page: 1,
        limit: HOME_PRODUCTS_PER_PAGE,
        total: 0,
        hasMore: false
      }
    };
  }
}

const Home = async () => {
  const { products: initialProducts, pagination } = await getInitialProductsPage();

  return (
    <>
      <Navbar/>
      <div className="px-6 md:px-16 lg:px-32">
        <HeaderSlider />
        <HomeProducts initialProducts={initialProducts} initialPagination={pagination} />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>
      <Footer />
    </>
  );
};

export default Home;
