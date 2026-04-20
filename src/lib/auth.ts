import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Phone and password are required");
        }

        // Normalize phone number to 254XXXXXXXXX
        let phone = credentials.phone.replace(/\s+/g, "").replace(/-/g, "");
        if (phone.startsWith("+254")) phone = phone.substring(1);
        else if (phone.startsWith("0")) phone = "254" + phone.substring(1);
        else if (!phone.startsWith("254")) phone = "254" + phone;

        const user = await prisma.user.findUnique({
          where: { phone },
        });

        if (!user) {
          throw new Error("Invalid phone number or password");
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Account is temporarily locked. Please try again later.");
        }

        if (user.status === "BANNED") {
          throw new Error("Account has been banned. Contact support.");
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Account is suspended. Contact support.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValidPassword) {
          const attempts = user.loginAttempts + 1;
          const updateData: Record<string, unknown> = { loginAttempts: attempts };

          if (attempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            updateData.loginAttempts = 0;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });

          throw new Error("Invalid phone number or password");
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.status,
          phoneVerified: user.phoneVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as unknown as { role: string; status: string; phoneVerified: boolean };
        token.role = u.role;
        token.status = u.status;
        token.phoneVerified = u.phoneVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).status = token.status;
        (session.user as Record<string, unknown>).phoneVerified = token.phoneVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
