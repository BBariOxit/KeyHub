import { clerkClient } from '@clerk/nextjs/server';

const authSeller = async (userId) => {
    try {

        const client = await clerkClient()
        const user = await client.users.getUser(userId)

        if (user?.publicMetadata?.role === 'seller') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error in Clerk:', error.message);
        return false;
    }
}

export default authSeller;