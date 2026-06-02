# InviSend — Premium Digital Wedding Invitation Platform

A luxury digital wedding invitation SaaS system built with Vanilla HTML, CSS, JavaScript and Supabase.

---

## File Structure

```
invisend/
├── landing.html          Public landing page (share this with clients)
├── index.html            Admin dashboard (password protected)
├── invite.html           Guest invitation page
├── assets/
│   ├── logo.png          InviSend logo
│   └── hero-bg.jpg       Landing page hero image
├── css/
│   ├── admin.css         Dashboard styles
│   └── invite.css        Invitation page styles (all themes)
├── js/
│   ├── config.js         ← EDIT THIS to change Supabase project
│   └── supabase.js       Supabase client and API helpers
└── README.md
```

---

## Quick Deploy — Netlify (30 seconds)

1. Extract the zip
2. Go to https://app.netlify.com/drop
3. Drag the `invisend/` **folder** onto the page
4. Your site is live

**Your URLs:**

| Page | URL |
|---|---|
| Landing page | `https://your-site.netlify.app/landing.html` |
| Admin dashboard | `https://your-site.netlify.app/index.html` |
| Guest invitation | `https://your-site.netlify.app/invite.html?slug=xxx` |

---

## Deploy to GitHub + Netlify (Recommended for updates)

### Step 1 — Create GitHub repository

1. Go to https://github.com/new
2. Repository name: `invisend`
3. Set to **Private**
4. Click **Create repository**

### Step 2 — Upload files

**Option A — GitHub web interface (no terminal needed):**
1. Open your new repository
2. Click **Add file → Upload files**
3. Drag all files from the `invisend/` folder
4. Click **Commit changes**

**Option B — Git terminal:**
```bash
git init
git add .
git commit -m "Initial InviSend deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/invisend.git
git push -u origin main
```

### Step 3 — Connect Netlify to GitHub

1. Go to https://app.netlify.com
2. Click **Add new site → Import an existing project**
3. Choose **GitHub** and select your `invisend` repository
4. Build settings: leave everything blank (no build command needed)
5. Click **Deploy site**

### Step 4 — Future updates

Every time you push to GitHub, Netlify redeploys automatically:
```bash
git add .
git commit -m "Update description"
git push
```

---

## Supabase Setup

### Step 1 — Run SQL (copy into SQL Editor → Run)

```sql
-- Invitations table
CREATE TABLE invitations (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug                 TEXT UNIQUE NOT NULL,
  template_id          INTEGER DEFAULT 1 CHECK (template_id IN (1,2,3,4)),
  status               TEXT DEFAULT 'live' CHECK (status IN ('live','expired','paused')),
  view_count           INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  expiry_date          TIMESTAMPTZ,
  couple_name          TEXT NOT NULL,
  bride_father         TEXT,
  bride_mother         TEXT,
  groom_father         TEXT,
  groom_mother         TEXT,
  wedding_date         TIMESTAMPTZ NOT NULL,
  venue                TEXT,
  maps_url             TEXT,
  message              TEXT,
  bride_image_url      TEXT,
  groom_image_url      TEXT,
  background_image_url TEXT,
  couple_image_url     TEXT,
  bgm_url              TEXT
);

-- RSVP table
CREATE TABLE rsvp (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_slug   TEXT REFERENCES invitations(slug) ON DELETE CASCADE,
  guest_name        TEXT NOT NULL,
  phone             TEXT,
  attendance        TEXT CHECK (attendance IN ('yes','no')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials table
CREATE TABLE testimonials (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url  TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE invitations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp         ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read invitations"   ON invitations  FOR SELECT USING (true);
CREATE POLICY "Public insert invitations" ON invitations  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update invitations" ON invitations  FOR UPDATE USING (true);
CREATE POLICY "Public delete invitations" ON invitations  FOR DELETE USING (true);

CREATE POLICY "Public read rsvp"   ON rsvp FOR SELECT USING (true);
CREATE POLICY "Public insert rsvp" ON rsvp FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read testimonials"   ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public insert testimonials" ON testimonials FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete testimonials" ON testimonials FOR DELETE USING (true);
```

### Step 2 — View counter function

```sql
CREATE OR REPLACE FUNCTION increment_views(inv_slug TEXT)
RETURNS void AS $$
  UPDATE invitations SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = inv_slug;
$$ LANGUAGE sql;
```

### Step 3 — Storage bucket

1. Go to **Storage → New Bucket**
2. Name: `wedding-media`
3. Toggle **Public bucket: ON**
4. Click Save

Then run:
```sql
DROP POLICY IF EXISTS "wedding_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "wedding_media_select" ON storage.objects;
DROP POLICY IF EXISTS "wedding_media_update" ON storage.objects;

CREATE POLICY "wedding_media_insert"
  ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'wedding-media');

CREATE POLICY "wedding_media_select"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'wedding-media');

CREATE POLICY "wedding_media_update"
  ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'wedding-media');
```

---

## Migrate Supabase to Business Account

### Step 1 — Export data from personal project

In your **personal** Supabase project, go to **SQL Editor** and run:

```sql
-- Copy this output and save as invitations_backup.json
SELECT row_to_json(t) FROM invitations t;
```

Also export RSVP and testimonials the same way.

### Step 2 — Create new project

1. Log into your business Supabase account
2. Create new project — note the new URL and anon key

### Step 3 — Run all SQL above in the new project

### Step 4 — Update config.js

Open `js/config.js` and replace the values:

```javascript
window.INVISEND_CONFIG = {
  supabaseUrl: 'https://YOUR_NEW_PROJECT.supabase.co',
  supabaseKey: 'YOUR_NEW_ANON_KEY',
  storageBucket: 'wedding-media',
};
```

### Step 5 — Re-upload media files

Storage files cannot be migrated automatically — you will need to re-upload photos through the admin dashboard.

### Step 6 — Re-import invitation data

Paste your backed-up invitation records using the SQL Editor INSERT statements.

---

## Admin Dashboard

**URL:** `your-site.netlify.app/index.html`
**Password:** Set in `index.html` (SHA-256 hashed — never stored as plaintext)

**Tabs:**
- Dashboard — stats and recent invitations
- Create Invitation — full form with 4 image uploads + BGM
- All Invitations — manage, preview, pause, download RSVP PDF
- RSVP Responses — view and filter by wedding, download PDF
- Testimonials — upload and manage review screenshots
- Setup Guide — SQL reference

---

## Themes

| ID | Name | Opening | Style |
|---|---|---|---|
| 1 | Western Luxury | Swipe slider | Black & Gold |
| 2 | Modern Elegant | Curtain + petals (coming) | Sage & White |
| 3 | Traditional Elegant | Swipe slider | Maroon & Gold |
| 4 | Vintage Letter | Wax seal (coming) | Parchment & Ink |

---

## Security Notes

- The Supabase anon key is visible in the browser. This is expected for a Supabase static site.
- Keep RLS policies tight — never disable them.
- The admin password is hashed with SHA-256 before storage. Do not revert to plaintext.
- For production with sensitive data, consider adding Supabase Auth (email + password login) instead of the static password system.

---

## Contacts

WhatsApp: +94713680340
