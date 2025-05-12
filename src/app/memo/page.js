'use client'
import React from 'react'
import { Card, Avatar, Link, Typography, Space, Input, Button, Message, Radio, Divider, Modal, Grid, Affix } from '@arco-design/web-react';
import api from '@/util/api'
import cache from '@/util/cache'
import JSONEditor from '@/component/JSONEditor';
import MDEditor from '@/component/MDEditor';
import MDViewer from '@/component/MDViewer';
import { exists, readDir, createDir, BaseDirectory, writeTextFile, readTextFile, removeFile } from '@tauri-apps/api/fs';
import dayjs from 'dayjs';
const Row = Grid.Row;
const Col = Grid.Col;

const initMemoDir = async () => {
    let flag = await exists('memo', { dir: BaseDirectory.AppData });
    if (flag) {
        return
    }
    await createDir('memo', { dir: BaseDirectory.AppData, recursive: true });
    return
}

const readMemoTop = async () => {
    let flag = await exists('memo_top', { dir: BaseDirectory.AppData });
    if (!flag) {
        return ''
    }
    return await readTextFile('memo_top', { dir: BaseDirectory.AppData });
}

const readMemo = async () => {
    const { sep } = await import('@tauri-apps/api/path')
    let list = await readDir('memo', { dir: BaseDirectory.AppData, recursive: false });
    let retData = [];
    let topName = await readMemoTop()
    for (var i in list) {
        let contents = await readTextFile('memo' + sep + list[i].name, { dir: BaseDirectory.AppData });
        let tmp = {
            name: list[i].name,
            time: dayjs.unix(list[i].name).format('YYYY-MM-DD HH:mm:ss'),
            content: contents,
            top: false
        }
        if (topName === list[i].name) {
            tmp.top = true
        }

        retData.push(tmp)
    }

    retData = retData.sort((a, b) => {

        return b.name - a.name;
    })

    retData = retData.sort((a, b) => {
        if (a.top) {
            return -1
        }
        return 1
    })
    return retData;
}

const writeMemo = async (name, content) => {
    const { sep } = await import('@tauri-apps/api/path')
    return await writeTextFile('memo' + sep + name, content, { dir: BaseDirectory.AppData });
}

const deleteMemo = async (name) => {
    const { sep } = await import('@tauri-apps/api/path')
    return await removeFile('memo' + sep + name, { dir: BaseDirectory.AppData, recursive: false });
}

const markTop = async (name) => {
    await writeTextFile('memo_top', name, { dir: BaseDirectory.AppData });
}

const cancelTop = async (name) => {
    await removeFile('memo_top', { dir: BaseDirectory.AppData });
}

export default function App() {
    var editor = null;
    const [value, setValue] = React.useState('')
    const [list, setList] = React.useState([])
    const [editName, setEditName] = React.useState('')

    const saveMessage = async () => {
        if (value.trim().length < 1) {
            return
        }
        let name = editName || dayjs().unix()
        await writeMemo(name, value)
        Message.success('保存成功')
        setValue('')
        setEditName('')
        getSetMemo()
    }
    const getSetMemo = async () => {
        let list = await readMemo()
        setList(list)
    }

    const handleDeleteMemo = async (item) => {
        Modal.confirm({
            title: '删除提醒',
            content: '确认删除这条记录？',
            onOk: async () => {
                await deleteMemo(item.name)
                Message.success('删除成功')
                getSetMemo()
            }
        })
    }

    const handleMarkTop = async (item) => {
        if (item.top) {
            await cancelTop(item.name + '')
        } else {
            await markTop(item.name + '')
        }

        getSetMemo()
    }

    const handleEditMemo = async (item) => {
        setEditName(item.name)
        setValue(item.content)
    }

    React.useEffect(() => {
        initMemoDir()
        getSetMemo()
    }, [])


    return <div id="app">
        <Row gutter={2} >
            <Col span={9} className="bytemd-h600">
                <Affix offsetTop={5}>
                    <MDEditor editMode="tab" value={value} onChangeText={setValue} />
                    <p style={{ textAlign: 'right' }}>
                        <Button onClick={saveMessage} type='primary'>保存</Button>
                    </p>
                </Affix>
            </Col>

            <Col span={15}>
                {
                    list.map(item => {
                        return <Card style={{ margin: '5px auto', width: '98%' }} bordered={true} hoverable={true} actions={[<Button type='text' size='mini' onClick={handleMarkTop.bind(this, item)}>{!item.top ? '置顶' : '取消置顶'}</Button>, <Button type='text' size='mini' onClick={handleEditMemo.bind(this, item)}>修改</Button>, <Button type='text' size='mini' onClick={handleDeleteMemo.bind(this, item)}>删除</Button>, item.time,]}>
                            <MDViewer value={item.content} />
                        </Card>
                    })
                }
            </Col>
        </Row>
    </div>

}
