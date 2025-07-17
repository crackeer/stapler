import Database from "@tauri-apps/plugin-sql";
import dayjs from "dayjs";

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

var getContent = async (id) => {
    let db = await getSQLiteDB();
    return await db.select("SELECT * from content WHERE id = $1", [id]);
};

var getCodeList = async () => {
    return await getContentList("code");
};

var createCode = async (title, content) => {
    return await createContent(title, content, "code", "tag");
};

var getCode = async (id) => {
    let list = await getContent(id);
    if (list.length > 0) {
        return list[0];
    }
    return null;
};

var updateCode = async (id, content) => {
    let db = await getSQLiteDB();
    let nowTime = dayjs().unix();
    return await db.execute(
        "update content set content = $1, modify_at = $2 where id = $3",
        [content, nowTime, id]
    );
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

export default {
    deleteContent,
    getCodeList,
    createCode,
    getCode,
    updateCode,
    getPageInitData,
    updatePageInitData,
};
