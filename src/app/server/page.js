'use client'
import React, { useEffect, useState } from "react";
import { IconPlus, IconDelete } from "@arco-design/web-react/icon"
import { Modal, Card, Button, Form, Input, Table, Space, Grid, Affix, Message, Divider } from "@arco-design/web-react"
import database from "@/util/database";
import { confirm, message } from "@tauri-apps/plugin-dialog";
const FormItem = Form.Item;

function AddServerModal({ visible, setVisible, initValue, callback }) {
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

export default function App() {
    const [visible, setVisible] = useState(false)
    const [serverList, setServerList] = useState([])
    const [initValue, setInitValue] = useState(null)
    useEffect(() => {
        getServerList()
    }, [])

    const columns = [
        {
            title: "名称",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "服务器IP",
            dataIndex: "server",
            key: "server",
        },
        {
            title: "端口",
            dataIndex: "port",
            key: "port",
        },
        {
            title: "用户",
            dataIndex: "user",
            key: "user",
        },
        {
            title: "密码",
            dataIndex: "password",
            key: "password",
            render: (col, record, index) => {
                return '********'
            }
        },
        {
            title: "操作",
            key: 'opt',
            align: 'center',
            render: (col, record, index) => {
                return (
                    <Space>
                        <Button
                            onClick={deleteServer.bind(this, record)}
                            size="mini"
                            type="text"
                            status="danger"
                        >
                            删除
                        </Button>
                        <Button onClick={toCopyServer.bind(this, record)} size="mini" type="text">复制</Button>
                    </Space>
                );
            },
        }
    ]

    const getServerList = async () => {
        let result = await database.getServerList()
        console.log(result)
        setServerList(result)
    }

    const toAddServer = () => {
        setVisible(true)
    }

    const toCopyServer = (item) => {
        setInitValue(item)
        setVisible(true)
    }

    const deleteServer = async (item) => {
        console.log(item)
        let result = await confirm("确认删除服务器吗？")
        if (result === false) {
            return
        }
        try {
            let result = await database.deleteContent(item.id)
            getServerList()
        } catch (e) {
            confirm("删除失败")
        }
    }

    const checkAll = (checked, selectedRows, changeRows) => {
        console.log(checked, selectedRows, changeRows);
      };

    return <div style={{ padding: "5px 10px" }}>
        <Divider orientation="left">
            <Space>
                服务器列表
                <Button onClick={toAddServer} type="outline" size="mini">新增</Button>
            </Space></Divider>
        <Table data={serverList} columns={columns} pagination={false} rowKey={(record) => record.id} rowSelection={
              {
                type: 'checkbox',
                checkAll: true,
                onChange: checkAll,
              }
            }/>
        <AddServerModal visible={visible} setVisible={setVisible} callback={getServerList} initValue={initValue} />
        <Divider orientation="left">已选服务器列表</Divider>
    </div>
}