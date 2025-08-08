'use client'
import React, { useEffect, useState } from "react";
import {
    Button,
    Space,
    Table,
    Card,
    Grid,
    Input,
} from "@arco-design/web-react";
import { getK3sNode } from './action'
import dayjs from 'dayjs'
import { message } from "@tauri-apps/plugin-dialog";
const { Row, Col } = Grid;
export default function K3sNode({
    server,
    namespace,
}) {
    const conditionsColumns = [
        {
            'title': 'type',
            'dataIndex': 'type',
            'key': 'type',
        },
        {
            'title': 'status',
            'dataIndex': 'status',
            'key': 'status',
        },
        
        {
            'title': 'reason',
            'dataIndex': 'reason',
            'key': 'reason',
        },
        {
            'title': 'lastHeartbeatTime',
            'dataIndex': 'lastHeartbeatTime',
            'key': 'lastHeartbeatTime',
            'render': (col, record, index) => {
                return dayjs(record.lastHeartbeatTime).format('YYYY-MM-DD HH:mm:ss')
            }
        },
        {
            'title': 'lastTransitionTime',
            'dataIndex': 'lastTransitionTime',
            'key': 'lastTransitionTime',
            'render': (col, record, index) => {
                return dayjs(record.lastTransitionTime).format('YYYY-MM-DD HH:mm:ss')
            }
        },
         {
            'title': '操作',
            'key': 'message',
            'render': (col, record, index) => {
                return <Space>
                    <Button size="mini" type="text"  onClick={() => { 
                        message(record.message)
                     }}>Msg</Button>
                </Space>
            }
        },
       
    ]
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])
    useEffect(() => {
        getList()
    }, [namespace, server])

    const getList = async () => {
        setLoading(true)
        let result = await getK3sNode(server)
        console.log(result)
        setLoading(false)
        setList(result)
    }

    return <>
        {
            list.map((item, index) => {
                return <Card title={item.metadata.annotations['k3s.io/hostname']} size='small' style={{ marginBottom: 10 }}>
                    <Row gutter={8}>
                        <Col span={7}>
                            <p>NodeIP: {item.metadata.annotations['k3s.io/internal-ip']}</p>
                            <p>Labels:</p>
                            <Input.TextArea value={JSON.stringify(item.metadata.labels, '', 4)} rows={6}></Input.TextArea>
                            <p>nodeInfo.architecture: {item.status.nodeInfo.architecture}</p>
                            <p>nodeInfo.kernelVersion: {item.status.nodeInfo.kernelVersion}</p>
                            <p>nodeInfo.kernelVersion: {item.status.nodeInfo.kernelVersion}</p>
                            <p>nodeInfo.osImage: {item.status.nodeInfo.osImage}</p>
                        </Col>
                        <Col span={17}>
                            <p>Conditions:</p>
                            <Table data={item.status.conditions} columns={conditionsColumns} size='small' pagination={false} />
                        </Col>
                    </Row>
                </Card>
            })
        }
    </>
}