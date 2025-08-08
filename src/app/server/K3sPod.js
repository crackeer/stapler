'use client'
import React, { useEffect, useState } from "react";
import {
    Button,
    Space,
    Table,
} from "@arco-design/web-react";
import { getK3sPods } from './action'

export default function K3sPod({
    server,
    namespace,
}) {
    //  'name', 'ready', 'status', 'restarts', 'age', 'ip', 'node', 'NOMINATED_NOD', "READINESS_GATES"
    const columns = [
        {
            'title': '名字',
            'dataIndex': 'name',
            'key': 'name',
        },
        {
            'title': 'READY',
            'dataIndex': 'ready',
            'key': 'ready',
        },
        {
            'title': 'STATUS',
            'dataIndex': 'status',
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
                }
            ],
            defaultFilters: ['Running'],
            onFilter: (value, row) => row.status == value,
        },
        {
            'title': 'restarts',
            'dataIndex': 'restarts',
            'key': 'restarts',
            sorter: (a, b) => {
                if (a.restarts == b.restarts) {
                    return a.name.localeCompare(b.name);
                }
                return parseInt(a.restarts) > parseInt(b.restarts) ? -1 : 1;
            }
        },
        {
            'title': 'AGE',
            'dataIndex': 'age',
            'key': 'age',
        },
        {
            'title': 'IP',
            'dataIndex': 'ip',
            'key': 'ip',
        },
        {
            'title': 'Node',
            'dataIndex': 'node',
            'key': 'node',
        },
        {
            'title': 'NOMINATED_NOD',
            'dataIndex': 'NOMINATED_NOD',
            'key': 'NOMINATED_NOD',
        },
        {
            'title': 'READINESS_GATES',
            'dataIndex': 'READINESS_GATES',
            'key': 'READINESS_GATES',
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
        let result = await getK3sPods(server, namespace)
        console.log(result)
        setLoading(false)
        setList(result)
    }

    return <Table columns={columns} data={list} loading={loading} pagination={false} />
}