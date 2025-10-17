// Utility function to generate unique referral codes
export function generateReferralCode(): string {
  // Generate a random string with letters and numbers
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  // Generate 8-character code
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

// Function to validate referral code format
export function isValidReferralCode(code: string): boolean {
  // Check if code is 8 characters and contains only letters and numbers
  return /^[A-Z0-9]{8}$/.test(code)
}
