# প্রিন্টিং প্রেস সিস্টেম ডিপ্লয়মেন্ট গাইড (বাংলায়)

## 🚨 সবচেয়ে গুরুত্বপূর্ণ - এখনই করুন

### ১. Supabase Password Reset করুন
আপনার `.env` ফাইলে আসল Supabase password আছে। এটা খুবই বিপজ্জনক।

**কিভাবে করবেন:**
1. Supabase Dashboard-এ যান: https://supabase.com/dashboard
2. আপনার project-এ ক্লিক করুন
3. Settings → Database যান
4. "Reset database password" ক্লিক করুন
5. নতুন strong password দিন এবং Save করুন
6. নতুন password কপি করে রাখুন

### ২. .env ফাইল আপডেট করুন
`.env` ফাইলের DATABASE_URL এবং DIRECT_URL-এ নতুন password বসান:

```env
DATABASE_URL="postgresql://postgres.ncbhusgffbvyeqnonifw:NEW_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.ncbhusgffbvyeqnonifw:NEW_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
NEXTAUTH_SECRET="Xy7kP2mNq9wRtL5vJh3sZaB8cD1eF6gH"
NEXTAUTH_URL="http://localhost:3000"
```

### ৩. .gitignore ফাইল তৈরি হয়েছে
আমি `.gitignore` ফাইল তৈরি করে দিয়েছি। এখন `.env` ফাইল Git-এ আপলোড হবে না।

---

## 📋 Vercel-এ ডিপ্লয় করার ধাপ (সবচেয়ে সহজ উপায়)

Vercel Next.js-এর জন্য সেরা হোস্টিং প্ল্যাটফর্ম। এটা ফ্রি এবং সেটআপ করা খুব সহজ।

### ধাপ ১: GitHub Repository তৈরি করুন
1. GitHub-এ যান: https://github.com
2. Login করুন
3.右上角 "+" ক্লিক করে "New repository" নির্বাচন করুন
4. Repository name দিন: `printing-press-system`
5. "Public" বা "Private" যেকোনোটি নির্বাচন করুন (Private ভালো)
6. "Create repository" ক্লিক করুন

### ধাপ ২: কোড GitHub-এ আপলোড করুন

আপনার কম্পিউটারের Terminal বা Command Prompt খুলুন এবং নিচের কমান্ডগুলো দিন:

```bash
# প্রজেক্ট ফোল্ডারে যান
cd d:/printing-press-critical-fixes/printing-press-system

# Git ইনিশিয়ালাইজ করুন
git init

# সব ফাইল যোগ করুন
git add .

# প্রথম কমিট করুন
git commit -m "Initial commit - Printing Press System"

# GitHub repository যোগ করুন (YOUR_USERNAME আপনার GitHub username দিন)
git remote add origin https://github.com/YOUR_USERNAME/printing-press-system.git

# GitHub-এ পুশ করুন
git branch -M main
git push -u origin main
```

**যদি Git ইনস্টল না থাকে:**
1. https://git-scm.com/download/win থেকে Git ডাউনলোড এবং ইনস্টল করুন
2. উপরের কমান্ডগুলো আবার চালান

### ধাপ ৩: Vercel-এ প্রজেক্ট ইমপোর্ট করুন
1. Vercel-এ যান: https://vercel.com
2. GitHub দিয়ে Sign up করুন
3. "Add New..." → "Project" ক্লিক করুন
4. আপনার `printing-press-system` repository খুঁজুন এবং "Import" ক্লিক করুন

### ধাপ ৪: Environment Variables সেট করুন
Vercel-এ প্রজেক্ট ইমপোর্ট করার পর:
1. "Environment Variables" সেকশনে যান
2. নিচের ভেরিয়েবলগুলো যোগ করুন:

| Key | Value |
|-----|-------|
| DATABASE_URL | আপনার `.env` ফাইলের DATABASE_URL |
| DIRECT_URL | আপনার `.env` ফাইলের DIRECT_URL |
| NEXTAUTH_SECRET | আপনার `.env` ফাইলের NEXTAUTH_SECRET |
| NEXTAUTH_URL | আপনার Vercel domain (পরে auto-generate হবে) |

**গুরুত্বপূর্ণ:** NEXTAUTH_URL প্রথমে `https://your-app.vercel.app` দিন, ডিপ্লয় হওয়ার পর আপডেট করুন।

