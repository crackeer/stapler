'use client'
import React, { useEffect, useState } from "react";
import {
    Button,
    Space,
    Table,
} from "@arco-design/web-react";
import { getK3sAPIResource } from './action'
import dayjs from "dayjs";
export default function K3sPod({
    server,
    namespace,
}) {
    //  'name', 'ready', 'status', 'restarts', 'age', 'ip', 'node', 'NOMINATED_NOD', "READINESS_GATES"
    const columns = [
        {
            'title': '名字',
            'dataIndex': 'metadata.name',
            'key': 'name',
        },
        {
            'title': 'STATUS',
            'dataIndex': 'status.phase',
            'key': 'status',
            sorter: (a, b) => {
                if (a.status == b.status) {
                    return a.name.localeCompare(b.name);
                }
                return a.status == 'Running' ? -1 : 1;
            },
            filters: [
                {
                    text: 'Running',
                    value: 'Running',
                },
                {
                    text: 'Error',
                    value: 'Error',
                },
                {
                    text: 'CrashLoopBackOff',
                    value: 'CrashLoopBackOff',
                },
                {
                    text: 'Completed',
                    value: 'Completed',
                },
                {
                    text: 'Succeeded',
                    value: 'Succeeded',
                }
            ],
            defaultFilters: [],
            onFilter: (value, row) => row.status.phase == value,
        },

        {
            'title': 'hostIP',
            'dataIndex': 'status.hostIP',
            'key': 'ip',
        },
        {
            'title': 'podIP',
            'dataIndex': 'status.podIP',
            'key': 'pod_ip',
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
    }, [namespace, server])

    const getList = async () => {
        setLoading(true)
        let result = await getK3sAPIResource(server, namespace, 'pod')
        console.log(result)
        setLoading(false)
        setList(result)
    }

    return <Table columns={columns} data={list} loading={loading} pagination={false} rowKey={record => record.metadata.uid} />
}