'use client'

import { List, Tag, Input } from "@arco-design/web-react";

export default function Output({
    dataSource, additionRender, 
}) {
    if(dataSource.length < 1) {
        return null
    }
    return <List
        size='small'
        dataSource={dataSource}
        rowKey={(record) => record.server.id}
        render={(item, index) => <List.Item key={index}>
            <p>主机：{item.server.title} # {item.server.server}</p>
            {
                item.target ? <p>目标：{item.target}</p> : null
            }
            <div>状态：<Tag>{item.status}</Tag></div>
            {
                item.percent ? <>
                    <p>进度：</p>
                    <Progress percent={item.percent} />
                </> : null
            }
            {
                item.output ? <>
                    <p>输出：</p>
                    <Input.TextArea rows={3} value={item.output} />
                </> : null
            }
            {
                additionRender ? additionRender(item, index) : null
            }
        </List.Item>}
    />
}