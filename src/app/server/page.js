'use client'
import React, { useEffect, useState } from "react";
import {  Card, Button, Table, Space, Tabs, Divider, Tag } from "@arco-design/web-react"
import database from "@/util/database";
import { confirm } from "@tauri-apps/plugin-dialog";
import ExecuteScript from './ExecuteScript'
import ExecuteCmd from './ExecuteCmd'
import LoadImage from './LoadImage'
import UploadFile from './UploadFile'
import DownloadFile from './DownloadFile'
import AddServer from "./AddServer";
import FileManage from "./FileManage";
import K3s from "./K3s";
const TabPane = Tabs.TabPane;

export default function App() {
    const [visible, setVisible] = useState(false)
    const [serverList, setServerList] = useState([])
    const [initValue, setInitValue] = useState(null)
    const [selectServer, setSelectServer] = useState([])
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
        <AddServer visible={visible} setVisible={setVisible} callback={getServerList} initValue={initValue} />

        <Card title={<Space>
            <strong>已选服务器:</strong>
            {selectServer.map(item => {
                return <Tag>
                    {item.title}（{item.server}）
                </Tag>
            })}
        </Space>} style={{ marginTop: '20px' }}>
            <Tabs defaultActiveTab='1' type="line">
                <TabPane key='1' title='执行命令'>
                    <ExecuteCmd servers={selectServer} />
                </TabPane>
                <TabPane key='2' title='执行脚本'>
                    <ExecuteScript servers={selectServer} />
                </TabPane>
                <TabPane key='6' title='上传文件'>
                    <UploadFile servers={selectServer} />
                </TabPane>
                <TabPane key='7' title='下载文件'>
                    <LoadImage servers={selectServer} />
                </TabPane>
                <TabPane key='4' title='下载文件'>
                    <DownloadFile servers={selectServer} />
                </TabPane>
                <TabPane key='5' title='加载k3s镜像'>
                    <LoadImage servers={selectServer} />
                </TabPane>
                <TabPane key='8' title='文件管理'>
                    <FileManage servers={selectServer} initialDir={'/tmp'}/>
                </TabPane>
                <TabPane key='9' title='k3s信息'>
                    <K3s servers={selectServer} />
                </TabPane>
            </Tabs>
        </Card>
    </div>
}
