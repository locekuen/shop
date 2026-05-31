"use client"
import {Input} from "antd";
import {SearchProps} from "antd/es/input";
import {usePathname} from "next/navigation";
const {Search}=Input

export default function CustomSearchProductBox(props: {}){
const currentPath=usePathname();
currentPath.toLowerCase().endsWith("/")
console.log("currentPath:",currentPath)
    const onSearch: SearchProps['onSearch'] = (value, _e, info) => console.log(info?.source, value);

    return(
        <div>
            <Search count={{show:true,max:50}} size={"large"} placeholder="input search text" allowClear onSearch={onSearch} />
        </div>
    )

}
