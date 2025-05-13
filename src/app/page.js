"use client";
import React from "react";
import { useEffect } from "react";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
export default function Home() {

    useEffect(() => {
        async function handleInitialized() {
            const unlisten = await WebviewWindow.getCurrent().once('initialized', (event) => {
                console.log(`Webview initialized!`);
            });
        }
        handleInitialized(null);
    }, []);
    return (
        <div>
            <h1>Hello World</h1>
        </div>
    );
}
