# 🎟️ LK Lottery Master — සම්පූර්ණ ගයිඩ් (සිංහල)

> **Version 1.7.0** · ශ්‍රී ලංකාවේ **NLB** සහ **DLB** ලොතරැයි ප්‍රතිඵල බලන්න,
> ටිකට් QR එක **scan** කරලා ඇත්ත **දිනුම් මුදල** දැනගන්න, **offline** එකේත් වැඩ කරන,
> **AI** එකෙන් ටිකට් කියවන, **තමන්ගේ වාසනාව** අනුමාන කරන web app එකක්.

මේ document එකේ තියෙන්නේ app එක **හදන්න, run කරන්න, test කරන්න සහ deploy කරන්න**
ඕන හැම දෙයක්ම. ඉස්සෙල්ලාම තියෙන **"ඉක්මන් start"** කොටස කියවලා පටන් ගන්න.

> ### 🚀 GitHub + Render එකට දාන්නද?
> ඒකට වෙනම පියවරෙන් පියවර ගයිඩ් එකක් තියෙනවා: **[DEPLOY-SI.md](DEPLOY-SI.md)**
> (zip එක ගැලවීම → GitHub → Render → phone එකෙන් test කිරීම → admin panel).

---

## 🆕 v1.3.0 — මොනවද අලුතෙන් හදලා තියෙනවා

මේ version එකේදී **QR කියවීමයි පෙන්වීමයි** අලුතින්ම හදලා තියෙනවා.

### 0. 🆕 v1.7.0 — 🔳 ලොතරැයි 6ක QR කියවීමේ වැරදි හදලා · 👤 My Account ඉතිහාසය · 🔎 Admin සෙවීම

#### 🔳 1. ඔයා report කරපු QR කියවීමේ ප්‍රශ්න 6ම හදලා
| ඔයා කිව්ව ප්‍රශ්නය | ඇත්ත හේතුව | දැන් |
|---|---|---|
| **ලග්න වාසනා** — අංක 4න් 2යි කියවුනේ | v1.6 එකේ "අනන්‍යතාව" shortcut එක ගැලපුනාම **අංක කියවන එක නවත්තනවා** | දැන් දෙකම කියවලා හරි එක තෝරනවා → අංක **4ම** |
| **හඳහන** — ලග්නය හඳුනාගන්නේ නෑ | ලග්නය **අංකයකින්** (1-12) තිබ්බොත් කියවන්නේ නෑ | "LAGNA 5" → සිංහ · "ලග්නය 3" → මිථුන (තහවුරු කරන්න පෙන්නනවා) |
| **මෙගා පවර්** — super no වැරදියි | super අංකය ටිකට් අංකයක් විදිහට ගන්නවා | "K 37 12 45 67 89" → **super = 37** ✓ (අමතර ඉලක්කම් කාණ්ඩයේ නීතිය) |
| **ශනිදා / අද කෝටිපති** — අංක වැරදි | serial/draw ඉලක්කම් ටිකට් අංක වගේ කැබලි වෙනවා | අංක කාණ්ඩය හරියටම `digitWidth × numberCount` විදිහට වෙන් කරනවා |
| **මහජන සම්පත** — සමහර ඒවාට අකුර read වෙන්නේ නෑ | අකුර තනිව තිබ්බොත් (label එකක් නැතුව) ගන්නේ නෑ | ඕනෑම තනි අකුරක් (ඉංග්‍රීසි **හෝ සිංහල**) + අංක 6ම |
| ටිකට් කේත QR (`085016050326004`) | — | අංක **හදන්නේම නෑ** → ලොතරැයිය + draw හඳුනාගෙන අංක ඉල්ලනවා |

**ලොකුම වෙනස:** පරණ version එකේ "මේක ටිකට් කේතයක්" කියලා තේරුනාම අංක කියවන එක නවත්තලා අතින් ඉල්ලනවා.
දැන් **දෙකම කියවලා**, ගානට ගැලපෙන එක තෝරනවා — ඒ නිසා QR එකේ අංක තියෙන ටිකට් වලටත් වැඩ කරනවා,
අංක නැති ටිකට් වලට වැරදි අංක හදන්නෙත් නෑ. Regression tests **15ක්** මේ 6 ලොතරැයියටම (`npm run test:qr`).

#### 👤 2. My Account tab එකේම සම්පූර්ණ ඉතිහාසය
* Email + password එකෙන් login → **🧾 මගේ සම්පූර්ණ ඉතිහාසය** Account tab එකේම
* Filters: ලොතරැයිය · දින සිට/දක්වා · දිනුම් විතරයි → "තව බලන්න" (pagination)
* සාරාංශය: මුළු check ගණන · දිනුම් ගණන · **මුළු දිනුම් මුදල**

#### 🔎 3. Admin ට හැම user කෙනෙක්ගේම ක්‍රියාකාරකම්
* අලුත් section එකක්: **🔎 ක්‍රියාකාරකම් සෙවීම** (`GET /api/admin/checks`)
* **email/නම අනුව** · **දින පරාසය අනුව (date wise)** · **එක user අනුව (user wise)** · ලොතරැයිය · දිනුම්/පරාද
* එක user කෙනෙක්ගේ හැම දේම බලන්න — "👤 මේ user ගේ ක්‍රියාකාරකම්" බොත්තම
* **⬇️ CSV** — සෙවපු දේ spreadsheet එකකට export (date-wise reports වලට)
* 🔒 සාමාන්‍ය user ට මේක පේන්නේ නෑ (403) — test එකකින් ඒකත් ඔප්පු කරලා

### 0.1 🆕 v1.6.0 — 🎫 **"QR එකේ ඇත්තටම මොනවද තියෙන්නේ" ප්‍රශ්නය විසඳලා**

ඔබ එවපු `ticketParser.js` / `prizeEngine.js` / `resultsFetcher.js` වලින් තහවුරු වුන **ලොකුම
කරුණ**: **NLB/DLB ටිකට් වල QR/බාර්කෝඩ් එකේ ඔබ තෝරපු අංක ඇත්තේ නෑ** — ඒකේ තියෙන්නේ
ටිකට් එකේ **අනන්‍යතාව** විතරයි (පුවරුව · ලොතරැයිය · draw අංකය · serial).

ඒ නිසා පරණ version එකේ මම QR එකේ ඉලක්කම් වලින් "ටිකට් අංක" හැදුවා — ඒවා **හුඟක් වෙලාවට
වැරදි** (draw/serial එකේ ඉලක්කම් ටිකට් අංක විදිහට ගන්නවා) → ප්‍රතිඵලය වැරදි. දැන් ඒක
සම්පූර්ණයෙන්ම හදලා.

#### 🎫 දැන් QR එකෙන් කියවන දේ (ඇත්ත ටිකට් රටාවලට)
| QR/බාර්කෝඩ් එකේ තියෙන රටාව | කියවන දේ |
|---|---|
| **NLB ඉලක්කම් 15** — `085016050326004` | ලොතරැයි කේතය `085` · draw `1605` · serial `0326004` |
| **DLB hyphen** — `4993-500395754-7-04` | draw `4993` · serial `500395754` · check `7` · terminal `04` |
| **URL QR** — `https://www.nlb.lk/results/handahana/1605` | පුවරුව · ලොතරැයිය · draw අංකය |
| (අංකත් තියෙන QR එකක් නම් — කලාතුරකින්) | අංක ටිකත් කියවනවා |
| වෙන මොනවා හරි | හඳුනාගන්නේ නෑ → ඇත්ත text එක copy කරන්න දෙනවා |

#### 🎯 2. Draw අංකයෙන් **ලොතරැයිය හඳුනාගන්නවා** (`GET /api/identify`)
අපේ database එකේ පසුගිය මාස 6ේ draws තියෙන නිසා — draw අංකය දැනගත්තම ලොතරැයිය
හඳුනාගන්න පුළුවන්. ඔබ එවපු උදාහරණ **දෙකම අපේ දත්ත වලින් තහවුරු වුනා**:
* NLB `1605` → **හඳහන** (ඔබේ file එකේ comment එකේ තිබ්බ "NLB Handahana tickets" ✓)
* DLB `4993` → **ලග්න වාසනා** (එහි තිබ්බ "DLB Lagna Wasanawa" ✓)