### ধাপ ৫: Build Settings কনফিগার করুন
Vercel-এ:
1. "Build & Development Settings" সেকশনে যান
2. Build Command সেট করুন: `npx prisma generate && next build`
3. Output Directory: `.next` (default)
4. Install Command: `npm install`

### ধাপ ৬: Deploy করুন
1. "Deploy" বাটন ক্লিক করুন
2. Vercel অটোমেটিক বিল্ড করবে
3. ২-৩ মিনিটের মধ্যে ডিপ্লয় সম্পন্ন হবে
4. আপনার সাইটের URL পাবেন: `https://printing-press-system.vercel.app`

---

## 🔧 ডিপ্লয়মেন্টের পর করণীয়

### ১. Database Migration রান করুন
Vercel-এ ডিপ্লয় হওয়ার পর:
```bash
# আপনার লোকাল কম্পিউটারে
cd d:/printing-press-critical-fixes/printing-press-system
npx prisma migrate deploy
```

### ২. Seed Data যোগ করুন (প্রথমবারের জন্য)
```bash
npx prisma db seed
```

### ৩. Custom Domain সেট করুন (ঐচ্ছিক)
আপনি চাইলে নিজের domain ব্যবহার করতে পারেন:
1. Vercel Dashboard → Settings → Domains
2. আপনার domain যোগ করুন
3. DNS settings ফলো করুন

---

## 🛡️ সিকিউরিটি টিপস

### ১. Environment Variables কখনো কোডে হার্ডকোড করবেন না
সবসময় `.env` ফাইল বা Vercel Environment Variables ব্যবহার করুন।

### ২. Strong Password ব্যবহার করুন
- Admin password অন্তত ১২ অক্ষরের হওয়া উচিত
- Uppercase, lowercase, numbers, special characters মিশ্রিত ব্যবহার করুন

### ৩. Regular Backup নিন
Supabase-এ automatic backup সেট করুন:
1. Supabase Dashboard → Database → Backups
2. "Enable automated backups" চালু করুন

---

## 📞 সমস্যা হলে কি করবেন

### Build Error হলে
1. Vercel Dashboard → Deployments যান
2. Failed deployment ক্লিক করুন
3. Build logs চেক করুন
4. সাধারণত environment variables সমস্যা হয়

### Database Connection Error হলে
1. DATABASE_URL এবং DIRECT_URL সঠিক কিনা চেক করুন
2. Supabase password reset হয়েছে কিনা দেখুন
3. Supabase project paused হয়নি তো চেক করুন

### Auth Error হলে
1. NEXTAUTH_SECRET সঠিক কিনা চেক করুন
2. NEXTAUTH_URL সঠিক domain দিয়েছেন কিনা দেখুন

---

## ✅ ডিপ্লয়মেন্ট চেকলিস্ট

ডিপ্লয়মেন্ট আগে নিশ্চিত করুন:
- [ ] Supabase password reset করা হয়েছে
- [ ] .env ফাইল আপডেট করা হয়েছে
- [ ] .gitignore ফাইল তৈরি হয়েছে
- [ ] কোড GitHub-এ আপলোড করা হয়েছে
- [ ] Vercel-এ environment variables সেট করা হয়েছে
- [ ] Build command কনফিগার করা হয়েছে
- [ ] Database migration রান করা হয়েছে
- [ ] Seed data যোগ করা হয়েছে

---

## 🎯 দ্রুত শুরু করার জন্য

যদি আপনি এখনই শুরু করতে চান:
1. Supabase password reset করুন (৫ মিনিট)
2. .env ফাইল আপডেট করুন (২ মিনিট)
3. GitHub repository তৈরি করুন (৩ মিনিট)
4. Git commands রান করুন (৫ মিনিট)
5. Vercel-এ ইমপোর্ট করুন (৫ মিনিট)
6. Environment variables সেট করুন (৫ মিনিট)
7. Deploy করুন (৫ মিনিট)

**মোট সময়:** প্রায় ৩০ মিনিট

---

## 💡 অতিরিক্ত টিপস

### প্রথমবার ডিপ্লয় করার পর
- Admin login: `admin@alihsan.com`
- Default password: আপনার seed.ts-এ সেট করা password (পরিবর্তন করুন!)
- প্রথম login করার পর অবশ্যই password change করুন

### পরবর্তী আপডেট
কোড আপডেট করার পর:
```bash
git add .
git commit -m "Update description"
git push
```
Vercel অটোমেটিক redeploy করবে।

---

যেকোনো সমস্যা হলে আমাকে জানান। আমি সাহায্য করতে প্রস্তুত!
