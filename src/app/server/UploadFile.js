'use client'
import { useState } from "react";
import { message, open } from "@tauri-apps/plugin-dialog";
import { Button, Input, Grid, List } from "@arco-design/web-react";
import Output from "./Output";
import { uploadFile } from "./action";
import { useResultStore } from './store'
const Row = Grid.Row;
const Col = Grid.Col;

export default function UploadFile({
    servers
}) {
    const { addData, clearData, dataList, updateLast } = useResultStore()
    const [uploadFileList, setUploadFileList] = useState([])
    const [remoteDir, setRemoteDir] = useState("")
    const selectFiles = async () => {
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
        setUploadFileList([file, ...uploadFileList])
    }

    const doUploadFiles = async () => {

        if (servers.length == 0) {
            message("请选择服务器")
            return
        }

        if (uploadFileList.length == 0) {
            message('请选择文件')
            return
        }

        if (remoteDir.length < 1) {
            message('请输入远程目录')
            return
        }

        clearData()
        for (let server of servers) {
            for (let file of uploadFileList) {
                addData({
                    server: server,
                    status: 'transferring',
                })
                let result = await uploadFile(server, file, remoteDir, updateLast)
                updateLast(result)
            }
        }
        message("全部上传完成")
    }

    return <>
        <Button type="primary" onClick={selectFiles}>选择文件</Button>
        <List
            size='small'
            header="待上传文件列表"
            dataSource={uploadFileList}
            style={{ marginTop: '15px' }}
            render={(item, index) => <List.Item key={index} extra={<Button type="outline" size="mini" onClick={() => { setUploadFileList(uploadFileList.filter((item1, index1) => index1 != index)) }}>删除</Button>}>{item}</List.Item>}
        />
        <Row gutter={10} style={{ marginTop: '20px' }}>
            <Col span={2} style={{ textAlign: 'right', paddingTop: '3px' }}>
                <strong>远程位置：</strong>
            </Col>
            <Col span={12}>
                <Input placeholder="远程服务器文件夹" value={remoteDir} onChange={value => {
                    setRemoteDir(value)
                }} />
            </Col>
            <Col span={4}>
                <Button type="outline" onClick={doUploadFiles}>上传</Button>
            </Col>
        </Row>
        <Output dataSource={dataList} />
    </>
}