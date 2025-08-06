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
import LoadImage from './LoadImage'
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
    const [remoteDir, setRemoteDir] = useState('/tmp')
    const [selectServer, setSelectServer] = useState([])
    const [sessionMap, setSessionMap] = useState({})
    const [currentServerID, setCurrentServerID] = useState(0)
    const [uploadProgress, setUploadProgress] = useState({})
    const [remoteFile, setRemoteFile] = useState('')
    const [localDir, setLocalDir] = useState('')
    const [downloadProgress, setDownloadProgress] = useState([])
    const [cmdContent, setCmdContent] = useState('')
    const [cmdResult, setCmdResult] = useState([])
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
        if (cmdContent.length < 1) {
            message('请输入命令')
            return
        }
        if (selectServer.length == 0) {
            message('请选择服务器')
            return
        }
        let result = await connectServers()
        if (result == false) {
            return
        }
        let cmdResult = []
        for (let i = 0; i < selectServer.length; i++) {
            let session = sessionMap[selectServer[i].id]
            try {
                cmdResult.push({
                    server: selectServer[i],
                    status: 'executing',
                    output: ''
                })
                setCmdResult([...cmdResult])
                console.log(cmdContent)
                let result = await invoke.sshExecuteCmd(session, cmdContent)
                cmdResult[i].status = 'success'
                cmdResult[i].output = result
            } catch (e) {
                console.log(e)
                cmdResult[i].status = 'failed'
                cmdResult[i].output = e.toString()
            }
            setCmdResult(prevState => {
                prevState[i] = cmdResult[i]
                return [...prevState]
            })
        }
    }

    const uploadFiles = async () => {
        if (uploadFileList.length == 0) {
            message('请选择文件')
            return
        }
        if (selectServer.length == 0) {
            message('请选择服务器')
            return
        }

        if (remoteDir.length < 1) {
            message('请输入远程目录')
            return
        }
        let result = await connectServers()
        if (result == false) {
            return
        }
        let uploadProgress = {}
        for (let i = 0; i < selectServer.length; i++) {
            uploadProgress[selectServer[i].id] = []
            setUploadProgress(uploadProgress)
            setCurrentServerID(selectServer[i].id)
            let serverInfo = selectServer[i]
            for (let j = 0; j < uploadFileList.length; j++) {
                let result = await singleUploadFiles(selectServer[i], uploadFileList[j], remoteDir)
                if (result.success == false) {
                    uploadProgress[selectServer[i].id].push({
                        file: uploadFileList[j],
                        status: 'failure',
                        message: result.message,
                        progress: 0,
                    })
                } else {
                    uploadProgress[selectServer[i].id].push({
                        file: uploadFileList[j],
                        status: 'transferring',
                        message: result.message,
                        progress: 0,
                    })
                }
                console.log(uploadProgress)
                setUploadProgress(uploadProgress)
                let finished = false

                do {
                    try {
                        console.log("query upload progress")
                        let query = await invoke.getTransferProgress()
                        console.log("result", query)
                        uploadProgress[serverInfo.id][j].progress = (parseInt(query.current) / parseInt(query.total) * 100).toFixed(2)
                        uploadProgress[serverInfo.id][j].status = query.status
                        if (query.status != 'transferring') {
                            finished = true
                        }
                    } catch (e) {
                        console.log("exception", e)
                        finished = true
                        uploadProgress[serverInfo.id][j].status = 'failure'
                        uploadProgress[serverInfo.id][j].message = '上传失败' + e.message
                    }
                    setUploadProgress(prev => ({
                        ...prev,
                        [serverInfo.id]: uploadProgress[serverInfo.id],
                    }))
                    await sleep(300)
                } while (!finished)
            }
        }
        message('全部上传完成')
    }

    const downloadFile = async () => {
        if (remoteFile.length == 0) {
            message('请填写远程文件')
            return
        }
        if (selectServer.length == 0) {
            message('请选择服务器')
            return
        }

        let result = await connectServers()
        if (result == false) {
            return
        }
        let downloadProgress = []
        for (let i = 0; i < selectServer.length; i++) {
            let result = await singleDownloadFile(selectServer[i], remoteFile, localDir)
            if (result.success == false) {
                downloadProgress.push({
                    server: selectServer[i],
                    local_file: result.local_file,
                    status: 'failure',
                    message: result.message,
                    progress: 0,
                })
            } else {
                downloadProgress.push({
                    server: selectServer[i],
                    local_file: result.local_file,
                    status: 'transferring',
                    message: result.message,
                    progress: 0,
                })
            }
            console.log(downloadProgress)
            setDownloadProgress(downloadProgress)
            let finished = false

            do {
                try {
                    console.log("query upload progress")
                    let query = await invoke.getTransferProgress()
                    console.log("result", query)
                    downloadProgress[i].progress = (parseInt(query.current) / parseInt(query.total) * 100).toFixed(2)
                    downloadProgress[i].status = query.status
                    if (query.status != 'transferring') {
                        finished = true
                    }
                } catch (e) {
                    console.log("exception", e)
                    finished = true
                    downloadProgress[i].status = 'failure'
                    downloadProgress[i].message = '下载失败' + e.message
                }
                setDownloadProgress([...downloadProgress])
                await sleep(300)
            } while (!finished)
        }
        message('全部下载完成')
    }

    const singleUploadFiles = async (serverInfo, file, remoteDir) => {
        if (sessionMap[serverInfo.id] == null) {
            message('服务器连接失败：' + serverInfo.title)
            return {
                success: false,
                message: '服务器连接失败：' + serverInfo.title
            }
        }
        let name = await basename(file)
        let remoteFile = remoteDir + '/' + name
        try {
            let result = await invoke.uploadRemoteFile(sessionMap[serverInfo.id], file, remoteFile)
            return {
                success: true,
                message: '正在上传中'
            }
        } catch (e) {
            return {
                success: false,
                message: '上传失败'
            }
        }
    }

    const singleDownloadFile = async (serverInfo, remoteFile, localDir) => {
        if (sessionMap[serverInfo.id] == null) {
            message('服务器连接失败：' + serverInfo.title)
            return {
                success: false,
                message: '服务器连接失败：' + serverInfo.title,
                local_file: '',
            }
        }
        let parts = remoteFile.split('/')
        let name = parts[parts.length - 1]
        let localFile = await join(localDir, serverInfo.title + '-' + name)
        try {
            let result = await invoke.downloadRemoteFile(sessionMap[serverInfo.id], localFile, remoteFile)
            return {
                success: true,
                message: '正在下载中',
                local_file: localFile,
            }
        } catch (e) {
            return {
                success: false,
                message: '下载失败' + e.message,
                local_file: localFile,
            }
        }
    }

    const connectServers = async () => {
        let sessions = sessionMap
        for (let i = 0; i < selectServer.length; i++) {
            let item = selectServer[i]
            if (item.id in sessionMap) {
                continue
            }
            try {
                let session = await invoke.sshConnectByPassword(
                    item.server,
                    item.port,
                    item.user,
                    item.password,
                    item.id + ''
                )
                sessions[item.id] = session
            } catch (e) {
                console.log(e)
                message('连接服务器失败：' + item.title)
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

    const selectDirectory = async () => {
        let selected = await open({
            directory: true,
            filters: [
                {
                    name: "File",
                    extensions: [],
                },
            ],
        });
        if (selected == null) {
            return;
        }
        setLocalDir(selected)
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
        <AddServerModal visible={visible} setVisible={setVisible} callback={getServerList} initValue={initValue} />

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
                    <Input.TextArea rows={3} value={cmdContent} onChange={value => {
                        setCmdContent(value)
                    }} />
                    <p>
                        <Button type="outline" onClick={executeCmd}>执行</Button>
                    </p>
                    <List
                        size='small'
                        dataSource={cmdResult}
                        rowKey={(record) => record.server.id}
                        render={(item, index) => <List.Item key={index}>
                            <p><Space>
                                <strong>{item.server.title}#{item.server.server}</strong>
                                <Tag>{item.status}</Tag>
                            </Space></p>
                            <Input.TextArea rows={3} value={item.output} />
                        </List.Item>}
                    />
                </TabPane>
                <TabPane key='2' title='执行脚本'>
                    <ExecuteScript servers={selectServer} />
                </TabPane>
                <TabPane key='3' title='上传文件'>
                    <Button type="primary" onClick={selectFiles}>选择文件</Button>
                    <List
                        size='small'
                        header="待上传文件列表"
                        dataSource={uploadFileList}
                        style={{ marginTop: '15px' }}
                        render={(item, index) => <List.Item key={index} extra={<Button type="outline" size="mini" onClick={() => { setUploadFileList(uploadFileList.filter((item1, index1) => index1 != index)) }}>删除</Button>}>{item}</List.Item>}
                    />
                    <Row gutter={10} style={{ marginTop: '20px' }}>
                        <Col span={2} style={{ textAlign: 'right', paddingTop: '3px' }}>
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
                    <Collapse onChange={key => {
                        setCurrentServerID(key)
                    }} style={{ marginTop: '15px' }} activeKey={currentServerID}>
                        {
                            selectServer.map(item => {
                                if (uploadProgress[item.id] == undefined) {
                                    return null
                                }
                                return <Collapse.Item header={item.title} name={item.id} key={item.id}>
                                    <List
                                        size='small'
                                        dataSource={uploadProgress[item.id]}
                                        rowKey={(record) => record.file}
                                        render={(item1, index) => <List.Item key={index}>
                                            <span>{item1.file}</span>
                                            <Progress percent={item1.progress} status={item1.status == 'success' ? 'success' : 'warning'} />
                                        </List.Item>}
                                    />
                                </Collapse.Item>
                            })
                        }
                    </Collapse>
                </TabPane>
                <TabPane key='4' title='下载文件'>
                    <Row gutter={10} style={{ marginTop: '10px' }}>
                        <Col span={2} style={{ textAlign: 'right', paddingTop: '4px' }}>
                            <strong>远程文件：</strong>
                        </Col>
                        <Col span={12}>
                            <Input placeholder="文件路径" value={remoteFile} onChange={value => {
                                setRemoteFile(value)
                            }} />
                        </Col>
                    </Row>
                    <Row gutter={10} style={{ marginTop: '10px' }}>
                        <Col span={2} style={{ textAlign: 'right', paddingTop: '4px' }}>
                            <strong>本地存放：</strong>
                        </Col>
                        <Col span={12}>
                            <Input placeholder="本地文件夹" value={localDir} onChange={value => {
                                setLocalDir(value)
                            }} />
                            <p>
                                <Button type="outline" onClick={downloadFile}>开始下载</Button>
                            </p>
                        </Col>
                        <Col span={4}>
                            <Button type="outline" onClick={selectDirectory}>选择文件夹</Button>
                        </Col>
                    </Row>

                    <List
                        size='small'
                        dataSource={downloadProgress}
                        rowKey={(record) => record.local_file}
                        render={(item1, index) => <List.Item key={index}>
                            <span>下载到：{item1.local_file}</span>
                            <Progress percent={item1.progress} status={item1.status == 'success' ? 'success' : 'warning'} />
                        </List.Item>}
                    />
                </TabPane>
                <TabPane key='5' title='加载k3s镜像'>
                    <LoadImage servers={selectServer} />
                </TabPane>
            </Tabs>

        </Card>
    </div>
}
