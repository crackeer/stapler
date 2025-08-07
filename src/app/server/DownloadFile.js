'use client'
import { useState } from "react";
import { message, open } from "@tauri-apps/plugin-dialog";
import { Button, Input, Grid } from "@arco-design/web-react";
import Output from "./Output";
import { downloadFile } from "./action";
import { useResultStore } from './store'
const Row = Grid.Row;
const Col = Grid.Col;

export default function DownloadFile({
    servers
}) {

    const { addData, clearData, dataList, updateLast } = useResultStore()
    const [remoteFile, setRemoteFile] = useState("")
    const [localDir, setLocalDir] = useState("")

    const selectDirectory = async () => {
        let selected = await open({
            directory: true,
            filters: [
                {
                    name: "File",
                    extensions: [],
                },
            ],
        });
        if (selected == null) {
            return;
        }
        setLocalDir(selected)
    };
    const doDownloadFile = async () => {
        if (servers.length == 0) {
            message("请选择服务器")
            return
        }

        if (remoteFile.length == 0) {
            message('请选择文件')
            return
        }

        if (localDir.length == 0) {
            message('请输入本地目录')
            return
        }

        clearData()
        for (let server of servers) {
            addData({
                server: server,
                status: 'transferring',
            })
            let result = await downloadFile(server, remoteFile, localDir, updateLast)
            updateLast(result)
            
        }
        message("全部下载完成")
    }

    return <>
        <Row gutter={10} style={{ marginTop: '10px' }}>
            <Col span={2} style={{ textAlign: 'right', paddingTop: '4px' }}>
                <strong>远程文件：</strong>
            </Col>
            <Col span={12}>
                <Input placeholder="文件路径" value={remoteFile} onChange={value => {
                    setRemoteFile(value)
                }} />
            </Col>
        </Row>
        <Row gutter={10} style={{ marginTop: '10px' }}>
            <Col span={2} style={{ textAlign: 'right', paddingTop: '4px' }}>
                <strong>本地存放：</strong>
            </Col>
            <Col span={12}>
                <Input placeholder="本地文件夹" value={localDir} onChange={value => {
                    setLocalDir(value)
                }} />
                <p>
                    <Button type="outline" onClick={doDownloadFile}>开始下载</Button>
                </p>
            </Col>
            <Col span={4}>
                <Button type="outline" onClick={selectDirectory}>选择文件夹</Button>
            </Col>
        </Row>
        <Output dataSource={dataList} />
    </>
}