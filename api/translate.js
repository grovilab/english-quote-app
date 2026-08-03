// DeepL 번역 프록시. RN 앱은 이 엔드포인트만 호출하고, DeepL 키는 절대 알지 못한다.
module.exports = async function handler(req, res) {
  // RN 앱(다른 origin)에서 호출할 수 있도록 CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET 요청만 지원합니다.' });
    return;
  }

  const { text } = req.query;

  if (!text) {
    res.status(400).json({ error: 'text 쿼리 파라미터가 필요합니다. 예: /api/translate?text=Hello' });
    return;
  }

  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: '서버에 DEEPL_API_KEY 환경변수가 설정되어 있지 않습니다.' });
    return;
  }

  try {
    const deeplResponse = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        source_lang: 'EN',
        target_lang: 'KO',
      }),
    });

    if (!deeplResponse.ok) {
      const detail = await deeplResponse.text();
      res.status(deeplResponse.status).json({ error: 'DeepL 요청이 실패했습니다.', detail });
      return;
    }

    const data = await deeplResponse.json();
    const translated = data.translations?.[0]?.text ?? '';

    res.status(200).json({ translated });
  } catch (err) {
    res.status(500).json({ error: '번역 중 오류가 발생했습니다.', detail: err.message });
  }
};
