'use client'
import React, { useEffect, useState } from "react";
import {
    Button,
    Space,
    Input,
    Table,
    Popover,
    Divider,
    Link,
    Select,
} from "@arco-design/web-react";
import { IconDelete, IconUpload, IconRefresh, IconObliqueLine, IconFolderAdd, IconHome, IconLoading } from '@arco-design/web-react/icon';
import { deleteFile, getFileList, createDir } from './action'
import { partial } from "filesize";
import { message, confirm } from "@tauri-apps/plugin-dialog";
import lodash from 'lodash'
const getFileSize = partial({ base: 2, standard: "jedec" });


async function generateQuickDirs(directory) {
    let sep = '/';
    let parts = directory.split(sep)
    let list = []
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
            list.push({
                path: parts.slice(0, i + 1).join(sep),
                name: parts[i]
            })
        }
    }
    return list
}


export default function FileManage({
    servers,
    initialDir,
}) {
    const columns = [
        {
            'title': '名字',
            'dataIndex': 'name',
            'key': 'name',
            'render': (col, record, index) => (
                record.is_dir ? <a href="javascript:;" onClick={changeDir.bind(this, record.name)} style={{ textDecoration: 'none' }}>{record.name}</a> : <span>{record.name}</span>
            )
        },
        {
            'title': '权限',
            'dataIndex': 'access',
            'key': 'access',
        },
        {
            'title': '时间',
            'dataIndex': 'time',
            'key': 'month',
            'render': (col, record, index) => (
                <>
                    {record.month} {record.day} {record.time}
                </>
            )

        },
        {
            'title': '大小',
            'dataIndex': 'size_text',
            'key': 'size_text',
        },
        {
            'title': '用户',
            'dataIndex': 'user',
            'key': 'user',
        },
        {
            'title': '操作',
            'key': 'opt',
            'align': 'center',
            'render': (col, record, index) => {
                return <Space>
                    <Button onClick={toDeleteFile.bind(this, record)} size="mini" type='text' icon={<IconDelete />} status="danger">删除</Button>
                </Space>
            }
        }
    ]

    const [currentServer, setCurrentServer] = useState(null)
    const [directory, setDirectory] = useState('')
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState([])
    const [quickDirs, setQuickDirs] = useState([])
    const [visible, setVisible] = useState(false)
    const [newDirName, setNewDirName] = useState('')

    useEffect(() => {
        setDirectory(initialDir)

        if (servers.length == 0) {
            return
        }
        if (currentServer == null) {
            setCurrentServer(servers[0])
            console.log(servers[0])
        } else {
            let index = lodash.findIndex(servers, { id: currentServer.id })
            if (index == -1) {
                setCurrentServer(servers[0])
            }
        }
        for (var i in servers) {
            if (servers[i].id == currentServer) {
                setCurrentServer(servers[i])
                break
            }
        }

        setTimeout(() => {
            console.log(currentServer)
            listFiles(initialDir)
        }, 1000)
    }, [initialDir, servers])

    const changeServer = (server) => {
        setCurrentServer(server)
        listFiles(directory)
    }

    const getHome = () => {
        if (currentServer == null) {
            return '/tmp'
        }
        if (currentServer.user == 'root') {
            return '/root'
        }
        return '/home/' + currentServer.user
    }
    const goHome = async () => {
        await this.setState({
            directory: this.getHome(this.state.user)
        })
        setTimeout(this.listFiles, 200)
    }

    const listFiles = async (dir) => {
        if (currentServer == null) {
            console.log('no server')
            return
        }
        let quickDirs = await generateQuickDirs(dir)
        setQuickDirs(quickDirs)
        setLoading(true)
        setFiles([])
        let result = await getFileList(currentServer, dir)
        console.log(result, currentServer)
        if (result.status == 'failed') {
            return
        }
        setLoading(false)
        result.output.sort((a, b) => {
            if (a.is_dir) {
                return -1
            }
            return 1
        })
        let fileList = result.output
        for (var i in fileList) {
            fileList[i]['size_text'] = getFileSize(fileList[i]['size'])
        }
        setFiles(fileList)

    }
    const gotoDir = async (item) => {
        setDirectory(item.path)
        listFiles(item.path)
    }
    const changeDir = async (name) => {
        setDirectory(directory + '/' + name)
        listFiles(directory + '/' + name)
    }


    const toDeleteFile = async (item) => {
        const yes = await confirm('确认删除该文件（夹）', '删除提示');
        if (!yes) {
            return
        }
        let result = await deleteFile(currentServer, directory + '/' + item.name)
        if (result.status == 'success') {
            message('删除成功')
            listFiles(directory)
        } else {
            message(result.message)
        }
    }

    const doCreateDir = async () => {
        if (newDirName.length < 1) {
            return
        }

        let result = await createDir(currentServer, directory + '/' + newDirName)
        if (result.status == 'success') {
            message('创建成功')
            setVisible(false)
            setNewDirName('')
            listFiles(directory)
        } else {
            message(result.message)
        }

    }

    if (servers.length == 0) {
        return null
    }

    const refresh = async () => {
        listFiles(directory)
    }

    const toUploadFile = async () => {

    }

    return (
        <>
            <div>
                <Select value={currentServer} onChange={changeServer}>
                    {
                        servers.map(item => {
                            return <Select.Option key={item.id} value={item}>{item.title} - {item.server}</Select.Option>
                        })
                    }
                </Select>
            </div>

            <Divider>
                <Space>
                    <Button onClick={goHome} type='primary' size='small' icon={<IconHome />}>家目录</Button>
                    <Popover
                        title='请输入名字'
                        trigger='click'
                        popupVisible={visible}
                        onVisibleChange={setVisible}
                        content={
                            <>
                                <Input size='small' value={newDirName} onChange={setNewDirName} />
                                <p style={{ textAlign: 'right' }}>
                                    <Button onClick={doCreateDir} type='primary'>确认</Button>
                                </p>
                            </>
                        }
                    >
                        <Button onClick={doCreateDir} type='primary' icon={<IconFolderAdd />}>新建文件夹</Button>
                    </Popover>
                    <Button onClick={toUploadFile} type='primary' icon={<IconUpload />}>上传文件</Button>
                    <Button onClick={refresh} type='primary' icon={<IconRefresh />} >更新</Button>
                </Space>
            </Divider>
            <Space split={<IconObliqueLine />} align={'center'} style={{ marginRight: '0' }}>
                <Link onClick={gotoDir.bind(this, { path: '/' })} key={'/'}>根目录</Link>
                {
                    quickDirs.map(item => {
                        return <Link onClick={gotoDir.bind(this, item)} key={item.path}>{item.name}</Link>
                    })
                }
            </Space>
            <Table data={files} columns={columns} pagination={false} rowKey={'name'} scroll={{ y: 1000 }} footer={directory} loading={loading} />
        </>
    );

}