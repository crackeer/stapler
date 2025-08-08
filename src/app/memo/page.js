'use client'
import React, { useEffect,useState } from 'react'
import { Card, Button, DatePicker, Input } from '@arco-design/web-react';
import MDEditor from '@/component/MDEditor';
import MDViewer from '@/component/MDViewer';
import { appDataDir } from '@tauri-apps/api/path';
import dayjs from 'dayjs';
import database from '@/util/database';
import {confirm} from '@tauri-apps/plugin-dialog';
const { MonthPicker } = DatePicker;

export default function App() {
    const [value, setValue] = React.useState('')
    const [list, setList] = React.useState([])
    const [editID, setEditID] = useState(0)
    const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
    const [baseDir, setBaseDir] = React.useState(null)
    useEffect(() => {
        appDataDir().then(res => {
            setBaseDir(res)
        })
        console.log(month)
        getMemoList()
    }, [])


    const getMemoList = async () => {
        try {
            let data = await database.getMemoList(month)
            console.log(data)
            setList(data)
        } catch (error) {
            console.error("获取备忘录列表失败:", error);
        }
    }
    const saveMessage = async () => {
        let result = await database.createMemo(dayjs().format('YYYY-MM-DD HH:mm') + '写', value)
        getMemoList()
        setValue('')
    }
    const handleUpdateMemo = async () => {
        let result = await database.updateContent(editID, value)
        getMemoList()
        setValue('')
        setEditID(parseInt(-1))
    }
    const handleCopyMemo = async (item) => {
        setValue(item.content)
    }
    const handleMarkTop = async (item) => {
    }
    const handleEditMemo = async (item) => {
        setEditID(item.id)
        setValue(item.content)
    }
    const handleDeleteMemo = async (item) => {
        let yes = await confirm('确定删除吗？')
        if (!yes) {
            return
        }
        await database.deleteContent(item.id)
        getMemoList()
    }

    return <div>
        <MDEditor value={value} onChangeText={setValue} baseDir={baseDir} />
        <div style={{marginTop:'10px',textAlign:'center'}}>
            {editID > 0 ? <Button type='primary' onClick={handleUpdateMemo}>修改</Button> : <Button type='primary' onClick={saveMessage}>保存</Button>}
        </div>
        <div style={{margin:'10px auto', textAlign:'center'}}>
            月份：<MonthPicker style={{ width: 265 }} value={month} onChange={setMonth} format="YYYY年MM月" size='large'/>
        </div>
        {
            list.map(item => {
                return <Card style={{ margin: '5px auto', width: '98%' }} bordered={true} hoverable={true} actions={[
                <Button type='text' size='mini' onClick={handleEditMemo.bind(this, item)}>修改</Button>, 
                <Button type='text' size='mini' onClick={handleCopyMemo.bind(this, item)}>复制</Button>, 
                <Button type='text' size='mini' onClick={handleDeleteMemo.bind(this, item)}>删除</Button>, item.create_time,]} key={item.id}>
                    <MDViewer value={item.content} baseDir={baseDir} />
                </Card>
            })
        }
    </div>

}