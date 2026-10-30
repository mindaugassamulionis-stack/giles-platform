import {
  type BrandVisualInfo,
  BRAND_LOGOS as BASE_BRAND_LOGOS,
  resolveBrandLogo,
  resolveProductVisual,
  resolveProductImageUrl,
  isExactPhotoSku,
} from "./product-visuals"

export const BRAND_LOGO_PATHS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(BASE_BRAND_LOGOS).map(([key, info]) => [key.toLowerCase(), info.logoPath]),
  ),
  haier: "/images/brands/haier.svg",
  gorenje: "/images/brands/gorenje.svg",
  danfoss: "/images/brands/danfoss.svg",
  herz: "/images/brands/herz.svg",
  "giles-inzinerija": "/images/brands/giles-inzinerija.svg",
  megatherm: "/images/brands/megatherm.svg",
}

export {
  type BrandVisualInfo,
  BASE_BRAND_LOGOS as BRAND_LOGOS,
  resolveBrandLogo,
  resolveProductVisual,
  resolveProductImageUrl,
  isExactPhotoSku,
}