එකම අංකය ලොතරැයි දෙකකට තිබ්බොත් (උදා: DLB `3121`) ඔබට තෝරන්න දෙනවා.

#### 📱 3. දැන් scan කරද්දී වෙන දේ
1. QR එක කියවුනාම — **පුවරුව · ලොතරැයිය · draw · serial** පෙන්නනවා
2. **ඒ draw එකේ නිල දිනුම් අංකත් පෙන්නනවා** (ඔබේ අංක එක්ක සසඳන්න)
3. *"මේ QR එකේ ඔබ තෝරපු අංක නෑ"* කියලා පැහැදිලිව කියනවා + buttons **2ක්**:
   ✏️ **අංක ටයිප් කරන්න** · 🤖 **AI Scan එකෙන් කියවන්න**
4. ✏️ ඔබද්දී ලොතරැයියයි **QR එකේ draw අංකයයි දෙකම පුරවලා** check tab එකට යනවා →
   ප්‍රතිඵලය ගණනය වෙන්නේ **ඔබේ ටිකට් එකේ ඒ draw එකටම** (අලුත්ම draw එකට නෙවෙයි)
5. 🚫 **වැරදි ප්‍රතිඵලයක් කවදාවත් පෙන්නන්නේ නෑ** — අංක නැතිව ගණනය කරන්නේ නෑ

