'use client'
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import { Button, Message } from '@arco-design/web-react';
import { IconCopy } from '@arco-design/web-react/icon';
export default function clickToCopy(props) {
    const copyText = () => {
        if (props.value.length > 0) {
            writeText(props.value).then(() => {
                Message.success('已复制')
            })
        } else {
            Message.error('内容为空')
        }

    }

    return <Button type={props.type || 'outline'} status={props.status || 'default'} size={props.size || 'mini'} onClick={copyText} icon={props.icon || <IconCopy />}>{props.children}</Button>
}
