"use client";
import React from "react";
import { useEffect } from "react";
import invoke from "@/util/invoke";
export default function Home() {
    useEffect(() => {
        invoke.goLastPage()
    }, []);
    return null
}
