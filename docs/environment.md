# Environment Configuration

This project now validates critical environment variables through:

- `lib/config/publicEnv.js`
- `lib/config/serverEnv.js`
- `lib/config/bootstrap.js`

The app fails fast when required Firebase, JWT, WhatsApp, OpenAI, or collection-mapping variables are missing or malformed.

## Public variables

These are exposed to the browser and are required for Firebase client setup and collection-name mapping:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_COLLECTION_CONCLAVES`
- `NEXT_PUBLIC_COLLECTION_LOGIN_LOGS`
- `NEXT_PUBLIC_COLLECTION_MONTHLY_MEETING`
- `NEXT_PUBLIC_COLLECTION_PAGE_VISIT`
- `NEXT_PUBLIC_COLLECTION_REFERRAL`
- `NEXT_PUBLIC_COLLECTION_BIRTHDAY_CANVA`
- `NEXT_PUBLIC_COLLECTION_USER_DETAIL`
- `NEXT_PUBLIC_COLLECTION_PROSPECT`
- `NEXT_PUBLIC_COLLECTION_DOORSTEP`
- `NEXT_PUBLIC_COLLECTION_ORBITER`

Optional public variable:

- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## Server variables

These must stay server-only:

- `JWT_SECRET`
- `ADMIN_JWT_SECRET`
  - optional if you want admin sessions to reuse `JWT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
  - must contain a valid private key value; escaped `\n` is supported
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `OPENAI_API_KEY`

## Validation behavior

- Missing required values throw immediately from the config layer.
- `FIREBASE_PRIVATE_KEY` is checked for a valid private-key shape.
- Admin JWT uses `ADMIN_JWT_SECRET` when present, otherwise it falls back to `JWT_SECRET`.

## Example `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

NEXT_PUBLIC_COLLECTION_CONCLAVES=conclaves
NEXT_PUBLIC_COLLECTION_LOGIN_LOGS=login_history
NEXT_PUBLIC_COLLECTION_MONTHLY_MEETING=monthly_meeting
NEXT_PUBLIC_COLLECTION_PAGE_VISIT=page_visit
NEXT_PUBLIC_COLLECTION_REFERRAL=referral
NEXT_PUBLIC_COLLECTION_BIRTHDAY_CANVA=birthday_canva
NEXT_PUBLIC_COLLECTION_USER_DETAIL=usersdetail
NEXT_PUBLIC_COLLECTION_PROSPECT=prospect
NEXT_PUBLIC_COLLECTION_DOORSTEP=doorstep
NEXT_PUBLIC_COLLECTION_ORBITER=orbiter

JWT_SECRET=replace-me
ADMIN_JWT_SECRET=replace-me

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\"

WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
OPENAI_API_KEY=...
```
