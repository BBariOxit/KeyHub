import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Review from "@/models/Review";
import mongoose from "mongoose";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "keyhub" });


// inngest func to save user data to a database
export const syncUserCreation = inngest.createFunction(
  {
    id:'sync-user-from-clerk'
  },
  {
    event: 'clerk/user.created'
  },
  async ({event, step}) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      imageUrl: image_url
    }
    await step.run("connect-to-db", async () => {
      await connectDB()
    })
    await step.run("save-user-to-db", async () => {
      return await User.findOneAndUpdate({ _id: id }, userData, { upsert: true })
    })
  }
)

// inngest func to update user data to a database
export const syncUserUpdation = inngest.createFunction(
  {
    id: 'update-user-from-clerk'
  },
  {
    event: 'clerk/user.updated'
  },
  async ({event, step}) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      imageUrl: image_url
    }
    await step.run("connect-to-db", async () => {
      await connectDB()
    })
    await step.run("update-user-in-db", async () => {
      return await User.findByIdAndUpdate(id, userData)
    })
  }
)

// inngest func to delete user data to a database
export const syncUserDeletion = inngest.createFunction(
  {
    id: 'delete-user-with-clerk'
  },
  { 
    event: 'clerk/user.deleted'
  },
  async ({event, step}) => {
    const { id } = event.data
    await step.run("connect-to-db", async () => {
      await connectDB()
    })
    await step.run("delete-user-from-db", async () => {
      return await User.findByIdAndDelete(id)
    })
  }
)

// inngest func to create user's order in db
export const createUserOrder = inngest.createFunction(
  {
    id: 'create-user-order',
    batchEvents: {
      maxSize: 5,
      timeout: '5s'
    }
  },
  {
    event: 'order/created'
  },
  async ({events, step}) => {
    const orders = events.map((event) => {
      return {
        userId: event.data.userId,
        items: event.data.items.map(item => ({
          product: item.product,
          quantity: Number(item.quantity)
        })),
        amount: Number(event.data.amount),
        address: event.data.address,
        date: event.data.date || Date.now()
      }
    })

    await step.run('save-orders-to-db', async () => {
      await connectDB()
      await Order.insertMany(orders)
      // Không cần return result ở đây nếu chỉ cần đếm số lượng
    })
    
    return { success: true, processed: orders.length }
  }
)

// inngest func to recompute product rating summary when review changes
export const syncProductReviewSummary = inngest.createFunction(
  {
    id: 'sync-product-review-summary'
  },
  {
    event: 'product/review.created'
  },
  async ({ event, step }) => {
    const rawProductId = String(event?.data?.productId || '')

    if (!mongoose.Types.ObjectId.isValid(rawProductId)) {
      return { success: false, reason: 'invalid-product-id' }
    }

    const productId = new mongoose.Types.ObjectId(rawProductId)

    await step.run('connect-to-db', async () => {
      await connectDB()
    })

    const summary = await step.run('aggregate-product-review-summary', async () => {
      const [stats] = await Review.aggregate([
        { $match: { productId } },
        {
          $group: {
            _id: '$productId',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])

      const averageRating = Number.isFinite(stats?.averageRating)
        ? Number(stats.averageRating.toFixed(2))
        : 0
      const totalReviews = Number.isFinite(stats?.totalReviews)
        ? stats.totalReviews
        : 0

      return { averageRating, totalReviews }
    })

    await step.run('update-product-rating-summary', async () => {
      await Product.findByIdAndUpdate(rawProductId, {
        $set: {
          averageRating: summary.averageRating,
          totalReviews: summary.totalReviews
        }
      })
    })

    return { success: true, productId: rawProductId, ...summary }
  }
)