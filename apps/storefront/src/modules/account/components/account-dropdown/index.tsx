"use client"

import { Dropdown } from "antd"
import type { MenuProps } from "antd"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signout } from "@lib/data/customer"
import {ReactNode} from "react";

export default function AccountDropdown({
                                            children,
                                        }: {
    children?: ReactNode
}) {
    const items: MenuProps["items"] = [
        {
            key: "account",
            label: (
                <LocalizedClientLink href="/account">
                    Account
                </LocalizedClientLink>
            ),
        },
        {
            key: "orders",
            label: (
                <LocalizedClientLink href="/account/orders">
                    Orders
                </LocalizedClientLink>
            ),
        },
        {
            key: "logout",
            label: "Sign Out",
            onClick: async () => {
                await signout()
            },
        },
    ]

    return (
        <Dropdown menu={{ items }} arrow>
            {children}
        </Dropdown>
    )
}
