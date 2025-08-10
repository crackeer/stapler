"use client";

import React, { useState, useEffect } from "react";

import {
    Tabs,
    Radio,
} from "@arco-design/web-react";

import Download from './Download'
import Convert from './Convert'
import Parse from './Parse'
const TabPane = Tabs.TabPane;
import { fetch as fetchPageConfig, update as updatePageConfig } from "@/store/PageInit";
export default function VRPage() {
    const [activeTab, setActiveTab] = useState('');
    useEffect(() => {
        fetchPageConfig().then((data) => {
            setActiveTab(data?.activeTab || 'parse');
        });
    }, []);
    const changeActiveTab = (tab) => {
        setActiveTab(tab);
        updatePageConfig({activeTab: tab});
    }
    return (
        <div>
            <Tabs activeTab={activeTab} onChange={changeActiveTab} >
                <TabPane title="解析" key="parse">
                    <Parse />
                </TabPane>
                <TabPane title="下载" key="download" destroyOnHide={false}>
                    <Download />
                </TabPane>
                <TabPane title="转换" key="convert">
                    <Convert />
                </TabPane>
               
            </Tabs>
        </div>
    );
};