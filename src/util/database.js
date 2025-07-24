import Database from "@tauri-apps/plugin-sql";
import dayjs from "dayjs";

const getMySQL = async (host, username, password, database) => {
    try {
        let db = await Database.load(
            `mysql://${username}:${password}@${host}/${database}`
        );
        return db;
    } catch (error) {
        console.error("连接数据库失败:", error);
        return null;
    }
};

var getSQLiteDB = async () => {
    return await Database.load("sqlite:json.db");
};

var createContent = async (title, content, contentType, tag) => {
    let db = await getSQLiteDB();
    let nowTime = dayjs().unix();
    return await db.execute(
        "INSERT into content (title, content, content_type, tag, create_at, modify_at) VALUES ($1, $2, $3, $4, $5, $5)",
        [title, content, contentType, tag, nowTime, nowTime]
    );
};

var getContentList = async (contentType) => {
    let db = await getSQLiteDB();
    return await db.select(
        "SELECT id, title, content_type, tag, create_at, modify_at from content WHERE content_type = $1 order by modify_at desc",
        [contentType]
    );
};

var getContentListV1 = async (contentType) => {
    let db = await getSQLiteDB();
    return await db.select(
        "SELECT id, title, content_type, tag, content, create_at, modify_at from content WHERE content_type = $1 order by modify_at desc",
        [contentType]
    );
};

var getContent = async (id) => {
    let db = await getSQLiteDB();
    return await db.select("SELECT * from content WHERE id = $1", [id]);
};

var getMySQLConfigList = async () => {
    let data = await getContentListV1("mysql");
    return formatList(data)
};

var createMySQLConfig = async (title, content) => {
    return await createContent(title, content, "mysql", "tag");
};

var deleteContent = async (id) => {
    let db = await getSQLiteDB();
    return await db.execute("delete from content where id = $1", [id]);
};

var getPageInitData = async (page, tag) => {
    let db = await getSQLiteDB();
    let result = await db.select(
        "SELECT content, create_at, modify_at from content WHERE content_type = 'page' and title = $1 and tag = $2 limit 1",
        [page, tag]
    );
    if (result.length > 0) {
        try {
            return JSON.parse(result[0].content);
        } catch (error) {
            console.log(error);
        }
        return null;
    }
    return result;
};

var updatePageInitData = async (page, tag, content) => {
    let db = await getSQLiteDB();
    let result = await db.select(
        "SELECT id, create_at, modify_at from content WHERE content_type = 'page' and title = $1 and tag = $2 limit 1",
        [page, tag]
    );
    if (result.length > 0) {
        let nowTime = dayjs().unix();
        return await db.execute(
            "update content set content = $1, modify_at = $2 where content_type = 'page' and title = $3 and tag = $4",
            [content, nowTime, page, tag]
        );
    }
    return await createContent(page, content, "page", tag);
};

const formatList = (list) => {
    for (var i in list) {
        let object = JSON.parse(list[i].content);
        list[i] = lodash.merge(list[i], object);
    }
    return list;
};

var getServerList = async () => {
    let data = await getContentListV1("server");
    return formatList(data)
};

export default {
    deleteContent,
    getContent,
    getMySQLConfigList,
    createMySQLConfig,
    getPageInitData,
    updatePageInitData,
    getMySQL,
    getServerList
};
