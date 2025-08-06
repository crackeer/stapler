'use client'
import { useState } from "react";

import invoke from "@/util/invoke";
import { message, open } from "@tauri-apps/plugin-dialog";
import { basename } from '@tauri-apps/api/path'
import { Button, Input, Space, Typography, List, Tag } from "@arco-design/web-react";

export default function ExecuteScript({
    servers
}) {

    const [scriptContent, setScriptContent] = useState("");
    const [scriptFile, setScriptFile] = useState("");
    const [progress, setProgress] = useState([])

    const selectFile = async () => {
        let file = await open({
            multipart: true,
            filters: [
                {
                    name: "",
                    extensions: [],
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

    const executeScript = async () => {
        console.log("执行脚本", scriptFile)
        if (scriptFile == "") {
            message("请选择脚本文件")
            return
        }

        if (servers.length == 0) {
            message("请选择服务器")
            return
        }

        let progress = []
        setProgress(progress)
        console.log("servers", servers)
        for (let server of servers) {
            try {
                progress.push({
                    server: server,
                    status: "connecting",
                    output: ""
                })
                setProgress([...progress])
                // 1. 连接
                console.log("连接", server)
                let sessionKey = await invoke.sshConnectByPassword(server.server, server.port, server.user, server.password, server.id + '')


                // 2. 上传脚本文件
                console.log("上传脚本文件", server)
                progress[progress.length - 1].status = "uploading"
                setProgress([...progress])
                let name = await basename(scriptFile)
                await invoke.sshExecuteCmd(sessionKey, "mkdir -p /tmp/stapler/upload_script")
                let scriptName = "/tmp/stapler/upload_script/" + name
                await invoke.uploadRemoteFileSync(sessionKey, scriptFile, scriptName)

                // 3. 执行脚本
                console.log("执行脚本", server)
                progress[progress.length - 1].status = "executing"
                setProgress([...progress])
                let result = await invoke.sshExecuteCmd(sessionKey, "bash " + scriptName)
                progress[progress.length - 1].status = "success"
                progress[progress.length - 1].output = result
                setProgress([...progress])
                console.log(result)
            } catch (e) {
                console.log(e)
                progress[progress.length - 1].status = "error"
                progress[progress.length - 1].output = e.message
                setProgress([...progress])
            }
           
        }
         message("执行完成")
    }

    return <>
        <Space style={{ marginBottom: 10 }}>
            <Button type="primary" onClick={selectFile}>选择文件</Button>
            <Typography.Text type="primary">{scriptFile}</Typography.Text>
        </Space>
        <Input.TextArea rows={5} value={scriptContent} onChange={value => {
            setCmdContent(setScriptContent)
        }} />
        <p>
            <Button type="outline" onClick={executeScript}>执行</Button>
        </p>
        <List
            size='small'
            header="执行结果"
            dataSource={progress}
            style={{ marginTop: '15px' }}
            render={(item, index) => <List.Item key={index}>
                <p>主机：{item.server.title} # {item.server.server}</p>
                <p>状态：<Tag>{item.status}</Tag></p>
                <p>输出：</p>
                <Input.TextArea rows={5} value={item.output} />
            </List.Item>}
        />
    </>
}