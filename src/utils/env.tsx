export const isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";
export const isChessmadra =
  import.meta.env.VITE_SITE == "chessmadra" || (!import.meta.env.SSR && window.location.hostname === "chessmadra.com")