#### 🐞 හම්බුනු bug එකක් (හදලා)
"අනාගත draw" පරීක්ෂාව QR එකේ draw අංකය **දැනට තෝරලා තියෙන වෙන ලොතරැයියක**
අලුත්ම draw එකත් එක්ක සසඳනවා (උදා: හඳහන #1630 vs DLB #4993) → *"තවම නිකුත් වී නෑ"*
කියලා වැරදි පණිවිඩයක්. දැන් ටිකට් අනන්‍යතාව සහ පුවරුව ගැලපෙන වෙලාවට විතරයි ඒ පරීක්ෂාව.

### 0.1 🆕 v1.5.0 — 🎯 0.8cm QR · 🎯 Chrome focus · 🏆 prize රටා 16ම තහවුරු · 🔊 හඬ unlock

**ඔබ දුන්නු `Sri_Lanka_Lottery_Prize_Structures_NLB_DLB` ලේඛනය අනුව ලොතරැයි 16ම
පරීක්ෂා කළා — දැන් test 145ක් ඒක ඔප්පු කරනවා (`npm run test:prize`).**

#### 🔴 හම්බුනු ඇත්ත bug එකක් (හදලා)
**අද සම්පත** (game 3 = අකුර + තනි ඉලක්කම් 4) එකේ ලේඛනයේ [1.7] අනුව තියෙන
**3 වන (ඕනෑම ඉලක්කම් 3ක්) = රු.4,000** සහ **4 වන (ඕනෑම ඉලක්කම් 2ක්) = රු.1,000**
tiers දෙක engine එකේ **නොතිබ්බා** → ඇත්තට දිනපු ටිකට් එකක් "දිනුමක් නෑ" කියලා
පෙන්නුවා. දැන් හදලා, test එකකුත් දාලා තියෙනවා.

#### 🎯 0.8cm × 0.8cm QR එක — "කියවන්නේම නෑ" ප්‍රශ්නය විසඳලා
හේතුව හොයාගත්තා: decoder එකට යවන කොටස **900px වලට කුඩා** කරනවා. ටිකට් එක
105mm පළල, QR එක 8mm → 4K frame එකක QR එකේ පික්සෙල් ~290. ඒත් 900px වලට
කුඩා කළාම ඉතුරු වෙන්නේ ~68px → QR module එකකට පික්සෙල් **2ක්** → කියවන්නම බෑ.
දැන් තියෙන දේ:
* **ස්වාභාවික පික්සෙල් වලින්ම කියවන high-res පාර** (2400px — කුඩා නොකර)
* **සම්පූර්ණ frame එකේ පාර** (රාමුවෙන් පිටත QR එකක් තිබ්බත්)
* **🔎 auto-hunt** — තත්පර ~4ක් කියවාගන්න බැරි උනාම තනියම:
  native-res → **full-resolution photo (ImageCapture)** → **zoom 2x → 3x → 4x** →
  ආයෙ photo. (ඔබ බොත්තමක් ඔබන්න ඕන නෑ)
* ඒ හැම පියවරක්ම fail වුනොත් **📛 උපදෙස් කාඩ් එකක්** + ආයෙ උත්සාහ/Photo buttons
* 🔍 **"QR එකේ ඇත්ත දත්ත"** කියන copy-button එකක් එක්ක — QR එක කියවුනත්
  results එක්ක ගැලපෙන්නේ නැත්නම් ඒ **text එක copy කරලා අපිට එවන්න** පුළුවන්.
  එතකොට ඔයාගේ ටිකට් QR format එකට parser එක 100% tune කරන්න පුළුවන්.

#### 🎯 Chrome focus (හරියට focus වෙන්නේ නෑ)
* **හැම 2.5 තත්පරයකට වතාවක්** continuous focus එක අලුතින් apply කරනවා (Android
  Chrome එකේ AF එක නිකම් stall වෙනවා)
* **🎯 Focus (අතින්)** slider එකක් — `focusDistance` support කරන device වලට
  (auto-focus එක 8mm QR එකට lock වෙන්නේ නැති වෙලාවට මේක තමයි ඉක්මන් විසඳුම)
* 🎯 Focus බොත්තම — manual → continuous cycle + stream restart එකක් (අලුත් AF sweep)

#### 🔊 හඬ play නොවීම (දිනුම + පරාද දෙකම)
* **Audio unlock** — පළවෙනි තට්ටුව (tap) එකේදීම AudioContext එක resume කරලා TTS
  engine එක warm කරනවා. (මේක නොකළොත් Chrome/Safari වල හඬ play වෙන්නේම නෑ)
* `cancel()` → 130ms → `speak()` (Chrome Android එකේ එකම tick එකේ දැම්මොත් utterance
  එක නැති වෙනවා — ඒකයි කලින් හඬ ආවේ නැත්තේ)
* දිනුමට උඩු ගමන් 3ක්, පරාදයට **පහළ ගමන් 2ක්** (වෙනස් හඬ)
* **🎧 හඬ පරීක්ෂා කරන්න** බොත්තම — ⚙️ උසස් සැකසුම් යටතේ. ඔබලා phone එකේදීම
  දිනුම් + පරාද වාක්‍ය දෙක ඇහෙනවද කියලා බලන්න පුළුවන්.

### 1. 🔳 QR parser එක සම්පූර්ණයෙන්ම අලුතින් (`public/qr-parse.js`)

#### 🎟️ 1. "QR එකේ තියෙන හැම දෙයක්ම" අරගෙන ප්‍රතිඵලය එක්ක match කරනවා
QR එකේ තියෙන **ලොතරැයිය · දිනය · draw අංකය · English අකුර · ලග්නය (රාශිය) ·
special letter · special number · ටිකට් අංක (1-ඉලක්කම් හෝ 2-ඉලක්කම්)** — මේ හැම එකක්ම
අරගෙන, දිනුම් ප්‍රතිඵලයේ තියෙන දේවල් එක්ක **එකින් එක සැසඳීමක්** ප්‍රතිඵලය ඇතුළේ
පෙන්නනවා (`public/ticket-verify.js`):

| | ඔබේ ටිකට් එක | | දිනුම් ප්‍රතිඵලය | |
|---|---|---|---|---|
| අකුර | **S** | = | **S** | ✅ |
| ටිකට් අංක 1 | **9** | ≠ | 4 | ❌ |
| … | | | | |

* ✅ හරි · ❌ ගැලපෙන්නේ නෑ · ⚠️ QR එකේ ඒක නෑ (වැරදි කියලා කියන්නේ නෑ)
* අංක ටික වර්ණ චිප් වලින් — **දිනුම් අංක අතරේ තියෙන ඒවා කොළ පාටින්**, නැති ඒවා
  ඉරි ඇඳලා ("3 / 6 ගැලපුනා" කියලා ගණනත් පෙන්නනවා)
* **draw අංකය / දිනය / ලොතරැයියත්** සැසඳෙනවා — ඒ නිසා "වැරදි draw එකක් එක්ක
  check වුනාද" කියන ප්‍රශ්නය ඉතුරු වෙන්නේ නෑ
* 🔁 **ඉලක්කම් 1/2 ආකාරය වෙනස් වුනත්** ගානට හදාගන්නවා — උදා: ලොතරැයියට
  2 බැගින් 4ක් ඕන ඒත් QR එකේ `1 2 4 5 6 7 8 9` කියලා තිබ්බොත් `12 45 67 89` කියලා
  හදාගන්නවා (ගාන **හරියටම ගැලපෙනවා නම් විතරයි** — නැත්නම් අනුමාන කරන්නේ නෑ)
* Special letter එකක් තිබ්බොත් ඒකත් කියවලා පෙන්නනවා (`🅰️ letters[]`)

#### 🔊 2. දිනුම්/පරාද හඬ — මුදල **වචන වලින්**, grammar හරියටම (`public/announce.js`)
| අවස්ථාව | ශබ්දයෙන් කියන දේ |
|---|---|
| 🏆 දිනුමක් | “**Congratulations! You have won forty rupees.**” |
| 🏆 ලොකු දිනුමක් | “**Congratulations! You have won twenty million rupees in Mahajana Sampatha.**” |
| 🏆 ටයර් එකක් | “Congratulations! You have won forty rupees. **That is the 3rd prize.**” |
| 😔 දිනුමක් නෑ | “**Sorry, you have lost this time. Try again.**” |
| ❓ දත්ත නෑ | “The result for this ticket is not available yet. Please check again later.” |

* මුදල **ඉලක්කම් වලින් නෙවෙයි වචන වලින්** (කලින් “40” කියවද්දී අවුල් ඇහුනා) —
  `40 → forty` · `1 → one rupee` (ඒක වචනය වෙනස්) · `1,250 → one thousand two hundred and fifty`
* 🔊 සැකසුම් button එකෙන් හඬ **ක්‍රියාත්මක/නිශ්ශබ්ද** කරන්න පුළුවන්
* ⚠️ කලින් එකම ප්‍රතිඵලයක් සමහර වෙලාවට **පාර 2-3ක්** කිව්වා — දැන් එක පාරයි

#### 🧹 3. එකම වැඩ කරන buttons අයින් කළා (සරලයි)
| කලින් (6ක්) | දැන් (3ක්) |
|---|---|
| 📸 කැමරාවෙන් Scan · 📱 Phone camera app · 🖼️ Gallery | **📸 කැමරාවෙන් Scan** (එකක්) + **🖼️ Photo එකක් එවන්න** (එකම file input එකෙන් camera/gallery දෙකම) |
| 📷 Photo ගන්න (AI) · 📸 උසස් ගුණත්ව Scan (QR) | **📷 Photo** (mode එකට අනුව තනියම හරි වැඩේ කරනවා) |
| confirm card එකේ buttons 3ක් | **2යි** (✅ තහවුරු · ✏️ අතින්) — AI එකට යන්න hint එකක් විතරයි |

### 1. 🔳 QR parser එක සම්පූර්ණයෙන්ම අලුතින් (`public/qr-parse.js`)
පරණ parser එකේ තිබ්බ **වැරදි 4ක්** හදලා තියෙනවා:

| පරණ ප්‍රශ්නය | දැන් |
|---|---|
| 🔴 **ටිකට් දිනය අංක විදිහට කියවනවා** (2026-09-25 → "20","26","09","25" ටිකට් අංක විදිහට) | දිනය **වෙනම හඳුනාගෙන** ඒ පරාසය ඇතුළේ ඉලක්කම් ටිකට් අංක වලින් අයින් කරනවා (YYYY-MM-DD · DD/MM/YYYY · YYYYMMDD · 25 SEP 2026 · සිංහල මාස නම්) |
| 🔴 **ලග්නය (රාශිය) කියවන්නේ නෑ** | English (GEMINI) · සිංහල (මිථුන) · தமிழ் (மிதுனம்) · ලකුණ (♊) — හැම ආකාරයකින්ම කියවනවා |
| 🔴 **Special/Super number කියවන්නේ නෑ** | "SN", "SPECIAL", "විශේෂ" වචන වලින් + අංක කාණ්ඩයට කලින් තියෙන ඉලක්කමෙනුත් හඳුනාගන්නවා |
| 🔴 **ලොතරැයියේ format එක බලන්නේ නෑ** | දැන් **ලොතරැයි 16ටම තම තමන්ගේ format** එකට හරියටම — ඉලක්කම් 6ක් (1 බැගින්) නම් 6ම, 4×2 නම් 4ම, අකුරු/ලග්නය/SN තියෙන ඒවාට ඒවා |

**වැදගත්ම දේ:** සම්පූර්ණයෙන්ම කියවාගන්න බැරි උනොත් app එක **වැරදි ප්‍රතිඵලයක් පෙන්නන්නේ නෑ** —
"⚠️ QR එක සම්පූර්ණයෙන්ම කියවාගන්න බැරි උනා" කියලා කියවපු දේ පෙන්නලා, තහවුරු කරන්න /
අතින් නිවැරදි කරන්න / AI Scan එකෙන් try කරන්න කියන විකල්ප 3ක් දෙනවා.

### 2. 🌐 QR scan එක **හැම browser එකකම** (Chrome · Edge · Safari · Firefox)
පරණ ප්‍රශ්නය: Chrome/Edge (Android) වල `BarcodeDetector` තියෙන නිසා loop එකේ කාලය ඒකට යනවා;
ඒක පොඩි QR එක කියවන්නේ නැති නිසා **Firefox එකේ (jsQR) විතරයි** වැඩ කළේ. දැන්:
- `BarcodeDetector` එකට **කල් සීමාවක්** (220ms) — හෙමින් නම් අත්හැරලා තත්පර 6කට නවත්තනවා
- **jsQR එක හැම browser එකකම** දුවනවා (offline file එකක් — `/vendor/jsqr.min.js`)
- 🔍 **"දැන්ම" button** එකක් — එක ඔබලා ගැඹුරින්ම (frame stacking + lattice) scan කරන්න පුළුවන්
- 🔬 **Diagnostics පේළියක්** (⚙️ උසස් සැකසුම්) — මොන decoder එක වැඩ කරනවද, camera resolution, frames ගණන

### 3. 🎨 UI — buttons දැන් camera එකට **යටින්** (එක අතින් අල්ලද්දී පහසුයි)
- ප්‍රධාන button එකයි 🔆 Torch · 🔍 Zoom · 🎯 Focus · 🔍 දැන්ම ටිකයි දැන් camera preview එකට
  **යටින්**, තිරයේ පහළම (sticky) — මාපටැඟිල්ලට ළඟට
- දිග පැහැදිලි කිරීම් (AI essays, crop පික්සෙල් විස්තර) අයින් කළා
- 📱 වෙනත් ක්රම (phone camera app · gallery) **වැහිලා තියෙන** කොටසක — අවශ්‍ය වුනාම තනියම විවෘත වෙනවා
- කැමරාවේ torch නැති device වල 🔆 button එක පෙන්නන්නේම නෑ (නිකම් තියෙන එක නරකයි)

### 4. 🧪 අලුත් test suite එකක්
```bash
npm run test:qr        # 52 tests — ලොතරැයි 16ම + දිනය/ලග්නය/SN + වැරදි QR
```

---

## 📑 අන්තර්ගතය

1. [මොනවද තියෙන්නේ (features)](#1-මොනවද-තියෙන්නේ)
2. [ඉක්මන් start (5 විනාඩියෙන්)](#2-ඉක්මන්-start)
3. [📱 Phone එකෙන් පාවිච්චි කරන්න (HTTPS අනිවාර්යයි)](#3--phone-එකෙන්-පාවිච්චි-කරන්න)
4. [📴 Offline (internet නැතුව)](#4--offline-internet-නැතුව)
5. [🔳 QR scan කරන හොඳම ක්‍රමය (පොඩි QR එකට)](#5--qr-scan-කරන-හොඳම-ක්‍රමය)
6. [🤖 AI Scan + Gemini keys 5](#6--ai-scan--gemini-keys)
7. [🍀 "මගේ වාසනාව" (Premium)](#7--මගේ-වාසනාව-premium)
8. [🛠️ Admin panel](#8-️-admin-panel)
9. [🔄 ප්‍රතිඵල ස්වයංක්‍රීයව ලබාගැනීම](#9--ප්‍රතිඵල-ස්වයංක්‍රීයව-ලබාගැනීම)
10. [🌐 භාෂා 3](#10--භාෂා-3)
11. [🧪 Test කරන විදිය](#11--test-කරන-විදිය)
12. [🚀 Deploy කරන්න](#12--deploy-කරන්න)
13. [🔐 Security checklist](#13--security-checklist)
14. [🧯 ප්‍රශ්න ආවොත් (troubleshooting)](#14--ප්‍රශ්න-ආවොත්)
15. [📁 File structure](#15--file-structure)
16. [⚖️ වගකීම් ප්‍රතික්ෂේප කිරීම](#16-️-වගකීම්-ප්‍රතික්ෂේප-කිරීම)

---

## 1. මොනවද තියෙන්නේ

### ටිකට් check කිරීම
| Feature | විස්තරය |
|---|---|
| 🔳 **QR Scan** | ටිකට් එකේ QR එක කැමරාවට ගත්තම **තනියම** කියවනවා (button එකක් ඔබන්නේ නෑ) |
| 🤖 **AI Scan** | QR එක හොඳට පේන්නේ නැති වුනත්, සම්පූර්ණ ටිකට් එකේ **photo එකකින්** AI එක අංක කියවලා ප්‍රතිඵලය බලනවා |
| 🎟️ **අතින් පරීක්ෂාව** | අංක ටයිප් කරලා බලන ක්‍රමය (dynamic boxes + auto-advance) |
| 💰 **ඇත්ත දිනුම් මුදල** | NLB/DLB **නිල prize structure** එකෙන් (16 ලොතරැයියකට වෙන වෙනම) |
| 🔊 **ශබ්දයෙන් දැනුම්දීම** | දිනුමක් ඇත්නම් සිංහලෙන්/ඉංග්‍රීසියෙන් කියවනවා + වාදනය |
| 📳 **Vibration** | QR එක කියෙව්වාම / දිනුමක් ඇති වුනාම (Android) |
| ⏱️ **5-තත්පර ප්‍රතිඵලය** | ප්‍රතිඵලය තිරයේ 5 තත්පර පෙන්නලා තනියම අයින් වෙනවා — **කැමරාව නවත්තන්නේ නෑ** |
| 🕘 **History** | හැම check එකක්ම — ලොතරැයි අනුව + දිනය අනුව filter කරලා බලන්න |

### ප්‍රතිඵල
| Feature | විස්තරය |
|---|---|
| 📋 **අලුත්ම ප්‍රතිඵල** | ලොතරැයි 16ටම අලුත්ම draw එක — **draw අංකය හැම වෙලාවෙම** පේනවා |
| 📅 **දිනය අනුව** | කැලැන්ඩරයෙන් දිනයක් තෝරලා ඒ දවසේ හැම ලොතරැයියකම ප්‍රතිඵල |
| 🔎 **ලොතරැයි අනුව** | ලොතරැයිය තෝරලා පසුගිය draws (මාස 6ක්) |
| 📊 **විශ්ලේෂණ** | ලොතරැයි අනුව ඔබේ දිනුම්/අලාභ සාරාංශය |

### Offline · භාෂා · වෙනත්
- 📴 **Offline** — app එක cache වෙනවා; internet නැතුවත් **QR scan කරලා දිනුම check කරන්න පුළුවන්**
- 🌐 **සිංහල · English · தமிழ்** (උඩම `සිං | EN | தமி` switcher එකෙන්)
- 👤 **ගිණුම්** — ඊමේල්+මුරපදය **සහ** Google (Gmail) login
- 🍀 **මගේ වාසනාව** — numerology + AI අනුමානය (Premium)
- 🛠️ **Admin panel** — users, භාවිතය, ප්‍රතිඵල, AI key pool
- ⚠️ **Disclaimer** — app එක open කරද්දීම + 📄 අප ගැන / රහස්‍යතා / මුදල් ආපසු tabs (පහළම)

---

## 2. ඉක්මන් start

```bash
cd lk-lottery-master

npm install          # dependencies (තත්පර 10-30ක්)
cp .env.example .env # .env එක හදන්න

# ⚠️ අනිවාර්යයි: JWT_SECRET එක random එකක් කරන්න
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

npm start            # http://localhost:3000
```

> 💡 මේ zip එකේ **`.env` file එක දැනටමත් තියෙනවා** (ඔබ දුන්න Gemini keys 5 ඒකේ තියෙනවා).
> ඒ නිසා `cp` කරන්න ඕන නෑ — කෙලින්ම `npm start` කරන්න පුළුවන්.
> නමුත් **`JWT_SECRET` එක අනිවාර්යයෙන් වෙනස් කරන්න** (production එකට යන්න කලින්).

| Command | මොකද කරන්නේ |
|---|---|
| `npm start` | Server එක start (offline prize engine එකත් ඉන්නම build වෙනවා) |
| `npm run scrape` | ප්‍රතිඵල දැන්ම DLB/NLB එකෙන් බාගන්න |
| `npm test` | Prize engine + parser tests **44** |
| `npm run test:prize` | 🏆 **NLB/DLB රටා 16ම** ඔබ දුන්නු ලේඛනයට ගැලපෙනවද **145** |
| `npm run test:qr` | 🔳 QR parser tests **81** (ලොතරැයි 16ම · 1/2 ඉලක්කම් auto · **ඇත්ත NLB/DLB ටිකට් රටා**) |
| `npm run test:verify` | 🎟️ සැසඳීම + 🔊 හඬ වාක්‍ය tests **45** |
| `npm run test:offline` | 📴 Offline + 👤 user history + 🔎 admin සෙවීම **47** |
| `npm run test:e2e` | 🌐 ඇත්ත browser එකකින් frontend tests **95** (Chrome/Edge ඕන) |
| `npm run test:gemini` | Gemini keys + model එක වැඩ කරනවද |
| `npm run build:offline` | `prizes.js` → `public/prize-engine.js` ආයෙ build කරන්න |

---

## 3. 📱 Phone එකෙන් පාවිච්චි කරන්න

**මේක අනිවාර්යයෙන් කියවන්න** — නැත්නම් කැමරාව වැඩ කරන්නේ නෑ.

Browser එකක් කැමරාව (`getUserMedia`) දෙන්නේ **`https://`** පිටුවකට විතරයි
(හෝ `localhost`). `http://192.168.1.5:3000` වගේ LAN IP එකකින් හැම browser එකක්ම
කැමරාව **block** කරනවා (Chrome, Edge, Safari, Firefox හැම එකක්ම).

**විසඳුම් 2ක්:**

**1) Test කරන කාලෙට (LAN එකේ):**

```bash
npm run cert         # self-signed certificate එකක් හදනවා (certs/)
HTTPS=1 npm start    # https://192.168.x.x:3000
```

Phone එකේ ඒ address එකට ගිහින් certificate warning එක එක වතාවක් accept කරන්න.

**2) ඇත්තටම පාවිච්චි කරන්න (නිවැරදි ක්‍රමය):** ඇත්ත domain එකකට + free HTTPS එකකට
deploy කරන්න (Render / Railway / Fly.io / VPS + Caddy). [12. Deploy කරන්න](#12--deploy-කරන්න)

> 📴 **Service worker (offline cache)** එකත් HTTPS හෝ localhost එකේ විතරයි වැඩ කරන්නේ.
> `http://` LAN එකේදී app එක වැඩ කරනවා, ඒත් offline cache එක සක්‍රීය වෙන්නේ නෑ.

---

## 4. 📴 Offline (internet නැතුව)

### මොකද cache වෙන්නේ

| Layer | File / දත්ත | කොහොමද අලුත් වෙන්නේ |
|---|---|---|
| **App shell** | `/`, `/offline.js`, `/prize-engine.js`, `/qr-decode.js`, `/voice.js`, icons | Service worker install එකේදීම |
| **ප්‍රතිඵල (bundle)** | මාස **6**ක draws (≈250 KB) | දවසට දෙපාරක් + app එක open කරද්දී |
| **API පිළිතුරු** | `/api/latest`, `/api/lotteries`, `/api/draws/:slug`, `/api/results-by-date` … | හැම සාර්ථක load එකකදීම |
| **History** | ඔබේ check කිරීම් | App එකේම (localStorage / server) |

### Offline එකේ වැඩ කරන දේවල් ✅
- App එක **load වෙනවා** (offline.html fallback එකත් තියෙනවා)
- **QR scan** කරලා දිනුම check — QR decode එක browser එකේම වෙනවා
- **දිනුම් මුදල ගණනය** — server එකේ **එකම prize engine** එක browser එකටත් තියෙනවා
  (`prize-engine.js`, `prizes.js` එකෙන් auto-generate වෙනවා → දෙක වැරදියන්නේ නෑ)
- 📋 ප්‍රතිඵල tab එක (ලොතරැයි අනුව / දිනය අනුව) — cached දත්තවලින්
- 🕘 History tab එක

### Offline එකේ වැඩ **නොකරන** දේවල් ⚠️
- 🤖 **AI Scan** (Gemini එකට internet ඕන)
- 👤 **Login / Register / Payments**
- 🍀 **මගේ වාසනාව** (AI අනුමානය)
- 🆕 **අලුත්ම** ප්‍රතිඵල — cache කරපු දත්ත විතරයි (තිරයේ "අවසන් යාවත්කාලීනය" පේනවා)

### 🚧 "දත්ත නෑ" නම් app එක වහනවා (අනිවාර්ය නීතිය)
මොකද: ප්‍රතිඵල දත්ත **නැතුව** check කරන්න දුන්නොත් user ට **වැරදි ප්‍රතිඵල**
පෙන්නන්න පුළුවන් (ඒක හානියක්). ඒ නිසා:

- දත්ත නැත්නම් (හෝ cache එකක් නැත්නම්) — 🔒 **blocking screen** එකක් එනවා
- දත්ත ආවම **තනියම විවෘත වෙනවා** (හෝ "🔄 නැවත උත්සාහ කරන්න" ඔබන්න)
- Admin කෙනෙක් නම් **"⬇️ දැන්ම ප්‍රතිඵල ලබාගන්න"** button එකක් තියෙනවා
- දත්ත **පරණ** නම් (පැය 30කට වඩා, `.env` → `DATA_STALE_HOURS`) — අවවාදයක් පෙන්නනවා,
  ඒත් app එක වහන්නේ නෑ (පරණ දත්තවලින් check කරන්න පුළුවන්)

### Cache එක අලුත් කරන්න
තිරයේ උඩ තියෙන status bar එකේ **"🔄 දැන්ම"** button එක ඔබන්න.
Console එකෙන්:

```js
LKMExtras._debug.clearCache()        // ඔක්කොම offline cache අයින් කරන්න
LKMExtras._debug.syncBundle(true)    // දැන්ම ආයෙ බාගන්න
LKMExtras._debug.bundle()            // දැන් තියෙන දත්ත බලන්න
```

---

## 5. 🔳 QR scan කරන හොඳම ක්‍රමය

ටිකට් එකේ QR එක **8mm × 8mm** වගේ ගොඩක් පොඩියි — ඒක තමයි ලොකුම අභියෝගය.
ඒ නිසා app එකේ මේ දේවල් කරලා තියෙනවා:

1. **Native camera (පොඩි QR එකට හොඳම)** — `8-15cm` දුරින්, කහ රාමුව ඇතුළේ QR එක තියන්න.
   App එක **continuous autofocus** + high resolution + digital zoom ඉල්ලනවා,
   focus එක නැති වුනාම තනියම නැවත focus කරනවා (focus nudge).
2. **⚙️ උසස් සැකසුම්** (Scan tab එකේ) →
   - 🔍 **Zoom** slider (QR එක ලොකු කරලා කියවන්න)
   - 🎯 **නැවත Focus කරන්න**
   - 🔆 **Torch (කැමරා එළි)** — අඳුරේ scan කරද්දී (device එකේ තියෙනවා නම් විතරයි පේන්නේ)
   - 📸 **උසස් ගුණත්ව Scan** — full-resolution photo එකක් ගන්නවා (video frame එකට වඩා පික්සෙල් 4-13 ගුණයක්)
   - 🖼️ **QR photo එකක් Upload කරන්න** — **හොඳම ක්‍රමය**: phone එකේ camera app එකෙන්
     QR එකට කිට්ටුවෙන් (1-3cm, macro) photo එකක් අරන් upload කරන්න
3. **Decode මට්ටම් 3ක්** — ① browser `BarcodeDetector` → ② **jsQR** (offline, Firefox/Safari වලත් වැඩ)
   → ③ **Gemini AI** (තත්පර 3කට පස්සේ තවම නොවුනොත්)
4. **Photo එක කොච්චර quality ද කියලා පෙන්නනවා** (crop size, sharpness) — එතකොට
   ඔබම දැනගන්න පුළුවන් තව කිට්ටුවෙන් ගන්න ඕනද කියලා

### Scan කරද්දී වෙන දේවල්
- 📳 QR එක කියෙව්වාම **vibrate** + **beep** (QR එක හඳුනාගත්තා කියලා දැනගන්න)
- 📝 ප්‍රතිඵලය තිරයේ පහළින් **5 තත්පර** පෙන්නනවා (countdown bar එකක් එක්ක)
- ⏱️ 5 තත්පරෙන් පස්සේ තනියම අයින් වෙනවා + **කැමරාව එහෙමම තියෙනවා** →
  ඊළඟ ටිකට් එක එවලේම scan කරන්න පුළුවන් (ආයෙ button ඔබන්න ඕන නෑ)
- 📢 දිනුමක් නම් ශබ්දයෙන් කියවනවා + වාදනය (⚙️ උසස් සැකසුම් → 🔊 ශබ්දය on/off)

### 📋 ලොතරැයි 16ම — එකින් එකේ format එක (මේක තමයි QR එක කියවද්දී බලන දේ)

| ලොතරැයිය | සමාගම | අංක ගණන | ඉලක්කම් | අකුර | රාශිය (ලග්නය) | Special | සටහන |
|---|---|---|---|---|---|---|---|
| අද කෝටිපති | DLB | 4 | 2 බැගින් | ✅ | — | — | |
| ශනිදා | DLB | 4 | 2 බැගින් | ✅ | — | — | |
| ලග්න වාසනා | DLB | 4 | 2 බැගින් | — | ✅ | — | |
| සුපිරි ධන සම්පත් | DLB | **6** | **1 බැගින්** | ✅ | — | — | පිහිටුම අනුව ගැලපේ |
| සුපර් බෝල් | DLB | 4 | 2 බැගින් | ✅ | — | — | |
| කප්‍රුක | DLB | 4 | 2 බැගින් | ✅ | — | ✅ | letter + special + 4 |
| සසිරි | DLB | 3 | 2 බැගින් | — | — | — | අංක 3ක් විතරයි |
| ජය සම්පත් | DLB | 4 | **1 බැගින්** | ✅ | — | — | පිහිටුම අනුව ගැලපේ |
| මහජන සම්පත් | NLB | **6** | **1 බැගින්** | ✅ | — | — | පිහිටුම අනුව ගැලපේ |
| ගොවිසෙත | NLB | 4 | 2 බැගින් | ✅ | — | — | |
| ධන නිධානය | NLB | 4 | 2 බැගින් | ✅ | — | — | |
| මෙගා පවර් | NLB | 4 | 2 බැගින් | ✅ | — | ✅ | letter + special + 4 |
| හඳහන | NLB | 4 | 2 බැගින් | — | ✅ | — | |
| අද සම්පත් | NLB | 2 | **1 බැගින්** | — | — | — | game 5ක් (multi) |
| NLB ජය | NLB | 4 | **1 බැගින්** | ✅ | — | — | පිහිටුම අනුව ගැලපේ |
| සුබ දවසක් | NLB | 3 | 2 බැගින් | — | ✅ | — | game 4ක් (multi) |

> 💡 **"ඉලක්කම් 1 බැගින්"** කියන්නේ මේ වගේ — `9 8 6 1 5 9` (මහජන සම්පත්).
> **"2 බැගින්"** කියන්නේ මේ වගේ — `12 45 67 89`.
> App එක file එකේ තියෙන ලොතරැයියක් අලුතින් එකතු කළොත් format එකත් එකතු කරන්න ඕන
> (`lottery-meta.js` + `prizes.js`), නැත්නම් ඒක "unavailable" විදිහට පෙන්නනවා — වැරදි ප්‍රතිඵලයක් කවදාවත් පෙන්නන්නේ නෑ.

### QR එක ලොතරැයි ටිකට් එකක් නොවෙන අවස්ථා
| අවස්ථාව | App එක කරන දේ |
|---|---|
| වෙන QR එකක් (WiFi, website, menu…) | ❌ **"මේ ලොතරැයි QR එකක් නෙමෙයි"** |
| Draw එකේ ප්‍රතිඵල තවම නිකුත් වී නෑ (අනාගත draw) | ⏳ **"මේ draw එකේ ප්‍රතිඵල තවම නිකුත් වී නෑ"** + අලුත්ම ප්‍රතිඵලය බලන්න button |
| QR එකේ ටිකට් අංක නෑ (serial/draw විතරයි) | ℹ️ අතින් පරීක්ෂාවට යවනවා |
| Photo එක අපැහැදිලි / හානි වෙලා | ⚠️ **ප්‍රතිඵලයක් නිකුත් කරන්නේ නෑ** (වැරදි ප්‍රතිඵලයකට වඩා හොඳයි) |

---

## 6. 🤖 AI Scan + Gemini keys

**AI Scan** = QR එක හරියට පේන්නේ නැති වුනත්, ටිකට් එකේ **photo එක** AI එකෙන් කියවලා
ප්‍රතිඵලය බලනවා. Scan tab එකේ උඩම තියෙන **🤖 AI Scan — සම්පූර්ණ ටිකට් එක** button එක ඔබන්න.

### Keys 5ක් + rotation (block වෙන්නේ නෑ)
`.env` එකේ keys 5ක් තියෙනවා (`GEMINI_API_KEY_1` … `GEMINI_API_KEY_5`):

- එක ඉල්ලීමකට keys ටික **සමානව බෙදිලා** පාවිච්චි වෙනවා
- Key එකක් **429** (limit) උනාම → **cooldown** + ඊළඟ key එකට තනියම මාරු වෙනවා
  (user ට error එකක් එන්නේ නෑ)
- Key එකක් වැරදි/අවසර නැති නම් → **disable** (ආයෙ පාවිච්චි කරන්නේ නෑ)
- Keys **ඔක්කොම** ඉවර නම් විතරයි error එකක් එන්නේ — "තව තත්පර Xකින් try කරන්න"
- Key එකේ තත්ත්වය: 🛠️ Admin → 📈 Overview → **🔑 AI key pool**
  (masked විදිහට විතරයි පේන්නේ — පූර්ණ key කවදාවත් client එකට එන්නේ නෑ)

Keys වැඩ කරනවද බලන්න: `npm run test:gemini`

> ⚠️ **වැදගත් නීතිමය කරුණ:** free quota එක ගුණ කරන්න **වෙන වෙන Google accounts**
> හදන එක Google Gemini API ToS කඩයි — keys/accounts suspend වෙන්න පුළුවන්.
> නිවැරදි ක්‍රමය: ඔබේම project එකේ (billing enable කරපු) keys, නැත්නම් scan ගණන අඩු කිරීම.

---

## 7. 🍀 "මගේ වාසනාව" (Premium)

**My Lucky Guess** — ඔබේ **මුල් නම, අග නම, උපන් දිනය සහ උපන් වෙලාව** දීලා:

- Numerology (Pythagorean අකුරු අගයන්, life-path, destiny, ග්‍රහයා, මූලද්‍රව්‍ය)
- පසුගිය **මාස 6ක ඇත්ත draws** වලින් statistical patterns
  (නිතර එන අංක, යාබද අංක, අංක අතර පරතරය, ලොතරැයි අනුව වෙනස් රටා)
- AI (Gemini) එකෙන් **advanced analysis** → ලොතරැයි අනුව අංක + අකුරු + ලග්න යෝජනා

⚠️ **මේක Premium feature එකක්.** Free plan එකෙන් බලන්න බෑ (`/api/lucky/*` → 402).
👑 **Admin කෙනෙක් නම්** (`.env` → `ADMIN_EMAILS`) උපරිම plan එකේ අයට වගේම සලකනවා —
ඒ නිසා PayHere setup කරන්න කලින් ඔබටම මේක test කරන්න පුළුවන්.
හැම අනුමානයකටම **disclaimer එකට එකඟ වීම අනිවාර්යයි** — client එකෙන් විතරක් නෙවෙයි,
**server එකෙනුත්** enforce වෙනවා (bypass කරන්න බෑ).
හැම අනුමානයක්ම `guesses` table එකේ audit එකට save වෙනවා.

> 🎲 මේක **විනෝදාත්මක** feature එකක්. කිසිම AI එකකට හෝ numerology එකකට
> ලොතරැයි දිනුම් කලින් කියන්න **බෑ**. අනුමාන පදනම් කරගෙන මුදල් යොදන්න එපා.

---

## 8. 🛠️ Admin panel

`.env` එකේ `ADMIN_EMAILS=you@gmail.com` දාලා (කිහිපයක් නම් කොමාවෙන්) login වෙන්න.
ඊට පස්සේ **🛠️ පරිපාලනය** tab එකේ පේන දේවල්:

| කොටස | මොනවද |
|---|---|
| 📈 **Overview** | මුළු users, checks, දිනුම් අනුපාතය, AI scans, 🔑 AI key pool තත්ත්වය |
| 👥 **Users** | හැම signup එකක්ම — ඊමේල්, plan, login වුන ක්‍රමය (email/Google), joined දිනය, **කීයක් check කළාද, දිනුම් කීයක්ද, මුළු මුදල** |
| 👤 **User detail** | එක user කෙනෙක්ගේ සම්පූර්ණ භාවිතය (ලොතරැයි අනුව) |
| 📊 **Report** | ලොතරැයි අනුව සමස්ත, top tiers, daily signups/checks chart |
| 🔄 **Scrape** | "දැන්ම ප්‍රතිඵල අලුත් කරන්න" + අවසන් උත්සාහයේ තත්ත්වය |
| 🔑 **Gemini keys** | හැම key එකකගේම state (ready / cooldown / disabled), calls, ok, 429 ගණන |

---

## 9. 🔄 ප්‍රතිඵල ස්වයංක්‍රීයව ලබාගැනීම

**අතින් මොකුවත් කරන්න ඕන නෑ:**

1. **Cron** — දිනකට దෙපාරක් **09:30** සහ **21:30** (Asia/Colombo) ස්වයංක්‍රීයව
   `dlb.lk` සහ `nlb.lk` එකෙන් ප්‍රතිඵල බාගන්නවා (`SCRAPE_CRON` එකෙන් වෙනස් කරන්න පුළුවන්)
2. **Server start වෙද්දී** — දත්ත පැය 8කට වඩා පරණ නම් එක පාරක් background එකේ බාගන්නවා
3. **Admin manual** — 🛠️ Admin → 🔄 දැන්ම ප්‍රතිඵල අලුත් කරන්න
4. **Command line** — `npm run scrape`

🛡️ **දත්ත ආරක්ෂාව:** scrape එකක් fail වුනොත් (internet නෑ / site එක වෙනස් වුනා)
පරණ දත්ත **නැති වෙන්නේ නෑ**. සම්පූර්ණයෙන්ම fail උනොත් ලියන්නේම නෑ.

✅ ලොතරැයියක් අලුතින් නිකුත් කළොත් `scraper.js` එකේ ලැයිස්තුවට එකතු කරන්න —
prize structure එකත් `prizes.js` එකට දාන්න (නැත්නම් ඒක "unavailable" විදිහට පෙන්නනවා,
වැරදි ප්‍රතිඵලයක් කවදාවත් පෙන්නන්නේ නෑ).

---

## 10. 🌐 භාෂා 3

උඩම menu එකේ **සිං | EN | தமி** එකෙන් මාරු කරන්න. තේරීම `localStorage` එකේ රැකෙනවා.

- ටිකට් scan / ප්‍රතිඵල / history / admin වගේ **හැම UI string එකක්ම** පරිවර්තනය වෙනවා
- Offline layer එකේ එකතු කරපු අලුත් strings (status bar, gate, ප්‍රතිඵල overlay,
  QR පණිවිඩ, පහළ info bar) ටිකත් 3 භාෂාවෙන්ම තියෙනවා — `public/offline.js` එකේ `STR` object එක
- අලුත් string එකක් එකතු කරන්න ඕන නම්: `public/index.html` එකේ `I18N` object එකට
  (`data-i18n` attribute එකක් එක්ක) හෝ `offline.js` එකේ `STR` object එකට

---

## 11. 🧪 Test කරන විදිය

```bash
npm test              # ✅ 44 tests — prize tables, parser, draw resolver
npm run test:prize    # ✅ 145 tests — NLB/DLB රටා 16ම (ඔබ දුන්නු ලේඛනය අනුව)
npm run test:qr       # ✅ 81 tests — QR parser (ලොතරැයි 16ම + ඇත්ත ටිකට් රටා)
npm run test:verify   # ✅ 45 tests — සැසඳීම + හඬ වාක්‍ය (මුදල වචන වලින්)
npm run test:offline  # ✅ 30 tests — offline bundle, PWA files, engine parity
npm run test:e2e      # ✅ 59 tests — ඇත්ත browser එකකින් (Chrome/Edge)
npm run test:gemini   # ✅ 5 keys + model එක live check
```

**⚠️ වැදගත්ම test එක:** `test:offline` එකේ **"Engine parity"** කොටස —
server එකේ ප්‍රතිඵලය සහ browser (offline) ප්‍රතිඵලය **100% සමානද** කියලා
ඇත්ත draws 16ක් එක්ක සසඳනවා. දෙක වෙනස් නම් හරියටම කියනවා.

**E2E test එකෙන් බලන දේවල්:** UI load වීම, service worker, bundle cache,
gate එක (දත්ත නැති වුනාම වහනවා / ආවම අයින් වෙනවා), QR වර්ග කිරීම,
5-තත්පර overlay, offline ticket check, භාෂා 3.

---

## 12. 🚀 Deploy කරන්න

### අවශ්‍යතාවයන්
- Node.js **18.17+** (22 LTS නරඹන්න)
- **HTTPS** (කැමරාවට + service worker එකට අනිවාර්යයි)
- 24/7 run වෙන process එකක් (cron එක වැඩ කරන්න) — නැත්නම් platform එකේම
  scheduled job එකක් `npm run scrape` කරන්න

### පියවර
1. Code එක server එකට upload කරන්න (`node_modules` හැර)
2. `npm install --production`
3. `.env` එකේ: `APP_BASE_URL=https://ඔබේ-domain`, `NODE_ENV=production`,
   **`JWT_SECRET` අලුත් random එකක්**, proxy පිටුපස නම් `TRUST_PROXY=true`
4. `npm start` (හෝ PM2: `pm2 start server.js --name lk-lottery`)
5. HTTPS + reverse proxy: **Caddy** (ස්වයංක්‍රීය certificate) හෝ nginx + certbot

```bash
# (optional) පැය 8කට වරක් දත්ත අලුත්ද බලලා බාගන්න — OS cron එකකින්
0 */8 * * * cd /path/to/app && /usr/bin/node scraper.js >> scrape.log 2>&1
```

### SEO (Google එකෙන් උඩට එන්න)
- `APP_BASE_URL` එක ඇත්ත domain එකට දාන්න (නැත්නම් sitemap එකේ `localhost` වැටෙනවා)
- [Google Search Console](https://search.google.com/search-console) එකට site එක එකතු කරලා
  `https://ඔබේ-domain/sitemap.xml` submit කරන්න
- App එකේ සර්වර්-රෙන්ඩර්ඩ් පිටු තියෙනවා: `/lottery/<slug>`, `/results`, `/about`,
  `/privacy-policy`, `/how-to-use`, `/refund-policy`, `robots.txt`, `sitemap.xml`

> ⚠️ SEO යනු ක්ෂණික දෙයක් නොවේ — rank guarantee එකක් කිසිවිටෙකත් නෑ.

---

## 13. 🔐 Security checklist

Production එකට යන්න කලින්:

- [ ] `JWT_SECRET` — random අකුරු 32+ (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`)
- [ ] `.env` එක git එකට **commit කරලා නෑ** (`.gitignore` එකේ තියෙනවා)
- [ ] Gemini key / PayHere secret කිසිවක් client එකට leak වෙන්නේ නෑ
      (`/api/auth/google-client-id` විතරයි public) — client එකට යන්නේ **masked** key විතරයි
- [ ] `UNLIMITED_SCAN=false` (plan limits වැඩ කරන්න)
- [ ] `PAYHERE_MODE=live` කරන්නේ test කරලා ඉවර වුනාට පස්සේ විතරයි
- [ ] HTTPS සක්‍රීයයි (කැමරාව + service worker)
- [ ] Proxy පිටුපස නම් `TRUST_PROXY=true`
- [ ] `data/app.db` එකට regular backup (server නවත්තලා file එක copy)
- [ ] `ADMIN_EMAILS` එක ඔබේ ඊමේල් එකට විතරක් සීමා කරලා

🔒 **Privacy:** scan කරන photo එක **කවදාවත් save කරන්නේ නෑ** — Gemini එකට යවලා
ප්‍රතිඵලය ගන්නවා විතරයි. ගිණුමක් නැතුව (guest) check කරන ඒවා ඔබේ browser එකේ විතරයි.
**ගිණුමකට login වුනාම** ඔබේ check කිරීම් (ලොතරැයිය, draw, දිනය, ප්‍රතිඵලය) history
එකට සහ ලොතරැයි වාර්තාවට ඕන නිසා server එකේ save වෙනවා.

---

## 14. 🧯 ප්‍රශ්න ආවොත්

| ප්‍රශ්නය | හේතුව / විසඳුම |
|---|---|
| **කැමරාව open වෙන්නේ නෑ** | HTTPS නෑ. `npm run cert && HTTPS=1 npm start` හෝ ඇත්ත domain එකකට deploy කරන්න |
| **QR එක කියවන්නේ නෑ** | ① Zoom එක ගන්න ② QR එකට 8-15cm දුරින් ③ 🔆 Torch දාන්න ④ camera app එකෙන් macro photo එකක් අරන් 🖼️ Upload කරන්න |
| **Offline එකේ app එක load වෙන්නේ නෑ** | App එක අඩුම එක් වරක් internet සමඟ open කරලා තියෙන්න ඕන (cache එක හැදෙන්න). `https` හෝ `localhost` වෙන්නත් ඕන |
| **"දත්ත නෑ" gate එකේ හිර වෙලා** | `npm run scrape` දාන්න / Admin නම් gate එකේ button එක ඔබන්න / status bar එකේ "🔄 දැන්ම" ඔබන්න |
| **AI Scan එක "Setup ඕන" කියනවා** | `.env` එකේ Gemini keys නෑ → `npm run test:gemini` එකෙන් බලන්න |
| **AI Scan එක 503 කියනවා** | Gemini model එක දැනට busy — තත්පර 30කින් ආයෙ try කරන්න (keys මාරු කරන්නේ නෑ, වැඩක් නැති නිසා) |
| **iPhone එකේ vibrate වෙන්නේ නෑ** | iOS Safari එකේ `navigator.vibrate` නෑ — ඒ වෙනුවට ශබ්දය වැඩ කරනවා ✅ |
| **Torch button එක පේන්නේ නෑ** | ඒ device/camera එකේ torch නෑ (හෝ browser එකෙන් අවසර දෙන්නේ නෑ) — App එක පරීක්ෂා කරලා නැති නම් button එක හංගනවා |
| **පහළ info tabs පේන්නේ නෑ** | `public/offline.js` එක load වුනාද බලන්න (browser console → `window.LKMExtras`) |
| **Portal එකේ ප්‍රතිඵල වැරදි** | නිල වෙබ් අඩවියෙන් තහවුරු කරන්න. `.env` එකේ `SCRAPE_CRON` එක වැඩ කරනවද බලන්න (server log එකේ "Auto-scrape cron" පේනවා) |

---

## 15. 📁 File structure

```
lk-lottery-master/
├── server.js              ← Express server (API + SEO + auth + billing)
├── offline-api.js         ← 📴 /api/data-status · /api/offline-bundle
├── prizes.js              ← ඇත්ත NLB/DLB prize tables (16 ලොතරැයි)
├── lucky.js               ← 🍀 numerology + statistical + AI අනුමානය
├── scraper.js             ← dlb.lk + nlb.lk එකෙන් ප්‍රතිඵල බාගැනීම
├── scrape-runner.js       ← cron scheduler (09:30 + 21:30)
├── vision.js              ← 🤖 AI (Gemini) ticket/QR කියවීම
├── gemini-keys.js         ← 🔑 key pool (5 keys × rotation + cooldown)
├── auth.js · billing.js · stats.js · db.js · draws-store.js
├── lottery-meta.js · seo.js · env.js · test.js · test-gemini.js
├── data.json              ← 🗄️ ප්‍රතිඵල දත්ත (source of truth)
├── data/app.db            ← SQLite (users, checks, guesses, draws…)
├── public/
│   ├── index.html         ← App එකේ UI (tabs, scan, results, admin…)
│   ├── offline.js         ← 📴 offline cache + gate + 5s overlay + torch (1.2.0 එකේ අලුත්)
│   ├── sw.js              ← 📴 Service worker (3 caches)
│   ├── prize-engine.js    ← 📴 prizes.js → browser (auto-generated)
│   ├── offline.html       ← offline fallback පිටුව
│   ├── qr-decode.js       ← 🔳 QR decoder (BarcodeDetector + jsQR + ROI/crop)
│   ├── voice.js           ← 🔊 දිනුම් ශබ්දය (speech + tone)
│   └── manifest.webmanifest · icons
├── scripts/
│   ├── build-prize-engine.js  ← prizes.js → public/prize-engine.js
│   ├── smoke-offline.js       ← npm run test:offline
│   └── e2e-browser.js         ← npm run test:e2e
├── .env / .env.example
├── README-SI.md           ← මේ file එක
├── README.md · SETUP.md · HOWTO-TEST.md
```

---

## 16. ⚖️ වගකීම් ප්‍රතික්ෂේප කිරීම

> **⚠️ වැදගත්:** මේ app එක තාක්ෂණය පාවිච්චි කරලා හදපු **තොරතුරුමය මෙවලමක්** විතරයි.
>
> - මෙහි දක්වන ප්‍රතිඵල **නිල ප්‍රතිඵල නොවේ** — NLB හෝ DLB නිල වෙබ් අඩවියෙන්
>   හෝ නිල ප්‍රතිඵල පත්‍රිකාවෙන් තහවුරු කරගන්න.
> - මේක **තාක්ෂණයෙන් හදපු app** එකක් නිසා **ඕනෑම වෙලාවක වැරදීමක් වෙන්න පුළුවන්**
>   (scraper එකේ වැරදීමක්, AI එකේ වැරදීමක්, දත්ත ප්‍රමාද වීම, network ප්‍රශ්න).
> - එවැනි වැරදීමක් නිසා සිදුවන **කිසිදු අලාභයකට / පාඩුවකට** මේ app එකෙන්වත්,
>   එය හදපු කෙනාගෙන්වත් **කිසිම වගකීමක් භාරගන්නේ නෑ** — ඒ සියලුම අවදානම
>   **පරිශීලකයා තමයි භාරගන්නේ**.
> - අවසන් තීරණයක් ගැනීමට පෙර (හෝ මුදල් අල්ලා ගැනීමට පෙර) **නිල මූලාශ්‍රයෙන්
>   තහවුරු කරගන්න**. ටිකට්පත්‍රයේ QR එක / අංක කියවාගන්න බැරි වුනොත් app එක
>   ප්‍රතිඵලයක් **නොදී නවත්තනවා** — ඒක ආරක්ෂාවටයි.
> - 🍀 "මගේ වාසනාව" අනුමාන **විනෝදාත්මක** දෙයක් — ඒවා **දිනුම් කියන අනුමානයක් නෙවෙයි**.
>   අනුමාන පදනම් කරගෙන මුදල් යොදන්න එපා.
> - ලොතරැයි ක්‍රීඩාවට අදාළ **වයස් සීමාවන් සහ නීති රීති** ඔබේ රටේ/පළාතේ නීතියට අනුව
>   පිළිපදින්නේ ඔබයි. (ශ්‍රී ලංකාවේ ලොතරැයි ක්‍රීඩාව **වයස 18+** පමණි.)
> - ගිණුමක් හදාගෙන app එක පාවිච්චි කරනවා නම් ඔබේ check කිරීම් server එකේ
>   save වෙන බවත්, ඒවා ඔබේ **history / වාර්තා / සංඛ්‍යාලේඛන** සඳහා විතරක්
>   පාවිච්චි වෙන බවත් දැනගන්න.

**App එක open කරද්දීම මේ disclaimer එක පෙන්නනවා** — එකඟ වුනාට පස්සේ විතරයි භාවිතා
කරන්න පුළුවන්. පහළම තියෙන **⚠️ වගකීම් ප්‍රතික්ෂේප කිරීම** tab එකෙන් ආයෙ කියවන්නත් පුළුවන්.

---

## 📞 උදව් ඕන නම්

ප්‍රශ්නයක් ආවොත් මේ පිළිවෙළට බලන්න:

1. **Tests run කරන්න** — `npm test` → `npm run test:offline` → `npm run test:gemini`.
   ප්‍රශ්නය කොහෙද කියලා ඒකෙන් හරියටම තේරෙනවා.
2. **Server log එක** බලන්න (`npm start` කරපු terminal එකේ) — scrape/cron
   තත්ත්වය, දත්ත අලුත්ද කියලා එතන පේනවා.
3. **Browser console එක** බලන්න (F12) — මේවා type කරන්න:
   ```js
   window.__lkm.state()            // කැමරාව, scan mode, user, tabs
   LKMExtras._debug.bundle()       // cache කරපු ප්‍රතිඵල දත්ත
   LKMExtras._debug.isOffline()    // online ද offline ද
   LKMPrizes.version               // offline prize engine එකේ version
   ```

**සුබ පැතුම්! 🎟️🍀**
