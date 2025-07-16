'use client'

import React, { useState, useEffect } from 'react';

import {  Button, Space, Modal, Card, Input, Divider, Steps, Tag, Message, Grid, Tabs, Form, Checkbox, Radio } from '@arco-design/web-react';
const Row = Grid.Row;
const Col = Grid.Col;

import invoke from '@/util/invoke.js';
const VRPage = () => {
    const [observerCount, setObserverCount] = useState(0);
    const [downloadList, setDownloadList] = useState([]);
    const [current, setCurrent] = useState("");
    const [downloadStatus, setDownloadStatus] = useState("");
    const [form] = Form.useForm();

    useEffect(() => {
    }, []);

    const parseRsVr = async () => {
        let url = form.getFieldValue('url');
        try {
            let res = await invoke.evalJsOnPage(url, "document.title");
            console.log(res);
        } catch (e) {
            console.log(e);
        } 
    };

    return (
        <div>
            <div style={{ margin: '0 10%' }}>
                <Form autoComplete='off' form={form} labelCol={{ span: 4 }}>
                    <Form.Item label='URL' field='url' rules={[{ required: true, message: 'URL不能为空' }]} >
                        <Input placeholder='please enter URL, eg: https://www.baidu.com' />
                    </Form.Item>

                    <Form.Item label='操作'>
                        <Button type='primary' size='small' onClick={parseRsVr}>Parse</Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );

}

export default VRPage;
