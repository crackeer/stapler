import { writeText, readText } from '@tauri-apps/api/clipboard';
import {  Message } from '@arco-design/web-react';

export default function copyCode() {
    function copyCode(node) {
        node.ondblclick = async () => {
            let str = '';
            // @ts-ignore
            node.children[0].childNodes.forEach(element => {
                str = str + element.textContent
            })
            await writeText(str)
            Message.success("复制成功")
        }
    }
    return {
        // @ts-ignore
        viewerEffect({ markdownBody }) {
            (async (markdownBody) => {
                const els = markdownBody.querySelectorAll('pre')
                els.forEach(el => {     
                    el.style.cursor = 'pointer'
                    copyCode(el)
                });
            })(markdownBody)
        }
    }
}