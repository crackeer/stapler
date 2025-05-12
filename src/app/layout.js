"use client";
import React, { useState, useEffect } from "react";
import "@/styles/globals.css";
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu } from "@arco-design/web-react";
import invoke from "@/util/invoke";
const Sider = Layout.Sider;
const MenuItem = Menu.Item;

export default function RootLayout({ children }) {
    const [activeMenuKey, setActiveMenuKey] = useState([]);
    const clickMenuItem = (item) => {
        window.location.href = item;
        invoke.setWindowTitle(item);
    };
    return (
        <html lang="en">
            <body>
                <Layout>
                    <Sider
                        theme="light"
                        collapsed={false}
                        width={"100px"}
                        style={{
                            overflow: "auto",
                            height: "100vh",
                            position: "fixed",
                            left: 0,
                            top: 0,
                            bottom: 0,
                        }}
                    >
                        <Menu
                            onClickMenuItem={clickMenuItem}
                            theme="light"
                            width="150"
                            selectedKeys={activeMenuKey}
                        >
                            <MenuItem key="/">Home</MenuItem>
                            <MenuItem key="/json">JSON</MenuItem>
                        </Menu>
                    </Sider>
                    <Layout style={{ marginLeft: "100px", padding: "2px" }}>
                        {children}
                    </Layout>
                </Layout>
            </body>
        </html>
    );
}
