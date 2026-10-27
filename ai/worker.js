// مساعد المادة: وسيط صغير على Cloudflare Workers بين الموقع و Claude، عشان مفتاح الـ API ما يطلع للمتصفح.
// ينرفع تلقائياً من GitHub (.github/workflows/deploy-ai.yml) كل ما تغيّر شي في مجلد ai/.
// المفتاح ينحفظ كـ secret في Cloudflare باسم ANTHROPIC_API_KEY، ومستحيل يبين في الكود.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-5-5";
const ORIGINS = ["https://www.asckwt.com", "https://asckwt.com"];
const MAX_TURNS = 11, MAX_CHARS = 1500, DAY_CAP = 150;
const FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"], MAX_FILE = 5600000; // ~4 ميغا بعد base64

const RULES = `أنت "مساعد الطالب الأكاديمي" في موقع asckwt.com، مساعد دراسي لطلاب الجامعة العربية المفتوحة فرع الكويت (AOU Kuwait).
تحت تعليماتك معلومات رسمية من الموقع عن الجامعة: المواد، الخطط الدراسية والمتطلبات، تقويم الفصل، مواعيد الاختبارات، النماذج السابقة، المحاضرات والقروبات.

- اللغة: رد بنفس لغة آخر رسالة من الطالب. بالعربي: لهجة كويتية فقط (مو سعودية ولا غيرها)، مهذبة وواضحة وبإملاء صحيح. استخدم كلمات كويتية مثل: شنو، شلون، ليش، وين، الحين، باجر، أبي/تبي، وايد، زين، جذي، شلونك. وتجنب الكلمات السعودية والخليجية الثانية مثل: وش، ايش، يبغى، مرة (بمعنى وايد)، كذا، دحين، زي، وخلي المصطلحات العلمية بالإنجليزي بين قوسين لأن المواد تُدرّس بالإنجليزي. بالإنجليزي: إنجليزي أكاديمي احترافي وواضح وبسيط.
- الترتيب: ابدأ بالجواب المباشر بسطر أو سطرين، وبعدها التفاصيل بنقاط قصيرة أو خطوات مرقمة، وعناوين صغيرة (##) إذا الجواب طويل. خلّ التواريخ والأرقام المهمة **بخط عريض**. فقرات قصيرة، بدون حشو أو تكرار، وإيموجي واحد بالكثير. وإذا يفيد، اختم بخطوة جاية وحدة يقدر يسويها الطالب.
- الطالب: إذا فيه معلومات عن الطالب تحت (اسمه، تخصصه، مواده)، ناده باسمه أحياناً بشكل طبيعي، وخصّص جوابك لتخصصه ومواده. وإذا سؤاله يعتمد على تخصصه وما تعرفه، اسأله عنه بسطر.
- المرفقات: إذا الطالب أرفق صورة أو ملف، اقرأه بدقة. إذا فيه سؤال أو مسألة حلها خطوة بخطوة، وإذا شي مو واضح بالصورة قول شنو اللي مو واضح.
- في أسئلة المواعيد والخطط والمتطلبات والرسوم والأنظمة والروابط اعتمد على المعلومات تحت فقط، ولا تألّف تواريخ أو أرقام أو متطلبات أبداً.
- لا تبدأ جوابك بـ "ما عندي" أو "ما أعرف" أو "ما أقدر". عط الطالب كل اللي تعرفه عن سؤاله أول (أقرب معلومة، الفترة الحالية، القاعدة العامة)، وبعدها دلّه بثقة على المكان الدقيق اللي يلقى فيه الجواب الرسمي (بوابة SIS، شؤون الطلبة، قروب الأخبار، صفحة بالموقع) مع الرابط.
- اذكر الرابط المناسب من الموقع لما يفيد (صفحة المادة، النموذج، القروب، الحاسبة...). الروابط اكتبها كاملة بدون أقواس حولها.
- النماذج السابقة: الطالب يقدر يفتح أي نموذج من قائمة "اسأل عن نموذج اختبار سابق" فوق المحادثة بصفحة المادة، وتقرأه وتحله معاه. دلّه عليها بدل ما تطلب منه يرسل النموذج.
- إذا فيه كتاب للمادة وفهرسه تحت، اربط شرحك بالشابتر المناسب (مثلاً: هذا بالشابتر 5).
- في شرح المواد اشرح خطوة بخطوة، وفي المسائل المحاسبية والحسابية اكتب القيود والأرقام بوضوح وتأكد من الحساب.
- الدقة في الحلول (أهم شي): إذا السؤال موجود في "بنك الأسئلة المعتمد" أو "حل معتمد" تحت، اعتمد جوابه حرفياً وقول إنه من البنك المعتمد. غير جذي حل بتأني: حدد المطلوب، طبّق القاعدة أو المعادلة، واحسب، وبعدها راجع الحساب مرة ثانية قبل ما تكتب الجواب النهائي. في الاختيار من متعدد اذكر الحرف والخيار الصحيح وسبب قصير ليش الباقي غلط. لا تخمّن: إذا السؤال ناقصه معلومة أو الصورة مو واضحة، قول بالضبط شنو الناقص بدل ما تفترض.
- إذا الطالب أرفق نموذج اختبار سابق، اقرأه وحل الأسئلة اللي يطلبها مع الشرح. الأسئلة اللي مو بالبنك المعتمد وضّح بسطر إن حلها مراجَع منك وممكن نموذج الإجابة الرسمي يختلف بالصياغة.
- الواجبات والـ TMA: الـ TMA تقييم بدرجة وينفحص بـ Turnitin، فساعد الطالب يفهم ويكتب بنفسه: اشرح المطلوب ومعايير التصحيح، رتّب له هيكل الجواب (مقدمة، نقاط، خاتمة، مراجع Harvard)، اشرح المفاهيم بأمثلة من الكتاب، وحل مسائل مشابهة بأرقام مختلفة، وراجع مسودته وعطه ملاحظات وصحح أخطاءه وحساباته. لا تكتب له جواب TMA كامل جاهز للتسليم، وإذا طلب جذي وضّح بلطف السبب وعطه أقرب مساعدة تنفعه. تمارين المراجعة والكويزات التدريبية والنماذج السابقة حلها كامل عادي.
- إعادة الصياغة: إذا الطالب أرسل كلامه هو، أعد صياغته بإنجليزي (أو عربي) أكاديمي واضح مع المحافظة على أفكاره، واذكر أهم التعديلات بسطر. لا تعيد صياغة نص منقول من مصدر عشان يبين إنه كتابة الطالب، بل علّمه يقتبس ويوثق المصدر.
- الاختصار والتلخيص: إذا طلب "لخص" أو "اختصر" أو "نقاط"، عطه ملخص مركز بنقاط قصيرة يغطي الأفكار الرئيسية والمصطلحات المهمة بدون شرح زايد. وبشكل عام خل جوابك مختصر على قد السؤال، والتفصيل لما يطلبه.
- لو الطالب سألك عن سؤال غلط فيه في بنك الأسئلة، وضّح ليش جوابه غلط وليش الصح صح، باختصار.
- إذا السؤال برا الدراسة والجامعة، رد بلطف ورجّع الطالب.
- إذا الطالب يبي شرح أعمق أو كورس كامل، تقدر تذكر إن الطالب الأكاديمي عنده شرح للمواد (التسجيل بالواتساب أو المنصة، الروابط تحت).`;

