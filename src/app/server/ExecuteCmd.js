'use client'
import { useState } from "react";
import { message, open } from "@tauri-apps/plugin-dialog";
import { Button, Input } from "@arco-design/web-react";
import Output from "./Output";
import { executeCmd } from "./action";
import {useResultStore} from './store'

export default function ExecuteCmd({
    servers
}) {
    const [cmdContent, setCmdContent] = useState("");
    const { addData, clearData, dataList, updateLast } = useResultStore()

    const doExecuteCmd = async () => {
        if (cmdContent.length < 1) {
            message('请输入命令')
            return
        }
        if (servers.length == 0) {
            message('请选择服务器')
            return
        }
        clearData()
        for (let i = 0; i < servers.length; i++) {
            addData({
                server: servers[i],
                status: 'executing',
                output: ''
            })
            let result = await executeCmd(servers[i], cmdContent)
            updateLast(result)
        }
    }

    return <>
        <Input.TextArea rows={3} value={cmdContent} onChange={value => {
            setCmdContent(value)
        }} />
        <p>
            <Button type="outline" onClick={doExecuteCmd}>执行</Button>
        </p>
        <Output dataSource={dataList} />
    </>
}