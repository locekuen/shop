import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import {retrieveCustomer} from "@lib/data/customer";
import AccountDropdown from "@modules/account/components/account-dropdown";
import {Space} from "antd";
import CustomLanguageSelect from "@modules/layout/components/custom-language-select";
import CustomCountrySelect from "@modules/layout/components/custom-country-select";
import CustomSearchProductBox from "@modules/layout/components/search-product-box";

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])
  console.log("regions:",regions)
  console.log("locales:",locales)
  console.log("currentLocale:",currentLocale)


  const customer = await retrieveCustomer()
  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container txt-xsmall-plus text-ui-fg-subtle flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <Space>
              <CustomLanguageSelect locales={locales} currentLocale={currentLocale}/>
              <CustomCountrySelect regions={regions}/>
            </Space>
            {/*<div className="h-full">*/}

              {/*<CustomLanguageSelect regions={regions}/>*/}
              {/*<SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />*/}
            {/*</div>*/}
          </div>
          <div className="flex items-center h-full">
            <CustomSearchProductBox/>
            {/*<LocalizedClientLink*/}
            {/*  href="/"*/}
            {/*  className="txt-compact-xlarge-plus hover:text-ui-fg-base uppercase"*/}
            {/*  data-testid="nav-store-link"*/}
            {/*>*/}
            {/*  Medusa Store*/}
            {/*</LocalizedClientLink>*/}
          </div>
          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <Space>
              {
                customer ? (
                    <AccountDropdown>
                      <LocalizedClientLink href={"/account"}>
                        Hello, {customer.first_name}
                      </LocalizedClientLink>
                    </AccountDropdown>
                ) : (
                    <LocalizedClientLink
                        className="hover:text-ui-fg-base"
                        href="/account"
                    >
                      {"Sign in"}
                    </LocalizedClientLink>
                )
              }
              <Suspense
                  fallback={
                    <LocalizedClientLink
                        className="hover:text-ui-fg-base flex gap-2"
                        href="/cart"
                        data-testid="nav-cart-link"
                    >
                      Cart (0)
                    </LocalizedClientLink>
                  }
              >
                <CartButton />
              </Suspense>
              <div>haha</div>
            </Space>
          </div>
        </nav>
      </header>
    </div>
  )
}