// معلومات المساعد تنبني من بيانات الموقع (tools/build-ai.js) وتنقرا من الموقع نفسه، مع كاش 10 دقايق
async function kb(env, file) {
  const r = await fetch((env.KB_BASE || "https://www.asckwt.com/") + "ai/kb/" + file, {cf: {cacheTtl: 600, cacheEverything: true}});
  return r.ok ? r.text() : "";
}
async function pdf(env, code, file) {
  const r = await fetch((env.KB_BASE || "https://www.asckwt.com/") + `exams/${code}/${file}.pdf`, {cf: {cacheTtl: 86400, cacheEverything: true}});
  if (!r.ok) return null;
  const b = new Uint8Array(await r.arrayBuffer());
  let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

const cors = origin => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin",
  "X-Content-Type-Options": "nosniff",
});

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    if (!allowed) return new Response("forbidden", {status: 403});
    const h = cors(origin);
    if (req.method === "OPTIONS") return new Response(null, {headers: h});
    if (req.method !== "POST") return new Response("method", {status: 405, headers: h});
    const fail = (msg, status = 400) => new Response(msg, {status, headers: {...h, "Content-Type": "text/plain; charset=utf-8"}});

    // حماية من الإغراق: عدد محدود من الأسئلة بالدقيقة لكل IP
    const ip = req.headers.get("CF-Connecting-IP") || "x";
    if (env.LIMITER && !(await env.LIMITER.limit({key: ip})).success)
      return fail("أرسلت أسئلة كثيرة ورا بعض، انتظر دقيقة وجرّب مرة ثانية 🙏", 429);

    // يوم كامل: حد أعلى لكل IP (الكاش محلي لكل مركز بيانات، فهو حماية تقريبية من الاستنزاف وسقف الصرف هو الحماية الأكيدة). يشتغل لما يكون للمساعد دومين خاص، وعلى workers.dev ما له أثر
    const capKey = new Request(`https://cap.asc-ai/${encodeURIComponent(ip)}/${new Date().toISOString().slice(0, 10)}`);
    const used = +(await (await caches.default.match(capKey))?.text() || 0);
    if (used >= DAY_CAP) return fail("وصلت الحد اليومي للأسئلة، ترجع لك الأسئلة باجر 🙏", 429);
    if (+req.headers.get("Content-Length") > MAX_FILE * 1.3) return fail("الطلب كبير", 413);

    let body;
    try { body = await req.json(); } catch { return fail("bad json"); }
    const code = String(body.course || "").toUpperCase();
    const name = String(body.name || "").slice(0, 80);
    const msgs = Array.isArray(body.messages) ? body.messages.slice(-MAX_TURNS) : [];
    if (code && !/^[A-Z0-9-]{2,12}$/.test(code)) return fail("bad course");
    const exam = String(body.exam || "");
    if (exam && !(code && exam.startsWith(code + "-") && /^[A-Za-z0-9-]{5,80}$/.test(exam))) return fail("bad exam");
    const ok = msgs.length && msgs[0].role === "user" && msgs.at(-1).role === "user" &&
      msgs.every((m, i) => m.role === (i % 2 ? "assistant" : "user") && typeof m.content === "string" && m.content.trim() && m.content.length <= MAX_CHARS * 4);
    if (!ok || msgs.at(-1).content.length > MAX_CHARS + 200) return fail("bad messages");
    // ملف أو صورة يرفعها الطالب مع آخر سؤال
    const file = body.file && typeof body.file === "object" ? body.file : null;
    if (file && !(FILE_TYPES.includes(file.type) && typeof file.data === "string" && file.data.length <= MAX_FILE && /^[A-Za-z0-9+/]+=*$/.test(file.data)))
      return fail("الملف لازم يكون صورة أو PDF وحجمه أقل من 4 ميغا.");
    // معلومات الطالب اللي كتبها عن نفسه (اسمه، تخصصه، مواده)
    const st = body.student && typeof body.student === "object" ? body.student : {};
    const clean = (v, n) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);
    const who = [["الاسم", clean(st.name, 40)], ["التخصص", clean(st.major, 60)], ["مواده هالفصل", clean(st.courses, 200)]].filter(x => x[1]).map(x => x.join(": ")).join("، ");

    const [general, course, doc] = await Promise.all([kb(env, "general.md"), code ? kb(env, code + ".md") : "", exam ? pdf(env, code, exam) : null]);
    if (exam && !doc) return fail("ما لقيت ملف النموذج.");
    const today = new Date().toLocaleDateString("ar-KW-u-nu-latn", {timeZone: "Asia/Kuwait", weekday: "long", year: "numeric", month: "long", day: "numeric"});
    const messages = msgs.map(m => ({role: m.role, content: [{type: "text", text: m.content}]}));
    // النموذج المرفق ينحط بأول رسالة مع كاش، عشان الأسئلة اللي بعده في نفس المحادثة تكون أرخص
    if (file) messages.at(-1).content.unshift(file.type === "application/pdf"
      ? {type: "document", source: {type: "base64", media_type: "application/pdf", data: file.data}, title: clean(file.name, 80) || "ملف الطالب"}
      : {type: "image", source: {type: "base64", media_type: file.type, data: file.data}});
    if (doc) messages[0].content.unshift({type: "document", source: {type: "base64", media_type: "application/pdf", data: doc}, title: exam, cache_control: {type: "ephemeral"}});

    // المسائل والحلول والملفات تاخذ تفكير أعمق عشان الجواب يطلع دقيق، والأسئلة العادية تبقى سريعة ورخيصة
    const solve = !!(file || exam) || /حل|احسب|قيد|اشرح|سؤال|كويز|واجب|tma|quiz|solve|calculat|answer|question|explain|journal|\d+[.,]?\d*\s*[-+*/×÷=]\s*\d/i.test(msgs.at(-1).content);

    await caches.default.put(capKey, new Response(String(used + 1), {headers: {"Cache-Control": "max-age=86400"}}));

    const client = new Anthropic({apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_BASE_URL || undefined});
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: solve ? 16000 : 4000,
      output_config: {effort: solve ? "high" : "low"},
      system: [
        // التعليمات والمعلومات العامة ثابتة لكل الطلاب، فتنحفظ بالكاش وتصير قرايتها أرخص بكثير
        {type: "text", text: RULES + "\n\n" + general, cache_control: {type: "ephemeral"}},
        {type: "text", text: `اليوم: ${today}.\n` + (who ? `معلومات الطالب: ${who}.\n` : "") + (code ? `الطالب الحين في صفحة مادة ${code}${name ? ` (${name})` : ""}.${exam ? ` وأرفق النموذج ${exam}.` : ""}\n\n${course}` : "الطالب في الصفحة الرئيسية للموقع.")},
      ],
      messages,
    });

    // نرجّع الجواب نص عادي أول بأول عشان الطالب يشوفه وهو ينكتب
    const {readable, writable} = new TransformStream();
    const w = writable.getWriter(), enc = new TextEncoder();
    (async () => {
      try {
        for await (const ev of stream)
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") await w.write(enc.encode(ev.delta.text));
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") await w.write(enc.encode("\n\nما أقدر أساعد في هذا السؤال، جرّب تسأل عن شي ثاني في المادة."));
        else if (final.stop_reason === "max_tokens") await w.write(enc.encode("\n\n(الجواب طويل وانقطع، اطلب مني أكمل.)"));
      } catch (e) {
        if (e instanceof Anthropic.RateLimitError) await w.write(enc.encode("المساعد عليه ضغط الحين، جرّب بعد شوي."));
        else { console.error(e); await w.write(enc.encode("المساعد واقف مؤقتاً، جرّب بعدين.")); }
      } finally { await w.close(); }
    })();
    return new Response(readable, {headers: {...h, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store"}});
  },
};
