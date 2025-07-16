"use client";
import React from "react";
import { useEffect } from "react";
import cache from "@/util/cache";
export const dynamic = 'auto' // 或 'error' 禁止动态渲染
export const dynamicParams = false // 禁用未定义动态路由

export default function Home() {

    async function redirect() {
        let lastPage = await cache.readFile("last-page") || "/json";
        console.log("getLastPage", lastPage);
        if(lastPage == '/') {
            lastPage = '/json'
        }
        window.location.href = lastPage
    }
    useEffect(() => {
        redirect()
    }, []);
    return null
}
