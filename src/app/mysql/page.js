'use client'
import { Layout, Select, Button, Table, Modal, Form } from '@arco-design/web-react';
import { useState } from 'react';

export default function MySQLPage() {
    const [connections, setConnections] = useState([]);
    const [activeConnection, setActiveConnection] = useState(null);
    const [tables, setTables] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [visible, setVisible] = useState(false);

    // 连接配置表单
    const [form] = Form.useForm();

    // 获取表结构示例
    const mockTables = ['users', 'orders', 'products'];

    return (
        <Layout>
            <Layout.Sider width={300}>
                <div className="p-4">
                    <div className="mb-4 flex gap-2">
                        <Select
                            placeholder="选择连接"
                            options={connections.map(c => ({ label: c.name, value: c.id }))}
                            onChange={id => {
                                const conn = connections.find(c => c.id === id);
                                setActiveConnection(conn);
                                setTables(mockTables); // 实际应调用API获取
                            }}
                        />
                        <Button type="primary" onClick={() => setVisible(true)}>新建</Button>
                    </div>

                    {tables.map(table => (
                        <div
                            key={table}
                            className="p-2 hover:bg-slate-100 cursor-pointer"
                            onClick={() => {
                                // 实际应调用API获取表格数据
                                setTableData(Array(5).fill().map((_, i) => ({
                                    id: i + 1,
                                    name: `示例数据${i + 1}`
                                })))
                            }}
                        >
                            {table}
                        </div>
                    ))}
                </div>
            </Layout.Sider>

            <Layout.Content className="p-4">
                <Table
                    columns={[
                        { title: 'ID', dataIndex: 'id' },
                        { title: '名称', dataIndex: 'name' }
                    ]}
                    data={tableData}
                />
            </Layout.Content>

            <Modal
                title="新建连接"
                visible={visible}
                onOk={() => {
                    form.validate().then(values => {
                        setConnections([...connections, {
                            ...values,
                            id: Date.now()
                        }]);
                        setVisible(false);
                    });
                }}
                onCancel={() => setVisible(false)}
            >
                <Form form={form}>
                    <Form.Item label="连接名称" field="name">
                        <Input placeholder="生产数据库" />
                    </Form.Item>
                    <Form.Item label="主机" field="host">
                        <Input placeholder="127.0.0.1" />
                    </Form.Item>
                    <Form.Item label="端口" field="port">
                        <InputNumber defaultValue={3306} />
                    </Form.Item>
                    <Form.Item label="用户名" field="username">
                        <Input />
                    </Form.Item>
                    <Form.Item label="密码" field="password">
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
}