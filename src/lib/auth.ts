import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error) {
            console.error("Auth error:", error)
            return null
          }

          if (data?.user) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || data.user.email,
            }
          }

          return null
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      if (account?.provider === "google") {
        token.provider = "google"
      }
      return token
    },
    async session({ session, token }) {
      if (token?.sub && session?.user) {
        (session.user as any).id = token.sub;
        (session.user as any).provider = token.provider
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user already exists in Supabase by listing users and filtering by email
          const { data: userList, error: listError } = await supabase.auth.admin.listUsers()
          
          if (listError) {
            console.error("Error listing users:", listError)
            return false
          }

          const existingUser = userList.users.find(u => u.email === user.email)

          // If user doesn't exist, create them in Supabase
          if (!existingUser) {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: user.email,
              email_confirm: true,
              user_metadata: {
                name: user.name,
                picture: user.image,
                provider: 'google',
                google_id: account.providerAccountId
              }
            })

            if (createError) {
              console.error("Error creating user in Supabase:", createError)
              return false
            }

            // Update token with Supabase user ID
            if (newUser.user) {
              user.id = newUser.user.id
            }
          } else {
            // User exists, update their info if needed
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              {
                user_metadata: {
                  ...existingUser.user_metadata,
                  name: user.name,
                  picture: user.image,
                  provider: 'google',
                  google_id: account.providerAccountId
                }
              }
            )

            if (updateError) {
              console.error("Error updating user in Supabase:", updateError)
              // Don't fail sign in if update fails
            }

            // Use existing Supabase user ID
            user.id = existingUser.id
          }
        } catch (error) {
          console.error("Error in Google OAuth sign in:", error)
          return false
        }
      }
      return true
    },
  },
}
