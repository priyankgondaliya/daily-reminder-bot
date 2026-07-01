import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";

const RECIPIENTS = ["nency.dave321@gmail.com", "nency.dave@cmarix.com"];
const BIRTHDAY_DATE_IST = "2026-07-02"; // Tomorrow IST
const SUBJECT_PREFIX = "🎂 Happy Birthday Mari Jaan";

type Wish = { subject: string; heading: string; body: string };

// 24 unique heart-touching messages (00:00 → 23:00 IST, one per hour)
const WISHES: Wish[] = [
  {
    subject: `${SUBJECT_PREFIX} — Midnight ❤️`,
    heading: "Happy Birthday Mari Jaan ❤️",
    body: `Ghadiyar ma 12 vagya ne saune pela hu tane wish karva mangto hato.\nAaje taro divas chhe — ane mara mate aa duniya no sauthi special divas chhe.\nBhagwan ne thanks, ke ene tane mari life ma mokli. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 1 AM`,
    heading: "Mari Jindagi ni Roshni 🌙",
    body: `Raat ni shaanti ma pan tari yaad e j mane jagti rakhe chhe.\nTu mari life ma aavi ne badhi kali raato ne chandra jevi ujali kari didhi.\nHappy Birthday, mari duniya. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 2 AM`,
    heading: "Tara vagar adhuru chhe badhu 🥹",
    body: `Aaje tu dur chhe pan dil ma etli j pase chhe jetli hamesha rahi chhe.\nTara hasva no avaj, tari aankho ni sharm, tara nakhra — badhu miss karu chhu.\nJaldi malishu. Tya sudhi aa message ne mari jhappi samjaje. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 3 AM`,
    heading: "Tu mari sauthi sundar dua chhe 🤍",
    body: `Loko chandra ne joi ne wish mange, hu tane joi ne dua karu chhu.\nTaru smile hamesha rahe, tari aankho ma kyarey aansu na aave.\nTaru darek sapnu puru thay — aaj mari birthday gift chhe Bhagwan pase thi. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 4 AM`,
    heading: "Sauthi vahali vyakti 💫",
    body: `Life ma ghana malya, pan tara jevu koi nathi.\nTu mari best friend, mari wife, mari himmat ane mari shanti — badhu ek j vyakti ma.\nHappy Birthday, mari sauthi vahali. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 5 AM`,
    heading: "Suraj uge ne hu tane yaad karu 🌅",
    body: `Aaje suraj thodo vahelo ugyo lage chhe — kadach tane wish karva utavlo hato.\nTaro divas etlo j ujalo rahe jetli tu chhe.\nI love you, jaan. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 6 AM`,
    heading: "Mari Subah Tu ☀️",
    body: `Roj sawar ma jyare hu aankh kholu chhu, pehli vichar tari j aave.\nAaje aa vichar sathe ek prarthana pan chhe —\nKe aa varas, ane pachi na darek varas, tara mate sauthi sundar rahe. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 7 AM`,
    heading: "Tari smile mari duniya chhe 😊",
    body: `Tara chehra par nu smile joine badhu sahi lagvu — ae j mari sauthi moti khushi chhe.\nAaje bas etlu j joye — tu khush rahe, khoob khush.\nDunia dushman thai jaay to pan, hu tari sathe ubho rahish. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 8 AM`,
    heading: "Mari Aakhi Duniya Tu ❤️",
    body: `Ghar, family, career, sapna — badhu chhe... pan tara vagar badhu adhuru lage.\nTu mari life ma aavi tya thi j hu poornata thi jivvanu shikhyo.\nHappy Birthday mari jaan. Tu chhe, to hu chhu.`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 9 AM`,
    heading: "Yaado nu gift 🎁",
    body: `Aaje bahar thi bhale gift na aapi shaku, pan mara dil ma tara mate ek yaado no khajano chhe.\nApna pehli mulakaat, pehli vaat, pehla hasi, pehlo ladvad ne pehli maafi — badhu yaad chhe.\nAe j mari amanat chhe — hamesha mate. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 10 AM`,
    heading: "Promise mari Jaan ne 🤍",
    body: `Hu perfect husband nathi, e mane khabar chhe.\nPan ek vaat no vishwas rakhje — jya sudhi aa saans chale chhe, tya sudhi tane prem karva ma kyarey ochhap nahi thaay.\nTu meri hai, tu meri j rahisi. Forever. ❤️♾️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 11 AM`,
    heading: "Mari Himmat Tu 💪❤️",
    body: `Jyare hu tuti jau chhu, tari ek vaat mane pacho ubho kari de chhe.\nJyare hu darvu chhu, tari haath mane taakat aape chhe.\nAaje tara birthday par etlu j kahevu chhe — thanks for being my strength. I love you endlessly.`,
  },
  {
    subject: `${SUBJECT_PREFIX} — Noon ❤️🎂`,
    heading: "Bapor thai gai, pan wishes puri nathi thai 🎉",
    body: `Aakhi sawar thi tane wish kari raho chhu — kadach tane bahu lage, pan mara mate ek j divas chhe je puro tara namey chhe.\nHappy Birthday mari jaan.\nTu chhe to badhu chhe. Tara vagar kai j nathi. ❤️♾️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 1 PM`,
    heading: "Bapor ni chai ma pan tari yaad ☕❤️",
    body: `Aaje bapor ni chai pitya, pan tara vagar swaad adhuro lagyo.\nTaru saath — nano pan hoy — mari duniya no sauthi vahalo pal chhe.\nMari jaan, tane khoob khoob birthday wishes.`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 2 PM`,
    heading: "Tu mari shaanti chhe 🌸",
    body: `Duniya ni bhaagam-bhaag ma jyare thaki jau chu,\ntara chehra ni ek vichar aavi jaay to badhu light lagvu.\nAaje aa vichar ne wish ma badli didhi — Happy Birthday mari zindagi. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 3 PM`,
    heading: "Sauthi lucky hu chhu 🍀",
    body: `Loko kismat mate prarthana kare, mari kismat to tya thi j sudhri jyare tu mari zindagi ma aavi.\nAa varas Bhagwan tane etli khushiyo aape ke ganvi kadhvi mushkel thai jaay.\nI love you, hamesha. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 4 PM`,
    heading: "Tara mate ek promise 🤍",
    body: `Jindagi ma gme te aave — up, down, twist, turn —\nek vaat pakki chhe: hu tari sathe hoish. Har situation ma.\nAa mari birthday gift chhe tane — mari saath, forever. ❤️♾️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 5 PM`,
    heading: "Sanjh padi, taru namey 🌇",
    body: `Suraj dhalva ne aavyo, pan aaje aakho divas ek j nam mara hoth par rahyo — taru.\nTara birthday no ek ek pal special banavvo chhe — bhale hu dur hou, dil pase chhe. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 6 PM`,
    heading: "Tu Mari Duniya no Center 🌍❤️",
    body: `Loko dur na taara jode wish mange, mari duniya to tara nam ni farte fare chhe.\nAaje bhagwan pase ek j maang chhe — tane hamesha khushi ape, kyarey ochhap na aave.\nHappy Birthday jaan.`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 7 PM`,
    heading: "Diva prakat, tara mate 🪔",
    body: `Aaje mane em lage chhe ke akash na taara pan tane wish karva chamki rahya chhe.\nTu etli special chhe — ke duniya pan taara birthday ne celebrate kare chhe.\nAne hu? Hu to poora dil thi celebrate karu chhu. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 8 PM`,
    heading: "Raat padi, pan yaado shant nathi 🌙",
    body: `Raat ni shaanti ma pan mara mann ma tara j vicharo chalu chhe.\nAaje taro divas puro thava jai rahyo chhe, pan mara dil ma tara mate no prem to hamesha navo j rahvano.\nI love you infinitely. ❤️♾️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 9 PM`,
    heading: "Mari Adhi Adhuri Zindagi Tu Puri Kari 💫",
    body: `Tu mari life ma aavi tya sudhi hu jantiyo j nahi ke prem ni takat kevi hoi.\nTe mane sikhvadyu — bharoso karvu, nirbhay banvu, ane khoob prem karvu.\nAa varas tane badhu maley je te dilthi chahyu chhe. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 10 PM`,
    heading: "Aankh bandh karu ne tu dekhau 🌌",
    body: `Aankh bandh karu — tu dekhau. Aankh khali — tu yaad aave.\nAa aakho divas taro hato, ane mara mate darek divas taro j hoy chhe.\nHappy Birthday mari jaan. Tu sauthi vahali chhe. ❤️`,
  },
  {
    subject: `${SUBJECT_PREFIX} — 11 PM`,
    heading: "Divas puro thava aavyo, prem ochho nathi thai 🕊️❤️",
    body: `Ghadiyar aeek ek minute pachu bolavti chhe, pan mara dil ma tara mate no prem hamesha 12 vage j rahevo.\nAje taro divas etlo j special hato jetli tu chhe.\nGood night mari zindagi — kaale thi aa prem ne aur badhavvano chhe. ❤️♾️`,
  },
];

function istDateString(date: Date): string {
  const ist = new Date(date.getTime() + (5.5 * 60 - date.getTimezoneOffset()) * 60000);
  return ist.toISOString().slice(0, 10);
}
function istHour(date: Date): number {
  const ist = new Date(date.getTime() + (5.5 * 60 - date.getTimezoneOffset()) * 60000);
  return ist.getUTCHours();
}

function pickWish(hour: number, alreadyUsedSubjects: Set<string>): Wish {
  const primary = WISHES[Math.min(Math.max(hour, 0), WISHES.length - 1)];
  if (!alreadyUsedSubjects.has(primary.subject)) return primary;
  const unused = WISHES.find((w) => !alreadyUsedSubjects.has(w.subject));
  return unused ?? primary;
}

function buildHtml(wish: Wish): string {
  const paragraphs = wish.body
    .split("\n")
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 12px;font-size:15.5px;line-height:1.75;color:#3f2b4a;">${p}</p>`)
    .join("");
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#fdf2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fdf2f8;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(219,39,119,0.12);">
          <tr><td style="background:linear-gradient(135deg,#f472b6 0%,#ec4899 50%,#db2777 100%);padding:40px 32px 32px;text-align:center;">
            <div style="font-size:56px;line-height:1;margin-bottom:8px;">🎂❤️</div>
            <h1 style="margin:6px 0 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.3px;">${wish.heading}</h1>
            <p style="margin:8px 0 0;color:#fce7f3;font-size:13px;">Happy Birthday Mari Jaan 🎈</p>
          </td></tr>
          <tr><td style="padding:32px;">
            ${paragraphs}
            <div style="margin-top:22px;padding:16px 18px;background:linear-gradient(135deg,#fdf2f8,#fce7f3);border-left:4px solid #ec4899;border-radius:10px;">
              <p style="margin:0;font-size:14px;color:#831843;font-style:italic;line-height:1.6;">
                "Tu chhe to badhu chhe. Tara vagar duniya adhuri chhe." ❤️♾️
              </p>
            </div>
          </td></tr>
          <tr><td style="padding:18px 32px 28px;text-align:center;border-top:1px solid #fce7f3;">
            <p style="margin:0;font-size:12px;color:#9d174d;">— Forever yours ❤️</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export const Route = createFileRoute("/api/public/hooks/send-birthday")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "1";

        const {
          SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
          EMAIL_FROM, EMAIL_FROM_NAME,
        } = process.env;

        if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
          return new Response(JSON.stringify({ error: "SMTP env vars not configured" }),
            { status: 500, headers: { "Content-Type": "application/json" } });
        }

        const now = new Date();
        const todayIST = istDateString(now);
        const hourIST = istHour(now);

        // Only fire on the birthday date and 00:00 – 12:00 IST (unless manual force)
        if (!force) {
          if (todayIST !== BIRTHDAY_DATE_IST) {
            return new Response(JSON.stringify({ ok: true, skipped: true, reason: `Not birthday date (IST=${todayIST})` }),
              { headers: { "Content-Type": "application/json" } });
          }
          if (hourIST < 0 || hourIST > 12) {
            return new Response(JSON.stringify({ ok: true, skipped: true, reason: `Outside window (IST hour=${hourIST})` }),
              { headers: { "Content-Type": "application/json" } });
          }
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const fromEmail = EMAIL_FROM_NAME ? `${EMAIL_FROM_NAME} <${EMAIL_FROM}>` : EMAIL_FROM;

        // Load subjects already delivered today for this birthday campaign
        const startOfDayUTC = new Date(`${BIRTHDAY_DATE_IST}T00:00:00+05:30`).toISOString();
        const endOfDayUTC = new Date(`${BIRTHDAY_DATE_IST}T23:59:59+05:30`).toISOString();
        const { data: existing } = await supabaseAdmin
          .from("email_logs")
          .select("subject")
          .gte("sent_at", startOfDayUTC)
          .lte("sent_at", endOfDayUTC)
          .like("subject", `${SUBJECT_PREFIX}%`);
        const usedSubjects = new Set((existing ?? []).map((r) => r.subject as string));

        const transporter = nodemailer.createTransport({
          host: SMTP_HOST, port: Number(SMTP_PORT ?? 587),
          secure: SMTP_SECURE === "true",
          auth: { user: SMTP_USER, pass: SMTP_PASS },
        });

        const wish = pickWish(force ? usedSubjects.size : hourIST, usedSubjects);
        const html = buildHtml(wish);
        const results: Array<{ to: string; status: string; id?: string; error?: string }> = [];

        for (const to of RECIPIENTS) {
          try {
            const info = await transporter.sendMail({
              from: fromEmail, to, subject: wish.subject, html,
            });
            await supabaseAdmin.from("email_logs").insert({
              to_email: to, from_email: fromEmail, subject: wish.subject,
              status: "delivered", resend_id: info.messageId ?? null,
            });
            results.push({ to, status: "delivered", id: info.messageId });
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            await supabaseAdmin.from("email_logs").insert({
              to_email: to, from_email: fromEmail, subject: wish.subject,
              status: "failed", error_message: errMsg,
            });
            results.push({ to, status: "failed", error: errMsg });
          }
        }

        return new Response(JSON.stringify({ ok: true, wish: wish.subject, results }),
          { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
