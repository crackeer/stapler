'use client'
import { useState } from "react";

import invoke from "@/util/invoke";
import { message, open } from "@tauri-apps/plugin-dialog";
import { Button, Input, Space, Typography, List, Tag } from "@arco-design/web-react";
import Output from "./Output";
import { executeScript } from "./action";
import {useResultStore} from './store'

export default function ExecuteScript({
    servers
}) {

    const [scriptContent, setScriptContent] = useState("");
    const [scriptFile, setScriptFile] = useState("");
    const { addData, clearData, dataList, updateLast } = useResultStore()
    const selectFile = async () => {
        let file = await open({
            multipart: true,
            filters: [
                {
                    name: "",
                    extensions: ["sh"],
                },
            ],
        });
        if (file == null) {
            return
        }
        setScriptFile(file)
        try {
            let result = await invoke.readFile(file)
            setScriptContent(result)
        } catch (e) {
            message(e.message)
        }
    }

    const doExecuteScript = async () => {
        if (scriptFile == "") {
            message("请选择脚本文件")
            return
        }

        if (servers.length == 0) {
            message("请选择服务器")
            return
        }
        clearData()
        for (let server of servers) {
            addData({
                server: server,
                status: 'init',
                output: ''
            })
            let result = await executeScript(server, scriptFile, updateLast)
            updateLast(result)
        }
         message("执行完成")
    }

    return <>
        <Space style={{ marginBottom: 10 }}>
            <Button type="primary" onClick={selectFile}>选择文件</Button>
            <Typography.Text type="primary">{scriptFile}</Typography.Text>
        </Space>
        <Input.TextArea rows={5} value={scriptContent} />
        <p>
            <Button type="outline" onClick={doExecuteScript}>执行</Button>
        </p>
        <Output dataSource={dataList} />
    </>
}