const profiles = [
  {
    genshin: true, // 原神
    honkai_star_rail: true, // 星穹鐵道
    zenless_zone_zero: false, // 絕區零
    honkai_3: false, // 崩壞3rd
    tears_of_themis: false, // 未定事件簿
    accountName: '你的名字',
    token: 'ltoken_v2=gBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxCY; ltuid_v2=26XXXXX20;'
  }
];

const discordNotify = true;
const myDiscordID = '0000000000000000000';
const discordWebhookURL = 'https://discord.com/api/webhooks/';

const urlDict = [
  'https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=zh-tw&act_id=e202102251931481', // Genshin
  'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=zh-tw&act_id=e202303301540311', // Honkai Star Rail
  'https://sg-public-api.hoyolab.com/event/mani/sign?lang=zh-tw&act_id=e202110291205111', // Honkai 3rd
  'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=zh-tw&act_id=e202308141137581', // Tears of Themis
  'https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?lang=zh-tw&act_id=e202406031448091' // Zenless Zone Zero
];

const headerDict = {
  default: {
    'accept': 'application/json, text/plain, */*',
    'accept-encoding': 'gzip, deflate, br',
    'connection': 'keep-alive',
    'x-rpc-app_version': '2.34.1',
    'x-rpc-client_type': '4',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'referer': 'https://act.hoyolab.com/',
    'origin': 'https://act.hoyolab.com'
  },
  zenless_zone_zero: {
    'x-rpc-signgame': 'zzz'
  }
};

async function autoSign({ token: cookie, genshin, honkai_star_rail, honkai_3, tears_of_themis, zenless_zone_zero, accountName }) {
  const urlsnheaders = [];
  const message = [`**Check-in completed for __${accountName}__**`];

  if (genshin) urlsnheaders.push([urlDict[0], { cookie, ...headerDict.default }]);
  if (honkai_star_rail) urlsnheaders.push([urlDict[1], { cookie, ...headerDict.default }]);
  if (honkai_3) urlsnheaders.push([urlDict[2], { cookie, ...headerDict.default }]);
  if (tears_of_themis) urlsnheaders.push([urlDict[3], { cookie, ...headerDict.default }]);
  if (zenless_zone_zero) urlsnheaders.push([urlDict[4], { cookie, ...headerDict.default, ...headerDict.zenless_zone_zero }]);

  for (const [url, headers] of urlsnheaders) {
    try {
      const response = await fetch(url, { method: 'POST', headers });
      if (!response.ok) throw new Error(response.statusText);

      const jsonData = await response.json();
      const isBanned = jsonData.data?.gt_result?.is_risk;
      const gameName = url === urlDict[0] ?
        '原神' :
        url === urlDict[1] ?
        '星穹鐵道' :
        url === urlDict[2] ?
        '崩壞3rd' :
        url === urlDict[3] ?
        '未定事件簿' :
        url === urlDict[4] ?
        '絕區零' :
        null;

      if (isBanned) {
        message.push(`> __${gameName}__: Auto check-in failed due to CAPTCHA blocking.`);
      } else {
        message.push(`> __${gameName}__: ${jsonData.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(error);
    }
  }

  return message.join('\n') + `\n-# *<@${myDiscordID || 0}>*`;
}

const postWebhook = async (content) => fetch(discordWebhookURL, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    username: 'auto-sign',
    avatar_url: 'https://i.imgur.com/LI1D4hP.png',
    content
  })
});

// Main engine
(async () => {
  while (true) {
    const messages = await Promise.all(profiles.map(autoSign));
    for (const m of messages) {
      if (discordNotify && discordWebhookURL) {
        await postWebhook(m);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.log(m); // Normal debug
      }
    }

    // Print to console
    const date = new Date();
    const ss = String(date.getSeconds()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    console.log(`[${hh}:${mm}:${ss}] Auto sign operation completed.`);

    // Waiting to check in the next day
    await new Promise((resolve) => setTimeout(resolve, 24 * 60 * 60 * 1000));
  }
})();
