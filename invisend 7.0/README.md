# InviSend — Wedding Invitation SaaS Platform

## 🚀 Quick Deploy to Netlify

1. Drag the `invisend/` folder to [netlify.com/drop](https://app.netlify.com/drop)
2. Your site will be live instantly.
3. Note your Netlify URL (e.g. `https://your-site.netlify.app`)

---

## 📁 File Structure

```
invisend/
├── index.html          → Admin Dashboard
├── invite.html         → Guest Invitation Page
├── css/
│   ├── admin.css       → Dashboard styles
│   └── invite.css      → Invitation page styles (all 3 templates)
├── js/
│   └── supabase.js     → Supabase client + all API helpers
└── README.md
```

---

## ⚙️ Supabase Setup (REQUIRED FIRST STEP)

### 1. Run SQL in Supabase SQL Editor

Go to your Supabase project → SQL Editor → paste and run:

```sql
-- INVITATIONS TABLE
CREATE TABLE invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  template_id INTEGER DEFAULT 1 CHECK (template_id IN (1,2,3)),
  status TEXT DEFAULT 'live' CHECK (status IN ('live','expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ,
  couple_name TEXT NOT NULL,
  bride_father TEXT,
  bride_mother TEXT,
  groom_father TEXT,
  groom_mother TEXT,
  wedding_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  message TEXT,
  bride_image_url TEXT,
  groom_image_url TEXT,
  background_image_url TEXT
);

-- RSVP TABLE
CREATE TABLE rsvp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_slug TEXT REFERENCES invitations(slug) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  phone TEXT,
  attendance TEXT CHECK (attendance IN ('yes','no')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read invitations" ON invitations FOR SELECT USING (true);
CREATE POLICY "Public insert invitations" ON invitations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update invitations" ON invitations FOR UPDATE USING (true);
CREATE POLICY "Public delete invitations" ON invitations FOR DELETE USING (true);

CREATE POLICY "Public read rsvp" ON rsvp FOR SELECT USING (true);
CREATE POLICY "Public insert rsvp" ON rsvp FOR INSERT WITH CHECK (true);
```

### 2. Create Storage Bucket

Go to **Storage → New Bucket**:
- Name: `wedding-media`
- ✅ Public bucket: **ON**

Then add these policies under **Storage → Policies**:

```sql
CREATE POLICY "Public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'wedding-media');

CREATE POLICY "Public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'wedding-media');
```

---

## 🗺️ Google Maps Setup (FREE — No API Key Required)

The invitation page uses **Google Maps Embed** which is **completely free** and requires **no API key** for basic embeds.

How it works: The venue name you enter in the form is automatically encoded into:
```
https://maps.google.com/maps?q=YOUR+VENUE+NAME&output=embed
```

✅ No setup needed — it works out of the box.

---

## 🎨 Templates

| ID | Name | Style |
|----|------|-------|
| 1 | Golden Romance | Warm gold, cinematic, luxury |
| 2 | Minimal Elegant | White + olive green, clean modern |
| 3 | Night Cinematic | Dark theme, purple glow, particles |

---

## 🔗 Invitation URL Format

```
https://your-site.netlify.app/invite.html?slug=sarah-james-2025
```

---

## 🔒 Adding Auth Later

To add admin password protection, add this at the top of `index.html`:

```javascript
const ADMIN_PASSWORD = 'your-secret-password';
if (sessionStorage.getItem('admin_auth') !== ADMIN_PASSWORD) {
  const pwd = prompt('Enter admin password:');
  if (pwd !== ADMIN_PASSWORD) {
    document.body.innerHTML = '<h2>Unauthorized</h2>';
    throw new Error('Unauthorized');
  }
  sessionStorage.setItem('admin_auth', ADMIN_PASSWORD);
}
```

---

## 📋 Workflow

1. **Admin** opens `index.html` → fills form → clicks Generate
2. **System** uploads images to Supabase Storage → saves record → shows live link
3. **Couple** shares link: `invite.html?slug=their-slug`
4. **Guests** open link → cinematic experience → submit RSVP
5. **Admin** views RSVPs in dashboard → RSVP tab

---

Built with ❤️ by InviSend
