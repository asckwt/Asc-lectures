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
  {id:"itc", title:"تقنية المعلومات", en:"Information Technology and Computing", hrs:131, color:"var(--turq)", src:"https://www.arabou.edu.kw/admission/Documents/ITC%20Programme%20Structure.pdf", srcNote:"هيكل البرنامج 2021–2026 (المقر الرئيسي؛ خطة الكويت منشورة كصور فقط)",
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

window.ASC_PLANS = {C, KIND, PLANS, layout, hrsOf, preOf};

/* ===== العرض ===== */
const root = document.getElementById("plantree");
if (!root) return;
const esc = s => String(s).replace(/[&<>"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
const preText = p => p ? p.split("+").map(g => g.split("|").join(" أو ")).join(" + ") : "بدون متطلب";
const codeTag = c => `<span class="code">${esc(c)}</span>`;
let cur = null, sel = null, links = {}, view = "sem";
const YEAR = ["الأولى","الثانية","الثالثة","الرابعة"];
const preNice = p => p.split("+").map(g => g.split("|").map(x => x === "EL099" ? "التمهيدي" : codeTag(x)).join(" أو ")).join(" + ");
function semHtml(plan) {
  let done = 0;
  return plan.sem.map((s, i) => {
    const h = s.reduce((a, c) => a + hrsOf(plan, c), 0); done += h;
    return `<li class="ps"><div class="ps-h"><span class="ps-n">${i + 1}</span><b>السنة ${YEAR[i >> 1]} · الفصل ${i % 2 ? "الثاني" : "الأول"}</b><small>${h} ساعة · أنجزت ${done} من ${plan.hrs}</small></div>
      <ul class="ps-c">${s.map(c => {
        if (c === "UE" || c === "FE") return `<li class="pc k-e"><div><b>${c === "UE" ? "اختياري جامعة" : "اختياري كلية"}</b><em>${hrsOf(plan, c)} س.م</em></div><span>تختار من القائمة تحت</span></li>`;
        const pre = preOf(plan, c), kind = plan.free.includes(c) ? "u" : (plan.map.find(r => r[0] === c) || [, , "e"])[2];
        return `<li class="pc k-${kind}"><div>${codeTag(c)}<em>${C[c][2]} س.م</em></div><span>${esc(C[c][1])}</span><small>${pre ? "يحتاج: " + preNice(pre) : "بدون متطلب"}</small></li>`;
      }).join("")}</ul></li>`;
  }).join("") + `<li class="ps ps-grad"><div class="ps-h"><span class="ps-n">🎓</span><b>مبروك التخرج!</b><small>${plan.hrs} ساعة معتمدة</small></div></li>`;
}

function render(id) {
  const plan = PLANS.find(p => p.id === id) || PLANS[0];
  cur = {plan, ...layout(plan)};
  sel = null;
  document.querySelectorAll("#plantree .ptab").forEach(t => t.setAttribute("aria-selected", t.dataset.p === plan.id));
  const chip = ([c, pre, star]) => `<li><button type="button" class="pchip" data-info="${esc(c)}"><span>${codeTag(c)}${star ? "<sup>*</sup>" : ""}</span><small>${esc(C[c][1])}</small>${pre ? `<small class="pre">متطلب: ${codeTag(preText(pre))}</small>` : ""}</button></li>`;
  $p("pbody").innerHTML = `
    <div class="phead"><div><b>${esc(plan.title)}</b><span dir="ltr">${esc(plan.en)}</span></div>
      <div class="pstat"><b>${plan.hrs}</b><small>ساعة معتمدة</small></div></div>
    <div class="pdl"><span>حمّل الخطة:</span>
      <a class="btn y" href="plans/${plan.id}.png" download="الخطة-الدراسية-${esc(plan.title.replace(/ /g, "-"))}.png">صورة للجوال</a>
      <a class="btn o" href="plans/${plan.id}.pdf" download="الخطة-الدراسية-${esc(plan.title.replace(/ /g, "-"))}.pdf">ملف PDF</a></div>
    <div class="pview" role="tablist"><button type="button" role="tab" data-v="sem" aria-selected="${view === "sem"}">فصل بفصل</button><button type="button" role="tab" data-v="map" aria-selected="${view === "map"}">خريطة المتطلبات</button></div>
    <div id="vsem"${view === "sem" ? "" : " hidden"}>
      <p class="phint">طريقك للتخرج فصل بفصل: سجّل مواد كل فصل بالترتيب، وتحت كل مادة مكتوب وش تحتاج قبلها.</p>
      <ol class="psem">${semHtml(plan)}</ol>
    </div>
    <div id="vmap"${view === "map" ? "" : " hidden"}>
    <p class="phint">كل عمود مرحلة: ما تقدر تاخذ المادة إلا بعد ما تخلص المواد اللي قبلها في الخط. اضغط على أي مادة يبين لك وش تحتاج قبلها ووش تفتح لك بعدها.</p>
    <ul class="plegend">${["p","u","f","c","t","e"].filter(k => cur.nodes.some(n => n.kind === k)).map(k => `<li><i class="k-${k}"></i>${KIND[k]}</li>`).join("")}<li><i class="or"></i>متطلب بديل (أو)</li></ul>
    <div class="pscroll" tabindex="0" aria-label="خريطة المواد، اسحب يمين ويسار">
      <div class="pmap" style="--n:${cur.cols.length}">
        <svg class="plines" aria-hidden="true"></svg>
        ${cur.cols.map((col, i) => `<div class="pcol"><div class="pst">${i ? "المرحلة " + i : "البداية"}</div><div class="pnodes">${col.map(n =>
          `<button type="button" class="pn k-${n.kind}" data-c="${esc(n.code)}" aria-label="${esc(n.code + " " + C[n.code][0])}"><b dir="ltr">${esc(n.code)}</b><small>${C[n.code][2] ? C[n.code][2] + " س.م" : "تمهيدي"}</small></button>`).join("")}</div></div>`).join("")}
      </div>
    </div>
    <p class="pmore" hidden>اسحب الخريطة لليسار عشان تشوف باقي المراحل ←</p>
    <div class="pinfo" id="pinfo" aria-live="polite"><p class="pempty">اختار مادة من الخريطة عشان تشوف تفاصيلها.</p></div>
    </div>
    <div class="pextra">
      <section><h3>تقدر تاخذها من أول فصل</h3><p>متطلبات جامعة إجبارية بدون متطلب سابق.</p><ul class="pchips">${plan.free.map(c => chip([c, ""])).join("")}</ul></section>
      <section><h3>اختياري جامعة <small>3 ساعات</small></h3><p>تختار مادة وحدة من هذي.</p><ul class="pchips">${plan.ue.map(chip).join("")}</ul></section>
      <section><h3>اختياري كلية <small>${plan.fe.hrs} ساعات</small></h3>${plan.fe.note ? `<p>${esc(plan.fe.note)}</p>` : ""}<ul class="pchips">${plan.fe.list.map(chip).join("")}</ul></section>
    </div>
    <p class="psrc">المصدر: <a href="${esc(plan.src)}" target="_blank" rel="noopener">${esc(plan.srcNote)}</a> من موقع الجامعة العربية المفتوحة، وتوزيع الفصول ${esc(plan.semNote)}. تقدر تغيّر الترتيب حسب المطروح كل فصل، بس لازم تخلص المتطلب قبل المادة. الأسماء العربية ترجمة تقريبية؛ تأكد من مرشدك الأكاديمي قبل التسجيل.</p>`;
  $p("pbody").querySelectorAll(".pview button").forEach(b => b.onclick = () => {
    view = b.dataset.v;
    $p("pbody").querySelectorAll(".pview button").forEach(x => x.setAttribute("aria-selected", x === b));
    $p("vsem").hidden = view !== "sem"; $p("vmap").hidden = view !== "map";
    requestAnimationFrame(draw);
  });
  $p("pbody").querySelectorAll(".pn").forEach(b => b.onclick = () => pick(b.dataset.c === sel ? null : b.dataset.c));
  $p("pbody").querySelectorAll(".pchip").forEach(b => b.onclick = () => info(b.dataset.info));
  requestAnimationFrame(draw);
}

const $p = id => document.getElementById(id);

function draw() {
  if (!cur) return;
  const map = root.querySelector(".pmap"), svg = root.querySelector(".plines");
  if (!map || !map.offsetParent) return;
  const box = map.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.setAttribute("width", box.width); svg.setAttribute("height", box.height);
  const el = c => map.querySelector(`.pn[data-c="${CSS.escape(c)}"]`).getBoundingClientRect();
  links = {};
  svg.innerHTML = cur.nodes.flatMap(n => n.groups.flatMap(g => g.filter(p => cur.by[p]).map(p => {
    const a = el(p), b = el(n.code), rtl = b.left < a.left;
    const x1 = (rtl ? a.left : a.right) - box.left, y1 = a.top + a.height / 2 - box.top;
    const x2 = (rtl ? b.right : b.left) - box.left, y2 = b.top + b.height / 2 - box.top;
    const mx = (x1 + x2) / 2;
    return `<path data-from="${esc(p)}" data-to="${esc(n.code)}" class="${g.length > 1 ? "or" : ""}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
  }))).join("");
  const sc = root.querySelector(".pscroll");
  root.querySelector(".pmore").hidden = sc.scrollWidth <= sc.clientWidth + 1;
  if (sel) pick(sel, true);
}

function walk(code, dir, out = new Set()) {
  cur.by[code][dir].forEach(c => { if (!out.has(c)) { out.add(c); walk(c, dir, out); } });
  return out;
}

function pick(code, keep) {
  sel = code;
  const map = root.querySelector(".pmap");
  map.classList.toggle("focus", !!code);
  const up = code ? walk(code, "parents") : new Set(), down = code ? walk(code, "kids") : new Set();
  map.querySelectorAll(".pn").forEach(b => {
    const c = b.dataset.c;
    b.classList.toggle("on", c === code); b.classList.toggle("up", up.has(c)); b.classList.toggle("down", down.has(c));
    b.setAttribute("aria-pressed", c === code);
  });
  map.querySelectorAll(".plines path").forEach(l => {
    const f = l.dataset.from, t = l.dataset.to;
    l.classList.toggle("up", (t === code || up.has(t)) && up.has(f));
    l.classList.toggle("down", (f === code || down.has(f)) && down.has(t));
  });
  if (keep) return;
  if (code) info(code); else $p("pinfo").innerHTML = `<p class="pempty">اختار مادة من الخريطة عشان تشوف تفاصيلها.</p>`;
}

function info(code) {
  const [en, ar, hrs, eq] = C[code];
  const node = cur.by[code];
  const row = node ? cur.plan.map.find(r => r[0] === code) : [cur.plan.fe.list, cur.plan.ue].flat().find(r => r[0] === code);
  const pre = row ? row[1] : "";
  const jump = c => cur.by[c] ? `<button type="button" class="pjump" data-c="${esc(c)}">${esc(c)}</button>` : codeTag(c);
  const preHtml = pre ? pre.split("+").map(g => g.split("|").map(jump).join(" أو ")).join(" + ") : "بدون متطلب سابق";
  const kids = node ? node.kids : [];
  const lect = typeof CONFIG !== "undefined" ? CONFIG.lectures.find(l => l.code === code || (code === "BB293" && l.code === "B293")) : null;
  const chat = typeof courseChat !== "undefined" ? courseChat[code] : null;
  $p("pinfo").innerHTML = `
    <div class="pi-h"><b class="code">${esc(code)}</b><span>${hrs ? hrs + " ساعات معتمدة" : "مستوى تمهيدي"}</span>${node ? `<span class="pk k-${node.kind}">${KIND[node.kind]}</span>` : ""}</div>
    <h3 dir="ltr">${esc(en)}</h3><p class="pi-ar">${esc(ar)}</p>
    <dl><div><dt>المتطلب السابق</dt><dd>${preHtml}</dd></div>
    ${node ? `<div><dt>تفتح لك</dt><dd>${kids.length ? kids.map(jump).join(" ") : "ما تفتح مواد ثانية في هذي الخطة"}</dd></div>` : ""}
    ${eq ? `<div><dt>يعادل في الخطة القديمة</dt><dd>${codeTag(eq)}</dd></div>` : ""}</dl>
    ${lect || chat ? `<div class="pi-go">${lect ? `<a class="go" href="${esc(lect.url)}" target="_blank" rel="noopener">محاضرة مجانية</a>` : ""}${chat ? `<a class="go chat" href="${esc(chat)}" target="_blank" rel="noopener">قروب المادة</a>` : ""}</div>` : ""}`;
  $p("pinfo").querySelectorAll(".pjump").forEach(b => b.onclick = () => {
    pick(b.dataset.c);
    root.querySelector(`.pn[data-c="${CSS.escape(b.dataset.c)}"]`).scrollIntoView({block:"nearest", inline:"center", behavior:"smooth"});
  });
}

root.innerHTML = `<div class="tabs ptabs" role="tablist">${PLANS.map((p, i) =>
  `<button type="button" role="tab" class="tab ptab" data-p="${p.id}" aria-selected="${!i}"><i style="background:${p.color}"></i>${p.title}</button>`).join("")}</div><div id="pbody"></div>`;
root.querySelectorAll(".ptab").forEach(t => t.onclick = () => { history.replaceState(null, "", "#plans/" + t.dataset.p); render(t.dataset.p); });
function fromHash() {
  const [v, sub] = location.hash.slice(1).split("/");
  if (v !== "plans") return;
  if (!cur || (sub && sub !== cur.plan.id)) render(sub); else requestAnimationFrame(draw);
}
addEventListener("hashchange", fromHash);
addEventListener("resize", () => requestAnimationFrame(draw));
document.fonts?.ready.then(() => requestAnimationFrame(draw));
render(location.hash.startsWith("#plans/") ? location.hash.split("/")[1] : PLANS[0].id);
})();
