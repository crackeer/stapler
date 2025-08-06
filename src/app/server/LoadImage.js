'use client'
import { useState } from "react";

import invoke from "@/util/invoke";
import { message, open } from "@tauri-apps/plugin-dialog";
import { basename } from '@tauri-apps/api/path'
import { Button, Input, Space, Typography, List, Tag } from "@arco-design/web-react";

export default function ExecuteScript({
    servers
}) {

    const [files, setFiles] = useState([]);
    const [progress, setProgress] = useState([])

    const selectFiles = async () => {
        let file = await open({
            multipart: true,
            filters: [
                {
                    name: "",
                    extensions: ["tar"],
                },
            ],
        });
        if (file == null) {
            return
        }
        setFiles([...files, file])
    }

    const loadImages = async (engine) => {
        if (files.length == 0) {
            message("请选择镜像文件")
            return
        }

        if (servers.length == 0) {
            message("请选择服务器")
            return
        }

        let progress = []
        setProgress(progress)
        for (let server of servers) {
            for (let file of files) {
                try {
                    progress.push({
                        server: server,
                        status: "connecting",
                        remote_file: "",
                        progress: 0,
                        message: ""
                    })
                    setProgress([...progress])
                    // 1. 连接
                    console.log("连接", server)
                    let sessionKey = await invoke.sshConnectByPassword(server.server, server.port, server.user, server.password, server.id + '')
                    let result = await singleLoadImage(sessionKey, file)
                    if (result.success) {
                        progress[progress.length - 1].status = "transferring"
                        progress[progress.length - 1].remote_file = result.remoteFile
                    } else {
                        progress[progress.length - 1].status = "error"
                        progress[progress.length - 1].message += result.message
                        break
                    }

                    // 3. 查询上传进度
                    do {
                        try {
                            console.log("query upload progress")
                            let query = await invoke.getTransferProgress()
                            console.log("result", query)
                            progress[progress.length - 1].progress = (parseInt(query.current) / parseInt(query.total) * 100).toFixed(2)
                            progress[progress.length - 1].status = query.status
                            if (query.status != 'transferring') {
                                finished = true
                            }
                        } catch (e) {
                            console.log("exception", e)
                            finished = true
                            progress[progress.length - 1].status = 'failure'
                            progress[progress.length - 1].message = '上传失败' + e.message
                        }
                        setProgress([...progress])
                        await sleep(300)
                    } while (!finished)

                    // 4. 执行脚本
                    console.log("执行脚本", server)
                    progress[progress.length - 1].status = "executing"
                    setProgress([...progress])
                    let command = ""
                    if (engine == "k3s") {
                        command = "k3s ctr image import " + progress[progress.length - 1].remote_file
                    } else if (engine == "docker") {
                        command = "docker load -i " + progress[progress.length - 1].remote_file
                    }
                    let result1 = await invoke.sshExecuteCmd(sessionKey, command)
                    progress[progress.length - 1].status = "success"
                    progress[progress.length - 1].output = ""
                    setProgress([...progress])
                } catch (e) {
                    console.log(e)
                    progress[progress.length - 1].status = "error"
                    progress[progress.length - 1].output = e.message
                    setProgress([...progress])
                }
            }
        }
        message("执行完成")
    }

    const singleLoadImage = async (sessionKey, file) => {
        try {


            let name = await basename(file)
            await invoke.sshExecuteCmd(sessionKey, "mkdir -p /tmp/stapler/upload_image")
            let remoteFile = "/tmp/stapler/upload_image/" + name
            await invoke.uploadRemoteFile(sessionKey, file, remoteFile)
            return {
                success: true,
                message: "上传成功",
                remote_file: remoteFile,
                name: name
            }
        } catch (e) {
            return {
                success: false,
                message: e.message
            }
        }
    }

    return <>
        <Button type="primary" onClick={selectFiles}>选择文件</Button>
        <List
            size='small'
            header="待上传文件列表"
            dataSource={files}
            style={{ marginTop: '15px' }}
            render={(item, index) => <List.Item key={index} extra={<Button type="outline" size="mini" onClick={() => { setFiles(files.filter((item1, index1) => index1 != index)) }}>删除</Button>}>{item}</List.Item>}
        />
        <Space>
            <Button type="primary" onClick={() => loadImages("k3s")}>加载k3s镜像</Button>
            <Button type="primary" onClick={() => loadImages("docker")}>加载docker镜像</Button>
        </Space>
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