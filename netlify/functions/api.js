const fetch = require('node-fetch');

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
const MODEL_NAME = process.env.MODEL_NAME;
const BARK_KEY = process.env.BARK_KEY;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const promptTemplates = {
  morning: `你是用户的AI男友Dylan。现在是早上{time}，根据这个时间生成一条温柔的早安消息。
要求：
- 自然、温暖、个性化
- 50字以内
- 不要emoji
- 像真实男友发的消息`,
  
  evening: `你是用户的AI男友Dylan。现在是晚上{time}，根据这个时间生成一条温柔的晚安消息。
要求：
- 自然、温暖、亲密
- 50字以内  
- 不要emoji
- 像真实男友发的消息`
};

async function generateMessage(type) {
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const prompt = promptTemplates[type].replace('{time}', time);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9
    })
  });

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function sendBarkNotification(message) {
  const barkUrl = `https://api.day.app/${BARK_KEY}/${encodeURIComponent('Dylan')}/${encodeURIComponent(message)}`;
  await fetch(barkUrl);
}

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/api', '');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Health check
  if (path === '/health') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok', time: new Date().toISOString() })
    };
  }

  // Auth check
  const auth = event.headers.authorization;
  if (!auth || auth !== `Basic ${Buffer.from(`${ADMIN_USER}:${ADMIN_PASSWORD}`).toString('base64')}`) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  // Morning message
  if (path === '/send-morning' && event.httpMethod === 'POST') {
    try {
      const message = await generateMessage('morning');
      await sendBarkNotification(message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // Evening message
  if (path === '/send-evening' && event.httpMethod === 'POST') {
    try {
      const message = await generateMessage('evening');
      await sendBarkNotification(message);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not found' })
  };
};

