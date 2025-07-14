"use client";
import React from "react";
import { useEffect, useState } from "react";
import { message, open, confirm } from '@tauri-apps/plugin-dialog';
import { basename } from '@tauri-apps/api/path'
import {
    Upload,
    Button,
    Layout,
    Form,
    Input,
    Card,
    Message,
    Divider,
    Space,
    Link,
    Table,
    Popconfirm 
} from "@arco-design/web-react";
import '@arco-design/web-react/es/_util/react-19-adapter';
import invoke from "@/util/invoke";
import cache from "@/util/cache";
import common from "@/util/common";
const getLastForm = async () => {
    let data = await cache.readFile("lastFtpForm");
    if (data === null) {
        return {
            host: '',
            port: '21',
            username: '',
            password: '',
        }
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return {
            host: '',
            port: '21',
            username: '',
            password: '',
        }
    }
}

const writeLastForm = async (data) => {
    await cache.writeFile("lastFtpForm", JSON.stringify(data));
}

const FtpPage = () => {
    const [connectKey, setConnectKey] = useState('');
    const [currentDir, setCurrentDir] = useState("");
    const [list, setList] = useState([]);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newDirName, setNewDirName] = useState('');

    var init = async () => {
        let data = await getLastForm();
        console.log(data)

        form.setFieldValue("host", data.host);
        form.setFieldValue("port", data.port);
        form.setFieldValue("username", data.username);
        form.setFieldValue("password", data.password);
    }

    useEffect(() => {
        init();
        return () => {
            invoke.disconnectFTPServer(connectKey)
        }
    }, []);

    const tableColumns = [
        {
            title: 'name',
            dataIndex: 'name',
            render: (text, record) => {
                if (record.type == 'directory') {
                    return <Link onClick={goDirectory.bind(this, record.name)}>{text}</Link>
                }
                return text
            }
        },
        {
            title: 'perm',
            dataIndex: 'perm',
        },
        {
            title: 'size',
            dataIndex: 'size',
        },
        {
            title: 'date',
            dataIndex: 'date',
        },
        {
            title: 'time',
            dataIndex: 'time',
        },
        {
            title: '操作',
            render: (text, record) => {
                return <Space>                    
                    <Button size='small' type='text' onClick={deleteFile.bind(this, record)}>删除</Button>
                    <Button size='small' type='text'>下载</Button>
                </Space>
            }
        }
    ]

    const connectFTPServer = async () => {
        try {
            const values = await form.validate();
            console.log(values)

            await writeLastForm(values);

            let result = await invoke.connectFTPServer(
                values.host,
                parseInt(values.port),
                values.username,
                values.password
            )
            setConnectKey(result)
            refreshFiles(result, currentDir)
        } catch (e) {
            console.log("Error", e)
            message(e, { title: 'Tauri', kind: 'error' });
        }
    };

    const goDirectory = (name) => {
        if (currentDir.length < 1) {
            setCurrentDir(name)
            refreshFiles(connectKey, name)
        } else {
            setCurrentDir(currentDir + '/' + name)
            refreshFiles(connectKey, currentDir + '/' + name)
        }
    }

    const refreshFiles = async (key, dir) => {
        console.log("key", key)
        if (key === '') {
            return
        }
        setLoading(true)
        let files = await invoke.listFTPFiles(key, dir);
        setLoading(false)

        let list = common.formatCommandOutput(files, 0, [
            "perm", 'index', 'from1', 'from2', 'size', 'date', 'date', 'time', 'name'
        ])
        for (let i = 0; i < list.length; i++) {
            list[i].type = list[i].perm.indexOf('d') == 0 ? 'directory' : 'file';
        }
        list = list.sort((a, b) => {
            if (a.type == b.type) {
                return a.name.localeCompare(b.name);
            }
            return a.type == 'directory' ? -1 : 1;
        })
        console.log(list)
        setList(list);

    }

    const toUpload = async () => {
        let file = await open({
            multipart: false,
            filters: [
            ],
        });
        if (file == null) return;
        try {
            let name = await basename(file)
            let savePath = [currentDir, name].join('/')
            setUploading(true)
            let result = await invoke.ftpUploadFile(connectKey, savePath, file)
            setUploading(false)
            console.log(result)
            message("上传成功")
            refreshFiles(connectKey, currentDir)

        } catch (e) {
            setUploading(false)
            message(e)
        }
    }

    const goUpper = () => {
        if (currentDir == '.') {
            return
        }
        let dir = currentDir.split('/')
        dir.pop()
        setCurrentDir(dir.join('/'))
        refreshFiles(connectKey, dir.join('/'))
    }

    const toDelete = async (record) => {
        let confirm = await confirm("确认删除`" + record.name + "`吗？")

        if (!confirm) {
            return
        }
        let path = [currentDir, record.name].join('/')
        if (record.type == 'directory') {
            let result = await invoke.ftpDeleteDir(connectKey, path)
            console.log(result)
            message("删除成功")
            refreshFiles(connectKey, currentDir)
            return
        }
        let result = await invoke.ftpDeleteFile(connectKey, path)
        console.log(result)
        message("删除成功")
        refreshFiles(connectKey, currentDir)
    }

    var disconnectFTPServer = async () => {
        try {
            await invoke.disconnectFTPServer(connectKey)
            setConnectKey('')
        } catch (e) {
            message(e)
            setConnectKey('')
        }
    }

    var createDir = async () => {
        try {
            if (newDirName.length < 1) {
                message('请输入文件夹名称')
                return
            }
            let path = [currentDir, newDirName].join('/')
            await invoke.ftpCreateDir(connectKey, path)
            setNewDirName('')
            refreshFiles(connectKey, currentDir)
        } catch (e) {
            message(e)
        }
    }

    return (
        <>
            <Card>
                <Form
                    id="refreshForm"
                    layout="inline"
                    form={form}
                    style={{ width: "auto" }}
                    disabled={connectKey.length > 0}
                >
                    <Form.Item
                        field="host"
                        label="host"
                        rules={[{ required: true, message: "请输入主机" }]}
                    >
                        <Input placeholder="输入host" />
                    </Form.Item>
                    <Form.Item
                        field="port"
                        label="port"
                        rules={[{ required: true, message: "请输入端口" }]}
                    >
                        <Input placeholder="输入port" />
                    </Form.Item>
                    <Form.Item
                        field="username"
                        label="username"
                        rules={[{ required: true, message: "请输入用户名" }]}
                    >
                        <Input placeholder="输入username" />
                    </Form.Item>
                    <Form.Item
                        field="password"
                        label="password"
                        rules={[{ required: true, message: "请输入密码" }]}
                    >
                        <Input placeholder="输入password" />
                    </Form.Item>

                    <Button type="primary" onClick={connectFTPServer} disabled={connectKey.length > 0}>
                        {connectKey.length > 0 ? '已连接' : '连接'}
                    </Button>
                </Form>
                <Divider orientation="left">SessionID：{connectKey}</Divider>
                <p>
                    路径: {currentDir.length > 0 ? <Link>{currentDir}</Link> : '根路径'}
                </p>
                <Space>
                    <Button onClick={toUpload} type="outline" disabled={uploading}>
                        {uploading ? '上传中....' : '上传'}
                    </Button>
                     <Popconfirm position='bottom'content={<>
                            <Input.TextArea placeholder='请输入文件夹名称' value={newDirName} onChange={(e) => setNewDirName(e.target.value)}/>
                        </>} onOk={createDir}>
                         <Button type='outline'>新建文件夹</Button>
                     </Popconfirm>
                   
                    <Button onClick={() => refreshFiles(connectKey, currentDir)} type="outline">刷新</Button>
                    <Button onClick={goUpper} type="outline">上一级</Button>
                    <Button onClick={disconnectFTPServer} type="outline">断开连接</Button>
                </Space>
                <Table
                    data={list}
                    loading={loading}
                    columns={tableColumns}
                    style={{ marginTop: '10px' }}
                    pagination={false}
                />
            </Card>
        </>
    );
};

export default FtpPage;