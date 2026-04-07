import Link from "next/link";

const MODEL_CARDS = [
  {
    name: "Reflection",
    desc: "从日记中识别情绪与行为模式，提炼可执行的成长线索。",
  },
  {
    name: "Grounding",
    desc: "将对话锚定在你的知识库内容，避免泛泛而谈。",
  },
  {
    name: "Action",
    desc: "把洞察转成下一步行动，让成长发生在真实生活里。",
  },
];

const QUICK_PROMPTS = [
  "帮我分析今天的日记，有什么值得关注的模式？",
  "最近总感到焦虑，书里有什么方法可以帮到我？",
  "我想建立一个早起习惯，该怎么开始？",
  "回顾我最近的状态，有哪些成长和进步？",
];

export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-[#f5f4ed] text-[#141413]">
      <header className="sticky top-0 z-20 border-b border-[#e8e6dc] bg-[#f5f4ed]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <p className="text-xs tracking-[0.3px] text-[#5e5d59]">Graduate-RAG</p>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-3 py-1.5 text-sm text-[#4d4c48] hover:bg-[#f0eee6] transition-colors"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#c96442] px-3 py-1.5 text-sm text-[#faf9f5] hover:bg-[#b85b3b] transition-colors shadow-[#c96442_0_0_0_0,#c96442_0_0_0_1px]"
            >
              注册
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 py-14 md:py-18 max-w-5xl mx-auto">
        <div className="max-w-3xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8e6dc] text-[#4d4c48] text-xs border border-[#d1cfc5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#c96442]" />
            Literary Growth Companion
          </p>
          <h1 className="font-editorial text-4xl md:text-6xl leading-[1.1] text-[#141413] mt-5">
            用日记照亮自我，
            <br />
            用知识点燃成长
          </h1>
          <p className="mt-5 text-base md:text-lg text-[#5e5d59] leading-relaxed max-w-2xl mx-auto">
            每一篇日记都是你人生轨迹的镜像，每一本书都是前人验证过的智慧结晶。
            当两者交汇，属于你的成长体系就开始生长。
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/workspace"
              className="rounded-xl bg-[#c96442] px-5 py-2.5 text-sm text-[#faf9f5] hover:bg-[#b85b3b] transition-colors shadow-[#c96442_0_0_0_0,#c96442_0_0_0_1px]"
            >
              进入工作台
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[#e8e6dc] bg-[#faf9f5] px-5 py-2.5 text-sm text-[#4d4c48] hover:bg-[#f0eee6] transition-colors"
            >
              我已有账号
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {MODEL_CARDS.map((card) => (
            <div
              key={card.name}
              className="rounded-2xl bg-[#faf9f5] border border-[#e8e6dc] p-5 claude-whisper"
            >
              <h3 className="font-editorial text-[1.35rem] leading-[1.2] text-[#141413]">
                {card.name}
              </h3>
              <p className="text-sm text-[#5e5d59] mt-2 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#141413] border-y border-[#30302e]">
        <div className="max-w-5xl mx-auto px-6 py-10 md:py-12 text-center">
          <h2 className="font-editorial text-3xl md:text-4xl leading-[1.15] text-[#faf9f5]">
            先从一个具体问题开始
          </h2>
          <p className="mt-3 text-[#b0aea5] text-sm md:text-base">
            让 AI 从你的真实语境出发，给出可执行而不空泛的建议。
          </p>
        </div>
      </section>

      <section className="px-6 py-10 max-w-5xl mx-auto w-full pb-16">
        <p className="text-xs text-[#87867f] text-center mb-3">典型提问示例</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_PROMPTS.map((text) => (
            <div
              key={text}
              className="text-left text-sm p-4 rounded-2xl border border-[#f0eee6] bg-[#faf9f5] claude-ring"
            >
              <span className="leading-relaxed text-[#4d4c48]">{text}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
