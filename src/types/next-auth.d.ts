import NextAuth from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's name */
      name?: string | null
      /** The user's email address */
      email?: string | null
      /** The user's profile image */
      image?: string | null
      /** The user's ID (Supabase UUID) */
      id: string
      /** The authentication provider (google, credentials, etc) */
      provider?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}