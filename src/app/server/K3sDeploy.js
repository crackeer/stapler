'use client'
import React, { useEffect, useState } from "react";
import {
    Button,
    Space,
    Table,
} from "@arco-design/web-react";
import { getK3sDeploy } from './action'
import { snapdom } from '@zumer/snapdom';
import invoke from "@/util/invoke";
import dayjs from "dayjs";

import {Buffer} from 'buffer'
export default function K3sDeploy({
    server,
    namespace,
}) {
    // 'name', 'ready', 'up-to-date', 'available', 'age', 'containers', 'images', 'selector'
    const deployColumns = [
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
            'title': '更新',
            'dataIndex': 'up-to-date',
            'key': 'up-to-date',
        },
        {
            'title': 'available',
            'dataIndex': 'available',
            'key': 'available',
        },
        {
            'title': 'AGE',
            'dataIndex': 'age',
            'key': 'age',
        },
        {
            'title': '容器',
            'dataIndex': 'containers',
            'key': 'containers',
        },
        {
            'title': '镜像',
            'dataIndex': 'images',
            'key': 'images',
        },
        {
            'title': '选择器',
            'dataIndex': 'selector',
            'key': 'selector',
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
    const [deployList, setDeployList] = useState([])
    useEffect(() => {
        getDeployList()
    }, [namespace, server])

    const getDeployList = async () => {
        setLoading(true)
        let result = await getK3sDeploy(server, namespace)
        console.log(result)
        setLoading(false)
        setDeployList(result)
    }

    return <>
        <Table columns={deployColumns} data={deployList} loading={loading} pagination={false}/>
    </>
}