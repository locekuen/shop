import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"
import {COUNTRY_CODE_COOKIE_NAME} from "@lib/data/cookies";

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "dk"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    throw new Error(
      "Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a NEXT_PUBLIC_MEDUSA_BACKEND_URL environment variable."
    )
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const response = await fetch(`${BACKEND_URL}/store/regions`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": PUBLISHABLE_API_KEY!,
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`],
      },
      cache: "force-cache",
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const json = await response.json()

    const { regions } = json

    if (!regions?.length) {
      return new Map<string, HttpTypes.StoreRegion>()
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach((c) => {
        regionMapCache.regionMap.set(c.iso_2 ?? "", region)
      })
    })

    regionMapCache.regionMapUpdated = Date.now()
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
/**
 * Determines the country code from cookie or headers.
 * @param request
 * @param regionMap
 */
async function getCountryCode(
    request: NextRequest,
    regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    // First, check if country code is already in cookie
    const cookieCountryCode = request.cookies.get(COUNTRY_CODE_COOKIE_NAME)?.value?.toLowerCase()
    if (cookieCountryCode && regionMap.has(cookieCountryCode)) {
      return cookieCountryCode
    }

    // Check Vercel IP country header
    const vercelCountryCode = request.headers
        .get("x-vercel-ip-country")
        ?.toLowerCase()
    if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      return vercelCountryCode
    }

    // Fall back to default region
    if (regionMap.has(DEFAULT_REGION)) {
      return DEFAULT_REGION
    }

    // Last resort: use first available region
    if (regionMap.keys().next().value) {
      return regionMap.keys().next().value
    }

    return null
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
          "Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
    return null
  }
}

/**
 * Middleware to handle region selection and onboarding status.
 */
/**
 * Middleware to handle region selection and country code cookie management.
 */
export async function middleware(request: NextRequest) {
  // Check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const cacheIdCookie = request.cookies.get("_medusa_cache_id")
  const cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  if (!regionMap) {
    return new NextResponse(
        "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
        { status: 500 }
    )
  }

  const countryCode = await getCountryCode(request, regionMap)

  if (!countryCode) {
    return new NextResponse(
        "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
        { status: 500 }
    )
  }

  // Create response
  const response = NextResponse.next()

  // Set cache ID cookie if not set
  if (!cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
    })
  }

  // Set country code cookie if not set or different
  const cookieCountryCode = request.cookies.get(COUNTRY_CODE_COOKIE_NAME)?.value
  if (!cookieCountryCode || cookieCountryCode !== countryCode) {
    response.cookies.set(COUNTRY_CODE_COOKIE_NAME, countryCode, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Allow client-side access
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}
