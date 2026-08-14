# 科學社團專案管理範本站

2026/8/19 花蓮「115 學年度國中小科學社團扶助計畫」教師研習的配套教材網。

給參與的國中小老師**會後自學**用：把「經營一個科學社團」拆成幾關。
研習上半場學員只跟 Codex 講話：它寫規格、自己呼叫 `agy`（Antigravity CLI）實作、再讀成品複核；
兩個視窗自己複製貼上的作法只留在方法頁當備援。
下半場以 `part2-豐兆/` 簡報為準（ChatGPT 出規格、Antigravity 做檔、ChatGPT 複核），做出基金會成果報告書真正需要的東西。

課後重做的順序固定是：**行前安裝 → 開課前檢查 → 方法 → 課程規劃表 → 學生回饋單 → 名單與出席 → 核銷對帳 → 結案 → 留下版本**。檔名仍是 step0–step5，上課與自學會先做回饋單，再做名單與出席。

- **純靜態**：每頁一個 `.html`，共用一支 `style.css` 與 `app.js`
- **零外部載入資源**：不使用 CDN、外部字型或外部圖片；延伸閱讀雖有外部網址，教材正文整包下載後仍可離線看
- **投影模式**：網站頁面可直接投影上課；`part2-豐兆/` 另保留游豐兆老師的原始簡報與講義

## 頁面

| 檔案 | 內容 |
|---|---|
| `index.html` | 總覽 |
| `install.html` | ChatGPT／Codex、Antigravity 桌面版、agy CLI、GitHub、Git、GitHub CLI 與教材資料夾的行前步驟；GitHub Desktop 選配（可勾選） |
| `method.html` | 上半場 Codex 呼叫 agy、複製貼上備援、下半場單一工具，以及 AI 會編內容的實測案例 |
| `demo.html` | 一個可操作管理台、一個外開作品收件器、一個成果牆畫面預覽 |
| `needs.html` | 老師的實際痛點對照到哪一關 |
| `step0.html` `step1.html` `step2.html` | 關 0／1／2 |
| `step3.html` `step4.html` `step5.html` | 關 3／4／5：學生回饋單、核銷對帳、結案（已查證內容可自學；現場實務待游豐兆補充處均明標「待確認」） |
| `github.html` | 關 6：用 GitHub 留版本，並把專案記憶、規格與作品接到另一台電腦；部署另列選配 |
| `refs.html` | 延伸閱讀（每條網址都實際驗過） |
| `workshop.html` | 8/19 場次資訊 |
| `console.html` | 示範用的研習管理台（單檔、14 筆虛構名單） |
| `_範本-關卡頁.html` | 新增一關時複製這個骨架 |
| `part2-豐兆/` | 游豐兆老師的簡報與安裝講義。**只有他能改**（他有寫入權限，直接改直接推） |
| `sources/README.md` | 學員要自行取得的五類原件、固定檔名與缺檔處理；repo 不附未授權原件 |
| `templates/` | 學員專案記憶範本：PROJECT-README、HANDOFF、LEARNER-RULES 與關卡規格 |
| `工單-下半場改善.md` / `.json` | 2026-08-13 教材審查的歷史快照，不能代表目前狀態；只供教材開發者追溯 |

> 關 3／4／5 只寫入目前有官方來源或原始資料可核對的內容。需要基金會窗口或各校主計室確認的做法，頁面會保留「待確認」，不把經驗或推測寫成規定。

各關作品固定放在 `outputs/`，避免覆蓋教材首頁：

| 關 | 固定成品檔名 |
|---|---|
| 方法練習 | `outputs/practice-tool.html` |
| 關 1 | `outputs/course-plan.html` |
| 關 2 | `outputs/attendance.html` |
| 關 2 去識別化接力摘要 | `outputs/attendance-summary.json` |
| 關 3 | `outputs/student-feedback.html` |
| 關 3 去識別化接力摘要 | `outputs/student-feedback-summary.json` |
| 關 4 | `outputs/reimbursement-check.html` |
| 關 4 去識別化接力摘要 | `outputs/reimbursement-summary.json` |
| 關 5 | `outputs/final-report-workbench.html` |
| 關 5 授課老師自評彙總 | `outputs/teacher-self-review-summary.json` |

同名檔已存在時，提示詞會要求 AI 先停下來，不得直接覆蓋。

## 教材開發與學員使用是兩種模式

- **教材開發者**讀 `AGENTS.md`、協作指南與查證資料，維護這個網站。
- **學員**複製教材到 `club2026` 後，只改 `outputs/`、`specs/` 與自己的 `PROJECT-README.md`、`HANDOFF.md`、`LEARNER-RULES.md`；教材頁面保持唯讀。
- 五類必要原件由學員依 [`sources/README.md`](sources/README.md) 自行取得。缺官方原件時可以練習，但不能宣稱工具符合正式欄位或可直接送件。
- 關 6 建立 `club2026-share` 時，只複製去識別化學員記憶、規格與核准共享的工具；不複製教材製作者的 AGENTS、改善工單或 `sources/`。

## 兩個人一起做

| 關 | 內容 | 主筆 |
|---|---|---|
| 0／1／2／6 | 行前準備、依各校實際週次製作課程規劃表、名單與出席、GitHub 版本控制與跨機器接手 | 陳文盛 |
| **3／4／5** | **學生回饋單、核銷對帳、結案** | **游豐兆** |

研習當天上半場（09:00–10:25）由陳文盛帶關 1，學員只跟 Codex 講話，由它呼叫 `agy` 完成規劃、實作與複核；下半場（10:35–12:00）由游豐兆帶學生回饋、關 2 名單出席與成果整理，以 `part2-豐兆/` 簡報為準：ChatGPT 出規格、Antigravity 做檔（關 3–5 仍由游豐兆主筆）。上、下半場作品分別在 10:22、11:50 收件。早上現場必備的是 ChatGPT／Codex、Antigravity 桌面版與 `agy`。GitHub 帳號、Git 與 GitHub CLI 是會後讓 AI 做 `commit`／`push`／`clone`／`pull` 才用到：有最好，沒裝仍請來；GitHub Desktop 選配。

- 要動手改：先讀 **[`協作指南-給豐兆.md`](協作指南-給豐兆.md)**（人看的）與 **[`AGENTS.md`](AGENTS.md)**（AI 看的）
- 已查證的官方規定與各校資料：**[`參考-官方事實與已查證資料.md`](參考-官方事實與已查證資料.md)**

> 這個 repo 本身也是 8/19 的教材之一：現場會打開 commit 紀錄，示範兩個人、兩台電腦、各自的 AI，
> 如何把 repo 內的專案記憶、規格與作品合成同一份，再從另一台電腦接著做。
> 部署是另一個選配步驟；GitHub Pages、Netlify 或其他服務都可以，不是 GitHub 的唯一用途。

## 作者與授權

- 陳文盛（國立東華大學通識教育中心）
- 游豐兆（花蓮縣明禮國小／國立東華大學）

教材內容 CC BY-NC-SA 4.0，兩位作者具名。引用的第三方連結著作權歸原作者。
