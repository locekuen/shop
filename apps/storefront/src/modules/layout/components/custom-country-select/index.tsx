"use client"

import ReactCountryFlag from "react-country-flag"
import { HttpTypes } from "@medusajs/types"
import {Dropdown, Space, type MenuProps, Spin} from "antd"
import {useEffect, useState} from "react";
import {updateRegion} from "@lib/data/cart";
import {usePathname, useRouter} from "next/navigation";

type CustomCountrySelectProps = {
    regions: HttpTypes.StoreRegion[]
}

type CountryOption = {
    key: string
    region: string
    label: React.ReactNode
    name: string
}

// Helper function to get cookie value on client side
function getCookie(name: string): string | null {
    if (typeof document === "undefined") {return null}
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {return parts.pop()?.split(";").shift() || null}
    return null
}

function getCountryOptions(
    regions?: HttpTypes.StoreRegion[]
): CountryOption[] {
    return (
        regions?.flatMap((region) =>
            region.countries?.map((country) => ({
                key: country.iso_2 ?? "",
                region: region.id,
                name:country.display_name ?? "",
                label: (<span><ReactCountryFlag countryCode={country.iso_2?.toUpperCase()??""} svg/>{" "}{country.display_name}</span>),
            })) ?? []
        )
            .filter((o) => o.key) // 防止空 key
            .sort((a, b) => a.name.localeCompare(b.name)) ?? []
    )
}

export default function CustomCountrySelect({
                                                regions,
                                            }: CustomCountrySelectProps) {
    const [spinning,setSpinning] = useState(false)
    const [countryCode, setCountryCode] = useState<string | null>(null)
    const router = useRouter()
    // Function to update country code from cookie
    const updateCountryCodeFromCookie = () => {
        const cookieCountryCode = getCookie("_medusa_country_code")
        setCountryCode(cookieCountryCode)
    }
    useEffect(() => {
        // Get country code from cookie on client side
        updateCountryCodeFromCookie()
    }, [])
    const options = getCountryOptions(regions)

    const normalizedCode = countryCode?.toLowerCase()

    const current = normalizedCode
        ? options.find((o) => o.key === normalizedCode)
        : undefined
    const currentPath = usePathname()
    const handleChange = async ({key}:{key?:string}) => {
if (!key){
    return
}
if (key==countryCode){
    return
}
setSpinning(true)
        try {
            // Update the region (this will set the cookie and redirect)
            await updateRegion(key, currentPath)
            updateCountryCodeFromCookie()
            router.refresh()
            setSpinning(false)
            setCountryCode(key)
        } catch (error) {
            // If update fails, revert to previous country code
            setSpinning(false)
            updateCountryCodeFromCookie()
            console.error("Failed to update region:", error)
        }

    }


    return (
        <div>
            <Spin size={"large"} spinning={spinning} fullscreen/>
        <Dropdown menu={{ items: options as MenuProps["items"],selectable: true,selectedKeys: countryCode ? [countryCode] : [],onClick:handleChange}}>
            <Space>
                {current?.label ?? ""}
            </Space>
        </Dropdown>
        </div>
    )
}
