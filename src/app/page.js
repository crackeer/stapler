"use client";
import React from "react";
import { useEffect } from "react";
import cache from "@/util/cache";
export default function Home() {

    async function redirect() {
        let lastPage = await cache.readFile("last-page") || "/json";
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
