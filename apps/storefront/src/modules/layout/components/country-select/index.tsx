"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"

import { StateType } from "@lib/hooks/use-toggle-state"
import { useParams, usePathname } from "next/navigation"
import { updateRegion } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type CountryOption = {
  country: string
  region: string
  label: string
}

type CountrySelectProps = {
  toggleState: StateType
  regions: HttpTypes.StoreRegion[]
}

// Helper function to get cookie value on client side
function getCookie(name: string): string | null {
  if (typeof document === "undefined") {return null}
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {return parts.pop()?.split(";").shift() || null}
  return null
}

const CountrySelect = ({ toggleState, regions }: CountrySelectProps) => {
  const [current, setCurrent] = useState<CountryOption | undefined>(undefined)
  const [countryCode, setCountryCode] = useState<string | null>(null)
  const currentPath = usePathname()

  const { state, close } = toggleState

  const options = useMemo(() => {
    return regions
      ?.map((r) => {
        return r.countries?.map((c) => ({
          country: c.iso_2 ?? "",
          region: r.id,
          label: c.display_name ?? "",
        }))
      })
      .flat()
      .filter((o): o is CountryOption => !!o)
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regions])

  // Function to update country code from cookie
  const updateCountryCodeFromCookie = () => {
    const cookieCountryCode = getCookie("_medusa_country_code")
    setCountryCode(cookieCountryCode)
  }
  useEffect(() => {
    // Get country code from cookie on client side
    updateCountryCodeFromCookie()

    // Listen for focus events to refresh country code when user returns to the page
    const handleFocus = () => {
      updateCountryCodeFromCookie()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [])
  useEffect(() => {
    if (countryCode) {
      const option = options?.find(
          (o) => o?.country === countryCode.toLowerCase()
      )
      setCurrent(option)
    }
  }, [options, countryCode])
  const handleChange = async (option: CountryOption) => {
    // Optimistically update the UI immediately
    const newCountryCode = option.country.toLowerCase()
    setCountryCode(newCountryCode)
    // updateRegion(option.country, currentPath)
    const selectedOption = options?.find(
        (o) => o?.country?.toLowerCase() === newCountryCode
    )
    if (selectedOption && selectedOption.country) {
      setCurrent({
        country: selectedOption.country,
        region: selectedOption.region,
        label: selectedOption.label,
      })
    }
    close()
    try {
      // Update the region (this will set the cookie and redirect)
      await updateRegion(option.country, currentPath)
    } catch (error) {
      // If update fails, revert to previous country code
      updateCountryCodeFromCookie()
      console.error("Failed to update region:", error)
    }


  }

  return (
    <div>
      <Listbox
        as="span"
        onChange={handleChange}
        defaultValue={
          countryCode
              ? (options?.find(
                  (o) => o?.country?.toLowerCase() === countryCode.toLowerCase()
              ) as CountryOption | undefined)
              : undefined
        }
      >
        <ListboxButton className="py-1 w-full">
          <div className="txt-compact-small flex items-start gap-x-2">
            <span>Shipping to:</span>
            {current && (
              <span className="txt-compact-small flex items-center gap-x-2">
                <ReactCountryFlag
                  svg
                  style={{
                    width: "16px",
                    height: "16px",
                  }}
                  countryCode={current.country ?? ""}
                />
                {current.label}
              </span>
            )}
          </div>
        </ListboxButton>
        <div className="flex relative w-full min-w-[320px]">
          <Transition
            show={state}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              className="absolute -bottom-[calc(100%-36px)] left-0 xsmall:left-auto xsmall:right-0 max-h-[442px] overflow-y-scroll z-[900] bg-white drop-shadow-md text-small-regular uppercase text-black no-scrollbar rounded-rounded w-full"
              static
            >
              {options?.map((o, index) => {
                return (
                  <ListboxOption
                    key={index}
                    value={o}
                    className="py-2 hover:bg-gray-200 px-3 cursor-pointer flex items-center gap-x-2"
                  >
                    <ReactCountryFlag
                      svg
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                      countryCode={o?.country ?? ""}
                    />{" "}
                    {o?.label}
                  </ListboxOption>
                )
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default CountrySelect
