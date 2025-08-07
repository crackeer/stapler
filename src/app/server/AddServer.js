'use client'
import React, { useEffect, useState } from "react";
import { IconPlus, IconDelete } from "@arco-design/web-react/icon"
import { Modal, Card, Button, Form, Input, Table, Space, Grid, Tabs, Collapse, Divider, List, Tag, Progress } from "@arco-design/web-react"
import database from "@/util/database";
import { confirm, message, open } from "@tauri-apps/plugin-dialog";
import { basename, join } from "@tauri-apps/api/path"
import invoke from "@/util/invoke";
import { sleep } from "@/util/common";
import ExecuteScript from './ExecuteScript'
import ExecuteCmd from './ExecuteCmd'
import LoadImage from './LoadImage'
import UploadFile from './UploadFile'
import DownloadFile from './DownloadFile'
const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const Row = Grid.Row;
const Col = Grid.Col;

export default function AddServer({ visible, setVisible, initValue, callback }) {
    const [selfVisible, setSelfVisible] = useState(visible)
    const [form] = Form.useForm();
    useEffect(() => {
        setSelfVisible(visible)
        if (initValue != null) {
            form.setFieldsValue({
                server: initValue.server,
                user: initValue.user,
                password: initValue.password,
                port: initValue.port,
                name: initValue.title,
            })
        } else {
            form.setFieldsValue({
                server: "",
                user: "root",
                password: "",
                port: "22",
            })
        }
    }, [visible, initValue])
    var doAddServer = async () => {
        let valid = await form.validate()
        if (!valid) {
            return
        }
        let data = form.getFieldsValue()
        let content = {
            server: data.server,
            user: data.user,
            password: data.password,
            port: data.port,
        }
        try {
            let result = await database.createServer(data.name, JSON.stringify(content))
            callback()
            setSelfVisible(false)
            setVisible(false)
        } catch (error) {
            message('添加失败')
            return
        }
    }
    return <Modal visible={selfVisible} title="新增Server配置" onCancel={() => {
        setSelfVisible(false)
        setVisible(false)
    }} style={{ width: '60%' }} onConfirm={doAddServer}>
        <Form autoComplete="off" form={form}>
            <FormItem label="服务器名称" field="name"><Input placeholder="服务器名称" rules={[{ required: true, message: '请输入服务器名称' }]} /></FormItem>
            <FormItem label="服务器IP" field="server"><Input placeholder="服务器IP" rules={[{ required: true, message: '请输入服务器IP' }]} /></FormItem>
            <FormItem label="用户" field="user"><Input placeholder="用户" rules={[{ required: true, message: '请输入用户' }]} /></FormItem>
            <FormItem label="密码" field="password"><Input placeholder="密码" type="password" rules={[{ required: true, message: '请输入密码' }]} /></FormItem>
            <FormItem label="端口" field="port"><Input placeholder="端口" rules={[{ required: true, message: '请输入端口' }]} /></FormItem>
        </Form>
    </Modal>
}