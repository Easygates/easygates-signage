# Hardware guide — putting NovaSign on multiple TVs

Chosen setup: **Android TV boxes running Fully Kiosk Browser, one per TV, all pointed at the CMS on your PC.** The PC and Raspberry Pi options are kept below as fallbacks. Either way: skip the Steam Link. Prices below are UK, October 2026, and move around — treat them as ballpark.

---

## TL;DR

| Option | Cost per screen | Setup effort | Good for | Watch out |
|---|---|---|---|---|
| **Windows PC / mini PC + Chrome kiosk** | £0 if reusing PCs, £100–180 if buying | Low–medium | Familiar, easy remote support, works with any content | 5 machines to patch; needs a properly locked-down kiosk account |
| **Raspberry Pi 5 / 4 + Chromium kiosk** | £70–100 | Medium (30 min/unit, scripted below) | Cheapest reliable always-on player | Needs case + PSU + SD card |
| **Linux on the same PCs** | £0 | Medium | Reuses old hardware, no Windows licences | You have to administer Linux |
| **Android TV box + Fully Kiosk Browser** ⭐ | £60–100 + £7.50 licence | Low | Your pick: fast to deploy, remote reload/wake/screenshot from the CMS | Weaker lockdown — see below |
| **Amazon Fire TV Stick** | £35–60 | Low | Only if you already own an **older Fire OS** model | ⚠️ All 2025/26 Sticks run Vega OS and **cannot sideload** |
| **One PC + HDMI splitter / HDBaseT** | £150–250 total for 4 TVs | Low | Every TV shows the same thing, perfectly in sync | No per-TV content; cable runs |
| **Commercial signage display** (Samsung SSSP / LG webOS Signage) | £400–700 per screen | Medium-high | No box behind the TV, 24/7 rated panel | Needs a packaged app (.wgt / .ipk), not a bare URL |
| ~~Steam Link~~ | ~£30 used | — | Nothing, in 2026 | Discontinued 2018, no browser, no firmware support |

---

## "No-build path" and "weaker lockdown" — what I meant

These were shorthand in the Android box row. In plain terms:

**No-build path** = you don't build an operating system. You buy a consumer box, install an app (Fully Kiosk Browser, Webview Kiosk), type your URL into it, and it starts fullscreen on boot. No imaging an SD card, no auto-login scripting, no OS hardening. That's genuinely quicker than a Pi — maybe 10 minutes per screen.

**Weaker lockdown** = that box is still a consumer streaming device, and you can't fully take the device away from its own software:

- The **Home button on the remote still works**. Standard Android kiosk apps can intercept *some* keys and hide system bars, but true single-app mode needs Android **device-owner provisioning** (an MDM enrolment), which consumer TV boxes don't support. So anyone with the remote — a curious customer, a cleaner, a child — can get back to the launcher.
- The Fully Kiosk developer states the app is designed for phones/tablets and that **Android TV / Fire OS may have a restricted feature set** because those platforms limit what an app can control.
- You don't control the launcher, boot animation, update prompts or the vendor's home-screen recommendations. Any of those can appear over your signage after a reboot.
- Cheap sticks throttle or reboot when they get hot behind a TV.

On a **PC** you own all of that: the Windows/Linux account, the shell, the startup sequence and the restart policy. Nobody with a remote can escape the kiosk because it isn't a TV input — it's the only thing running on that machine's desktop.

That's why, if you're comfortable managing five PCs, the PC route is the better one.

---

## Why not the Steam Link

- Valve **discontinued the hardware in November 2018** and stopped meaningful firmware updates afterwards. It's a decade-old, single-core ARMv7 box with ~256 MB of usable RAM.
- It has **no browser**. Its only display mode is Steam Remote Play: stream a PC desktop to it. That works as a demo, but for 24/7 signage you get a fragile chain (Steam client updates, session drops, host GPU encoding per screen), one host session per Link, and an overlay UI that can appear over your content.
- If you already own one, it's fine for a *temporary* single screen. Don't build a five-TV rollout on it.

