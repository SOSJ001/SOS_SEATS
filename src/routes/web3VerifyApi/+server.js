import { json } from "@sveltejs/kit";

export async function GET({ cookies }) {
    try {
        const web3Session = cookies.get("web3Session");
        
        if (!web3Session) {
            return json({ valid: false, error: "No session found" }, { status: 401 });
        }

        // Parse session data
        let sessionData;
        try {
            sessionData = JSON.parse(web3Session);
        } catch (parseError) {
            console.error("Error parsing Web3 session:", parseError);
            cookies.delete("web3Session", { path: "/" });
            return json({ valid: false, error: "Invalid session format" }, { status: 401 });
        }

        // Validate session structure
        if (!sessionData.type || sessionData.type !== 'web3' || !sessionData.user || !sessionData.wallet_address) {
            cookies.delete("web3Session", { path: "/" });
            return json({ valid: false, error: "Invalid session structure" }, { status: 401 });
        }

        // Check if session is expired (optional - you can add expiration logic here)
        if (sessionData.created_at) {
            const sessionAge = Date.now() - new Date(sessionData.created_at).getTime();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
            
            if (sessionAge > maxAge) {
                cookies.delete("web3Session", { path: "/" });
                return json({ valid: false, error: "Session expired" }, { status: 401 });
            }
        }

        return json({ 
            valid: true, 
            user: sessionData.user,
            wallet_address: sessionData.wallet_address 
        }, { status: 200 });
        
    } catch (error) {
        console.error("Web3 session verification error:", error);
        return json({ valid: false, error: "Internal server error" }, { status: 500 });
    }
} 