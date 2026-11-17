const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, "docs", "userhunt");

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

const hits = new Map();
app.use("/api", (req, res, next) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < 60_000);
  if (recent.length >= 30) return res.status(429).json({ error: "Слишком много запросов. Попробуй через минуту." });
  recent.push(now);
  hits.set(key, recent);
  next();
});

const platforms = {
  Telegram: { url: n => `https://t.me/${encodeURIComponent(n)}`, min: 5, max: 32, regex: /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/ },
  Instagram: { url: n => `https://www.instagram.com/${encodeURIComponent(n)}/`, min: 1, max: 30, regex: /^[a-zA-Z0-9._]{1,30}$/ },
  TikTok: { url: n => `https://www.tiktok.com/@${encodeURIComponent(n)}`, min: 2, max: 24, regex: /^[a-zA-Z0-9._]{2,24}$/ },
  X: { url: n => `https://x.com/${encodeURIComponent(n)}`, min: 1, max: 15, regex: /^[a-zA-Z0-9_]{1,15}$/ },
  YouTube: { url: n => `https://www.youtube.com/@${encodeURIComponent(n)}`, min: 3, max: 30, regex: /^[a-zA-Z0-9._-]{3,30}$/ },
  Twitch: { url: n => `https://www.twitch.tv/${encodeURIComponent(n)}`, min: 4, max: 25, regex: /^[a-zA-Z0-9_]{4,25}$/ },
  GitHub: { url: n => `https://github.com/${encodeURIComponent(n)}`, min: 1, max: 39, regex: /^[a-zA-Z0-9-]{1,39}$/ },
  Reddit: { url: n => `https://www.reddit.com/user/${encodeURIComponent(n)}/`, min: 3, max: 20, regex: /^[a-zA-Z0-9_-]{3,20}$/ }
};

async function lookup(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "USERHUNT/1.0 (username availability checker)" }
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function checkPlatform(platform, name) {
  const config = platforms[platform];
  const profileUrl = config.url(name);
  if (!config.regex.test(name)) {
    return { platform, status: "invalid", message: `Формат не подходит для ${platform}`, url: profileUrl };
  }

  // These public endpoints provide a useful existence signal without credentials.
  // Other platforms are intentionally marked unknown rather than guessing from profile-page errors.
  if (platform === "GitHub") {
    try {
      const r = await lookup(`https://api.github.com/users/${encodeURIComponent(name)}`);
      if (r.status === 200) return { platform, status: "taken", message: "Аккаунт найден", url: profileUrl };
      if (r.status === 404) return { platform, status: "possibly_available", message: "Публичный аккаунт не найден; имя всё ещё может быть зарезервировано", url: profileUrl };
      return { platform, status: "unknown", message: `GitHub вернул HTTP ${r.status}`, url: profileUrl };
    } catch {
      return { platform, status: "unknown", message: "GitHub временно не ответил", url: profileUrl };
    }
  }

  if (platform === "Reddit") {
    try {
      const r = await lookup(`https://www.reddit.com/user/${encodeURIComponent(name)}/about.json`);
      if (r.status === 200) return { platform, status: "taken", message: "Профиль найден", url: profileUrl };
      if (r.status === 404) return { platform, status: "possibly_available", message: "Профиль не найден; имя может быть зарезервировано", url: profileUrl };
      return { platform, status: "unknown", message: `Reddit вернул HTTP ${r.status}`, url: profileUrl };
    } catch {
      return { platform, status: "unknown", message: "Reddit временно не ответил", url: profileUrl };
    }
  }

  return { platform, status: "unknown", message: "Платформа не предоставляет надёжную открытую проверку без официального API", url: profileUrl };
}

app.post("/api/check", async (req, res) => {
  const raw = typeof req.body?.username === "string" ? req.body.username : "";
  const username = raw.trim().replace(/^@/, "");
  const selected = Array.isArray(req.body?.platforms) ? req.body.platforms : Object.keys(platforms);

  if (!username || username.length > 39 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return res.status(400).json({ error: "Введи ник длиной до 39 символов: латинские буквы, цифры, точка, дефис или подчёркивание." });
  }
  const chosen = [...new Set(selected)].filter(p => Object.hasOwn(platforms, p));
  if (!chosen.length) return res.status(400).json({ error: "Выбери хотя бы одну поддерживаемую платформу." });

  const results = await Promise.all(chosen.map(p => checkPlatform(p, username)));
  res.json({
    username,
    checkedAt: new Date().toISOString(),
    results,
    note: "Статус «возможно свободен» не гарантирует возможность регистрации. Платформы могут резервировать имена и менять правила."
  });
});


function generateCandidates(keyword, style) {
  const base = keyword.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 18);
  if (!base) return [];
  const sets = {
    short: [base, base + "x", base + "hq", "its" + base, "the" + base, base + "io", base + "co", base + "lab", base + "one", "hey" + base],
    clean: [base, "the" + base, "its" + base, base + "studio", base + "online", base + "world", base + "daily", base + "club", base + "space", base + "works"],
    gamer: [base + "gg", base + "plays", base + "x", base + "fps", "real" + base, base + "exe", base + "zero", base + "core", base + "gaming", "not" + base],
    creative: ["by" + base, base + "ly", base + "verse", base + "nova", base + "wave", base + "void", base + "zen", "neo" + base, base + "lab", base + "mode"]
  };
  return [...new Set(sets[style] || sets.clean)].filter(n => n !== base || n.length >= 3).slice(0, 10);
}

app.post("/api/generate", async (req, res) => {
  const keyword = typeof req.body?.keyword === "string" ? req.body.keyword.trim() : "";
  const style = ["short", "clean", "gamer", "creative"].includes(req.body?.style) ? req.body.style : "clean";
  const selected = Array.isArray(req.body?.platforms) ? req.body.platforms : ["GitHub", "Reddit"];
  const chosen = [...new Set(selected)].filter(p => Object.hasOwn(platforms, p));
  if (!keyword || keyword.length > 24 || !/^[a-zA-Z0-9 _.-]+$/.test(keyword)) {
    return res.status(400).json({ error: "Введи ключевое слово длиной до 24 символов: латиница, цифры, пробел, точка, дефис или подчёркивание." });
  }
  if (!chosen.length) return res.status(400).json({ error: "Выбери хотя бы одну платформу." });

  const candidates = generateCandidates(keyword, style);
  const results = [];
  // Keep external requests modest and avoid hammering social platforms.
  for (let i = 0; i < candidates.length; i += 2) {
    const batch = candidates.slice(i, i + 2);
    const checked = await Promise.all(batch.map(async username => {
      const checks = await Promise.all(chosen.map(p => checkPlatform(p, username)));
      return {
        username,
        results: checks,
        possiblyFreeOn: checks.filter(x => x.status === "possibly_available").map(x => x.platform),
        takenOn: checks.filter(x => x.status === "taken").map(x => x.platform),
        unknownOn: checks.filter(x => x.status === "unknown").map(x => x.platform)
      };
    }));
    results.push(...checked);
  }
  const suggestions = results.filter(x => x.possiblyFreeOn.length > 0 && x.takenOn.length === 0);
  res.json({
    keyword,
    suggestions,
    checked: results.length,
    note: "В список попадают только имена, для которых хотя бы одна платформа не обнаружила публичный аккаунт и ни одна не подтвердила занятость. Это предварительный сигнал, а не гарантия регистрации. Для остальных платформ статус может быть неизвестен."
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "USERHUNT API" }));
app.use(express.static(FRONTEND_DIR));
app.get("*", (_req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));

app.listen(PORT, () => console.log(`USERHUNT running on port ${PORT}`));
