import { convertFileSrc } from '@tauri-apps/api/tauri';
var urls = require('rehype-urls')
const path = require('path');

export default function localImageSrc(currentFile, sep) {
    return {
        rehype:  (processor) => processor.use(urls, (url, ele) => {
           
            if(url.href.indexOf('http://') == 0) {
                return  null
            }
            if(url.href.indexOf('https://') == 0) {
                return null
            }

            if(url.pathname == null) {
                return null
            }
            
            let parts = currentFile.split(sep)
            parts.pop()
            let absolutePath = path.resolve(parts.join(sep), url.pathname)
            /*
            let parts = currentFile.split(sep)
            parts[parts.length - 1] = url.pathname
            let absolutePath = parts.join(sep)*/
            
            if(ele.tagName == "a") {
                if(ele.properties.href != undefined) {
                    return "/file/view?file=" + absolutePath
                }
            }
            return convertFileSrc(absolutePath)
        })
    }
}