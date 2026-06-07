# Flutter Integration Guide: Client Calculation Formula Updates

এই ডকুমেন্টটিতে আপনার Flutter মোবাইল অ্যাপে ক্লায়েন্টের নতুন ক্যালকুলেশন ফর্মুলা অনুযায়ী কী কী পরিবর্তন (Formulas, Inputs & UI updates) করতে হবে তা বিস্তারিত বর্ণনা করা হলো। 

---

## ১. রেট প্ল্যানার (Rate Planner / GOAL) স্ক্রিন আপডেট

রেট প্ল্যানার বা Goal স্ক্রিনে ক্লায়েন্ট কিছু গাণিতিক পরিবর্তন এনেছেন। যদি আপনার অ্যাপের ফ্রন্টএন্ডে রিয়েল-টাইম প্রিভিউ দেখানোর জন্য কোনো সূত্র বা ফর্মুলা ব্যবহার করা হয়ে থাকে, তবে তা অবশ্যই নিচের সূত্র অনুযায়ী আপডেট করতে হবে। 

### ক. সূত্র আপডেট (Formula Changes)

1. **Total Cost (মোট খরচ):**
   * **আগের সূত্র:** `Cost Per Mile * (Loaded Miles Needed + Suggested Max Deadhead Per Week)`
   * **নতুন সূত্র (আপডেটেড):** 
     $$\text{Total Cost} = \text{costPerMile} \times \text{loadedMilesNeeded}$$
     *(অর্থাৎ, টোটাল কস্ট হিসাব করার সময় ডেডহেড মাইল আর যোগ হবে না।)*

2. **Total Revenue (মোট রাজস্ব/আয়):**
   * **আগের সূত্র:** `(Loaded Miles Needed * Min Target Rate) + (Max Deadhead Per Week * Deadhead Pay Per Mile)`
   * **নতুন সূত্র (আপডেটেড):** 
     $$\text{Total Revenue} = (\text{loadedMilesNeeded} \times \text{minTargetRate}) + \frac{\text{maxDHPerWeek} \times \text{deadheadPayPerMile}}{\text{loadedMilesNeeded}}$$
     *(অর্থাৎ, ডেডহেড আয়ের অংশটিকে `loadedMilesNeeded` দিয়ে ভাগ করে টোটাল রেভিনিউতে যোগ করা হবে।)*

### খ. ডিজাইন বা ইউজার ইন্টারফেস (UI) পরিবর্তন
* **কোনো নতুন ইনপুট ফিল্ডের প্রয়োজন নেই:** ক্লায়েন্ট কোনো নতুন ডাটা ইনপুট বা ফিল্ড যুক্ত করেননি। ইউজার আগে যে ইনপুটগুলো দিতেন (যেমন: Desired Weekly Profit, Cost Per Mile, Deadhead Pay, Days Per Week, Max Miles Per Day, Driver Percentage) সেগুলো হুবহু একই থাকবে।
* **ফলাফল প্রদর্শন:** স্ক্রিনে **Total Cost** এবং **Total Revenue** ফিল্ডের আউটপুট ভ্যালুগুলো ব্যাকএন্ড থেকে রেসপন্স হিসেবে চলে আসবে। ফ্রন্টএন্ডে সরাসরি ব্যাকএন্ড থেকে আসা `totalCost` and `totalRevenue` ফিল্ড দুটি রেন্ডার করাই সবচেয়ে নিরাপদ।

---

## ২. লোড ক্যালকুলেটর (Load Calculator) স্ক্রিন আপডেট

লোড ক্যালকুলেটরের জন্য ক্লায়েন্ট ফর্মুলা শিটে **Compensation Per Mile** বিষয়টি স্পষ্টভাবে উল্লেখ করেছেন। 

### ক. সূত্র আপডেট (Formula Changes)
* **Compensation Per Mile:**
  $$\text{Compensation Per Mile} = \frac{\text{Total Revenue}}{\text{Total Miles}}$$
  *(এটি ইতিমধ্যে ব্যাকএন্ডে ইমপ্লিমেন্টেড ছিল, ফ্রন্টএন্ডের UI-তে বা অফলাইন হিসাবের জন্য এই ফর্মুলাটি নিশ্চিত করে নিন।)*

### খ. ডিজাইন বা ইউজার ইন্টারফেস (UI) পরিবর্তন
* UI-তে **Compensation Per Mile** ভ্যালুটি প্রদর্শনের ব্যবস্থা রাখুন। ব্যাকএন্ডের `compensationPerMile` ফিল্ডটি সরাসরি এখানে শো করুন।

---

## ৩. এপিআই পে-লোড এবং রেসপন্স (API Payload & Response)

ব্যাকএন্ড এপিআই রাউট বা রিকোয়েস্ট বডিতে কোনো পরিবর্তন করার প্রয়োজন নেই। `POST /api/v1/calculations` রাউটটিতে আগের ফরম্যাটেই ডাটা পাঠাবেন:

### Request Body (POST `/api/v1/calculations`)
```json
{
  "type": "GOAL",
  "goalData": {
    "desiredWeeklyProfit": 2000,
    "costPerMile": 1.50,
    "deadheadPayPerMile": 1.00,
    "daysPerWeek": 5,
    "maxMilesPerDay": 600,
    "driverPercentage": 25,
    "loadedMilesNeeded": 3000,
    "minTargetRate": 2.17,
    "totalRevenue": 3000.03,
    "totalCost": 4500,
    "maxDHPerDay": 90,
    "maxDHPerWeek": 450,
    "driverPay": 500,
    "ownerPay": 1500
  }
}
```

> [!TIP]
> ব্যাকএন্ডে আপনার পাঠানো ডাটা পুনরায় চেক করে নিজের লজিক দিয়ে `totalCost`, `totalRevenue`, `minTargetRate` ইত্যাদি রিসেট/ক্যালকুলেট করে ডাটাবেজে সেভ করবে। তাই ফ্রন্টএন্ডে শুধু ডাটা সেন্ড করে রেসপন্সে আসা ডাটা ডিসপ্লে করলেই অ্যাপ সম্পূর্ণ সিঙ্কড থাকবে।
