# Separate Firebase Environments Guide

This document explains the recommended way to manage Firebase across the three standard stages:

- development
- staging
- production

## Recommended Approach

Use:

- one shared codebase
- three separate Firebase projects
- environment variables to switch configuration

This is better than keeping all stages inside one Firebase project with collection names like `Referraldev`, `MonthlyMeeting_dev`, or `Conclaves_dev`.

## Why Separate Firebase Projects Are Better

Using a dedicated Firebase project for each stage gives you:

- safer isolation between environments
- lower risk of accidentally writing test data into production
- cleaner security rules and auth settings
- easier debugging and rollback
- cleaner storage buckets and Firestore data
- simpler mental model for the team

## Recommended Stage Layout

Use one Firebase project per stage:

| Stage | Firebase Project Purpose |
| --- | --- |
| `development` | local development, experiments, incomplete features, test data |
| `staging` | QA, UAT, pre-release validation, realistic testing |
| `production` | live users and real business data |

## What To Keep the Same in Code

The code should use stable logical names such as:

- `COLLECTIONS.userDetail`
- `COLLECTIONS.referral`
- `COLLECTIONS.prospect`
- `COLLECTIONS.monthlyMeeting`
- `COLLECTIONS.conclaves`

The application code should not know whether it is talking to dev, staging, or prod beyond environment configuration.

## What To Avoid

Avoid these patterns:

- hardcoded collection names scattered across the codebase
- mixing `COLLECTIONS.referral` with hardcoded names like `Referral`, `Referraldev`, and `referrals`
- suffixing collections with `_dev` or `_staging` when a separate Firebase project can solve the problem
- using one Firebase project for all stages unless there is a strong external constraint

## Best Practice Configuration Pattern

Create a single centralized configuration layer for:

- Firebase project config
- collection names
- storage bucket names
- optional environment flags

## Example Environment Files

Recommended env files:

- `.env.development`
- `.env.staging`
- `.env.production`

Example values:

```env
# .env.development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-dev-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_COLLECTION_USER_DETAIL=userdetails
NEXT_PUBLIC_COLLECTION_REFERRAL=referrals
NEXT_PUBLIC_COLLECTION_PROSPECT=prospects
NEXT_PUBLIC_COLLECTION_MONTHLY_MEETING=monthlyMeetings
NEXT_PUBLIC_COLLECTION_CONCLAVES=conclaves
NEXT_PUBLIC_COLLECTION_BIRTHDAY_CANVA=birthdayCanva
```

```env
# .env.staging
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-staging-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_COLLECTION_USER_DETAIL=userdetails
NEXT_PUBLIC_COLLECTION_REFERRAL=referrals
NEXT_PUBLIC_COLLECTION_PROSPECT=prospects
NEXT_PUBLIC_COLLECTION_MONTHLY_MEETING=monthlyMeetings
NEXT_PUBLIC_COLLECTION_CONCLAVES=conclaves
NEXT_PUBLIC_COLLECTION_BIRTHDAY_CANVA=birthdayCanva
```

```env
# .env.production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-prod-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

NEXT_PUBLIC_COLLECTION_USER_DETAIL=userdetails
NEXT_PUBLIC_COLLECTION_REFERRAL=referrals
NEXT_PUBLIC_COLLECTION_PROSPECT=prospects
NEXT_PUBLIC_COLLECTION_MONTHLY_MEETING=monthlyMeetings
NEXT_PUBLIC_COLLECTION_CONCLAVES=conclaves
NEXT_PUBLIC_COLLECTION_BIRTHDAY_CANVA=birthdayCanva
```

## Example Centralized Firebase Config

```js
// lib/env.js
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "development";

export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

```js
// lib/collections.js
export const COLLECTIONS = {
  userDetail: process.env.NEXT_PUBLIC_COLLECTION_USER_DETAIL,
  referral: process.env.NEXT_PUBLIC_COLLECTION_REFERRAL,
  prospect: process.env.NEXT_PUBLIC_COLLECTION_PROSPECT,
  monthlyMeeting: process.env.NEXT_PUBLIC_COLLECTION_MONTHLY_MEETING,
  conclaves: process.env.NEXT_PUBLIC_COLLECTION_CONCLAVES,
  birthdayCanva: process.env.NEXT_PUBLIC_COLLECTION_BIRTHDAY_CANVA,
};
```

```js
// usage
import { collection } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { COLLECTIONS } from "@/lib/collections";

const referralCollection = collection(db, COLLECTIONS.referral);
```

## Naming Strategy Recommendation

Use the same logical collection names in every stage.

Good:

- `userdetails`
- `referrals`
- `prospects`
- `monthlyMeetings`
- `conclaves`

Avoid stage-specific collection names:

- `Referraldev`
- `Referral_prod`
- `MonthlyMeeting_dev`
- `Conclaves_dev`

The environment should change the Firebase project, not the business naming model.

## Migration Recommendation for This Codebase

For this repository, the safest cleanup direction is:

1. Create three Firebase projects:
   - dev
   - staging
   - prod

2. Centralize all collection names behind one shared `COLLECTIONS` file.

3. Remove hardcoded collection names from feature code wherever possible.

4. Consolidate duplicate names such as:
   - `COLLECTIONS.userDetail`
   - `usersdetail`
   - `usersDetail`
   - `UsersData`
   - `Prospects`
   - `COLLECTIONS.prospect`
   - `Referral`
   - `Referraldev`
   - `referrals`
   - `COLLECTIONS.referral`

5. Keep dev/demo data in the dev Firebase project instead of using `_dev` suffixed collections.

## Ideal Outcome

After cleanup, the app should behave like this:

- local development connects only to the dev Firebase project
- staging deployment connects only to the staging Firebase project
- production deployment connects only to the production Firebase project
- the code references the same logical collection names in every stage
- no developer needs to remember special `_dev` collection names

## Short Rule of Thumb

Use different Firebase projects for different stages.

Do not use different collection names for different stages unless you are forced to.
