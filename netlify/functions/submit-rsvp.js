const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const GUEST_LIST_TAB  = 'guest_list';
const RSVPS_TAB       = 'rsvps';

async function getSheets(readonly = false) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: readonly
      ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
      : ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
  }

  try {
    // Re-validate email against guest list before writing
    const sheets = await getSheets(false);
    const listRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${GUEST_LIST_TAB}!A:D`,
    });

    const rows = listRes.data.values || [];
    const match = rows.slice(1).find(
      row => (row[0] || '').trim().toLowerCase() === email
    );

    if (!match) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Email not found on guest list' }),
      };
    }

    const plusOneAllowed   = (match[2] || '').toUpperCase() === 'TRUE';
    const childrenAllowed  = (match[3] || '').toUpperCase() === 'TRUE';
    const guestName        = match[1] || 'Guest';

    // Build the row to append
    const now = new Date().toISOString();
    const row = [
      now,                                                     // timestamp
      email,                                                   // email
      guestName,                                               // guest_name
      body.attending || '',                                    // attending
      body.meal || '',                                         // meal
      plusOneAllowed   ? (body.plus_one_name || '')   : '',   // plus_one_name
      plusOneAllowed   ? (body.plus_one_meal || '')   : '',   // plus_one_meal
      childrenAllowed  ? (body.children_count || '0') : '',   // children_count
      childrenAllowed  ? (body.children_meal || '')   : '',   // children_meal
      body.dietary_restrictions || '',                         // dietary_restrictions
      body.song_request || '',                                 // song_request
      body.message || '',                                      // message
      now,                                                     // updated_at
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${RSVPS_TAB}!A:M`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, attending: body.attending }),
    };
  } catch (err) {
    console.error('submit-rsvp error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error. Please try again.' }),
    };
  }
};
