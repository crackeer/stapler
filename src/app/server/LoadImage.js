'use client'
import { useState } from "react";

import invoke from "@/util/invoke";
import { message, open } from "@tauri-apps/plugin-dialog";
import { basename } from '@tauri-apps/api/path'
import { Button, Input, Space, Typography, List, Tag } from "@arco-design/web-react";
import { importImage } from "./action";
import { useResultStore } from './store'
import Output from './Output'

export default function LoadImage({
    servers
}) {
    const { addData, clearData, dataList, updateLast } = useResultStore()
    const [files, setFiles] = useState([]);

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
        clearData()
        for (let server of servers) {
            for (let file of files) {
                addData({
                    server: server,
                    status: 'transferring',
                })
                let fileName = await basename(file)
                let remoteFile = "/tmp/" + fileName
                let result = await importImage(server, file, remoteFile, updateLast)                
            }
        }
        message("全部上传&加载完成")
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
        <Space style={{ marginTop: '15px' }}>
            <Button type="primary" onClick={() => loadImages("k3s")}>加载k3s镜像</Button>
            <Button type="primary" onClick={() => loadImages("docker")}>加载docker镜像</Button>
        </Space>
       <Output dataSource={dataList} />
    </>
}