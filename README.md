# Pixiv Web Crawler

## 專案說明 (Project Title)：
套件Puppeteer的練習專案，以藝術網站Pixiv為對象，撈取追隨追隨畫家的相關資訊，輸出成Json格式，模擬成資料庫紀錄。

## 環境建置與需求 (prerequisites)：
* puppeteer-core: 5.3.1

## 安裝與執行步驟 (installation and execution)：
1. 下載Github頁面上內容
```console
git clone https://github.com/coooo77/pixivWebCrawler
```

2. 以指令cd移動至pixivWebCrawler資料夾底下
```console
cd 下載位置/pixivWebCrawler
```

3. 根據環境建置與需求安裝軟體與套件
```console
npm install
```

4. 手動輸入使用者資料，登入Pixiv，登入後按下ctrl+c退出
```console
npm run login
```

5. 輸入指令爬取資料
```console
npm run fetch
```

## 功能描述 (features)：
* 使用者可以紀錄追蹤作家的英文ID、使用者ID、使用者名稱
* 以Json檔案形式作資料庫紀錄