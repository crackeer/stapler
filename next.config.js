const isProd = process.env.NODE_ENV === "production";

const internalHost = process.env.TAURI_DEV_HOST || "localhost";

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    images: {
        unoptimized: true,
    },
    assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.module.rules.push({
                test: /\.js$/,
                include: path.resolve("path/to/file.js"), // 替换为目标文件路径
                parser: {
                    exportConditions: () => [], // 设置导出条件为空数组
                },
            });
        }
        return config;
    },
};

export default nextConfig;
