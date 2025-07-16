export async function load({ cookies }) {
  // Get user session from cookies
  const cookievar1 = cookies.get("session");
  
  // You can add logic here to fetch real event data from your database
  // For now, we'll return the basic user data
  
  return {
    cookievar1,
    user_Id: cookievar1, // Assuming the session contains user ID
    userName: "User" // This could be fetched from database
  };
} 