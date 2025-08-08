'use client'
import React, { useEffect, useState } from "react";
import {
    Button,
    Space,
    Form,
    Table,
    Popover,
    Divider,
    Link,
    Grid,
    Select,
    Tabs
} from "@arco-design/web-react";
import { getK3sNamespaces, getK3sPods } from './action'
import lodash, { set } from 'lodash'
import K3sNode from "./K3sNode";
import K3sDeploy from "./K3sDeploy";
import K3sPod from "./K3sPod";
const TabPane = Tabs.TabPane;
const { Row, Col } = Grid;

export default function K3s({
    servers,
}) {
    const [form] = Form.useForm();
    const [currentServer, setCurrentServer] = useState(null)
    const [namespaces, setNamespaces] = useState([])
    const [namespace, setNamespace] = useState('kube-system')
    const [deployList, setDeployList] = useState([])
    const [podList, setPodList] = useState([])

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (servers.length == 0) {
            return
        }
        if (currentServer == null) {
            changeServer(servers[0])
        } else {
            let index = lodash.findIndex(servers, { id: currentServer.id })
            if (index == -1) {
                changeServer(servers[0])
            }
        }

    }, [servers])

    const changeServer = async (server) => {
        setCurrentServer(server)
        let result = await getK3sNamespaces(server)
        setNamespaces(result)
    }

    const changeNamespace = async (ns) => {
        setNamespace(ns)
    }


    return (
        <>
            <Row gutter={20}>
                <Col span={12}>
                    <Select value={currentServer} onChange={changeServer} addBefore='服务器' >
                        {
                            servers.map(item => {
                                return <Select.Option key={item.id} value={item}>{item.title} - {item.server}</Select.Option>
                            })
                        }
                    </Select>
                </Col>
                <Col span={12}>
                    <Select onChange={changeNamespace}  value={namespace} addBefore='namespace'>
                        {
                            namespaces.map(item => {
                                return <Select.Option key={item.name} value={item.name}>{item.name}</Select.Option>
                            })
                        }
                    </Select>
                </Col>
            </Row>
            <Tabs tabPosition='left' style={{ marginTop: 20 }}>
                <TabPane key='tab0' title='Node'>
                    <K3sNode server={currentServer} />
                </TabPane>
                <TabPane key='tab1' title='Deployment'>
                    <K3sDeploy server={currentServer} namespace={namespace} />
                </TabPane>
                <TabPane key='tab2' title='Pod'>
                    
                </TabPane>
            </Tabs>

        </>
    );
}