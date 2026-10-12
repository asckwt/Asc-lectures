/* الخطط الدراسية: خريطة متسلسلة لمواد كل تخصص مع المتطلبات السابقة.
   المصدر: خطط الجامعة العربية المفتوحة الرسمية (انظر SRC تحت كل خطة).
   صيغة المتطلب: "A+B" = الاثنين مع بعض، "A|B" = واحد منهم يكفي. */
(() => {
/* ===== دليل المواد: [العنوان الإنجليزي, العنوان العربي, الساعات, المقرر المعادل في الخطة القديمة] ===== */
const C = {
  EL099:["English Preparatory (EL099)","التمهيدي الإنجليزي",0],
  EL111:["English Communication Skills I","مهارات الاتصال بالإنجليزية 1",3],
  EL112:["English Communication Skills II","مهارات الاتصال بالإنجليزية 2",3],
  GT101:["Learning and Information Technology","التعلم وتقنية المعلومات",3],
  AR113:["Arabic Communication Skills","مهارات الاتصال باللغة العربية",3],
  GB102:["Principles of Entrepreneurship for Non-Specialists","مبادئ ريادة الأعمال لغير المتخصصين",3],
  GR118:["Life Skills and Coexistence","مهارات الحياة والتعايش",3],
  GR111:["Arabic Islamic Civilization","الحضارة العربية الإسلامية",3],
  GR112:["Issues and Problems of Development in the Arab World","قضايا التنمية في الوطن العربي",3],
  GR115:["Current International Issues and Problems","قضايا دولية معاصرة",3],
  GR116:["Youth Empowerment","تمكين الشباب",3],
  GR117:["Women Empowerment","تمكين المرأة",3],
  GR121:["Environment and Health","البيئة والصحة",3],
  GR131:["General Branch Requirement","متطلب الفرع",3],
  IN300:["Internship","التدريب الميداني",3],
  CHI101:["Chinese for Beginners I","اللغة الصينية للمبتدئين 1",3],
  CHI102:["Chinese for Beginners II","اللغة الصينية للمبتدئين 2",3],
  SL101:["Spanish for Beginners I","اللغة الإسبانية للمبتدئين 1",3],
  SL102:["Spanish for Beginners II","اللغة الإسبانية للمبتدئين 2",3],
  FR101:["French for Beginners I","اللغة الفرنسية للمبتدئين 1",3],
  FR102:["French for Beginners II","اللغة الفرنسية للمبتدئين 2",3],
  BUC111:["Business Communication 1","الاتصال في الأعمال 1",4],
  BUC112:["Business Communication 2","الاتصال في الأعمال 2",4,"LB170"],
  ECO101:["Principles of Microeconomics","مبادئ الاقتصاد الجزئي",4],
  ECO102:["Principles of Macroeconomics","مبادئ الاقتصاد الكلي",4],
  BUS110:["Introduction to Business","مقدمة في الأعمال",8],
  BUS115:["Small Business Management","إدارة المشاريع الصغيرة",4],
  ACT111:["Financial Accounting","المحاسبة المالية",4],
  ACT112:["Managerial Accounting","المحاسبة الإدارية",4,"B124"],
  BUS101:["Introduction to Math for Business","مقدمة في الرياضيات للأعمال",4],
  BUS102:["Introduction to Statistics","مقدمة في الإحصاء",4],
  MGT111:["Principles of Management I","مبادئ الإدارة 1",4],
  MGT112:["Principles of Management II","مبادئ الإدارة 2",4,"B123"],
  MKT111:["Principles of Marketing I","مبادئ التسويق 1",4],
  MKT112:["Principles of Marketing II","مبادئ التسويق 2",4,"B122"],
  B207A:["Shaping Business Opportunities I","تشكيل فرص الأعمال 1",8],
  B207B:["Shaping Business Opportunities II","تشكيل فرص الأعمال 2",8],
  BUS310:["Strategic Management","الإدارة الاستراتيجية",8],
  ACC204:["Intermediate Financial Accounting","المحاسبة المالية المتوسطة",4],
  BB293:["Financial Accounting in Context","المحاسبة المالية في سياقها",8,"B291"],
  B294:["Financial Analysis and Decision Making","التحليل المالي واتخاذ القرار",8,"B292"],
  B326:["Advanced Financial Accounting","المحاسبة المالية المتقدمة",8],
  B391:["Management Accounting and Finance","المحاسبة الإدارية والتمويل",8,"B392"],
  ACC300:["Accounting Information Systems","نظم المعلومات المحاسبية",4],
  ACC302:["Auditing Theory and Practice","نظرية وتطبيق التدقيق",4],
  B206:["Understanding Customers","فهم العملاء",8,"B205A"],
  BUS208:["Contemporary Issues in Marketing","قضايا معاصرة في التسويق",8,"B205B"],
  B327:["Sustainable Enterprise and Innovation","المشاريع المستدامة والابتكار",8],
  B328:["Marketing in Action","التسويق في التطبيق",8,"B324"],
  MKT331:["Services Marketing","تسويق الخدمات",4],
  MKT332:["Digital Marketing","التسويق الرقمي",4],
  B205A:["Exploring Innovation and Entrepreneurship I","استكشاف الابتكار وريادة الأعمال 1",8],
  B205B:["Exploring Innovation and Entrepreneurship II","استكشاف الابتكار وريادة الأعمال 2",8],
  B329:["Leadership in a Changing World","القيادة في عالم متغير",8,"B325"],
  BUS628:["Global Human Resource Management","إدارة الموارد البشرية العالمية",8,"B628"],
  BUS629:["International Management","الإدارة الدولية",8,"B629"],
  DD209A:["Running the Economy I","إدارة الاقتصاد 1",8],
  DD209B:["Running the Economy II","إدارة الاقتصاد 2",8],
  DD309A:["Doing Economics I","ممارسة علم الاقتصاد 1",8],
  DD309B:["Doing Economics II","ممارسة علم الاقتصاد 2",8],
  ECO342:["Economic Development & Contemporary Issues","التنمية الاقتصادية والقضايا المعاصرة",8,"ECO340 + ECO341"],
  SYS111:["Principles of Technology Ventures","مبادئ المشاريع التقنية",4],
  SYS210:["Managing Technology and Innovation","إدارة التقنية والابتكار",8],
  SYS280:["Principles and Practice of Systems Thinking","مبادئ وممارسة التفكير النظمي",8],
  SYS380:["Managing Systems Complexity","إدارة تعقيد النظم",8],
  MIS111:["Introduction to Management Information Systems I","مقدمة في نظم المعلومات الإدارية 1",4],
  MIS112:["Introduction to Management Information Systems II","مقدمة في نظم المعلومات الإدارية 2",4],
  "MIS200-IS":["Relational Database Management Systems","نظم إدارة قواعد البيانات العلائقية",4],
  "MIS201-IS":["Programming for Business Studies","البرمجة للدراسات التجارية",4],
  MIS300:["Project Management","إدارة المشاريع",8],
  MIS330:["Business Data Management","إدارة بيانات الأعمال",4],
  MIS331:["Business Intelligence","ذكاء الأعمال",4],
  MIS332:["System Analysis and Design","تحليل وتصميم النظم",8],
  MST129:["Applied Calculus","التفاضل والتكامل التطبيقي",4],
  TM260:["Ethics, Law and Governance in IT","الأخلاقيات والقانون والحوكمة في تقنية المعلومات",4],
  TM103:["Computer Organization and Architecture","تنظيم وبنية الحاسوب",4],
  TM105:["Introduction to Programming","مقدمة في البرمجة",4],
  MT131:["Discrete Mathematics","الرياضيات المتقطعة",4],
  MT132:["Linear Algebra","الجبر الخطي",4],
  M110:["Python Programming","البرمجة بلغة بايثون",8,"TM111"],
  TM112:["Introduction to Computing and IT","مقدمة في الحوسبة وتقنية المعلومات",8],
  M251:["Object-Oriented Programming using Java","البرمجة الكائنية بلغة جافا",8],
  M269:["Algorithms, Data Structures and Computability","الخوارزميات وهياكل البيانات",8],
  TM255:["Communication and Information Technologies","تقنيات الاتصال والمعلومات",8,"T215A"],
  T215B:["Communication and Information Technologies (Part B)","تقنيات الاتصال والمعلومات (ب)",8],
  TM351:["Data Management and Analysis","إدارة البيانات وتحليلها",8],
  TM354:["Software Engineering","هندسة البرمجيات",8],
  TM355:["Communications Technology","تقنية الاتصالات",8],
  TM471:["Graduation Project","مشروع التخرج",8],
  MS102:["Physics","الفيزياء",3],
  M109:[".NET Programming","البرمجة بـ ‎.NET",3],
  MT101:["General Mathematics","الرياضيات العامة",3],
  TM297:["Compression Methods for Multimedia","طرق ضغط الوسائط المتعددة",3],
  M277:["Competitive Programming","البرمجة التنافسية",3],
  MT390:["Image Processing","معالجة الصور",3],
  CH101:["Chinese for Beginners I","اللغة الصينية للمبتدئين 1",3],
  CH102:["Chinese for Beginners II","اللغة الصينية للمبتدئين 2",3],
  EL117:["Writing","الكتابة",4],
  EL119:["Oral & Presentation Skills","مهارات المحادثة والعرض",4],
  E120:["Introduction to Language","مقدمة في اللغة",4],
  E121:["Introduction to Literature","مقدمة في الأدب",4],
  EL122:["Writing Research","كتابة البحث",4],
  EL118:["Reading","القراءة",4],
  A112A:["Cultures I","الثقافات 1",8,"AA100A"],
  A112B:["Cultures II","الثقافات 2",8],
  A230A:["Reading and Studying Literature I","قراءة ودراسة الأدب 1",8],
  A230B:["Reading and Studying Literature II","قراءة ودراسة الأدب 2",8],
  L201A:["English in the World I","الإنجليزية في العالم 1",8,"U214A"],
  L201B:["English in the World II","الإنجليزية في العالم 2",8],
  E304A:["Exploring English Grammar I","استكشاف قواعد الإنجليزية 1",8],
  E304B:["Exploring English Grammar II","استكشاف قواعد الإنجليزية 2",8],
  EA300A:["Children's Literature I","أدب الأطفال 1",8],
  EA300B:["Children's Literature II","أدب الأطفال 2",8],
  TR102:["Introduction to Translation","مقدمة في الترجمة",4],
  EL123:["Discourse Analysis","تحليل الخطاب",4],
  EL230:["American Literature","الأدب الأمريكي",4],
  EL240:["Drama","الدراما",4],
  EL350:["Introduction to Literary Theory","مقدمة في النظرية الأدبية",4],
  EL330:["Teaching English as a Foreign Language","تدريس الإنجليزية كلغة أجنبية",4,"ED256"]
};
const KIND = {p:"تمهيدي", u:"متطلب جامعة", f:"متطلب كلية", c:"أساسي مشترك", t:"مواد التخصص", e:"اختياري"};

/* ===== الخطط: map = [رمز, متطلب, نوع]، اختياري = النوع e ===== */
const BIZ_BASE = [
  ["EL099","","p"],["EL111","EL099","u"],["EL112","EL111","u"],["GT101","EL099","u"],
  ["BUC111","EL111","f"],["BUC112","BUC111","f"],["ECO101","EL099","f"],
  ["ACT111","EL111","c"],["ACT112","ACT111","c"],["BUS101","EL099","c"],["BUS102","BUS101","c"],
  ["MGT111","EL111","c"],["MGT112","MGT111","c"],["MKT111","EL111","c"],["MKT112","MKT111","c"],
  ["B207A","MKT112+MGT112","c"],["B207B","B207A+BUC112","c"],["BUS310","B207B","c"]
];
const BIZ_FREE = ["AR113","GB102","GR118"];
const BIZ_UE = ["GR111","GR112","GR115","GR116","GR117","GR121","GR131","CHI101","CHI102","IN300"].map(c => [c,""]);
const KW = "https://www.aou.edu.kw/admission/PublishingImages/Lists/UndergraduatePrograms/AllItems/";
const BIZ_SRC = n => KW + "Step%202-Study%20Plan%20Temp-19-09-2021-" + n + ".pdf";
const drop = (list, codes) => list.filter(([c]) => !codes.includes(c));
const PLANS = [
  {id:"acc", title:"المحاسبة", en:"Business Studies with Accounting", hrs:133, color:"var(--yellow)", src:BIZ_SRC("Accounting"), srcNote:"خطة 2022–2027",
   map:[...BIZ_BASE, ["BB293","ACT112+ECO101","t"],["B294","ACT112+BUS102","t"],["B326","BB293","t"],["B391","B294","t"],["ACC300","BB293|B294","t"],["ACC302","BB293|B294","t"]],
   free:BIZ_FREE, ue:BIZ_UE, fe:{hrs:4, list:[["BUS110","EL111"],["ACC204","ACT112"]]}},
  {id:"mkt", title:"التسويق", en:"Business Studies with Marketing", hrs:133, color:"var(--pink)", src:BIZ_SRC("Marketing"), srcNote:"خطة 2022–2027",
   map:[...BIZ_BASE, ["B206","BUC112+ACT112","t"],["BUS208","B206+MKT112","t"],["B327","B207B","t"],["B328","BUS208","t"],["MKT331","BUS208","t"],["MKT332","BUS208","t"]],
   free:BIZ_FREE, ue:BIZ_UE, fe:{hrs:4, list:[["BUS110","EL111"],["ECO102","ECO101"],["BUS115","EL112"]]}},
  {id:"mgt", title:"الإدارة", en:"Business Studies with Management", hrs:133, color:"var(--turq)", src:BIZ_SRC("Management"), srcNote:"خطة 2022–2027",
   map:[...BIZ_BASE, ["B205A","BUC112+ACT112","t"],["B205B","B205A+ECO101","t"],["B329","B207B","t"],["BUS628","B207B","t"],["BUS629","B205B","t"]],
   free:BIZ_FREE, ue:BIZ_UE, fe:{hrs:4, list:[["BUS110","EL111"],["ECO102","ECO101"],["BUS115","EL112"]]}},
  {id:"eco", title:"الاقتصاد", en:"Business Studies with Economics", hrs:133, color:"var(--yellow)", src:BIZ_SRC("Economics"), srcNote:"خطة 2022–2027",
   map:[...drop(BIZ_BASE,["MKT112"]), ["MKT112","MKT111","e"],["ECO102","ECO101","t"],["DD209A","BUS102+ECO102","t"],["DD209B","DD209A+MKT111","t"],["DD309A","DD209B","t"],["DD309B","DD309A","t"],["ECO342","DD209B","t"]],
   free:BIZ_FREE, ue:BIZ_UE, fe:{hrs:4, list:[["BUS110","EL111"],["MKT112","MKT111"],["BUS115","EL112"]],
   note:"MKT112 اختياري في خطة الاقتصاد، لكن B207A يتطلبه، فعملياً تحتاج تاخذه."}},
  {id:"sys", title:"النظم", en:"Business Studies with Systems Practice", hrs:133, color:"var(--turq)", src:"https://www.arabou.edu.kw/admission/Documents/en/FBS/Undergraduate/Business%20Studies%20System%20Practice/SP/Program%20Structure-UG-Sys%202022.pdf", srcNote:"هيكل البرنامج 2022 (المقر الرئيسي)",
   map:[...BIZ_BASE, ["SYS210","BUC112+ACT112","t"],["SYS280","SYS210+ECO101","t"],["B329","B207B","t"],["B327","B207B","t"],["SYS380","SYS280","t"]],
   free:BIZ_FREE, ue:BIZ_UE.filter(([c]) => c !== "IN300"), fe:{hrs:4, list:[["BUS110","EL111"],["SYS111","EL111"],["BUS115","EL112"]]}},
  {id:"mis", title:"نظم المعلومات الإدارية", en:"Business Studies with MIS", hrs:133, color:"var(--pink)", src:"https://www.aou.edu.kw/media/PublishingImages/Lists/Announcements/AllItems/FBS-%20Student%20Handbook%202022-V%206.1-U1.pdf", srcNote:"دليل طالب كلية الدراسات التجارية 2022 (خطة الكويت منشورة كصور فقط)",
   map:[...drop(BIZ_BASE,["ACT112","MGT112","MKT112","B207A"]), ["MIS111","EL111","t"],["MIS112","MIS111","t"],["SYS111","EL111","t"],
     ["B207A","MIS112|SYS111","c"],["SYS210","SYS111","t"],["MIS200-IS","MIS112","t"],["MIS201-IS","MIS200-IS+BUS102","t"],
     ["MIS300","B207B","t"],["MIS330","MIS200-IS","t"],["MIS331","MIS201-IS","t"],["MIS332","MIS330","t"]],
   free:BIZ_FREE, ue:BIZ_UE, fe:{hrs:4, list:[], note:"الدليل ما يوضح قائمة الاختياري لمسار MIS، راجع مرشدك الأكاديمي."}},
  {id:"itc", title:"تقنية المعلومات", en:"Information Technology and Computing", hrs:131, color:"var(--turq)", src:KW + "ITC-Study%20Plan.pdf", srcNote:"خطة الكويت 2021–2026",
   map:[["EL099","","p"],["EL111","EL099","u"],["EL112","EL111","u"],["MST129","EL099","f"],["TM260","TM255","f"],
     ["TM103","EL111","t"],["TM105","EL111","t"],["MT131","EL111","t"],["MT132","EL111","t"],["M110","EL111","t"],["TM112","M110","t"],
     ["M251","TM105","t"],["M269","M110+MT131","t"],["TM255","TM112","t"],["T215B","TM255","t"],["TM351","M269|M251","t"],["TM354","M251","t"],
     ["TM355","T215B","t"],["TM471","TM355|TM354|TM351","t"]],
   free:["AR113","GB102","GR118","GT101"],
   ue:[["GR111",""],["GR112",""],["GR115",""],["GR116",""],["GR117",""],["GR121",""],["GR131",""],["CH101",""],["CH102","CH101"],["SL101",""],["SL102","SL101"],["FR101",""],["FR102","FR101"]],
   fe:{hrs:6, list:[["MS102","EL111"],["M109","EL111"],["MT101",""],["TM297","TM112+MT131"],["M277","M251+M269"],["MT390","MT132+M251"]], note:"تختار مادتين (6 ساعات)."}},
  {id:"ell", title:"الأدب الإنجليزي", en:"English Language and Literature", hrs:129, color:"var(--pink)", src:KW + "ELL%20Study%20Plan%202026%20Kuwait.pdf", srcNote:"خطة الكويت 2026",
   map:[["EL099","","p"],["EL111","EL099","u"],["EL112","EL111","u"],["EL117","EL111","f"],["EL119","EL111","f"],
     ["E120","EL111","t"],["E121","EL117+EL119","t"],["EL122","EL117","t"],["EL118","EL111","t"],["A112A","EL112+EL117","t"],["A112B","E121+A112A","t"],
     ["A230A","E121+A112A+A112B","t"],["A230B","A230A","t"],["L201A","E120+EL112+EL117","t"],["L201B","L201A","t"],
     ["E304A","L201B","t"],["E304B","E304A","t"],["EA300A","A230B","t"],["EA300B","EA300A","t"]],
   free:["AR113","GB102","GR118","GT101"],
   ue:[["GR111",""],["GR112",""],["GR115",""],["GR131",""],["SL101",""],["FR101",""]],
   fe:{hrs:4, list:[["TR102","E121"],["EL123","EL112","*"],["EL230","E121"],["EL240","EL112","*"],["EL350","EL112","*"],["EL330","EL112"]], note:"المواد المعلّمة بـ * ما تنطرح في فرع الكويت للحين."}}
];

/* ===== الخطة فصل بفصل: UE = اختياري جامعة، FE = اختياري كلية =====
   تخصصات الأعمال مبنية على الخطة المقترحة في دليل طالب الكلية 2022، مع تقديم MGT112 و BUC112 فصل
   عشان B207A يتوافق مع متطلباته. تقنية المعلومات والأدب الإنجليزي: ترتيب مقترح حسب المتطلبات. */
const Y1 = [["EL111","AR113","GR118","GT101","BUS101","ECO101"], ["EL112","BUC111","ACT111","MGT111","MKT111"]];
const Y2A = ["BUS102","ACT112","MGT112","MKT112","BUC112"];
const SEM = {
  acc:[...Y1, Y2A, ["B207A","BB293","GB102"], ["B207B","B294","UE"], ["BUS310","B326","FE"], ["B391","ACC300","ACC302"]],
  mkt:[...Y1, Y2A, ["B207A","B206","GB102"], ["B207B","BUS208","UE"], ["BUS310","MKT331","MKT332","FE"], ["B327","B328"]],
  mgt:[...Y1, Y2A, ["B207A","B205A","GB102"], ["B207B","B205B","UE"], ["BUS310","B329","FE"], ["BUS628","BUS629"]],
  eco:[...Y1, ["BUS102","ECO102","MGT112","MKT112","BUC112"], ["B207A","DD209A","GB102"], ["B207B","DD209B","UE"], ["BUS310","DD309A","ACT112"], ["DD309B","ECO342"]],
  sys:[...Y1, Y2A, ["B207A","SYS210","GB102"], ["B207B","SYS280","UE"], ["BUS310","SYS380","FE"], ["B327","B329"]],
  mis:[Y1[0], ["EL112","BUC111","MIS111","MGT111","MKT111"], ["ACT111","BUC112","MIS112","BUS102","SYS111"], ["SYS210","MIS200-IS","GB102","FE"], ["B207A","MIS201-IS","MIS330"], ["B207B","MIS331","MIS332"], ["BUS310","MIS300","UE"]],
  itc:[["EL111","AR113","GR118","GT101","MST129","GB102"], ["EL112","TM105","MT131","M110"], ["TM112","M251","TM103"], ["M269","TM255","UE"], ["T215B","TM354","MT132"], ["TM260","TM351","FE","FE"], ["TM355","TM471"]],
  ell:[["EL111","AR113","GR118","GT101","GB102","UE"], ["EL112","EL117","EL119","E120","EL118"], ["E121","EL122","A112A"], ["A112B","L201A","FE"], ["A230A","L201B"], ["A230B","E304A"], ["EA300A","E304B"], ["EA300B"]]
};
PLANS.forEach(p => { p.sem = SEM[p.id]; p.semNote = ["itc","ell"].includes(p.id) ? "ترتيب مقترح حسب المتطلبات" : "مبنية على الخطة المقترحة في دليل الطالب"; });
const feHrs = p => p.id === "itc" ? 3 : p.fe.hrs;
const hrsOf = (p, c) => c === "UE" ? 3 : c === "FE" ? feHrs(p) : C[c][2];
const preOf = (p, c) => ([...p.map, ...p.fe.list, ...p.ue].find(r => r[0] === c) || [, ""])[1];

/* ===== ترتيب الخريطة: كل مادة في المرحلة اللي بعد آخر متطلب لها ===== */
function layout(plan) {
  const nodes = plan.map.map(([code, pre, kind]) => ({code, kind, groups: pre ? pre.split("+").map(g => g.split("|")) : []}));
  const by = Object.fromEntries(nodes.map(n => [n.code, n]));
  nodes.forEach(n => { n.parents = n.groups.flat().filter(c => by[c]); n.kids = []; });
  nodes.forEach(n => n.parents.forEach(p => by[p].kids.push(n.code)));
  const stage = c => by[c].st ??= by[c].parents.length ? 1 + Math.max(...by[c].parents.map(stage)) : 0;
  nodes.forEach(n => stage(n.code));
  const cols = [];
  nodes.forEach(n => (cols[n.st] ??= []).push(n));
  // ترتيب كل عمود حسب موقع المتطلبات عشان تقل تقاطعات الخطوط
  for (let pass = 0; pass < 3; pass++) cols.forEach((col, i) => {
    col.forEach((n, j) => n.pos = (j + .5) / col.length);
    if (!i) return;
    col.forEach(n => n.bc = n.parents.length ? n.parents.reduce((s, p) => s + by[p].pos, 0) / n.parents.length : n.pos);
    col.sort((a, b) => a.bc - b.bc);
  });
  cols.forEach(col => col.forEach((n, j) => n.row = j));
  return {nodes, by, cols};
}

/* ===== تسلسل المواد: كل سلسلة مادة تفتح اللي بعدها =====
   EL099 و EL111 و EL112 بوابة البداية، والمواد اللي ما تفتح شي وتحتاج بس EL111 تطلع بقائمة لحالها. */
const GATE = ["EL099", "EL111", "EL112"];
function lanes(plan) {
  const {nodes, by} = layout(plan);
  const dset = c => by[c].ds ??= new Set(by[c].kids.flatMap(k => [k, ...dset(k)]));
  const desc = c => dset(c).size;
  const order = nodes.filter(n => !GATE.includes(n.code)).sort((a, b) => a.st - b.st || desc(b.code) - desc(a.code));
  const prefix = c => c.replace(/\d.*/, "");
  const list = [], laneOf = {}, solo = [];
  for (const n of order) {
    const real = n.parents.filter(p => !GATE.includes(p));
    if (!n.kids.length && !real.length) { solo.push(n.code); continue; }
    const tails = real.filter(p => laneOf[p] && laneOf[p].at(-1) === p)
      .sort((a, b) => (prefix(b) === prefix(n.code)) - (prefix(a) === prefix(n.code)) || laneOf[b].length - laneOf[a].length);
    if (tails.length) { laneOf[tails[0]].push(n.code); laneOf[n.code] = laneOf[tails[0]]; }
    else { const l = [n.code]; list.push(l); laneOf[n.code] = l; }
  }
  list.sort((a, b) => b.length - a.length);
  return {lanes: list, solo, by, gate: GATE.filter(c => by[c])};
}

/* ===== صانع الخطة: يوزع المواد الباقية على الفصول حسب المتطلبات ===== */
const TERM = {"1": "الفصل الأول", "2": "الفصل الثاني", "S": "الفصل الصيفي"};
const termName = t => t.t === "S" ? `${TERM.S} ${t.y + 1}` : `${TERM[t.t]} ${t.y}/${t.y + 1}`;
function nextTerm(t, summer) {
  if (t.t === "1") return {t: "2", y: t.y};
  if (t.t === "2") return summer ? {t: "S", y: t.y} : {t: "1", y: t.y + 1};
  return {t: "1", y: t.y + 1};
}
// مفاتيح عناصر الخطة: رمز المادة، أو UE1 / FE1 / FE2 للاختياري
function planItems(plan) {
  const n = {};
  return plan.sem.flatMap((s, i) => s.map(c => {
    const key = c === "UE" || c === "FE" ? c + (n[c] = (n[c] || 0) + 1) : c;
    return {key, code: c, rank: i, hrs: hrsOf(plan, c), pre: c === "UE" || c === "FE" ? "" : preOf(plan, c)};
  }));
}
function schedule(plan, doneKeys, {hrs = 20, summer = 0, start = {t: "2", y: 2026}} = {}) {
  const items = planItems(plan), known = new Set(items.map(x => x.code));
  const {by} = layout(plan);
  const dset = c => by[c] ? (by[c].ds ??= new Set(by[c].kids.flatMap(k => [k, ...dset(k)]))) : new Set();
  const desc = c => dset(c).size;
  const done = new Set(items.filter(x => doneKeys.has(x.key)).map(x => x.code));
  let left = items.filter(x => !doneKeys.has(x.key)), t = start;
  const terms = [];
  const ok = x => !x.pre || x.pre.split("+").every(g => g.split("|").some(c => c === "EL099" || !known.has(c) || done.has(c)));
  for (let guard = 0; left.length && guard < 40; guard++, t = nextTerm(t, summer)) {
    const cap = t.t === "S" ? summer : hrs;
    const pick = [];
    let sum = 0;
    left.filter(ok).sort((a, b) => a.rank - b.rank || desc(b.code) - desc(a.code)).forEach(x => { if (sum + x.hrs <= cap) { pick.push(x); sum += x.hrs; } });
    if (pick.length) { terms.push({name: termName(t), items: pick, hrs: sum}); pick.forEach(x => done.add(x.code)); left = left.filter(x => !pick.includes(x)); }
    else if (t.t !== "S" && !left.some(ok)) break;
  }
  return {terms, left: left.length};
}

window.ASC_PLANS = {C, KIND, PLANS, layout, hrsOf, preOf, lanes, schedule, planItems};

/* ===== العرض ===== */
const root = document.getElementById("plantree");
if (!root) return;
const $p = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const codeTag = c => `<span class="code">${esc(c)}</span>`;
const preNice = p => p.split("+").map(g => g.split("|").map(x => x === "EL099" ? "التمهيدي" : codeTag(x)).join(" أو ")).join(" + ");
const YEAR = ["الأولى","الثانية","الثالثة","الرابعة"];
const kindOf = (plan, c) => c === "UE" || c === "FE" ? "e" : plan.free.includes(c) ? "u" : (plan.map.find(r => r[0] === c) || [, , "e"])[2];
let cur = null, view = "img";
const VIEWS = [["img", "الصورة"], ["mine", "سوّ خطتك"], ["sem", "فصل بفصل"], ["chain", "التسلسل"]];

// بطاقة مادة وحدة (تُستخدم في كل العروض)
function courseCard(plan, c, foot) {
  if (c === "UE" || c === "FE") return `<li class="pc k-e"><div><b>${c === "UE" ? "اختياري جامعة" : "اختياري كلية"}</b><em>${hrsOf(plan, c)} س.م</em></div><span>تختار من القائمة تحت</span></li>`;
  const pre = preOf(plan, c);
  return `<li class="pc k-${kindOf(plan, c)}"><div>${codeTag(c)}<em>${C[c][2]} س.م</em></div><span>${esc(C[c][1])}</span>${foot ?? `<small>${pre ? "يحتاج: " + preNice(pre) : "بدون متطلب"}</small>`}${links(c)}</li>`;
}
function links(c) {
  const lect = typeof CONFIG !== "undefined" ? CONFIG.lectures.find(l => l.code === c || (c === "BB293" && l.code === "B293")) : null;
  const chat = typeof courseChat !== "undefined" ? courseChat[c] : null;
  return lect || chat ? `<p class="pl">${lect ? `<a href="${esc(lect.url)}" target="_blank" rel="noopener">محاضرة مجانية</a>` : ""}${chat ? `<a class="wa" href="${esc(chat)}" target="_blank" rel="noopener">قروب المادة</a>` : ""}</p>` : "";
}
function termCard(n, title, sub, cards, extraCls = "") {
  return `<li class="ps ${extraCls}"><div class="ps-h"><span class="ps-n">${n}</span><b>${title}</b><small>${sub}</small></div>${cards ? `<ul class="ps-c">${cards}</ul>` : ""}</li>`;
}

function semHtml(plan) {
  let done = 0;
  return plan.sem.map((s, i) => {
    const h = s.reduce((a, c) => a + hrsOf(plan, c), 0); done += h;
    return termCard(i + 1, `السنة ${YEAR[i >> 1]} · الفصل ${i % 2 ? "الثاني" : "الأول"}`, `${h} ساعة · أنجزت ${done} من ${plan.hrs}`, s.map(c => courseCard(plan, c)).join(""));
  }).join("") + termCard("🎓", "مبروك التخرج!", `${plan.hrs} ساعة معتمدة`, "", "ps-grad");
}

function chainHtml(plan) {
  const {lanes: ls, solo, by, gate} = lanes(plan);
  const node = (c, i, lane) => {
    const n = by[c], prev = lane[i - 1];
    const extra = i ? n.groups.filter(g => !g.includes(prev)) : [];
    const more = n.kids.filter(k => k !== lane[i + 1]);
    return `<div class="ch-n k-${n.kind}"><b class="code">${esc(c)}</b><span>${esc(C[c][1])}</span>${extra.length ? `<small>+ يحتاج ${extra.map(g => g.map(codeTag).join(" أو ")).join(" + ")}</small>` : ""}${more.length ? `<small class="opens">ويفتح: ${more.map(codeTag).join("، ")}</small>` : ""}</div>`;
  };
  const startOf = c => { const g = by[c].groups; return g.length ? preNice(g.map(x => x.join("|")).join("+")) : "البداية"; };
  return `
    <div class="ch-gate"><b>ابدأ من هني</b><ol class="ch-row">${gate.map((c, i) => `<li class="ch-step">${i ? '<span class="ch-ar" aria-hidden="true">←</span>' : ""}<div class="ch-n k-${by[c].kind}"><b class="code">${esc(c)}</b><span>${esc(C[c][1])}</span></div></li>`).join("")}</ol>
      <p>بعد ما تخلص <span class="code">EL111</span> تنفتح لك بدايات كل السلاسل اللي تحت.</p></div>
    <ol class="ch-list">${ls.map(l => `<li class="ch-lane"><span class="ch-start">بعد ${startOf(l[0])}</span><ol class="ch-row">${l.map((c, i) => `<li class="ch-step">${i ? '<span class="ch-ar" aria-hidden="true">←</span>' : ""}${node(c, i, l)}</li>`).join("")}</ol></li>`).join("")}</ol>
    ${solo.length ? `<div class="ch-solo"><b>مواد ما تفتح غيرها</b><span>تاخذها في أي فصل بعد التمهيدي أو EL111:</span> ${solo.map(codeTag).join("، ")}</div>` : ""}`;
}

/* ===== سوّ خطتك ===== */
const store = {
  get: id => { try { return JSON.parse(localStorage.getItem("asc-plan-" + id)) || {}; } catch { return {}; } },
  set: (id, v) => { try { localStorage.setItem("asc-plan-" + id, JSON.stringify(v)); } catch {} }
};
const waNum = () => (typeof CONFIG !== "undefined" && CONFIG.whatsapp?.[0]?.number) || "";
function mineHtml(plan) {
  const items = planItems(plan), st = store.get(plan.id), done = new Set(st.done || []);
  const opt = (v, cur, label) => `<option value="${v}"${String(v) === String(cur) ? " selected" : ""}>${label}</option>`;
  return `
    <div class="mine-step"><h3><span>1</span>أشّر على المواد اللي خلصتها</h3>
      <p>لما تأشّر مادة نأشّر متطلباتها معاها. اللي ما أشّرت عليه نعتبره باقي عليك.</p>
      ${plan.sem.map((s, i) => `<fieldset><legend>مواد الفصل ${i + 1} في الخطة</legend>${items.filter(x => x.rank === i).map(x =>
        `<label class="tick"><input type="checkbox" data-k="${esc(x.key)}"${done.has(x.key) ? " checked" : ""}><span>${x.code === "UE" ? "اختياري جامعة" : x.code === "FE" ? "اختياري كلية" : codeTag(x.code)}<small>${x.code === "UE" || x.code === "FE" ? x.hrs + " س.م" : esc(C[x.code][1])}</small></span></label>`).join("")}</fieldset>`).join("")}
      <p class="mine-all"><button type="button" class="linkbtn" data-all="0">مسح الكل</button></p>
    </div>
    <div class="mine-step"><h3><span>2</span>جدولك</h3>
      <div class="mine-opts">
        <label>كم ساعة تبي تسجل كل فصل؟<select id="m-hrs">${[12, 16, 20].map(h => opt(h, st.hrs || 20, h + " ساعة" + (h === 20 ? " (عبء كامل)" : ""))).join("")}</select></label>
        <label>أول فصل بتسجل فيه<select id="m-start">${opt("2-2026", st.start || "2-2026", "الفصل الثاني 2026/2027")}${opt("S-2026", st.start, "الفصل الصيفي 2027")}${opt("1-2027", st.start, "الفصل الأول 2027/2028")}</select></label>
        <label>الفصل الصيفي<select id="m-sum">${opt(0, st.summer || 0, "ما بدرس صيفي")}${opt(4, st.summer, "4 ساعات")}${opt(8, st.summer, "8 ساعات")}</select></label>
      </div>
      <p class="mine-note">الحد الأعلى للتسجيل يعتمد على أنظمة الجامعة ومعدلك، تأكد منه من مرشدك.</p>
    </div>
    <div class="mine-step" id="m-plan"><h3><span>3</span>خطتك في تخصص ${esc(plan.title)}</h3><div id="m-out"></div></div>
    ${waNum() ? `<div class="mine-step mine-ask"><h3><span>4</span>تبينا نرتبها لك؟</h3>
      <p>ترسل لنا تخصصك والمواد اللي أشّرت عليها على الواتساب، ونراجع خطتك ونرد عليك.</p>
      <label>اسمك (اختياري)<input type="text" id="m-name" autocomplete="name" value="${esc(st.name || "")}"></label>
      <a class="btn w" id="m-ask" target="_blank" rel="noopener">أرسل طلبي على الواتساب</a></div>` : ""}`;
}
function mineWire(plan, box) {
  const items = planItems(plan), byKey = Object.fromEntries(items.map(x => [x.key, x]));
  const keyOf = Object.fromEntries(items.filter(x => !/^(UE|FE)\d/.test(x.key)).map(x => [x.code, x.key]));
  const boxes = () => [...box.querySelectorAll("input[data-k]")];
  // تأشير المتطلبات تلقائياً (المتطلب الإجباري بس، مو "أو")
  const tickPre = k => (byKey[k].pre || "").split("+").filter(g => g && !g.includes("|")).forEach(c => {
    const pk = keyOf[c], el = pk && box.querySelector(`input[data-k="${CSS.escape(pk)}"]`);
    if (el && !el.checked) { el.checked = true; tickPre(pk); }
  });
  const update = () => {
    const done = new Set(boxes().filter(b => b.checked).map(b => b.dataset.k));
    const [t, y] = $p("m-start").value.split("-");
    const opts = {hrs: +$p("m-hrs").value, summer: +$p("m-sum").value, start: {t, y: +y}};
    store.set(plan.id, {done: [...done], hrs: opts.hrs, summer: opts.summer, start: $p("m-start").value, name: $p("m-name")?.value || ""});
    const doneHrs = items.filter(x => done.has(x.key)).reduce((a, x) => a + x.hrs, 0);
    const {terms, left} = schedule(plan, done, opts);
    let acc = doneHrs;
    $p("m-out").innerHTML = !terms.length && !left ? `<p class="mine-sum">خلصت كل مواد الخطة، مبروك! 🎓</p>` : `
      <p class="mine-sum">خلصت <b>${doneHrs}</b> من ${plan.hrs} ساعة، وباقي لك <b>${plan.hrs - doneHrs}</b> ساعة في <b>${terms.length}</b> ${terms.length > 2 && terms.length < 11 ? "فصول" : "فصل"}. تتخرج تقريباً في <b>${terms.at(-1).name}</b>.</p>
      <div class="mine-act"><button type="button" class="btn y" id="m-print">اطبع خطتي أو احفظها PDF</button></div>
      <ol class="psem">${terms.map((tm, i) => { acc += tm.hrs; return termCard(i + 1, tm.name, `${tm.hrs} ساعة · بتوصل ${acc} من ${plan.hrs}`, tm.items.map(x => courseCard(plan, x.code)).join("")); }).join("")}
      ${termCard("🎓", "التخرج", `${plan.title} · ${plan.hrs} ساعة معتمدة`, "", "ps-grad")}</ol>
      ${left ? `<p class="mine-note">فيه ${left} مواد ما قدرنا نرتبها، راجع مرشدك.</p>` : ""}`;
    const ask = $p("m-ask");
    if (ask) {
      const name = $p("m-name").value.trim(), code = k => byKey[k].code === "UE" ? "اختياري جامعة" : byKey[k].code === "FE" ? "اختياري كلية" : byKey[k].code;
      const txt = [`السلام عليكم، أبي تسوون لي خطة دراسية${name ? `\nالاسم: ${name}` : ""}`, `التخصص: ${plan.title}`,
        `المواد اللي خلصتها (${doneHrs} ساعة): ${done.size ? [...done].map(code).join("، ") : "ولا مادة"}`,
        `أبي أسجل ${opts.hrs} ساعة بالفصل، وأبدأ ${$p("m-start").selectedOptions[0].text}، والصيفي: ${$p("m-sum").selectedOptions[0].text}`].join("\n");
      ask.href = `https://wa.me/${waNum()}?text=${encodeURIComponent(txt)}`;
    }
    $p("m-print")?.addEventListener("click", () => print());
  };
  $p("m-name")?.addEventListener("input", update);
  box.addEventListener("change", e => { if (e.target.dataset.k && e.target.checked) tickPre(e.target.dataset.k); update(); });
  box.querySelector("[data-all]").onclick = () => { boxes().forEach(b => b.checked = false); update(); };
  update();
}

function render(id, v) {
  const plan = PLANS.find(p => p.id === id) || PLANS[0];
  if (VIEWS.some(([x]) => x === v)) view = v;
  cur = {plan};
  store.set("last", {id: plan.id});
  document.querySelectorAll("#plantree .ptab").forEach(t => t.setAttribute("aria-selected", t.dataset.p === plan.id));
  const chip = ([c, pre, star]) => `<li><span class="pchip"><span>${codeTag(c)}${star ? "<sup>*</sup>" : ""}</span><small>${esc(C[c][1])}</small>${pre ? `<small class="pre">يحتاج: ${preNice(pre)}</small>` : ""}</span></li>`;
  const file = `الخطة-الدراسية-${esc(plan.title.replace(/ /g, "-"))}`;
  $p("pbody").innerHTML = `
    <div class="phead"><div><b>${esc(plan.title)}</b><span dir="ltr">${esc(plan.en)}</span></div>
      <div class="pstat"><b>${plan.hrs}</b><small>ساعة معتمدة</small></div></div>
    <div class="pdl"><span>حمّل الخطة:</span>
      <a class="btn y" href="plans/${plan.id}.png" download="${file}.png">صورة للجوال</a>
      <a class="btn o" href="plans/${plan.id}.pdf" download="${file}.pdf">ملف PDF</a>
      <button type="button" class="btn o" id="p-print">اطبع</button></div>
    <div class="pview" role="tablist">${VIEWS.map(([v, t]) => `<button type="button" role="tab" data-v="${v}" aria-selected="${view === v}">${t}</button>`).join("")}</div>
    <div id="vimg"${view === "img" ? "" : " hidden"}>
      <p class="phint">هذي خطة التخصص كاملة في صورة وحدة. احفظها عندك من زر «صورة للجوال» فوق، أو اضغط على الصورة مطولاً واختر حفظ.</p>
      <a class="pimg" href="plans/${plan.id}.png" target="_blank" rel="noopener"><img src="plans/${plan.id}.png" alt="الخطة الدراسية لتخصص ${esc(plan.title)}: شجرة المواد ومتطلباتها" decoding="async"></a>
    </div>
    <div id="vmine"${view === "mine" ? "" : " hidden"}>
      <p class="phint">أشّر على المواد اللي خلصتها، ونرتب لك باقي موادك فصل بفصل لين التخرج.</p>
      <div id="m-body">${mineHtml(plan)}</div>
    </div>
    <div id="vsem"${view === "sem" ? "" : " hidden"}>
      <p class="phint">طريقك للتخرج فصل بفصل: سجّل مواد كل فصل بالترتيب، وتحت كل مادة مكتوب وش تحتاج قبلها.</p>
      <ol class="psem">${semHtml(plan)}</ol>
    </div>
    <div id="vchain"${view === "chain" ? "" : " hidden"}>
      <p class="phint">كل سطر سلسلة: تبدأ من اليمين، وكل مادة تفتح اللي بعدها. إذا مادة تحتاج شي من سلسلة ثانية مكتوب تحتها.</p>
      ${chainHtml(plan)}
    </div>
    <div class="pextra">
      <section><h3>اختياري جامعة <small>3 ساعات</small></h3><p>تختار مادة وحدة من هذي.</p><ul class="pchips">${plan.ue.map(chip).join("")}</ul></section>
      <section><h3>اختياري كلية <small>${plan.id === "itc" ? "6 ساعات (مادتين)" : plan.fe.hrs + " ساعات"}</small></h3>${plan.fe.note && plan.id !== "itc" ? `<p>${esc(plan.fe.note)}</p>` : ""}<ul class="pchips">${plan.fe.list.map(chip).join("")}</ul></section>
    </div>
    <p class="psrc">المصدر: <a href="${esc(plan.src)}" target="_blank" rel="noopener">${esc(plan.srcNote)}</a> من موقع الجامعة العربية المفتوحة، وتوزيع الفصول ${esc(plan.semNote)}. تقدر تغيّر الترتيب حسب المطروح كل فصل، بس لازم تخلص المتطلب قبل المادة. الأسماء العربية ترجمة تقريبية؛ تأكد من مرشدك الأكاديمي قبل التسجيل.</p>`;
  $p("pbody").querySelectorAll(".pview button").forEach(b => b.onclick = () => {
    view = b.dataset.v;
    history.replaceState(null, "", `#plans/${plan.id}/${view}`);
    $p("pbody").querySelectorAll(".pview button").forEach(x => x.setAttribute("aria-selected", x === b));
    VIEWS.forEach(([v]) => $p("v" + v).hidden = v !== view);
  });
  $p("p-print").onclick = () => print();
  mineWire(plan, $p("m-body"));
}

if (root) {
  root.innerHTML = `<div class="tabs ptabs" role="tablist">${PLANS.map((p, i) =>
    `<button type="button" role="tab" class="tab ptab" data-p="${p.id}" aria-selected="${!i}"><i style="background:${p.color}"></i>${p.title}</button>`).join("")}</div><div id="pbody"></div>`;
  root.querySelectorAll(".ptab").forEach(t => t.onclick = () => { history.replaceState(null, "", `#plans/${t.dataset.p}/${view}`); render(t.dataset.p); });
  // الروابط القديمة: سوّ خطتك وصور الخطط صاروا داخل صفحة الخطط
  const [h, sub] = location.hash.slice(1).split("/");
  const old = {myplan: "mine", planimgs: "img"}[h];
  if (old) location.replace(`#plans/${sub || store.get("last").id || PLANS[0].id}/${old}`);
  else { const [, id, v] = location.hash.slice(1).split("/"); render(h === "plans" && id ? id : store.get("last").id, v); }
}
addEventListener("hashchange", () => {
  const [v, sub, mode] = location.hash.slice(1).split("/");
  const old = {myplan: "mine", planimgs: "img"}[v];
  if (old) return location.replace(`#plans/${sub || cur?.plan.id || PLANS[0].id}/${old}`);
  if (v === "plans" && sub && (sub !== cur?.plan.id || (mode && mode !== view))) render(sub, mode);
});
})();
