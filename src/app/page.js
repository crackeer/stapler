"use client";
import React from "react";
import { useEffect } from "react";
import cache from "@/util/cache";
export default function Home() {

    async function redirect() {
        let lastPage = await cache.readFile("last-page") || "/web/qrcode";
        window.location.href = lastPage
    }
    useEffect(() => {
        redirect()
    }, []);
    return null
}
