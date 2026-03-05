import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

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