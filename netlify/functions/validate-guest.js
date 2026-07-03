const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GUEST_LIST_TAB  = 'guest_list';

async function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const email = (event.queryStringParameters?.email || '').trim().toLowerCase();
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
  }

  try {
    const sheets = await getSheets();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${GUEST_LIST_TAB}!A:D`,
    });

    const rows = res.data.values || [];
    if (rows.length < 2) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Guest list is empty' }) };
    }

    // Row 0 is the header: email | name | plus_one_allowed | children_allowed
    const match = rows.slice(1).find(
      row => (row[0] || '').trim().toLowerCase() === email
    );

    if (!match) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: "We couldn't find that email on our guest list. Please double-check or contact us.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        name:               match[1] || 'Guest',
        plus_one_allowed:   (match[2] || '').toUpperCase() === 'TRUE',
        children_allowed:   (match[3] || '').toUpperCase() === 'TRUE',
      }),
    };
  } catch (err) {
    console.error('validate-guest error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error. Please try again.' }),
    };
  }
};
