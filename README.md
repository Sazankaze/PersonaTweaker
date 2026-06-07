# Persona Tweaker

SillyTavern 脚本 —— 按角色 / 按聊天微调 User 人设描述。

在不修改原始人设的情况下，对发送给 AI 的 User 人设文本进行动态补丁（追加、前置、删除、替换），支持正则表达式。

## 功能

- **角色级补丁** — 针对特定角色生效的人设修改
- **聊天级补丁** — 针对特定聊天会话生效的人设修改（优先级高于角色级）
- **补丁库** — 将常用补丁保存为可复用的库条目，按需引用
- **四种操作** — 追加 (append)、前置 (prepend)、删除 (delete)、替换 (replace)
- **正则支持** — 删除和替换操作可使用正则表达式匹配

## 安装

在 SillyTavern 中导入构建好的 JSON 文件即可使用，无需手动安装源码。

## 从源码构建

```bash
pnpm install
pnpm build
```

构建产物位于 `dist/persona-tweaker/`。

开发模式（自动监听变更）：

```bash
pnpm watch
```

## 致谢

基于 [酒馆助手 (Tavern Helper)](https://github.com/N0VI028/JS-Slash-Runner)，使用 [tavern_helper_template](https://github.com/StageDog/tavern_helper_template) 模板开发。

## 技术栈

- TypeScript + Vue 3 + Pinia
- Webpack 5
- Tailwind CSS
- Zod（数据校验）

## 许可证

MIT
