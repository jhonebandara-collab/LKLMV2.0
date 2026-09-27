# 🚀 GitHub → Render · පියවරෙන් පියවර ගයිඩ්

> **LK Lottery Master v1.2.0** — zip එකේ ඉඳන් අන්තර්ජාලයේ ඇත්ත app එකක් වෙනකම්.
>
> මේක කරන්න පුළුවන් **කිසිම coding දැනුමක් නැතුව** — හැම command එකක්ම copy-paste කරන්න.
> අන්තිමේදී ඔබට `https://lk-lottery-master.onrender.com` වගේ **ඇත්ත link එකක්** ලැබෙනවා,
> ඒක **phone එකේ කැමරාවත් එක්ක** වැඩ කරනවා (HTTPS නිසා) 🎉

**මුළු කාලය:** විනාඩි 20-30 · **වියදම:** Rs. 0 (test කරන්න free plan එකෙන්)

---

## 📑 අන්තර්ගතය

- [කොටස 0 — ඕන දේවල්](#කොටස-0--ඕන-දේවල්)
- [කොටස 1 — Zip එක ගලවලා local එකේ test කරන්න](#කොටස-1--zip-එක-ගලවලා-local-එකේ-test-කරන්න)
- [කොටස 2 — GitHub එකට දාන්න](#කොටස-2--github-එකට-දාන්න)
- [කොටස 3 — Render එකේ host කරන්න (ක්‍රම 2ක්)](#කොටස-3--render-එකේ-host-කරන්න)
- [කොටස 4 — Env variables ටික දාන්න](#කොටස-4--env-variables-ටික-දාන්න)
- [කොටස 5 — App එක වැඩ කරනවද බලන්න (test checklist)](#කොටස-5--app-එක-වැඩ-කරනවද-බලන්න)
- [කොටස 6 — Phone එකෙන් test කරන්න](#කොටස-6--phone-එකෙන්-test-කරන්න)
- [කොටස 7 — Google (Gmail) login එක හදන්න](#කොටස-7--google-gmail-login-එක-හදන්න)
- [කොටස 8 — Admin panel එක](#කොටස-8--admin-panel-එක)
- [කොටස 9 — අලුත් version එකක් දාන්න (update)](#කොටස-9--අලුත්-version-එකක්-දාන්න)
- [කොටස 10 — Free plan එකේ සීමා (අනිවාර්යයෙන් කියවන්න) ⚠️](#කොටස-10--free-plan-එකේ-සීමා-️)
- [කොටස 11 — ඇත්තටම පාවිච්චි කරන්න (paid + disk)](#කොටස-11--ඇත්තටම-පාවිච්චි-කරන්න)
- [කොටස 12 — ප්‍රශ්න ආවොත්](#කොටස-12--ප්‍රශ්න-ආවොත්)

---

## කොටස 0 — ඕන දේවල්

| # | මොකක්ද | කොහෙන්ද |
|---|---|---|
| 1 | **GitHub account** | https://github.com/signup (free) |
| 2 | **Render account** | https://dashboard.render.com/register (free — GitHub එකෙන්ම sign up කරන්න පුළුවන්) |
| 3 | **Zip එක** (`lk-lottery-master-v1.2.0.zip`) | ඔබට දුන්න file එක |
| 4 | **Gemini keys 5** | දැනටමත් `.env` එකේ තියෙනවා (කොටස 4 එකේදී ඒවා Render එකට දාන්න ඕන) |
| 5 | **ඔබේ ඊමේල් එක** | Admin panel එකට (`ADMIN_EMAILS`) |

> 💡 **GitHub හෝ Render ගැන මුලින්ම දැනගන්න ඕන නෑ** — පහළ පියවර ටික අනුපිළිවෙළට කරන්න.

---

## කොටස 1 — Zip එක ගලවලා local එකේ test කරන්න

**ඇයි මේක මුලින්ම කරන්නේ?** Render එකේ deploy කරන්න කලින් app එක ඔබේ computer එකේ
වැඩ කරනවද කියලා දැනගන්න ඕන. එතකොට ප්රශ්නයක් ආවොත් කොහෙද කියලා ලේසියෙන් හොයාගන්න පුළුවන්.

### 1.1 Zip එක ගලවන්න

```bash
# Zip එක තියෙන folder එකට ගිහින්:
unzip lk-lottery-master-v1.2.0.zip
cd lk-lottery-master
```

*(Windows එකේ නම් right-click → Extract All → ඊට පස්සේ Command Prompt එක ඒ folder එකේ open කරන්න)*

### 1.2 Dependencies install කරන්න

```bash
npm install
```

⏳ තත්පර 10-60ක් ගන්නවා. **"added 128 packages"** වගේ පණිවිඩයක් ආවා නම් හරි ✅

### 1.3 `.env` එක බලන්න

Zip එකේ **`.env` file එක දැනටමත් තියෙනවා** (ඔබේ Gemini keys 5 + JWT_SECRET + Google client ID ඒකේ තියෙනවා).
ඒක නැති නම් විතරයි:

```bash
cp .env.example .env      # ඊට පස්සේ values ටික edit කරන්න
```

**⚠️ අනිවාර්යයි:** `.env` එකේ `ADMIN_EMAILS=` එකට ඔබේ ඊමේල් එක දාන්න (නැත්නම් admin panel එක වැඩ කරන්නේ නෑ):

```
ADMIN_EMAILS=you@gmail.com
```

### 1.4 App එක run කරන්න

```bash
npm start
```

Terminal එකේ පේන්න ඕන:

```
✓ Auto-scrape cron: "30 9,21 * * *" (Asia/Colombo) — දිනකට දෙපාරක්.
Server: http://localhost:3000
```

Browser එකේ **http://localhost:3000** open කරන්න → app එක පේනවා නම් හරි ✅

### 1.5 Tests run කරන්න (optional නමුත් නරඹන්න)

```bash
npm test              # 44 tests
npm run test:offline  # 30 tests (offline layer)
npm run test:e2e      # 44 tests (ඇත්ත browser එකකින් — Chrome/Edge ඕන)
```

හරි ගියොත්: `✓ Pass: 44   ✗ Fail: 0`

> 🛑 **නවත්තන්න:** Terminal එකේ `Ctrl + C` ඔබන්න.

---

## කොටස 2 — GitHub එකට දාන්න

මේකට **ක්‍රම 2ක්** තියෙනවා. පහසු එක තෝරන්න.

> ### 🚫 මුලින්ම මේක කියවන්න (අනිවාර්යයි)
>
> **`.env` file එක **කවදාවත්** GitHub එකට දාන්න එපා.** ඒකේ ඔබේ Gemini keys,
> JWT secret සහ PayHere secret තියෙනවා. GitHub එකට ගියොත් **ලෝකෙටම පේනවා** —
> අපේ keys භාර වෙනවා, ඒවා හොරකම් කරන්න පුළුවන්.
>
> **හොඳ ආරංචිය:** අපේ zip එකේ `.gitignore` එකේ `.env` දාලා තියෙනවා —
> ඒ නිසා `git` පාවිච්චි කරලා දානවා නම් ඒක තනියම අයින් වෙනවා ✅

---

### ක්‍රමය A — GitHub website එකෙන් (පහසුම, command නැහැ)

1. https://github.com/new එකට ගිහින්:
   - **Repository name:** `lk-lottery-master`
   - **Private** තෝරන්න ✅ (Render එකට private repos වැඩ කරනවා)
   - **Create repository** ඔබන්න
2. **⚠️ මුලින්ම `.env` එක අයින් කරන්න:** ඔබේ computer එකේ `lk-lottery-master` folder එකේ
   `.env` file එක **වෙනම තැනකට කපන්න** (delete කරන්න එපා — පස්සේ ඕන). *
   (`node_modules` folder එකත් අයින් කරන්න ඕන නෑ — ඒක upload කරන්නත් බෑ, ලොකු වැඩි නිසා.)
3. අලුත් repo එකේ **"uploading an existing file"** link එක ඔබන්න
4. `lk-lottery-master` folder එකේ **ඇතුළේ තියෙන හැම file එකක්ම සහ folder එකක්ම** select කරලා
   (folder එකම නෙවෙයි — **ඇතුළේ තියෙන දේවල්**) drag & drop කරන්න
   - `data/` folder එකක් තිබ්බොත් ඒක දාන්න එපා (DB file)
5. පහළින් **Commit changes** ඔබන්න

✅ දැන් GitHub එකේ ඔබේ code එක තියෙනවා. **කොටස 3** එකට යන්න.

---

### ක්‍රමය B — Git command එකෙන් (නිවැරදිම ක්‍රමය)

Git install කරලා තියෙන්න ඕන ([git-scm.com/downloads](https://git-scm.com/downloads)).

```bash
cd lk-lottery-master

# 1) Git repo එකක් හදන්න
git init
git branch -M main

# 2) හැම file එකක්ම add කරන්න
git add .

# 3) ⚠️ හරියටම මේක බලන්න — `.env` මේ list එකේ තියෙන්නම බෑ!
git status --short
```

`git status` එකේ `.env` පේනවා නම් **නවත්තලා** මේක කරන්න:

```bash
git rm --cached .env     # (එක පාරක් add කරලා නම් විතරයි)
echo ".env" >> .gitignore
```

දැන් commit කරලා GitHub එකට යවන්න (පහළ `YOUR-USERNAME` එක ඔබේ නමට වෙනස් කරන්න):

```bash
git config user.name "Your Name"
git config user.email "you@gmail.com"

git commit -m "LK Lottery Master v1.2.0"
git remote add origin https://github.com/YOUR-USERNAME/lk-lottery-master.git
git push -u origin main
```

පළවෙනි පාරට GitHub එකෙන් **password එක අහනවා** — ඒකට ඔබේ GitHub password එක
වැඩ කරන්නේ නෑ. **Personal Access Token** එකක් ඕන:
GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) →
Generate new token → `repo` scope එක tick කරලා හදාගන්න → ඒ token එක password එක විදිහට දාන්න.

✅ දැන් **කොටස 3**.

---

## කොටස 3 — Render එකේ host කරන්න

### ක්‍රමය A — Blueprint එකෙන් (පහසුම — `render.yaml` එක අපි හදලා දීලා තියෙනවා) ✅ නරඹන්න

1. https://dashboard.render.com/ එකට ගිහින් **GitHub** එකෙන් sign in කරන්න
2. උඩ **New +** → **Blueprint** ඔබන්න
3. **Connect GitHub** → ඔබේ `lk-lottery-master` repo එක තෝරන්න → **Connect**
4. Render එකෙන් `render.yaml` එක කියවලා සැකසුම් පෙන්නනවා:
   - Name: `lk-lottery-master`
   - Region: `Singapore` (ශ්‍රී ලංකාවට ලඟම — වේගවත්ම)
   - Instance type: **Free** ✅
   - ඊට පස්සේ **අහන env variables ටික පුරවන්න** → [කොටස 4](#කොටස-4--env-variables-ටික-දාන්න) එකේ ලිස්ට් එක බලන්න
5. **Apply** / **Create** ඔබන්න → build එක පටන් ගන්නවා (විනාඩි 2-5)

### ක්‍රමය B — අතින් හදන්න (`render.yaml` නැතුව)

1. https://dashboard.render.com/ → **New +** → **Web Service**
2. **Git Provider** → ඔබේ repo එක තෝරන්න (**Connect** කරන්න ඕන නම් කරන්න)
3. පහත විදිහට පුරවන්න — **හරියටම මේවාම**:

| Field | අගය |
|---|---|
| **Name** | `lk-lottery-master` |
| **Region** | `Singapore` |
| **Branch** | `main` |
| **Language / Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type / Plan** | **Free** ✅ |

4. **Advanced** කොටස open කරන්න:
   - **Health Check Path:** `/api/health`
   - **Environment Variables** → [කොටස 4](#කොටස-4--env-variables-ටික-දාන්න) එකේ ලිස්ට් එකේ ටික දාන්න
5. **Create Web Service** ඔබන්න

### Build එක බලන්න

**Logs** tab එකේ පේන්න ඕන:

```
==> Running build command 'npm install'...
added 128 packages
==> Running 'npm start'
✓ Auto-scrape cron: "30 9,21 * * *" (Asia/Colombo) — දිනකට දෙපාරක්.
Server: http://localhost:10000
==> Your service is live 🎉
```

URL එක උඩම පේනවා: **`https://lk-lottery-master-xxxx.onrender.com`**

> ⚠️ පළවෙනි deploy එකේදී Render එක **තනියම අලුත් ප්‍රතිඵල බාගන්නවා** (පැය 8කට වඩා පරණ නම්).
> ඒක background එකේ වෙන නිසා log එකේ පේනවා — බය වෙන්න එපා, app එක වැඩ කරනවා.

---

## කොටස 4 — Env variables ටික දාන්න

Render Dashboard → ඔබේ service එක → **Environment** tab → **Add Environment Variable**.
පහත ටික එකින් එක දාන්න (`Secret` විදිහට තියන්න ඕන ඒවා ✅ කියලා තියෙනවා):

| Key | Value | Secret? |
|---|---|---|
| `NODE_ENV` | `production` | |
| `TRUST_PROXY` | `true` | |
| `APP_TIMEZONE` | `Asia/Colombo` | |
| `APP_BASE_URL` | `https://ඔබේ-service-එක.onrender.com` | |
| `JWT_SECRET` | random string 32+ (පහළ command එකෙන් හදාගන්න) | ✅ |
| `ADMIN_EMAILS` | `you@gmail.com` (ඔබේ ඊමේල්) | ✅ |
| `GEMINI_API_KEY_1` … `GEMINI_API_KEY_5` | `.env` එකේ තියෙන keys 5 | ✅ |
| `GEMINI_MODEL` | `gemini-3.6-flash` | |
| `GOOGLE_CLIENT_ID` | `.env` එකේ තියෙන එක | ✅ |
| `UNLIMITED_SCAN` | `false` (plan limits වැඩ කරන්න) | |
| `SCRAPE_CRON` | `30 9,21 * * *` | |
| `SCRAPE_MAX_AGE_HOURS` | `8` | |
| `OFFLINE_BUNDLE_MONTHS` | `6` | |
| `DATA_STALE_HOURS` | `30` | |
| `PAYHERE_MERCHANT_ID` / `_SECRET` | (PayHere නැත්නම් හිස් තියන්න) | ✅ |
| `PAYHERE_MODE` | `sandbox` | |

**`JWT_SECRET` එකක් හදාගන්න:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**⚠️ Env variable එකක් දැම්මට/වෙනස් කළාට පස්සේ Render එක තනියම ආයෙ deploy කරනවා
(විනාඩි 1-3).** ඒක ඉවර වෙනකම් ඉන්න.

> 💡 `.env` එකේ තියෙන keys ටික Render එකට **copy කරන්න** විතරයි — `.env` file එක
> කවදාවත් GitHub එකට යවන්නේ නෑ.

---

## කොටස 5 — App එක වැඩ කරනවද බලන්න

### 5.1 මූලික checks (computer එකෙන්)

| # | කරන්න | හරි නම් පේන්න ඕන |
|---|---|---|
| 1 | `https://ඔබේ-URL.onrender.com/api/health` open කරන්න | `{"ok":true, ..., "lotteries":16, ...}` |
| 2 | `https://ඔබේ-URL.onrender.com/api/data-status` | `"hasData":true`, `"draws":2952` |
| 3 | `https://ඔබේ-URL.onrender.com/api/offline-bundle/size` | `"kb":250` වගේ අගයක් |
| 4 | `https://ඔබේ-URL.onrender.com/` | App එක open වෙනවා + **disclaimer** එක එනවා |
| 5 | Disclaimer → එකඟ වෙන්න | App එකේ tabs පේනවා (📋 ප්රතිඵල, 📷 Scan…) |
| 6 | **📋 ප්රතිඵල** tab | අලුත්ම draw අංක + දිනය + අංක පේනවා |
| 7 | History / අතින් පරීක්ෂාව | ටිකට් අංක දාලා බලන්න පුළුවන් |

> ⏳ **පළවෙනි request එකට තත්පර 50-60ක් ගන්න පුළුවන්** (free plan එක නිදාගෙන තිබ්බ නම්).
> Render එකේ loading page එකක් පෙන්නනවා — ඒක normal ✅

### 5.2 App එකේ ඇතුළේ බලන්න ඕන දේවල්

- උඩම **status bar**: `🟢 Online · අවසන් යාවත්කාලීනය: 2026-09-26 …` + **🔄 දැන්ම** button
- 📷 **Scan** tab එකේ උඩම mode දෙක: **🔳 QR Scan** සහ **🤖 AI Scan — සම්පූර්ණ ටිකට් එක**
- පහළම **📄 තොරතුරු සහ නීතිමය** bar එක (අප ගැන · රහස්‍යතා · මුදල් ආපසු · වගකීම්)
- 🛠️ **Admin** tab එක (ඔබේ ඊමේල් එකෙන් login වුනාම විතරයි පේන්නේ)

---

## කොටස 6 — Phone එකෙන් test කරන්න

**මේක තමයි ඇත්තම test එක** — camera + vibration + offline.

### 6.1 Camera / QR scan

1. Phone එකේ browser එකෙන් (Chrome හෝ Safari) ඔබේ Render URL එකට යන්න
2. **Allow** ඔබන්න කැමරාව අහනකොට (Render එකේ HTTPS තියෙන නිසා කැමරාව වැඩ කරනවා ✅)
3. **📷 Scan** tab → **📸 කැමරාවෙන් Scan කරන්න**
4. ටිකට් එකේ QR එක **කහ රාමුව ඇතුළේ** තියන්න (8-15cm දුර)
5. QR එක කියෙව්වම: 📳 vibrate + 🔊 beep + **ප්රතිඵලය තත්පර 5ක්** පෙන්නලා තනියම අයින් වෙනවා
6. **කැමරාව නවත්තන්නේ නෑ** — ඊළඟ ටිකට් එක එවලේම scan කරන්න පුළුවන් ✅

කියවන්නේ නැත්නම්: **⚙️ උසස් සැකසුම්** → 🔍 Zoom වැඩි කරන්න · 🎯 නැවත Focus ·
🔆 Torch දාන්න · නැත්නම් phone එකේ camera app එකෙන් QR එකට කිට්ටුවෙන් photo එකක් අරන් **🖼️ Upload** කරන්න.

### 6.2 AI Scan

**Scan** tab එකේ උඩම **🤖 AI Scan — සම්පූර්ණ ටිකට් එක** ඔබලා ටිකට් එකේ photo එකක් ගන්න.
AI එක අංක කියවලා ප්රතිඵලය බලනවා (තත්පර 5-15ක් ගන්නවා).

### 6.3 Offline test (අනිවාර්යයෙන් කරන්න)

1. App එක **online** එකේ open කරලා තත්පර 10-15ක් ඉන්න (bundle එක cache වෙන්න)
2. Phone එකේ **Airplane mode** දාන්න (හෝ WiFi + data off)
3. App එක **close කරලා ආයෙ open කරන්න**
4. බලන්න ඕන:
   - ✅ App එක **load වෙනවා** (internet නැතුව)
   - ✅ උඩම `📴 Offline · Cache කරපු දත්ත` පේනවා
   - ✅ **📋 ප්රතිඵල** tab එකේ පරණ ප්රතිඵල පේනවා
   - ✅ **QR scan** කරලා දිනුම check කරන්න පුළුවන් (🚫 AI Scan විතරයි වැඩ නොකරන්නේ)
5. Airplane mode off කරලා **🔄 දැන්ම** ඔබන්න → දත්ත අලුත් වෙනවා

### 6.4 History එක

Scan කරපු හැම එකක්ම **🕘 History** tab එකේ — ලොතරැයි අනුව සහ දිනය අනුව filter කරලා බලන්න පුළුවන්.

---

## කොටස 7 — Google (Gmail) login එක හදන්න

Render එකේ domain එක අලුත් නිසා Google එකට ඒක කියන්න ඕන (නැත්නම් Gmail button එකෙන් login වෙන්න බෑ):

1. https://console.cloud.google.com/apis/credentials එකට යන්න
2. ඔබේ **OAuth 2.0 Client ID** එක ඔබන්න (Web application)
3. **Authorized JavaScript origins** එකට **Add URI**:
   ```
   https://ඔබේ-service-එක.onrender.com
   ```
   (`http://localhost:3000` එකත් තියන්න — local test වලට)
4. **Authorized redirect URIs** එකටත් ඒකම දාන්න
5. **Save** ඔබන්න → විනාඩි 5-10කින් වැඩ කරන්න පටන් ගන්නවා

> 💡 OAuth consent screen එක **Testing** mode එකේ නම්, ලොග් වෙන්න ඕන
> Gmail accounts ටික **Test users** ලැයිස්තුවට එකතු කරන්න.

**ඊමේල් + password login එකට** කිසිම setup එකක් ඕන නෑ — ඒක දැනටමත් වැඩ කරනවා ✅

---

## කොටස 8 — Admin panel එක

1. App එකේ **👤 ගිණුම** tab එකෙන් **එකම ඊමේල් එකෙන්** register වෙන්න
   (`.env` එකේ `ADMIN_EMAILS` එකට දාපු එක)
2. ආයෙ page එක reload කරන්න
3. **🛠️ පරිපාලනය** tab එක පේන්න පටන් ගන්නවා →

| කොටස | මොනවද |
|---|---|
| 📈 Overview | users, checks, දිනුම් අනුපාතය, AI scans, **🔑 AI key pool** තත්ත්වය |
| 👥 Users | හැම user කෙනෙක්ගේම ඊමේල්, plan, login ක්රමය, කීයක් check කළාද, දිනුම් කීයක්ද |
| 📊 Report | ලොතරැයි අනුව සමස්ත + daily chart එක |
| 🔄 Scrape | **දැන්ම ප්රතිඵල අලුත් කරන්න** + අවසන් උත්සාහයේ තත්ත්වය |

👑 **Admin කෙනෙක් නම් "🍀 මගේ වාසනාව" (premium feature) එකත් නොමිලේ වැඩ කරනවා** —
PayHere setup කරන්න කලින් ටෙස්ට් කරන්න පුළුවන්.

---

## කොටස 9 — අලුත් version එකක් දාන්න

Code එක වෙනස් කළාම (හෝ අපි අලුත් version එකක් දුන්නම) GitHub එකට push කරන්න:

```bash
cd lk-lottery-master
git add .
git status --short          # ⚠️ .env පේනවා නම් නවත්තන්න!
git commit -m "update: ..."
git push
```

**Render එක තනියම අලුත් version එක deploy කරනවා** (විනාඩි 2-4).
හෝ Render Dashboard → **Manual Deploy** → *Deploy latest commit* ඔබන්න.

---

## කොටස 10 — Free plan එකේ සීමා ⚠️

මේවා **දැනගෙන ඉන්න ඕන** — නැත්නම් "app එක කැඩුනා" කියලා හිතෙන්න පුළුවන්.

| සීමාව | තේරුම | විසඳුම |
|---|---|---|
| 😴 **විනාඩි 15ක් කවුරුත් එන්නේ නැත්නම් නිදාගන්නවා** | ඊළඟ request එකට තත්පර ~60ක් ගන්නවා (Render loading page එකක් පෙන්නනවා) | පිළිගන්න පුළුවන්. හෝ cron-job.org වගේ එකකින් 14 විනාඩියකට වරක් `/api/health` එකට ping කරන්න (24/7 = ~730 පැය, free සීමාව 750 නිසා ගැලපෙනවා) |
| 💾 **Filesystem එක ephemeral** | Service එක restart/spin-down වුනාම **SQLite DB එක මැකෙනවා** → **register වුන users, history, payments නැති වෙනවා** | Test කරන්න අවුලක් නෑ (ප්රතිඵල දත්ත `data.json` එකෙන් එන නිසා scan/check ඔක්කොම වැඩ). ඇත්තට පාවිච්චි කරන්න → [කොටස 11](#කොටස-11--ඇත්තටම-පාවිච්චි-කරන්න) |
| 💿 **Persistent disk නෑ** | free plan එකට disk attach කරන්න බෑ | Paid plan (Starter) එකකට ගියාම හරි |
| ⏰ **Cron එක නිදාගෙන ඉන්න කොට වැඩ කරන්නේ නෑ** | උදේ 9:30 / රාත්රී 9:30 ට service එක නිදාගෙන නම් scrape එක run වෙන්නේ නෑ | ✅ **අපේ app එකේ විසඳුම දාලා තියෙනවා:** service එක ආයෙ ඇහැරෙන හැම වෙලාවකම "දත්ත පැය 8කට වඩා පරණද" බලලා තනියම බාගන්නවා |
| 📊 **750 free instance hours/මාසය** | 24/7 run කළොත් ~730 පැය — ගැලපෙනවා | හරි ✅ |
| 🔍 **SEO** | නිදාගෙන ඉන්න කොට `/robots.txt` එකට "disallow all" යවනවා | ඇත්තට පාවිච්චි කරන කොට (paid) ප්රශ්නයක් නෑ |

> ### 💡 Test කරන කාලෙට හොඳම ක්රමය
> Free plan එකෙන් **හැම දෙයක්ම test කරන්න** (camera, QR, AI, offline, admin).
> හරියට වැඩ කරනවා කියලා හිතුනාම විතරයි paid එකට යන්න.

---

## කොටස 11 — ඇත්තටම පාවිච්චි කරන්න

**Users + history + payments රැකෙන්න ඕන නම්:**

### 1. Plan එක upgrade කරන්න

Render Dashboard → ඔබේ service → **Settings** → **Instance Type** → **Starter** (2026 වන විට ~$7/මාසය).

### 2. Persistent disk එකක් attach කරන්න

**Settings → Disks → Add Disk:**

| Field | අගය |
|---|---|
| **Name** | `lk-data` |
| **Mount Path** | `/var/data` |
| **Size** | `1 GB` (ප්රමාණවත්) |

### 3. `DB_PATH` env var එක දාන්න

**Environment** → Add:

| Key | Value |
|---|---|
| `DB_PATH` | `/var/data/app.db` |

✅ දැන් users, ගිණුම්, history, payments **restart වුනත් රැකෙනවා**.

> 💡 `render.yaml` එකේ මේ ටික comment කරලා තියෙනවා — uncomment කරලාත්
> automatic කරගන්න පුළුවන් ([render.yaml](render.yaml) බලන්න).

### 4. අනිත් නරඹන්න ඕන දේවල්

- **Custom domain** (උදා: `lankalottery.lk`) → Settings → Custom Domains (HTTPS නොමිලේ ✅)
  ඊට පස්සේ `APP_BASE_URL` එකත් අලුත් domain එකට වෙනස් කරන්න
- **SEO**: [Google Search Console](https://search.google.com/search-console) එකට
  `https://ඔබේ-domain/sitemap.xml` submit කරන්න
- **Backup**: `data/app.db` එකට regular backup එකක් (Render disk snapshots දිනකට එකක් ගන්නවා)
- `JWT_SECRET` / Gemini keys / PayHere secret **කවදාවත්** GitHub එකට යවන්න එපා

---

## කොටස 12 — ප්රශ්න ආවොත්

| ප්රශ්නය | හේතුව | විසඳුම |
|---|---|---|
| Deploy එක fail — `npm ci ... lock file` | `package-lock.json` එකයි `package.json` එකයි ගැලපෙන්නේ නෑ | Build Command එක `npm install` කියලා හරියටම දාලා තියෙනවද බලන්න (Blueprint එකේ ඒක දාලා තියෙනවා) |
| Deploy fail — `better-sqlite3` build error | Node version එක ගැලපෙන්නේ නෑ | `.node-version` file එක තියෙනවද බලන්න (`22.22.0`). නැත්නම් Env එකට `NODE_VERSION` = `22.22.0` දාන්න |
| "Your service is live" ඒත් page එක load වෙන්නේ නෑ | Health check fail / port වැරදි | `Start Command` = `npm start` ද බලන්න. Logs tab එකේ error එක බලන්න |
| App එක open වුනාට tabs වැඩ කරන්නේ නෑ | `API_BASE_URL`/`APP_BASE_URL` වැරදි | `APP_BASE_URL` එක ඔබේ ඇත්ත `https://...onrender.com` URL එකට දාන්න |
| **"📛 ප්රතිඵල දත්ත තවම ලැබිලා නෑ"** gate එක එනවා | `data.json` එකේ දත්ත නෑ / scrape එක fail | Admin නම් gate එකේ **⬇️ දැන්ම ප්රතිඵල ලබාගන්න** ඔබන්න. නැත්නම් Logs එකේ scrape error එක බලන්න |
| AI Scan එක "Setup ඕන" කියනවා | `GEMINI_API_KEY_1..5` දාලා නෑ (හෝ env var එකට පස්සේ restart වුනේ නෑ) | Keys දාලා Render එක ආයෙ deploy වෙනකම් ඉන්න. Logs එකේ `keys:5` පේනවද බලන්න |
| කැමරාව open වෙන්නේ නෑ | `https://` නෙවෙයි | ඔබේ URL එක `https://` ද බලන්න (Render එකේ හැමවෙලාවෙම https ✅) |
| Login වුනාට පස්සේ ආයෙ logout වෙලා | Free plan එකේ DB එක reset වෙන නිසා (spin-down) | [කොටස 11](#කොටස-11--ඇත්තටම-පාවිච්චි-කරන්න) — disk + paid plan |
| Admin tab එක පේන්නේ නෑ | `ADMIN_EMAILS` හිස් / වෙනත් ඊමේල් එකකින් register වුනා | `ADMIN_EMAILS` එක හරිට දාලා **ඒ ඊමේල් එකෙන්ම** register වෙන්න |
| Gmail login button එකෙන් වැඩ කරන්නේ නෑ | Render domain එක Google OAuth එකට දාලා නෑ | [කොටස 7](#කොටස-7--google-gmail-login-එක-හදන්න) |
| පළවෙනි load එකට තත්පර 60ක් ගන්නවා | Free plan spin-down | Normal ✅ (හෝ paid plan එකකට යන්න) |

**Logs බලන්න:** Render Dashboard → ඔබේ service → **Logs** (හෝ deploy එකේ **Events**).

---

## ✅ අවසාන checklist

- [ ] Zip එක ගලවලා local එකේ `npm install` + `npm start` කරලා බැලුවා
- [ ] `npm test` → 44 pass, `npm run test:offline` → 30 pass
- [ ] GitHub repo එකේ **`.env` නෑ** (⚠️ අනිවාර්යයි)
- [ ] Render එකේ Web Service එක Free plan එකෙන් හැදුවා
- [ ] Env variables ඔක්කොම දැම්මා (`ADMIN_EMAILS` ඇතුළුව)
- [ ] `/api/health` එකෙන් `{"ok":true}` ආවා
- [ ] Phone එකෙන් camera scan කරලා බැලුවා
- [ ] Airplane mode දාලා **offline** test එක කරලා බැලුවා
- [ ] `ADMIN_EMAILS` එකෙන් register වෙලා Admin panel එක බැලුවා

**හැම දෙයක්ම හරි ගියොත් — ඔබට ලෝකෙට විවෘත ඇත්ත app එකක් තියෙනවා! 🎉🎟️**

---

> ⚖️ **මතක් කිරීම:** මේ app එක තාක්ෂණයෙන් හදපු මෙවලමක් — නිල ප්රතිඵල නොවේ.
> අවසන් තීරණයකට කලින් NLB/DLB නිල මූලාශ්රයෙන් තහවුරු කරගන්න.
> සම්පූර්ණ disclaimer එක [README-SI.md](README-SI.md) එකේ 16 කොටසේ තියෙනවා.
