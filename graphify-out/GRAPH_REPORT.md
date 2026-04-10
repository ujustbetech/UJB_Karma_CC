# Graph Report - .  (2026-04-09)

## Corpus Check
- 330 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 648 nodes · 1281 edges · 41 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `getAdminSessionSecret()` - 3 edges
2. `normalizePhone()` - 3 edges
3. `sendWhatsAppPayload()` - 3 edges
4. `sendWhatsAppTemplate()` - 3 edges
5. `sendWhatsAppText()` - 3 edges
6. `parseDobInput()` - 3 edges
7. `saveBirthdayEntry()` - 3 edges
8. `createContentPayload()` - 3 edges
9. `publishContent()` - 3 edges
10. `toNumber()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `sanitizeText()`  [INFERRED]
  app\api\verify-otp\route.js → app\api\send-birthday\route.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (2): FilePreview(), formatSize()

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (2): calculateTDS(), round2()

### Community 2 - "Community 2"
Cohesion: 0.02
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (4): getSafeImageSrc(), ModernProfilePage(), getInitials(), SlotPayoutRow()

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (2): findTitle(), usePageMeta()

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (0): 

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (13): hasAdminAccess(), normalizeRole(), createAdminSessionToken(), getAdminSessionSecret(), verifyAdminSessionToken(), POST(), sanitizeText(), ensurePrivateKey() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (6): fetchBirthdayUsersForAdmin(), getBirthdayDobInfo(), getFormattedDate(), parseDobInput(), saveBirthdayEntry(), uploadBirthdayImage()

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (4): createContentPayload(), publishContent(), saveContentDraft(), uploadContentFiles()

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 0.24
Nodes (3): buildDealDistribution(), calculateAgreedFromItem(), toNumber()

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (0): 

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (2): getSafeImageSrc(), ProfileHero()

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (2): ExpandableCard(), getInitials()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 20`** (2 nodes): `ProgressRing.js`, `ProgressRing()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `BusinessHeader.js`, `BusinessHeader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `BusinessTabs.js`, `BusinessTabs()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `ReferralLoader.js`, `ReferralLoader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `MobileBottomNav copy.js`, `MobileBottomNav()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `Stat.js`, `InfoRow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `TagList.js`, `TagList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `TableSkeleton.js`, `TableSkeleton()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `RangeInput.js`, `RangeInput()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `Toast.js`, `Toast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `LogoSection.js`, `LogoSection()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `useAutosuggest.js`, `useAutosuggest()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `contentValidation.js`, `validateContent()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `firebaseConfig.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `confirm.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `status.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `toast.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `variants.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `next.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `getAdminSessionSecret()` (e.g. with `createAdminSessionToken()` and `verifyAdminSessionToken()`) actually correct?**
  _`getAdminSessionSecret()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `normalizePhone()` (e.g. with `sendWhatsAppTemplate()` and `sendWhatsAppText()`) actually correct?**
  _`normalizePhone()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `sendWhatsAppPayload()` (e.g. with `sendWhatsAppTemplate()` and `sendWhatsAppText()`) actually correct?**
  _`sendWhatsAppPayload()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `sendWhatsAppTemplate()` (e.g. with `normalizePhone()` and `sendWhatsAppPayload()`) actually correct?**
  _`sendWhatsAppTemplate()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `sendWhatsAppText()` (e.g. with `normalizePhone()` and `sendWhatsAppPayload()`) actually correct?**
  _`sendWhatsAppText()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._