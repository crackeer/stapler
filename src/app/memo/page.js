'use client'
import React, { useEffect } from 'react'
import { Card, Button } from '@arco-design/web-react';
import MDEditor from '@/component/MDEditor';
import MDViewer from '@/component/MDViewer';
import { appDataDir } from '@tauri-apps/api/path';
export default function App() {
    const [value, setValue] = React.useState('')
    const [list, setList] = React.useState([])
    const [baseDir, setBaseDir] = React.useState(null)
    useEffect(() => {
        appDataDir().then(res => {
            setBaseDir(res)
        })
    })
    const saveMessage = async () => {
    }

    const handleMarkTop = async (item) => {
    }
    const handleEditMemo = async (item) => {
    }
    const handleDeleteMemo = async (item) => {
    }


    return <div>
        <MDEditor value={value} onChangeText={setValue} baseDir={baseDir} />
        {
            list.map(item => {
                return <Card style={{ margin: '5px auto', width: '98%' }} bordered={true} hoverable={true} actions={[<Button type='text' size='mini' onClick={handleMarkTop.bind(this, item)}>{!item.top ? '置顶' : '取消置顶'}</Button>, <Button type='text' size='mini' onClick={handleEditMemo.bind(this, item)}>修改</Button>, <Button type='text' size='mini' onClick={handleDeleteMemo.bind(this, item)}>删除</Button>, item.time,]}>
                    <MDViewer value={item.content} />
                </Card>
            })
        }
    </div>

}