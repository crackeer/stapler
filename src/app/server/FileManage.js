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
    Grid,
    Select,
} from "@arco-design/web-react";
import { IconDelete, IconUpload, IconRefresh, IconObliqueLine, IconFolderAdd, IconHome, IconLoading } from '@arco-design/web-react/icon';
import { deleteFile, getFileList, createDir } from './action'
import { partial } from "filesize";
import { message, confirm } from "@tauri-apps/plugin-dialog";
import lodash from 'lodash'
const getFileSize = partial({ base: 2, standard: "jedec" });

const { Row, Col } = Grid;

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
            'width': '30%',
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
        let dir = directory
        if (directory == '' && initialDir != '') {
            setDirectory(initialDir)
            dir = initialDir
        }
        if (servers.length == 0) {
            return
        }
        if (currentServer == null) {
            setCurrentServer(servers[0])
            listFiles(servers[0], dir)
        } else {
            let index = lodash.findIndex(servers, { id: currentServer.id })
            if (index == -1) {
                setCurrentServer(servers[0])
                listFiles(servers[0], dir)
            }
        }

    }, [initialDir, servers])

    const changeServer = (server) => {
        setCurrentServer(server)
        listFiles(server, directory)
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
        setDirectory(getHome())
        listFiles(currentServer, getHome())
    }

    const listFiles = async (server, dir) => {
        if (server == null) {
            return
        }
        let quickDirs = await generateQuickDirs(dir)
        setQuickDirs(quickDirs)
        setLoading(true)
        let result = await getFileList(server, dir)
        console.log(result, server)
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
        listFiles(currentServer, item.path)
    }

    const changeDir = async (name) => {
        setDirectory(directory + '/' + name)
        listFiles(currentServer, directory + '/' + name)
    }

    const toDeleteFile = async (item) => {
        const yes = await confirm('确认删除该文件（夹）', '删除提示');
        if (!yes) {
            return
        }
        let remoteFile = directory + '/' + item.name
        if (item.name.indexOf(' ') >= 0) {
            remoteFile = directory + "/'" + item.name + "'"
        }
        let result = await deleteFile(currentServer, remoteFile)
        if (result.status == 'success') {
            message('删除成功')
            listFiles(currentServer, directory)
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
            listFiles(directory, directory)
        } else {
            message(result.message)
        }

    }

    if (servers.length == 0) {
        return null
    }

    const refresh = async () => {
        listFiles(currentServer, directory)
    }

    const toUploadFile = async () => {

    }

    return (
        <>
            <Row style={{ marginBottom: '20px' }}>
                <Col span={8}>
                    <Select value={currentServer} onChange={changeServer} addBefore='服务器'>
                        {
                            servers.map(item => {
                                return <Select.Option key={item.id} value={item}>{item.title} - {item.server}</Select.Option>
                            })
                        }
                    </Select>
                </Col>
            </Row>

            <Divider orientation="left">
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
            <Space split={<IconObliqueLine />} align={'center'} style={{ marginRight: '0', marginBottom: '10px' }}>
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