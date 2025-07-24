"use client";
import {
    Layout,
    Select,
    Button,
    Space,
    Table,
    Modal,
    Form,
    Input,
} from "@arco-design/web-react";
import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { message } from "@tauri-apps/plugin-dialog";
import database from "@/util/database";
import lodash from 'lodash'

const queryTables = async (dbClient) => {
    let result = await dbClient.execute('show tables')
    console('queryTables', result)
    return result
}

export default function MySQLPage() {
    const [tableData, setTableData] = useState([]);
    const [visible, setVisible] = useState(false);
    const [form] = Form.useForm();
    const columns = [
        {
            'title' : 'ID',
            'dataIndex' : 'id'
        },
        {
            'title' : '名称',
            'dataIndex' : 'title'
        },
        {
            'title' : '主机+端口',
            'dataIndex' : 'host'
        },
        {
            'title' : '用户',
            'dataIndex' : 'username'
        },
        {
            'title' : '数据库',
            'dataIndex' : 'database'
        },
        {
            'title' : '操作',
            'align' : 'center',
            'render' : (_, record) => {
                return <Space>
                    <Button size='small' type='text' onClick={deleteConfig.bind(this, record)}>删除</Button>
                    <Button size='small' type='text' onClick={showCopyModal.bind(this, record)}>复制</Button>
                    <Button size="small" type='text' onClick={connect.bind(this, record)}>连接</Button>
                </Space>
            }
        }
    ]

    useEffect(() => {
        initMySQLs()
    }, [])


    const showCreateModal = () => {
        setVisible(true);
        form.setFieldValue("host", '127.0.0.1:3306');
        form.setFieldValue("username", "root");
    };

    const showCopyModal = (record) => {
        setVisible(true)
        form.setFieldsValue({
            'name' : record.title + '-复制',
            'host' : record.host,
            'username' : record.username,
            'password' : record.password,
            'database' : record.database,
        })
    }

    const connect = (record) => {
        window.location.href = '/mysql/manage?id=' + record.id
    }

    const initMySQLs = () => {
        database.getMySQLConfigList().then(result => {
            setTableData(result)
        })
    }

    const initDatabase = async (dbClient) => {
        let tables = await queryTables(dbClient)
    }

    const addConnection = async () => {
        try {
            let data = await form.validate()
            let db = await database.getMySQL(data.host, data.username, data.password, data.database);
            if(db === null) {
               message.error("连接数据库失败");
               return;
            }
            let result = await database.createMySQLConfig(data.name, JSON.stringify({
                'host' : data.host,
                'username' : data.username,
                'password' : data.password,
                'database' : data.database
            }))
            initMySQLs()
            setVisible(false)       
        } catch (error) {
            console.error("连接数据:", error);
        }
    }

     const deleteConfig = async (record) => {
        let yesNo = await confirm("确认删除连接`" + record.title + "`吗？")
        if (!yesNo) {
            return
        }
        try {
            let result = await database.deleteContent(record.id)
              message("删除成功")
              initMySQLs()
        } catch(e) {
            console.log('deleteConfig error', e)
            message('删除失败')
        }
        
    }

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={showCreateModal} size="small">
                    新建
                </Button>
            </Space>

            <Table data={tableData}
                pagination={false}
                columns={columns}
            />

            <Modal
                title={"新建连接"}
                visible={visible}
                onOk={addConnection}
                onCancel={() => setVisible(false)}
            >
                <Form form={form}>
                    <Form.Item label="连接名称" field="name" rules={[{ required: true, message: "请输入连接名称" }]}>
                        <Input placeholder="生产数据库" />
                    </Form.Item>
                    <Form.Item label="主机" field="host" rules={[{ required: true, message: "请输入主机:端口" }]}>
                        <Input placeholder="127.0.0.1:3306" />
                    </Form.Item>
                    <Form.Item label="用户名" field="username" rules={[{ required: true, message: "请输入用户名" }]}>   
                        <Input />
                    </Form.Item>
                    <Form.Item label="密码" field="password" rules={[{ required: true, message: "请输入密码" }]}>
                        <Input.Password />
                    </Form.Item>
                    <Form.Item label="DB" field="database" rules={[{ required: true, message: "请输入DB" }]}>
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
