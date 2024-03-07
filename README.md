---
name: 科伦巴商会
slug: resonance-colombia
description: 雷索纳斯 科伦巴商会 数据分享站
framework: Next.js
css: Tailwind
database: Firebase Cloud Firestore
---

# 雷索纳斯 科伦巴商会 数据分享站

## 网站地址

https://www.resonance-columba.com/

## Development
![Tech Stack](https://github-readme-tech-stack.vercel.app/api/cards?lineCount=1&line1=react%2Creact%2Cauto%3Bnext.js%2Cnext.js%2Cffffff%3Bvercel%2Cvercel%2Cffffff%3Bfirebase%2Cfirebase%2Cauto%3B&title=Tech%20Stack&align=center&titleAlign=center&fontSize=20&lineHeight=10)

### 本地开发

#### 分支
`main` 分支是生产环境分支，`develop` 分支是开发环境分支。PR请提交到`develop`分支。

#### Web - Next.js

##### 软件
Node.js 18  
包管理器 [pnpm](https://pnpm.io/installation)

##### 环境变量
复制 `.env.example` 为 `.env.local` 


#### 数据库 - Firebase Cloud Firestore

##### 软件
[firebase-cli](https://firebaseopensource.com/projects/firebase/firebase-tools/#installation) 用于初始化firebase项目，并启动本地firestore模拟器  
[firestore emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore?hl=zh-cn)  本地数据库
在`.env.local`中设置环境变量`FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"`后，firebase-admin会自动连接firestore模拟器数据库。

### 部署
#### Vercel
该Next.js项目已经配置了Vercel的自动部署，只需要将代码提交到`develop`分支，Vercel会自动部署到[预览环境](https://preview.resonance-columba.com/)。  
`main`分支的代码会自动部署到[生产环境](https://www.resonance-columba.com/)。  
而所有其他分支的代码会自动部署到使用`vercel.app`域名的预览环境。  
Vercel Functions(APIs)已配置了使用位于香港的服务器。

#### Firebase Cloud Firestore
数据库使用的是Firebase Cloud Firestore，不需要手动部署。  
网站的所有预览环境和生产环境连接的同一个数据库，其中生产环境使用`columba`集合，所有预览环境共同使用`columba-dev`集合。  
Firebase项目已配置了使用位于香港的服务器。

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->