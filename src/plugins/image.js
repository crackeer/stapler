import { convertFileSrc } from '@tauri-apps/api/core';
import urls from 'rehype-urls'
import { appDataDir } from '@tauri-apps/api/path';
import path from 'path'
export default function localImageSrc(baseDir) {
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
          
            return convertFileSrc(baseDir + '/' + url.pathname)
        })
    }
}