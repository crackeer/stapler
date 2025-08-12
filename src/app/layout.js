"use client";
import '@arco-design/web-react/es/_util/react-19-adapter';
import React, { useEffect } from "react";
import "@/styles/globals.css";
import "@arco-design/web-react/dist/css/arco.css";
import invoke from '@/util/invoke'
export default function RootLayout({ children }) {
    useEffect(() => {
        invoke.isDev().then(result => {
            if (result) {
                window.addEventListener('contextmenu', (e) => {
                    e.preventDefault(); // 阻止默认右键菜单
                })
            }
        })
    }, [])
    return (
        <html lang="en">
            <body style={{ padding: 8 }}>
                {children}
            </body>
        </html>
    );
}
