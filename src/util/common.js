//const crypto = require('crypto');
import crypto from "crypto";
import lodash from "lodash";
import dayjs from "dayjs";
//const lodash = require('lodash');
//const dayjs = require('dayjs');

const FileTypeMarkdown = "md";
const FileTypeJSON = "json";
const FileTypeGO = "go";
const FileTypeText = "text";

const FileTypeExtensionMapping = {
    FileTypeMarkdown: "md",
    FileTypeJSON: "json",
    FileTypeText: "txt",
};
var getFileExtByType = (fileType) => {
    if (fileType === FileTypeMarkdown) {
        return "md";
    }
    return FileTypeExtensionMapping[fileType] || fileType;
};

var sortFileList = (fileList) => {
    fileList = fileList.sort((a, b) => {
        if (a.item_type == b.item_type) {
            if (a.path < b.path) {
                return -1;
            }
            return 1;
        }
        if (a.item_type == "dir") {
            return -1;
        }
        return 1;
    });
    return fileList;
};

var getRelativePath = (currentDir, rootDir) => {
    if (currentDir == rootDir) {
        return "";
    }
    return currentDir.substr(rootDir.length);
};

var md5 = (str) => {
    // 创建MD5对象
    let md5 = crypto.createHash("md5");

    // 将字符串转换为字节数组
    let bytes = str
        .split("")
        .map((char) => char.charCodeAt(0).toString(16))
        .join("");

    return md5.update(bytes).digest("hex");
};

function getQuery(key, value) {
    let url = new URLSearchParams(window.location.search);
    return url.get(key) || value;
}

var calculateCRC32 = (data) => {
    const crc32 = new Uint32Array(data);
    const crc32Value = crc32.reduce((acc, curr) => acc ^ curr, 0);
    return crc32Value;
};

var getViewHeight = () => {
    return document.documentElement.clientHeight - 80;
};
var detectFileType = (file) => {
    if (lodash.endsWith(file, ".md")) {
        return FileTypeMarkdown;
    }
    if (lodash.endsWith(file, ".json")) {
        return FileTypeJSON;
    }
    if (lodash.endsWith(file, ".go")) {
        return FileTypeGO;
    }
    return "A";
};

function httpBuildQuery(query) {
    let params = new URLSearchParams("");
    Object.keys(query).forEach((k) => {
        params.append(k, query[k]);
    });
    return params.toString();
}

function convertTs2Time(ts) {
    return dayjs.unix(ts).format("YYYY-MM-DD HH:mm:ss");
}

function convertDBTime(dbTime) {
    return dayjs(dbTime).format("YYYY-MM-DD HH:mm:ss");
}

function convertDBTime2Unix(dbTime) {
    return dayjs(dbTime).unix();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const startWithProtocol = (url) => {
    return url.startsWith("http://") || url.startsWith("https://");
};



function extractURLs(data) {
    if (data == null) return []
    if(typeof data == 'string' && startWithProtocol(data)) {
       return [data]
    }
    let retData = []
    // 对象
    if (typeof data == 'object' && data.length == undefined) {
        Object.keys(data).forEach(key => {
            retData.push(...extractURLs(data[key]))
        })
    }
    if (typeof data == 'object' && data.length != undefined) {
        for (let i in data) {
            retData.push(...extractURLs(data[i]))
        }
    }
    return retData
}

function superDecode(data) {
    if (data == null) return data
    if (typeof data == 'string') {
        try {
            return JSON.parse(data)
        } catch (e) {
            return data
        }
    }
    
    if (typeof data == 'object' && data.length == undefined) {
        let retData = {}
        Object.keys(data).forEach(key => {
            retData[key] = superDecode(data[key])
        })
        return retData
    }
    
    if (typeof data == 'object' && data.length != undefined) {
        let list = []
        for (let i in data) {
            list.push(superDecode(data[i]))
        }
        return list
    }
    return data
}

function formatCommandOutput(parts, startIndex, headers) {
    if (parts.length < 1) {
        return []
    }
    let retData = []
    for (let i = startIndex; i < parts.length; i++) {
        if (parts[i].length > 0) {
            let values = parts[i].split(/\s+/)
            let tmp = mappingRowData(values, headers)
            retData.push(tmp)
        }
    }
    return retData
}

function mappingRowData(values, headers) {
    let tmp = {}
    
    for (let j = 0; j < values.length; j++) {
        if (values[j].length < 1) {
            
        } else if (j < headers.length) {
            tmp[headers[j]] =  tmp[headers[j]] == undefined ? values[j] : tmp[headers[j]] + ' ' + values[j]
        } else {
            tmp[j + ''] = values[j]
        }
    }
    return tmp
}

export default {
    sortFileList,
    getRelativePath,
    md5,
    calculateCRC32,
    getQuery,
    getViewHeight,
    getFileExtByType,
    FileTypeMarkdown,
    FileTypeJSON,
    FileTypeText,
    detectFileType,
    httpBuildQuery,
    convertTs2Time,
    convertDBTime,
    convertDBTime2Unix,
    sleep,
    startWithProtocol,
    extractURLs,
    superDecode,
    formatCommandOutput
};
export {
    sortFileList,
    getRelativePath,
    md5,
    calculateCRC32,
    getQuery,
    getViewHeight,
    getFileExtByType,
    FileTypeMarkdown,
    FileTypeJSON,
    FileTypeText,
    detectFileType,
    httpBuildQuery,
    convertTs2Time,
    convertDBTime,
    convertDBTime2Unix,
    sleep,
    startWithProtocol,
    extractURLs,
    superDecode,
    formatCommandOutput
};
