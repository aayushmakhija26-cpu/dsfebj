import "server-only";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { verifyOTP } from "@/services/auth/otp";

// Session/JWT type extensions
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      userType: "Applicant" | "Staff";
      role?: string;
    };
  }

  interface User {
    userType?: "Applicant" | "Staff";
    role?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),

  providers: [
    // Staff authenticate via email + password (TOTP enforced separately per-request)
    CredentialsProvider({
      id: "staff-credentials",
      name: "Staff Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string, userType: "Staff" },
          include: { staffUser: true },
        });

        if (!user?.staffUser) return null;
        if (user.staffUser.status !== "Active") return null;

        // Password verification delegated to staffUser service (Phase 4)
        // For Phase 2 infrastructure, return user identity only
        return {
          id: user.id,
          email: user.email,
          userType: "Staff",
          role: user.staffUser.role,
        };
      },
    }),
    // Applicant authentication via email OTP
    CredentialsProvider({
      id: "applicant-otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "OTP Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.code) return null;

        const result = await verifyOTP(
          credentials.email as string,
          credentials.code as string,
        );

        if (!result.success || !result.userId) return null;

        const user = await db.user.findUnique({
          where: { id: result.userId },
          select: { id: true, email: true, userType: true },
        });

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          userType: user.userType,
          role: undefined,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 h absolute max; idle timeout enforced per-request
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.role = user.role;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.userType = token.userType as "Applicant" | "Staff";
      session.user.role = token.role as string | undefined;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
});
