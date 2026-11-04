import "server-only";

/** Sign-up is always open in dev; in production it needs ALLOW_SIGNUP=true (set it only while creating accounts). */
export const signUpOpen = () => process.env.NODE_ENV !== "production" || process.env.ALLOW_SIGNUP === "true";
