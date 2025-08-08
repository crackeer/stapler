'use client'
import React, { useEffect, useState } from "react";
import {
    Button,
    Space,
    Table,
} from "@arco-design/web-react";
import { getK3sAPIResource } from './action'
import lodash from 'lodash'
import dayjs from 'dayjs'
export default function K3sSvc({
    server,
    namespace,
    reload
}) {
    // 'name', 'ready', 'up-to-date', 'available', 'age', 'containers', 'images', 'selector'
    const columns = [
        {
            'title': '名字',
            'dataIndex': 'metadata.name',
            'key': 'name'
        },
        {
            'title': 'clusterIPs',
            'key': 'clusterIPs',
            'render' : (col, record, index) => {
                return record.spec.clusterIPs.map((element, index) => {
                    return <div key={index}>{element}</div>
                })
            }
        },
        {
            'title': '类型',
            'key': 'type',
            'render': (col, record, index) => {
                return record.spec.type
            }
        },
        {
            'title': '端口',
            'key': 'port',
            'render': (col, record, index) => {
                let portList = lodash.get(record, 'spec.ports', [])
                if (portList.length == 0) {
                    return '-'
                }
                let ports = []
                let tmp = []
                portList.forEach(element => {
                    tmp.push(element.port + ':' + element.targetPort)
                    if (tmp.length >= 3) {
                        ports.push(tmp.join(', '))
                        tmp = []
                    }
                });
                if (tmp.length > 0) {
                    ports.push(tmp.join(', '))
                }
                return ports.map((element, index) => {
                    return <div key={index}>{element}</div>
                })
            }
        },
        {
            'title': '创建时间',
            'key': 'create_time',
            'render': (col, record, index) => {
                return dayjs(record.metadata.creationTimestamp).format('YYYY-MM-DD HH:mm:ss')
            }
        },
        {
            'title': '操作',
            'key': 'opt',
            'align': 'center',
            'render': (col, record, index) => {
                return <Space>
                    <Button size="mini" type='text' status="danger">删除</Button>
                </Space>
            }
        }
    ]
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])
    useEffect(() => {
        getList()
    }, [namespace, server, reload])

    const getList = async () => {
        setLoading(true)
        let result = await getK3sAPIResource(server, namespace, 'svc')
        console.log(result)
        setLoading(false)
        setList(result)
    }

    return <>
        <Table columns={columns} data={list} loading={loading} pagination={false} />
    </>
}