Sources: [Steam Link (Wikipedia)](https://en.wikipedia.org/wiki/Steam_Link), [Valve store news](https://store.steampowered.com/news/app/353380/view/5264101341768013277).

---

## How the software expects to be deployed

NovaSign is built for this: the CMS is the only stateful thing, and every screen is a dumb viewer.

```
[ CMS on your PC / NAS :3000 ]
        │  LAN
        ├──▶ TV 1  http://cms:3000/display?displayId=A   → "Showroom window" playlist
        ├──▶ TV 2  http://cms:3000/display?displayId=B   → "Gate display" playlist
        ├──▶ TV 3  http://cms:3000/display?displayId=C   → "Smart home wall" playlist
        ├──▶ TV 4  http://cms:3000/display?displayId=D   → "Trade counter" playlist
        └──▶ TV 5  http://cms:3000/display?displayId=E   → "Workshop" playlist
```

- Each screen opens **its own URL**. Create it in **Admin → Displays → + Register display**, then **COPY URL**. The **⚡ Trade demo** button pre-registers five screens for you.
- The player polls `/api/player` every **30 s**, so edits made on your computer appear on the TVs within half a minute — no app, no USB stick, no reinstall.
- It heartbeats every 20 s, which is what turns the dot green in Admin → Displays.
- Schedules override a display's playlist by time of day and priority.
- You can run different content on every TV, or point them all at the same playlist.

Practical requirement: **the TVs and the CMS machine must be on the same network**, and the CMS host needs a fixed IP (DHCP reservation on your router).

---

## Option A — Windows PC / mini PC kiosk (recommended for you)

Five full desktop PCs is overkill; a **mini PC** (Intel N100/N150 class) handles a single 1080p browser tab comfortably. Buy new for ~£120–180 each, or use used Lenovo/Dell/HP micro PCs at ~£70–110.

### Per screen

1. **Make a dedicated local Windows user** (`signage`), standard account, no admin rights. Sign in once so the profile exists.
2. **Enable auto sign-in** for that user (Sysinternals `Autologon`, or `netplwiz` → untick "Users must enter a user name and password").
3. **Stop the machine sleeping.** In an elevated Command Prompt:
   ```bat
   powercfg /change standby-timeout-ac 0
   powercfg /change monitor-timeout-ac 0
   powercfg /change disk-timeout-ac 0
   powercfg /hibernate off
   ```
   Also set *Settings → System → Power → Screen and sleep* to **Never**, and in *Control Panel → Power Options → Choose what the power buttons do*, disable fast startup.
4. **Start Chrome (or Edge) fullscreen at login.** Put a `.bat` in `shell:startup`:
   ```bat
   @echo off
   :loop
   start /wait "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
     --kiosk "http://192.168.1.50:3000/display?displayId=PASTE-ID" ^
     --start-fullscreen --no-first-run --no-default-browser-check ^
     --disable-session-crashed-bubble --disable-infobars ^
     --disable-features=Translate,MediaRouter ^
     --autoplay-policy=no-user-gesture-required
   timeout /t 5 >nul
   goto loop
   ```
   The loop is the watchdog: if Chrome crashes or someone closes it, it comes straight back.
5. **Hide the mouse pointer** after idle — Chrome doesn't do this reliably; use a cursor-hiding utility, or a blank cursor scheme.
6. **Reboot nightly**, outside trading hours, with Task Scheduler (`shutdown /r /t 0` at 03:00). Also set Windows Update **active hours** to cover opening times so it can't restart mid-day.
7. **Remote access** so you're not driving to the shop: Chrome Remote Desktop, RustDesk or AnyDesk. Keep them under the admin account, not the kiosk account.

### Locking it down further

- Use a **standard (non-admin) Windows account** — that alone blocks most accidental changes.
- On Windows 11 **Enterprise/Education**, *Assigned Access* gives you true single-app kiosk mode. Pro/Home only offer the basic single-app kiosk for UWP apps, so most people use Chrome `--kiosk` plus a standard account.
- Disable the taskbar via Group Policy / registry on the kiosk account if you want to prevent window switching in kiosk mode.
- If you want to be extra safe, set a **BIOS password** and disable boot from USB.

### Free/cheap alternatives on the same hardware

- **Linux (Debian/Ubuntu + Chromium)** on old PCs: no Windows licence, and the `deploy/pi-kiosk.sh` script works in principle on a normal desktop Linux too (it writes a Chrome autostart entry). This is the cheapest way to reuse machines you already own.
- **ChromeOS Flex** is free and turns old PCs into managed kiosk devices, but true kiosk mode needs a Chrome Enterprise/Education licence (~£30/device/year), so factor that in.

### One PC driving all five TVs?

Possible if the TVs are all near the PC and you're willing to run cable: a GPU with 4–5 outputs (or DisplayPort MST hubs), five Chrome windows positioned on separate displays, or five browser profiles. It's cheaper than five machines and gives you one place to update — but it's a single point of failure, and 5× 1080p HDMI runs beyond ~10–15 m need HDBaseT extenders (~£50/pair). For screens spread around a shop or yard, one small PC per TV is simpler.

---

## Option B — Raspberry Pi kiosk

Cheapest always-on option that isn't a PC you have to maintain.

| Part | Approx. |
|---|---|
| Raspberry Pi 5 (1 GB) or Pi 4 (2 GB) | £42–75 |
| Official PSU, 32 GB microSD, case, micro-HDMI lead | £27–35 |
| **Total** | **£70–100** |

Current pricing: Pi 4 2 GB is $67.50 (~£65) and Pi 5 2 GB is $77.50 (~£74) after the **1 October 2026 increase** — the **Pi 5 1 GB at $45** is the value pick for a browser-only player. Raspberry Pi has committed to building Pi 4/Pi 5 into the 2030s. ([price announcement](https://www.raspberrypi.com/news/price-increases-for-2gb-raspberry-pi-4-and-raspberry-pi-5/))

```bash
scp deploy/pi-kiosk.sh pi@signage-1:~/
ssh pi@signage-1
sudo ~/pi-kiosk.sh "http://192.168.1.50:3000/display?displayId=PASTE-ID" --watchdog --nightly
sudo reboot
```

That installs Chromium, auto-starts it fullscreen at login, disables screen blanking, and optionally adds a watchdog + 3 a.m. reboot. TV power on/off over HDMI-CEC: `sudo apt install cec-utils`, then `echo 'standby 0' | cec-client -s -d 1`.

---

## Option C — Android TV box + Fully Kiosk Browser (your pick)

Fully Kiosk is a good call: it's the standard kiosk shell for Android, it survives reboots and updates, and its
**Remote Admin REST API** lets the CMS reload, wake, restart and screenshot each player. It is also the *only* Android
kiosk app with a true remote control surface.

### The one cost to know about

**Remote Admin is a PLUS feature.** One-time **€8.90 (≈£7.50) per device** + tax, with volume pricing at 10+ devices.
For five screens that's roughly **£37 once** — no subscription. Without a licence you can still run the kiosk itself;
you just get watermark prompts on the PLUS features and no REST control. ([Fully Kiosk pricing](https://www.fully-kiosk.com/))

### Per-screen setup

1. **Box:** Android TV / Google TV running real Android — Xiaomi TV Box S (3rd gen) ~£65, STRONG LEAP-S3PRO, Google TV Streamer ~£99. Avoid Fire TV: 2025/26 Sticks are Vega OS and **cannot sideload**.
2. **Install Fully Kiosk Browser** (Play Store, or the APK via Downloader on Android TV). Buy the PLUS licence in-app.
3. **Update Android System WebView** in the Play Store — Fully renders with it, so an old WebView is the usual cause of "the animations look broken".
4. **Fully settings → Web Content:**
   - **Start URL** = `http://<cms-ip>:3000/display?displayId=<id>&poll=10`
     (`poll=10` refreshes content every 10 s instead of 30 s — worth it for a showroom)
   - **Launch on Boot** = on
   - **Keep Screen On** = on
   - **Reload on error** / **Wait for network** = on
   - Hide status/navigation/action bars, enable fullscreen
5. **Fully settings → Remote Administration (PLUS):**
   - **Enable Remote Administration** = on
   - **Remote Admin Password** = a real password (not `1234`)
   - **Remote Admin from Local Network** = on → note the `http://192.168.1.xx:2323` address
6. **Give the box a DHCP reservation** on your router so its IP never moves.
7. **Kiosk lockdown:** set a PIN, enable "Exit from kiosk only with PIN", disable settings access. Remember the Home
   button can still escape on consumer boxes — the PIN stops changes, not navigation.

### Control it from the CMS

**Admin → Displays → Player device (Fully Kiosk)**: paste `http://<box-ip>:2323` plus the Remote Admin password once,
then you get buttons per screen:

| Button | What it does | Uses |
|---|---|---|
| ● Test | Reads live device info — model, app version, screen on/off, battery, current URL | `deviceInfo` |
| ⟳ Reload | Reloads the Start URL (picks up new content instantly) | `loadStartURL` |
| ☀ Wake | Turns the screen on, then reloads | `screenOn` + `loadStartURL` |
| Screen on/off | Physical panel power | `screenOn` / `screenOff` |
| ↻ Restart | Restarts the Fully app (recovery) | `restartApp` |
| Clear cache | Fixes a stale/broken render | `clearCache` |
| 📷 Screenshot | Live PNG of what that TV is showing | `getScreenshot` |

The CMS proxies these server-side, so there's no CORS problem and the device password is stored on the CMS, never sent
to the browser. Targets are restricted to LAN addresses — the endpoint can't be turned into an open proxy.

### Editing products remotely

Two separate remote paths, and you want both:

- **Content** — the CMS at `/admin` is a normal web app. Open it from a laptop at home, a phone on 4G, or the shop
  tablet. Edit a product → Publish → every screen polls and updates (10 s with `poll=10`, 30 s default). Nothing needs
  to be installed on the TVs, and no player restarts.
- **Devices** — Fully's Remote Admin gives you the per-screen reload / wake / screenshot above when a TV is stuck, plus
  its own web UI at `http://<box-ip>:2323` for deeper settings.

**If you want the CMS reachable from outside the shop**, don't port-forward it. Put the CMS host on
[Tailscale](https://tailscale.com) (free for personal/small use) — you get a private `https://cms.tailnet-name.ts.net`
that only your devices can reach. Cloudflare Tunnel is the alternative if you want a public URL, and then put
Cloudflare Access in front of `/admin`.

### Quick sanity checks

- Open `http://<box-ip>:2323` from a laptop → you should get the Fully admin page.
- `curl "http://<box-ip>:2323/?cmd=deviceInfo&type=json&password=<pass>"` → JSON back means the CMS buttons will work.
- On the TV, the CMS **Displays** tab should show a green ONLINE dot within ~20 s (heartbeat).

## Option D — same picture on every TV, one source

If every screen shows the identical playlist:

- One PC / the CMS host → **1×4 (or 1×8) HDMI splitter** (~£30) → one cable per TV.
- Up to ~10–15 m with good HDMI cable; beyond that use **HDMI-over-Cat6 extenders (~£50/pair)** or HDBaseT.
- Perfect sync, one thing to update, cheapest for 3–4 screens. Downside: every TV shows the same thing, and you're pulling cable.
- A common hybrid: splitter for the window wall (identical promo) + a PC/Pi behind the two screens that need different content.

---

## Ops checklist for a five-screen rollout

- [ ] CMS host on a **fixed IP** (router DHCP reservation), wired to the switch
- [ ] Each TV registered in Admin → Displays with its own `displayId` URL
- [ ] Player auto-starts the URL at boot and self-restarts if it dies
- [ ] Sleep and screen blanking **disabled**; TVs set to "no auto power off"
- [ ] Nightly reboot outside opening hours; Windows Update active hours set
- [ ] TV power scheduled off after closing (CEC, smart plug, or BIOS wake timer)
- [ ] UPS on the CMS host — if it dies, screens keep playing their last playlist but nothing updates
- [ ] Test the failure path: unplug the CMS for a minute and confirm the TVs keep looping
- [ ] `/api/selftest` returns `pass: true` after any content change

---

## Rough totals

| Rollout | Hardware | Notes |
|---|---|---|
| 5 TVs, independent content, new mini PCs | 5 × ~£150 ≈ **£750** | Recommended if buying |
| 5 TVs, reuse existing PCs | **£0** hardware | Best value if the machines exist |
| 5 TVs, Raspberry Pi kiosk | 5 × ~£85 ≈ **£425** | Cheapest reliable dedicated player |
| 5 TVs, Android boxes + Fully | 5 × ~£80 + 5 × £7.50 ≈ **£440** | Your pick — includes CMS buttons for reload/wake/screenshot |
| 4 TVs, identical content | PC + splitter + cabling ≈ **£180** | No per-TV control |
| 5 TVs, turnkey commercial | BrightSign etc. ≈ **£1,800+** | Only if you need pro support |
