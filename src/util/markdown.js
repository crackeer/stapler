import { join, sep as SEP } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';


var convertLocalImage = async (currentFile) => {
    var eles = document.getElementsByTagName('img')
    let parts = currentFile.split(SEP)
    let rootDir = parts.splice(0, parts.length-1).join(SEP)
    for (let ele of eles) {
        let fullURL = ele.src
        let prefixLength = ele.baseURI.length
        console.log(ele.baseURI, rootDir, ele)
        let assetUrl = await join(rootDir, fullURL.substring(prefixLength));
        ele.src = convertFileSrc(assetUrl);
    }
}

var fmtFilesAsTreeData = (rootDir, fileList) => {
    let mapData = {
        name: rootDir,
        title: rootDir,
        toggled: true,
        key: rootDir,
        children: []
    }
    let prefixLength = rootDir.length + 1
    for (var i in fileList) {
        let path = fileList[i].substr(prefixLength)
        let parts = path.split(SEP)
        mapData = park(mapData, parts, rootDir, 0)
    }
    return mapData
}

var park = (retData, parts, uriPrefix, level) => {
    if (parts.length < 1) {
        return retData
    }
    if (parts.length == 1) {
        retData.children.push({
            name: parts[0],
            title: parts[0],
            key: uriPrefix + SEP + parts[0],
            type: 'file',
        })
    } else {
        let index = -1
        for (var i in retData.children) {
            if (retData.children[i].name == parts[0]) {
                index = i
            }
        }
        if (index < 0) {
            retData.children.push({
                name: parts[0],
                title: parts[0],
                key: uriPrefix + SEP + parts[0],
                children: [],
                toggled: level == 0 ? true : false
            })
            index = retData.children.length - 1
        }
        retData.children[index] = park(retData.children[index], parts.splice(1), uriPrefix + SEP + parts[0], level + 1)
    }
    return retData
}

export {
    convertLocalImage, fmtFilesAsTreeData
}
