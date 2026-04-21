import { clerkClient } from '@clerk/nextjs/server';

const authSeller = async (userId) => {
    try {

        const client = await clerkClient()
        const user = await client.users.getUser(userId)
        
        const role = user?.publicMetadata?.role;
        const normalizedRole = typeof role === 'string' ? role.toLowerCase() : '';

        if (normalizedRole === 'seller') {
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