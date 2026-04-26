// Auto-generated from extensions/<name>/meta.json.
// Run `npm run sync:extension-meta` from astro/ to refresh.

export const GENERATED_EXTENSION_REGISTRY = {
  "hitokoto": {
    "key": "hitokoto",
    "title": "一言",
    "subtitle": "hitokoto.cn",
    "icon": "feather",
    "defaultOrder": 0,
    "layout": "single",
    "displayName": "一言",
    "displayNameZh": "一言",
    "description": "来自 hitokoto.cn 的每日一言，替换默认 tagline。无需 API key。",
    "descriptionZh": "来自 hitokoto.cn 的每日一言，替换默认 tagline。无需 API key。",
    "category": "custom",
    "locale": "zh",
    "tags": [
      "hitokoto",
      "一言",
      "quote",
      "chinese",
      "中文",
      "名言"
    ],
    "setupFields": [
      {
        "key": "type",
        "label": "Sentence type",
        "labelZh": "句子类型",
        "type": "select",
        "default": "",
        "options": [
          {
            "value": "",
            "label": "随机 (all)"
          },
          {
            "value": "a",
            "label": "a — 动画"
          },
          {
            "value": "b",
            "label": "b — 漫画"
          },
          {
            "value": "c",
            "label": "c — 游戏"
          },
          {
            "value": "d",
            "label": "d — 文学"
          },
          {
            "value": "e",
            "label": "e — 原创"
          },
          {
            "value": "h",
            "label": "h — 影视"
          },
          {
            "value": "i",
            "label": "i — 诗词"
          },
          {
            "value": "k",
            "label": "k — 哲学"
          }
        ]
      }
    ],
    "weeklyDefault": false,
    "monthlyDefault": false
  },
  "quote_of_day": {
    "key": "quote_of_day",
    "title": "Words for the Morning",
    "subtitle": "Quote of the day",
    "icon": "feather",
    "defaultOrder": 0,
    "layout": "single",
    "displayName": "Quote of the Day",
    "displayNameZh": "每日名言",
    "description": "A daily quote from API Ninjas — replaces the default tagline. Requires API_NINJAS_KEY secret.",
    "descriptionZh": "来自 API Ninjas 的每日名言，替换默认 tagline。需要配置 API_NINJAS_KEY。",
    "category": "custom",
    "locale": "en",
    "tags": [
      "quote",
      "inspiration",
      "tagline",
      "名言",
      "每日"
    ],
    "setupFields": [
      {
        "key": "category",
        "label": "Quote category",
        "labelZh": "名言类别",
        "type": "text",
        "placeholder": "morning, inspiration, life ...",
        "hint": "Leave blank for a random category. See <a href=\"https://api-ninjas.com/api/quotes\" target=\"_blank\" rel=\"noopener\">API Ninjas docs</a> for all options.",
        "hintZh": "留空则随机选取类别。详情请参考 <a href=\"https://api-ninjas.com/api/quotes\" target=\"_blank\" rel=\"noopener\">API Ninjas 文档</a>。"
      }
    ],
    "weeklyDefault": false,
    "monthlyDefault": false
  },
  "weather": {
    "key": "weather",
    "title": "The Morning",
    "subtitle": "Local weather",
    "icon": "cloud",
    "defaultOrder": 1,
    "layout": "single",
    "displayName": "Weather",
    "displayNameZh": "天气",
    "description": "Temperature, conditions, and a short forecast for your city.",
    "descriptionZh": "你所在城市的气温、天气状况和简短预报。",
    "category": "local",
    "locale": "general",
    "tags": [
      "weather",
      "forecast",
      "temperature",
      "city",
      "天气",
      "预报"
    ],
    "setupFields": [
      {
        "key": "city",
        "label": "City",
        "labelZh": "城市",
        "type": "text",
        "required": true,
        "placeholder": "Edinburgh",
        "hint": "City name passed to the weather API. The selected timezone helps disambiguate places like London or Edinburgh.",
        "hintZh": "传给天气 API 的城市名称。所选时区会帮助区分 London、Edinburgh 这类重名城市。",
        "autocomplete": "geocode"
      },
      {
        "key": "timezone",
        "label": "Timezone",
        "labelZh": "时区",
        "type": "select",
        "default": "Europe/London",
        "options": [
          {
            "value": "Europe/London",
            "label": "London (GMT/BST)"
          },
          {
            "value": "Europe/Paris",
            "label": "Paris (CET)"
          },
          {
            "value": "America/New_York",
            "label": "New York (ET)"
          },
          {
            "value": "America/Chicago",
            "label": "Chicago (CT)"
          },
          {
            "value": "America/Los_Angeles",
            "label": "Los Angeles (PT)"
          },
          {
            "value": "Asia/Shanghai",
            "label": "Shanghai (CST)"
          },
          {
            "value": "Asia/Tokyo",
            "label": "Tokyo (JST)"
          },
          {
            "value": "Asia/Kolkata",
            "label": "India (IST)"
          },
          {
            "value": "Australia/Sydney",
            "label": "Sydney (AEST)"
          }
        ],
        "hint": "Used to align the briefing time with local sunrise.",
        "hintZh": "用于让简报时间与当地日出对齐。"
      }
    ],
    "weeklyDefault": false,
    "monthlyDefault": false
  },
  "arxiv": {
    "key": "arxiv",
    "title": "From the arXiv",
    "subtitle": "arXiv preprints",
    "icon": "paper",
    "defaultOrder": 2,
    "layout": "editorial",
    "displayName": "arXiv Papers",
    "displayNameZh": "arXiv 论文",
    "description": "Daily preprints ranked by your keyword and author preferences.",
    "descriptionZh": "每日 arXiv 预印本，按你的关键词和作者偏好排序。",
    "category": "research",
    "locale": "general",
    "tags": [
      "arxiv",
      "papers",
      "research",
      "academic",
      "preprint",
      "ml",
      "ai",
      "science",
      "论文",
      "学术"
    ],
    "setupFields": [
      {
        "key": "profiles",
        "label": "Research areas",
        "labelZh": "研究方向",
        "type": "multiselect",
        "hint": "Sets the arXiv categories to monitor.",
        "hintZh": "设置要监控的 arXiv 分类。",
        "options": [
          {
            "value": "ai_ml",
            "label": "AI / ML",
            "description": "cs.LG, cs.AI, stat.ML"
          },
          {
            "value": "nlp",
            "label": "NLP",
            "description": "cs.CL"
          },
          {
            "value": "cv",
            "label": "Computer Vision",
            "description": "cs.CV"
          },
          {
            "value": "robotics",
            "label": "Robotics",
            "description": "cs.RO"
          },
          {
            "value": "medical_ai",
            "label": "Medical AI",
            "description": "cs.AI + q-bio"
          },
          {
            "value": "hci",
            "label": "HCI",
            "description": "cs.HC"
          },
          {
            "value": "systems",
            "label": "Systems",
            "description": "cs.OS, cs.DC, cs.NI"
          },
          {
            "value": "theory",
            "label": "Theory",
            "description": "cs.CC, cs.DS, math.CO"
          },
          {
            "value": "physics",
            "label": "Physics",
            "description": "physics, cond-mat, quant-ph, hep-th"
          },
          {
            "value": "chemistry",
            "label": "Chemistry",
            "description": "physics.chem-ph, cond-mat.mtrl-sci"
          },
          {
            "value": "biology",
            "label": "Biology / Bioinformatics",
            "description": "q-bio, cs.LG + biology"
          },
          {
            "value": "mathematics",
            "label": "Mathematics",
            "description": "math.AG, math.NT, math.PR, math.AP"
          },
          {
            "value": "astrophysics",
            "label": "Astrophysics / Space",
            "description": "astro-ph, gr-qc"
          },
          {
            "value": "economics",
            "label": "Economics / Finance",
            "description": "econ, q-fin"
          },
          {
            "value": "neuroscience",
            "label": "Neuroscience",
            "description": "q-bio.NC, cs.NE"
          }
        ]
      },
      {
        "key": "keywords",
        "label": "Keywords",
        "labelZh": "关键词",
        "type": "tags",
        "placeholder": "e.g. diffusion model, RLHF, RAG",
        "hint": "Papers matching these keywords receive a higher relevance score.",
        "hintZh": "命中这些关键词的论文会获得更高的相关性分数。"
      },
      {
        "key": "authors",
        "label": "Favourite authors",
        "labelZh": "关注作者",
        "type": "tags",
        "placeholder": "e.g. Yann LeCun, Ilya Sutskever",
        "hint": "Papers by these authors are always surfaced.",
        "hintZh": "这些作者的论文始终会被收录。"
      },
      {
        "key": "max_results",
        "label": "Max papers per day",
        "labelZh": "每日最多论文数",
        "type": "slider",
        "default": 10,
        "min": 3,
        "max": 30,
        "step": 1
      }
    ],
    "weeklyDefault": true,
    "monthlyDefault": true,
    "weeklyTopN": 5,
    "monthlyTopN": 10
  },
  "us_stocks": {
    "key": "us_stocks",
    "title": "US Stocks",
    "subtitle": "Pre-market signal radar",
    "icon": "chart",
    "defaultOrder": 2,
    "layout": "stack",
    "displayName": "US Stock Signals",
    "displayNameZh": "美股盘前信号",
    "description": "A compact pre-market signal board for AI infrastructure stocks, with data quality notes and source links.",
    "descriptionZh": "面向 AI 基建股票的盘前信号看板，包含数据质量标注和来源链接。",
    "category": "tech",
    "locale": "general",
    "tags": [
      "stocks",
      "markets",
      "premarket",
      "AI infrastructure",
      "finance",
      "美股",
      "盘前",
      "股票"
    ],
    "setupFields": [
      {
        "key": "mode",
        "label": "Signal mode",
        "labelZh": "信号模式",
        "type": "select",
        "default": "premarket",
        "options": [
          {
            "value": "premarket",
            "label": "Pre-market",
            "description": "Rank AI infrastructure stocks before the US market opens."
          }
        ],
        "hint": "The MVP focuses on a pre-market trading signal radar.",
        "hintZh": "MVP 聚焦盘前交易信号雷达。"
      },
      {
        "key": "max_items",
        "label": "Max signals",
        "labelZh": "最多信号数",
        "type": "slider",
        "default": 12,
        "min": 5,
        "max": 25,
        "step": 1,
        "hint": "The extension fetches the full configured universe, then renders the top ranked signals.",
        "hintZh": "扩展会抓取完整股票池，然后只展示排名靠前的信号。"
      },
      {
        "key": "max_symbols",
        "label": "Max fetched symbols",
        "labelZh": "最多抓取股票数",
        "type": "slider",
        "default": 24,
        "min": 4,
        "max": 60,
        "step": 1,
        "hint": "Limits live data requests before ranking. Set higher after you confirm provider coverage.",
        "hintZh": "限制排序前的实时数据请求数量。确认数据源覆盖稳定后可以调高。"
      },
      {
        "key": "max_sector_overview",
        "label": "Sector rows",
        "labelZh": "板块概览数",
        "type": "slider",
        "default": 8,
        "min": 3,
        "max": 12,
        "step": 1,
        "hint": "Show a compact sector tape above the stock table.",
        "hintZh": "在股票表格上方展示紧凑的板块概览。"
      },
      {
        "key": "max_llm_items",
        "label": "LLM signal summaries",
        "labelZh": "LLM 合成信号数",
        "type": "slider",
        "default": 8,
        "min": 0,
        "max": 20,
        "step": 1,
        "hint": "How many ranked stock rows receive LLM-written drivers and invalidation notes.",
        "hintZh": "排名靠前的多少个股票信号会交给 LLM 生成驱动因素和失效条件。"
      },
      {
        "key": "include_neutral",
        "label": "Include neutral watches",
        "labelZh": "包含中性观察项",
        "type": "toggle",
        "default": true,
        "hint": "Include neutral stocks when they have notable news or data movement.",
        "hintZh": "当中性股票有明显新闻或数据变化时，也纳入看板。"
      },
      {
        "key": "skip_llm",
        "label": "Skip LLM synthesis",
        "labelZh": "跳过 LLM 合成",
        "type": "toggle",
        "default": false,
        "hint": "Leave off to let the configured LLM refine summaries, drivers, invalidation, and risk flags.",
        "hintZh": "关闭此项时，会使用配置的 LLM 优化摘要、驱动因素、失效条件和风险提示。"
      }
    ],
    "weeklyDefault": false,
    "monthlyDefault": false
  },
  "hacker_news": {
    "key": "hacker_news",
    "title": "The Town Square",
    "subtitle": "Hacker News",
    "icon": "flame",
    "defaultOrder": 3,
    "layout": "columns-2",
    "displayName": "Hacker News",
    "description": "Top stories filtered by score threshold — signal without the scroll.",
    "descriptionZh": "按分数阈值过滤的热门故事——去除噪音，只留信号。",
    "category": "tech",
    "locale": "general",
    "tags": [
      "hacker news",
      "hn",
      "tech",
      "startups",
      "programming",
      "news",
      "科技",
      "新闻"
    ],
    "setupFields": [
      {
        "key": "min_score",
        "label": "Minimum score",
        "labelZh": "最低分数",
        "type": "slider",
        "default": 100,
        "min": 20,
        "max": 500,
        "step": 10,
        "hint": "Stories below this score are filtered out.",
        "hintZh": "低于此分数的故事将被过滤掉。"
      },
      {
        "key": "max_items",
        "label": "Max stories",
        "labelZh": "最多故事数",
        "type": "slider",
        "default": 10,
        "min": 3,
        "max": 25,
        "step": 1
      }
    ],
    "weeklyDefault": true,
    "monthlyDefault": false,
    "weeklyTopN": 5
  },
  "github_trending": {
    "key": "github_trending",
    "title": "Workshops",
    "subtitle": "GitHub Trending",
    "icon": "repo",
    "defaultOrder": 4,
    "layout": "editorial",
    "displayName": "GitHub Trending",
    "displayNameZh": "GitHub 趋势",
    "description": "Repositories gaining momentum — what the community is building right now.",
    "descriptionZh": "正在获得关注的仓库——了解社区现在在做什么。",
    "category": "tech",
    "locale": "general",
    "tags": [
      "github",
      "trending",
      "repositories",
      "open source",
      "code",
      "开源",
      "仓库"
    ],
    "setupFields": [
      {
        "key": "max_repos",
        "label": "Max repositories",
        "labelZh": "最多仓库数",
        "type": "slider",
        "default": 9,
        "min": 3,
        "max": 20,
        "step": 1
      },
      {
        "key": "programming_language",
        "label": "Filter by language",
        "labelZh": "按语言过滤",
        "type": "select",
        "default": "",
        "options": [
          {
            "value": "",
            "label": "All languages"
          },
          {
            "value": "python",
            "label": "Python"
          },
          {
            "value": "typescript",
            "label": "TypeScript"
          },
          {
            "value": "javascript",
            "label": "JavaScript"
          },
          {
            "value": "rust",
            "label": "Rust"
          },
          {
            "value": "go",
            "label": "Go"
          },
          {
            "value": "julia",
            "label": "Julia"
          },
          {
            "value": "cpp",
            "label": "C++"
          }
        ],
        "hint": "Leave blank to track all languages."
      }
    ],
    "weeklyDefault": true,
    "monthlyDefault": false,
    "weeklyTopN": 5
  },
  "postdoc_jobs": {
    "key": "postdoc_jobs",
    "title": "Postings",
    "subtitle": "Academic positions",
    "icon": "post",
    "defaultOrder": 5,
    "layout": "stack",
    "displayName": "Academic Jobs",
    "displayNameZh": "学术职位",
    "description": "Postdoc and faculty postings surfaced automatically from job boards.",
    "descriptionZh": "自动从招聘板块抓取的博后和教职职位。",
    "category": "career",
    "locale": "general",
    "tags": [
      "jobs",
      "postdoc",
      "faculty",
      "academic",
      "career",
      "hiring",
      "职位",
      "招聘",
      "博后"
    ],
    "setupFields": [
      {
        "key": "keywords",
        "label": "Search terms",
        "labelZh": "搜索词",
        "type": "tags",
        "placeholder": "e.g. machine learning, neuroscience",
        "hint": "Job titles or subject areas to match.",
        "hintZh": "要匹配的职位名称或研究领域。"
      },
      {
        "key": "llm_score_threshold",
        "label": "Relevance threshold",
        "labelZh": "相关性阈值",
        "type": "slider",
        "default": 7,
        "min": 0,
        "max": 10,
        "step": 1,
        "hint": "Jobs below this LLM score are filtered out.",
        "hintZh": "低于这个 LLM 评分的职位会被过滤掉。"
      }
    ],
    "weeklyDefault": true,
    "monthlyDefault": true,
    "weeklyTopN": 3,
    "monthlyTopN": 5
  },
  "supervisor_updates": {
    "key": "supervisor_updates",
    "title": "On My Radar",
    "subtitle": "Monitored pages",
    "icon": "feather",
    "defaultOrder": 6,
    "layout": "stack",
    "displayName": "Page Monitor",
    "displayNameZh": "页面监控",
    "description": "Tracks changes on any web pages you care about — lab sites, supervisor pages, deadlines.",
    "descriptionZh": "监控任意网页的变化——导师主页、实验室公告、截止日期等。",
    "category": "custom",
    "locale": "general",
    "tags": [
      "monitor",
      "supervisor",
      "webpage",
      "changes",
      "tracking",
      "监控",
      "导师",
      "页面"
    ],
    "setupFields": [
      {
        "key": "urls",
        "label": "Pages to monitor",
        "labelZh": "要监控的页面",
        "type": "urls",
        "placeholder": "https://example.com/lab",
        "hint": "Add one URL per line. Changes since the last run will be summarised.",
        "hintZh": "每行一个 URL。自上次运行以来的变化将被自动摘要。"
      }
    ],
    "weeklyDefault": false,
    "monthlyDefault": false
  }
} as const;
