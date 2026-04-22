import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma, type Merchant, type User } from "@prisma/client";

const CLERK_PROVIDER = "clerk";

type SessionClaims = Awaited<ReturnType<typeof auth>>["sessionClaims"];

type ClerkIdentity = {
  email: string;
  name: string;
  image: string | null;
};

const getClaimString = (
  sessionClaims: SessionClaims | null | undefined,
  ...keys: string[]
): string | null => {
  if (!sessionClaims) return null;

  const claims = sessionClaims as Record<string, unknown>;

  for (const key of keys) {
    const value = claims[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const getClerkIdentity = (sessionClaims: SessionClaims): ClerkIdentity => {
  const email = getClaimString(
    sessionClaims,
    "email",
    "primaryEmail",
    "email_address",
  );

  if (!email) {
    throw new Error("Authenticated Clerk user is missing an email claim.");
  }

  const name =
    getClaimString(sessionClaims, "fullName", "full_name", "name") ??
    email.split("@")[0];

  const image = getClaimString(sessionClaims, "imageUrl", "image_url", "picture");

  return { email, name, image };
};

const buildUserUpdateData = (
  appUser: Pick<User, "email" | "name" | "image">,
  identity: ClerkIdentity,
): Prisma.UserUpdateInput => {
  const data: Prisma.UserUpdateInput = {};

  if (appUser.email !== identity.email) {
    data.email = identity.email;
  }

  if (appUser.name !== identity.name) {
    data.name = identity.name;
  }

  if (appUser.image !== identity.image) {
    data.image = identity.image;
  }

  return data;
};

const syncClerkUserIntoApp = async (): Promise<User | null> => {
  const { userId, sessionClaims } = await auth();

  if (!userId) return null;

  let identity: ClerkIdentity;
  
  try {
    identity = getClerkIdentity(sessionClaims);
  } catch (error) {
    // Fallback: Fetch full user object if claims are missing email
    const user = await currentUser();
    if (!user || !user.emailAddresses?.[0]?.emailAddress) {
      throw new Error("Unable to identify Clerk user email.");
    }
    
    identity = {
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.emailAddresses[0].emailAddress.split("@")[0],
      image: user.imageUrl,
    };
  }
  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: CLERK_PROVIDER,
        providerAccountId: userId,
      },
    },
    include: {
      user: true,
    },
  });

  if (linkedAccount?.user) {
    const updateData = buildUserUpdateData(linkedAccount.user, identity);

    if (Object.keys(updateData).length === 0) {
      return linkedAccount.user;
    }

    return prisma.user.update({
      where: { id: linkedAccount.user.id },
      data: updateData,
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: identity.email },
  });

  if (existingUser) {
    const updateData = buildUserUpdateData(existingUser, identity);

    const [appUser] = await prisma.$transaction([
      Object.keys(updateData).length > 0
        ? prisma.user.update({
            where: { id: existingUser.id },
            data: updateData,
          })
        : prisma.user.findUniqueOrThrow({
            where: { id: existingUser.id },
          }),
      prisma.account.create({
        data: {
          userId: existingUser.id,
          type: "oauth",
          provider: CLERK_PROVIDER,
          providerAccountId: userId,
        },
      }),
    ]);

    return appUser;
  }

  return prisma.user.create({
    data: {
      email: identity.email,
      name: identity.name,
      image: identity.image,
      password: null,
      accounts: {
        create: {
          type: "oauth",
          provider: CLERK_PROVIDER,
          providerAccountId: userId,
        },
      },
    },
  });
};

export async function getAuthContext(): Promise<{
  appUser: User;
  merchant: Merchant | null;
} | null> {
  const appUser = await syncClerkUserIntoApp();

  if (!appUser) return null;

  const merchant = await prisma.merchant.findFirst({
    where: { userId: appUser.id },
  });

  return { appUser, merchant };
}

export async function getRequiredAppUser() {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  return context.appUser;
}

export async function getRequiredDashboardContext(): Promise<{
  appUser: User;
  merchant: Merchant;
}> {
  const context = await getAuthContext();

  if (!context) {
    redirect("/login");
  }

  const { merchant } = context;
  const hasPaymentMethod = merchant?.razorpayKeyId || merchant?.upiId;

  if (!merchant || !merchant.whatsappNumber || !hasPaymentMethod) {
    redirect("/onboarding");
  }

  return {
    appUser: context.appUser,
    merchant,
  };
}

export async function getRequiredAdminUser() {
  const appUser = await getRequiredAppUser();

  if (appUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return appUser;
}

/**
 * Gets the current authenticated merchant from the session.
 * If not authenticated, redirects to login.
 * If no merchant found, redirects to the merchant setup page?
 */
export async function getRequiredMerchant(): Promise<Merchant> {
  const { merchant } = await getRequiredDashboardContext();
  return merchant;
}

/**
 * Simplified helper for server components that just need the ID.
 */
export async function getRequiredMerchantId() {
  const merchant = await getRequiredMerchant();
  return merchant?.id || null;
}
