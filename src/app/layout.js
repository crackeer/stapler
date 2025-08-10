"use client";
import '@arco-design/web-react/es/_util/react-19-adapter';
import React, { useEffect } from "react";
import "@/styles/globals.css";
import "@arco-design/web-react/dist/css/arco.css";
import cache from "@/util/cache";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body style={{ padding: 8 }}>
               {children}
            </body>
        </html>
    );
}