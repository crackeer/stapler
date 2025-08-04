'use client'
import React, { useEffect, useState } from "react";
import { IconPlus, IconDelete } from "@arco-design/web-react/icon"
import { Modal, Card, Button, Form, Input, Table, Space, Grid, Tabs, Message, Divider, List, Tag } from "@arco-design/web-react"
import database from "@/util/database";
import { confirm, message, open } from "@tauri-apps/plugin-dialog";
import {basename} from "@tauri-apps/api/path"
import invoke from "@/util/invoke";
const FormItem = Form.Item;
const TabPane = Tabs.TabPane;
const Row = Grid.Row;
const Col = Grid.Col;
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
    const [uploadFileList, setUploadFileList] = useState([])
    const [remoteDir, setRemoteDir] = useState('')
    const [selectServer, setSelectServer] = useState([])
    const [sessionMap, setSessionMap] = useState({})
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
            setSelectServer(selectServer.filter(tmp => tmp.id != item.id))
        } catch (e) {
            confirm("删除失败")
        }
    }

    const checkAll = (checked, selectedRows, changeRows) => {
        setSelectServer(selectedRows)
    };

    const executeCmd = async () => {

    }

    const uploadFiles = async () => {
        if(uploadFileList.length == 0) {
            message('请选择文件')
            return
        }
        if(selectServer.length == 0) {
            message('请选择服务器')
            return
        }

        if (remoteDir.length < 1) {
            message('请输入远程目录')
            return
        }
        let result =  await connectServers()
        if(result == false) {
            return
        }
        for(let i = 0; i < selectServer.length; i++) {
            for(let j = 0; j < uploadFileList.length; j++) {
                let item = uploadFileList[j]
                let result = await singleUploadFiles(selectServer[i], item, remoteDir)
                if(result == false) {
                    return
                }
            }
        }
        
    }

    const singleUploadFiles = async (serverInfo, file, remoteDir) => {
        if(sessionMap[serverInfo.id] == null) {
            message('服务器连接失败：' + serverInfo.title)
            return false
        }
        let name = await basename(file)
        let remoteFile = remoteDir + '/' + name
        try {
            let result = await invoke.uploadRemoteFile(sessionMap[serverInfo.id], file, remoteFile)
            console.log(result, file, remoteFile)
            return true
        } catch (e) {
            message('上传文件失败')
            return false
        }
       
    }

    const connectServers = async () => {
        let sessions = sessionMap
        for(let i = 0; i < selectServer.length; i++) {
            let item = selectServer[i]
            if(item.id in sessionMap) {
                continue
            }
            try {
                console.log(item)
                let session = await invoke.sshConnectServer(
                    item.server,
                    item.port,
                    item.user,
                    item.password,
                )
                console.log(session)
                sessions[item.id] = session
            } catch (e) {
                console.log(e)
                message('连接服务器失败')
                return false
            }
        }
        setSessionMap(sessions)
        return true
    }

    const selectFiles = async () => {
        let files = await open({
            multipart: true,
            filters: [
                {
                    name: "",
                    extensions: [],
                },
            ],
        });
        if (files == null) {
            return
        }

        setUploadFileList([files, ...uploadFileList])
    }

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
        } />
        <AddServerModal visible={visible} setVisible={setVisible} callback={getServerList} initValue={initValue} />

        <Card title={'执行操作'} style={{ marginTop: '20px' }}>
            <Space>
                <strong>已选服务器:</strong>
                {selectServer.map(item => {
                    return <Tag>
                        {item.title}（{item.server}）
                    </Tag>
                })}
            </Space>
            <Tabs defaultActiveTab='1' type="line" style={{ marginTop: '15px' }}>
                <TabPane key='1' title='执行命令'>
                    <Input.TextArea rows={8} />
                    <p>
                        <Button type="outline" onClick={executeCmd}>执行</Button>
                    </p>
                </TabPane>
                <TabPane key='2' title='上传文件'>
                    <Button type="primary" onClick={selectFiles}>选择文件</Button>
                    <List
                        size='small'
                        header="待上传文件列表"
                        dataSource={uploadFileList}
                        style={{ marginTop: '15px' }}
                        render={(item, index) => <List.Item key={index}>{item}</List.Item>}
                    />
                    <Row gutter={10} style={{ marginTop: '20px' }}>
                        <Col span={3} style={{ textAlign: 'right', paddingTop: '3px' }}>
                            <strong>远程位置：</strong>
                        </Col>
                        <Col span={12}>
                            <Input placeholder="远程服务器文件夹" value={remoteDir} onChange={value => {
                                setRemoteDir(value)
                            }} />
                        </Col>
                        <Col span={4}>
                            <Button type="outline" onClick={uploadFiles}>上传</Button>
                        </Col>
                    </Row>
                </TabPane>
                <TabPane key='3' title='下载文件'>

                </TabPane>
            </Tabs>
        </Card>
    </div>
}
