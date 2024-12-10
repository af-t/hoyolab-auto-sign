const profiles = [
  {
    gi: true, //Genshin
    hsr: true, //Honkai Star rail
    zzz: true, //Zenless Zone Zero
    h3: true, //Honkai 3
    tot: false, // Tears Of Themis
    accountName: 'Custom_name',
    token: 'ltoken_v2=v2_CAISDxxxxxxLL0 ; ltuid_v2=000000000;'
  },

];
const telegramNotify = true;
const myTelegramID = '1xxxxxxx0';
const telegramBotToken = '';


const urlDict = [
  'https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=en-us&act_id=e202102251931481', // Genshin
  'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202303301540311', //Hsr
  'https://sg-public-api.hoyolab.com/event/mani/sign?lang=en-us&act_id=e202110291205111', // Honkai 3
  'https://sg-public-api.hoyolab.com/event/luna/os/sign?lang=en-us&act_id=e202308141137581', // T o t
  'https://sg-public-api.hoyolab.com/event/luna/zzz/os/sign?lang=en-us&act_id=e202406031448091' //Zzz
];

const headerDict = {
  default: {
    'accept': 'application/json, text/plain, */*',
    'accept-encoding': 'gzip, deflate, br',
    'connection': 'keep-alive',
    'x-rpc-app_version': '2.34.1',
    'x-rpc-client_type': '4',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36',
    'referer': 'https://act.hoyolab.com/',
    'origin': 'https://act.hoyolab.com'
  },
  gi: {

  },
  hsr: {

  },
  h3: {

  },
  tot: {

  },
  zzz: {
    'x-rpc-signgame': 'zzz'
  }
};

async function autoSign({
  token: cookie, gi,
  tot, zzz, h3, hsr,
  accountName
}) {
  const urlsnheaders = [];
  const message = [`**Check-in completed for __${accountName}__**`];

  if (gi) urlsnheaders.push([urlDict[0], { cookie, ...headerDict.default, ...headerDict.gi }]);
  if (hsr) urlsnheaders.push([urlDict[1], { cookie, ...headerDict.default, ...headerDict.hsr }]);
  if (h3) urlsnheaders.push([urlDict[2], { cookie, ...headerDict.default, ...headerDict.h3 }]);
  if (tot) urlsnheaders.push([urlDict[3], { cookie, ...headerDict.default, ...headerDict.tot }]);
  if (zzz) urlsnheaders.push([urlDict[4], { cookie, ...headerDict.default, ...headerDict.zzz }])

  for (const [url, headers] of urlsnheaders) try {
    const response = await fetch(url, { method: 'POST', headers });
    if (!response.ok) throw Error(response.statusText);

    const jsonData = await response.json();
    const isBanned = jsonData.data?.gt_result?.is_risk;
    const gameName = url === urlDict[0] ?
      'Genshin Impact' :
      url === urlDict[1] ?
      'Honkai: Star Rail' :
      url === urlDict[2] ?
      'Honkai Impact 3rd' :
      url === urlDict[3] ?
      'Tears of Themis' :
      url === urlDict[4] ?
      'Zenless Zone Zero' :
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

  return message.join('\n') + `\n-# *<@${myTelegramID || 0}>*`;
}

const postWebhook = async(content) => fetch(telegramBotToken, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    chat_id: myTelegramID,
    text: content,
    parse_mode: 'HTML'
  })
});

// Main engine
(async() => {
  while (true) {
    const messages = await Promise.all(profiles.map(autoSign));
    for (const m of messages) if (telegramNotify && telegramBotToken && myTelegramID) {
      await postWebhook(m);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else {
      console.log(m); // normal debug
    }

    // Print to console
    const date = new Date();
    const ss = String(date.getSeconds()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    console.log(`[${hh}:${mm}:${ss}] Auto sign operation completed.`);

    // waiting to check in the next day
    await new Promise((resolve) => setTimeout(resolve, 24 * 60 * 60000));
  }
})();
