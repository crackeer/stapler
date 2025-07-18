"use client";
import { useState, useEffect } from "react";
import {
    Layout,
    Select,
    Button,
    Space,
    Table,
    Modal,
    Form,
    Input,
    List,
    Grid
} from "@arco-design/web-react";
import Database from "@tauri-apps/plugin-sql";
import { message } from "@tauri-apps/plugin-dialog";
import database from "@/util/database";
import lodash from 'lodash'
const Row = Grid.Row;
const Col = Grid.Col;

const queryTables = async (dbClient) => {
    try {
        let result = await dbClient.select('show tables')
        let tables = []
        for(var i in result) {
            tables.push(...Object.values(result[i]))
        }
        console.log(tables)
        return tables
        console.log('queryTables', result)
    } catch(e) {
        console.log('queryTables exception', e)
        return []
    }
}

export default function MySQLPage() {
    const [tables, setTables] = useState([]);
    var currentDB = null
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
                </Space>
            }
        }
    ]

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let id = params.get('id', 0)
        console.log(id)
        if(parseInt(id) < 1) {
            message('无效连接id')
            return
        }
        initMySQL(parseInt(id))
    }, [])


    const initMySQL = async (id) => {
        try {
            let data = await database.getContent(id)
            if(data.length < 1) {
                message('数据库配置不存在')
                return
            }
            console.log(data)
            let mysqlConfig = JSON.parse(data[0].content)
            let db = await database.getMySQL(mysqlConfig.host, mysqlConfig.username, mysqlConfig.password, mysqlConfig.database);
            if(db === null) {
               message("连接数据库失败");
               return;
            }
            currentDB = db
            initDatabase(currentDB)
        } catch(e) {
            console.log('exception', e)
        }
    }

    const initDatabase = async (dbClient) => {
        let tables = await queryTables(dbClient)
        setTables(tables)
    }



    return (
        <div>
         <Space></Space>
         <Row>
             <Col span={4}>
                 <List
                  dataSource={tables}
                  style={{height:'100%', overflow: 'scroll'}}
                  render={(item, index) => <List.Item key={index}>{item}</List.Item>}
                />
            </Col>
        </Row>
        </div>
    );
}
