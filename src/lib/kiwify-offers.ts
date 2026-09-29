/** Public checkout metadata. Entitlements must only be granted by the verified server webhook. */
export const kiwifyOffers = {
  monthly: {
    productId: "a7c0d800-babb-11f1-b862-8f9991c1f93d",
    checkoutCode: "RGDMcYQ",
    checkoutUrl: "https://pay.kiwify.com.br/RGDMcYQ",
    priceCents: 2900,
    billingCycle: "monthly",
  },
  yearly: {
    productId: "a7c0d800-babb-11f1-b862-8f9991c1f93d",
    checkoutCode: "b1Y8f96",
    checkoutUrl: "https://pay.kiwify.com.br/b1Y8f96",
    priceCents: 24700,
    billingCycle: "yearly",
  },
  lifetime: {
    productId: "7e73c3d0-babc-11f1-845f-f15309390953",
    checkoutCode: "L7v2NLk",
    checkoutUrl: "https://pay.kiwify.com.br/L7v2NLk",
    priceCents: 34700,
    billingCycle: "lifetime",
  },
} as const;

/** The two recurring offers share a product ID; identify them by checkout link. */
export function offerFromCheckout(productId: string, checkoutLink: string) {
  const code = checkoutLink.replace(/\/$/, "").split("/").pop();
  return Object.entries(kiwifyOffers).find(
    ([, offer]) => offer.productId === productId && offer.checkoutCode === code,
  )?.[0] as keyof typeof kiwifyOffers | undefined;
}
