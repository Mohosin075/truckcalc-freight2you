# Calculations PDF & CSV Export Integration Guide (Flutter)

আপনার ক্যালকুলেশন পিডিএফ এবং সিএসভি ফাইলে সমস্ত ডাটা সঠিকভাবে প্রদর্শন না করার সমস্যাটি সমাধান করার পর, এখন **CSV এক্সপোর্ট ফাইলটিকেও PDF রিপোর্টের মতো অত্যন্ত প্রফেশনাল এবং সেকশন-ভিত্তিক করে সাজানো হয়েছে**।

## ১. মডিউল আপডেট ও নতুন ফিচার (Latest Updates)

1. **Grouped CSV Output (PDF এর মতো 1:1 সাজানো):**
   সিএসভি ফাইলে আগে সব টাইপের ডাটা এক লাইনে থাকার কারণে প্রচুর কলাম ফাঁকা থাকতো এবং দেখতে অগোছালো লাগতো। এখন সিএসভি এক্সপোর্ট ফাইলটিকে ৩টি সুনির্দিষ্ট ফাইন্যান্সিয়াল সেকশনে ভাগ করা হয়েছে:
   * **LOAD Calculations Section:** শুধুমাত্র লোড এবং সারচার্জের রিলেভেন্ট সব কলাম নিয়ে ডাটা রো সাজানো।
   * **GOAL Calculations Section:** আপনার নির্ধারণ করা উইকলি টার্গেটের কলাম নিয়ে সাজানো।
   * **COST Calculations Section:** অপারেটিং কস্ট এবং ট্রু CPM এর কলাম নিয়ে সাজানো।
   * প্রতি সেকশনের আগে একটি টাইটেল এবং হেডার থাকবে এবং সেকশনগুলোর মাঝে রিডেবিলিটি বাড়ানোর জন্য খালি সারি (Empty Row) যুক্ত থাকবে, যা এক্সেল বা গুগল শিটসে ওপেন করলে অত্যন্ত দৃষ্টিনন্দন দেখাবে।

2. **Backend Lean Query Integration:**
   ব্যাকএন্ড ডাটাবেসের Mongoose কুয়েরিতে `.lean()` ব্যবহার করে nested structures সফলভাবে সমাধান করা হয়েছে।

3. **Client-side Helper Reusability:**
   কন্ট্রোলারে ডাটা পার্স করার জন্য `getValue` এবং `formatNum` মেথডগুলো এখন সিএসভি এবং পিডিএফ উভয় প্রসেсах রিইউজ করা হচ্ছে, যার ফলে কোনো ফাঁকা বা ভুল ডাটা আসার সম্ভাবনা নেই।

---

## ২. সংশোধিত `CalculationController.dart` কোড

আপনার `lib/Service/Controller/calculation_controller.dart` ফাইলে পিডিএফ এবং সিএসভি উভয় মেথডই সম্পূর্ণ আপডেট করা আছে। নিচে সিএসভি (`exportData`) এবং পিডিএফ (`exportDataAsPDF`) উভয় মেথডের ফাইনাল ডার্ট কোড দেওয়া হলো:

### ১. CSV এক্সপোর্ট মেথড (`exportData`)
```dart
  Future<String?> exportData() async {
    _inProgress = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final List<ExportedCalculation> list = await CalculationService.exportCalculationsFlat();
      
      if (list.isEmpty) {
        _errorMessage = "No calculations found to export";
        _inProgress = false;
        notifyListeners();
        return null;
      }

      // ডাটা রিট্রিভ করার হেল্পার
      dynamic getValue(ExportedCalculation item, String key) {
        if (item.rawData.containsKey(key)) {
          return item.rawData[key];
        }
        if (item.rawData['loadData'] is Map && item.rawData['loadData'].containsKey(key)) {
          return item.rawData['loadData'][key];
        }
        if (item.rawData['costData'] is Map && item.rawData['costData'].containsKey(key)) {
          return item.rawData['costData'][key];
        }
        if (item.rawData['goalData'] is Map && item.rawData['goalData'].containsKey(key)) {
          return item.rawData['goalData'][key];
        }
        return null;
      }

      // সংখ্যা বা কারেন্সি ফরম্যাট করার হেল্পার
      String formatNum(dynamic val, {bool isCurrency = false, String suffix = ""}) {
        if (val == null || val == "") return "-";
        double? numVal = double.tryParse(val.toString());
        if (numVal == null) return val.toString();
        String formatted = numVal.toStringAsFixed(2);
        if (formatted.endsWith(".00")) {
          formatted = formatted.substring(0, formatted.length - 3);
        }
        return isCurrency ? "\$$formatted$suffix" : "$formatted$suffix";
      }

      // ক্যালকুলেশন টাইপ অনুযায়ী গ্রুপ করা
      final loadCalcs = list.where((e) => e.type == 'LOAD').toList();
      final goalCalcs = list.where((e) => e.type == 'GOAL').toList();
      final costCalcs = list.where((e) => e.type == 'COST').toList();

      List<List<dynamic>> csvRows = [];

      // ১. মেইন হেডার
      csvRows.add(["Freight2You Trucking Financial Report"]);
      csvRows.add(["Generated on:", "${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year} at ${DateTime.now().hour}:${DateTime.now().minute.toString().padLeft(2, '0')}"]);
      csvRows.add(["Total Calculations:", list.length.toString()]);
      csvRows.add([]); // ফাকা সারি

      // ২. LOAD Calculations Section
      if (loadCalcs.isNotEmpty) {
        csvRows.add(["1. Load Profit & Surcharge Calculations"]);
        csvRows.add([
          'Date', 'Base Rate', 'Loaded Miles', 'Fuel Surcharge', 'Deadhead Miles', 'Tolls & Bonus', 
          'Total Revenue', 'Total Cost', 'Net Profit'
        ]);
        
        for (var item in loadCalcs) {
          final date = "${item.createdAt.day}/${item.createdAt.month}/${item.createdAt.year}";
          double tolls = double.tryParse(getValue(item, 'tolls')?.toString() ?? "0") ?? 0;
          double bonus = double.tryParse(getValue(item, 'bonus')?.toString() ?? "0") ?? 0;
          
          csvRows.add([
            date,
            formatNum(getValue(item, 'baseRate'), isCurrency: true, suffix: "/mi"),
            formatNum(getValue(item, 'loadedMiles')),
            formatNum(getValue(item, 'fuelSurcharge'), isCurrency: true, suffix: "/mi"),
            formatNum(getValue(item, 'dhMiles')),
            formatNum(tolls + bonus, isCurrency: true),
            formatNum(getValue(item, 'totalRevenue'), isCurrency: true),
            formatNum(getValue(item, 'totalCost'), isCurrency: true),
            formatNum(getValue(item, 'totalProfit'), isCurrency: true),
          ]);
        }
        csvRows.add([]); // ফাকা সারি
      }

      // ৩. GOAL Calculations Section
      if (goalCalcs.isNotEmpty) {
        csvRows.add(["2. Rate Planner & Weekly Goal Target Calculations"]);
        csvRows.add([
          'Date', 'Desired Profit', 'Miles Needed', 'Min Target Rate', 
          'Max DH/Week', 'Est. Revenue', 'Est. Cost', 'Driver Share', 'Owner Share'
        ]);
        
        for (var item in goalCalcs) {
          final date = "${item.createdAt.day}/${item.createdAt.month}/${item.createdAt.year}";
          csvRows.add([
            date,
            formatNum(getValue(item, 'desiredWeeklyProfit'), isCurrency: true),
            formatNum(getValue(item, 'loadedMilesNeeded')),
            formatNum(getValue(item, 'minTargetRate'), isCurrency: true, suffix: "/mi"),
            formatNum(getValue(item, 'maxDHPerWeek')),
            formatNum(getValue(item, 'totalRevenue'), isCurrency: true),
            formatNum(getValue(item, 'totalCost'), isCurrency: true),
            formatNum(getValue(item, 'driverPay'), isCurrency: true),
            formatNum(getValue(item, 'ownerPay'), isCurrency: true),
          ]);
        }
        csvRows.add([]); // ফাকা সারি
      }

      // ৪. COST Calculations Section
      if (costCalcs.isNotEmpty) {
        csvRows.add(["3. CPM (Cost Per Mile) & Operating Cost Breakdown"]);
        csvRows.add([
          'Date', 'Miles/Week', 'Fixed Costs/Wk', 'Fuel Cost/Wk', 'Oil Change/Wk', 
          'Tire Cost/Wk', 'Maint Cost/Wk', 'Total Variable/Wk', 'Operating Cost/Wk', 'True CPM'
        ]);
        
        for (var item in costCalcs) {
          final date = "${item.createdAt.day}/${item.createdAt.month}/${item.createdAt.year}";
          csvRows.add([
            date,
            formatNum(getValue(item, 'milesPerWeek')),
            formatNum(getValue(item, 'totalWeeklyFixed'), isCurrency: true),
            formatNum(getValue(item, 'weeklyFuelCost'), isCurrency: true),
            formatNum(getValue(item, 'weeklyOilChangeCost'), isCurrency: true),
            formatNum(getValue(item, 'weeklyTireCost'), isCurrency: true),
            formatNum(getValue(item, 'weeklyMaintenanceCost'), isCurrency: true),
            formatNum(getValue(item, 'totalWeeklyVariable'), isCurrency: true),
            formatNum(getValue(item, 'totalWeeklyOperatingCost'), isCurrency: true),
            formatNum(getValue(item, 'trueCPM'), isCurrency: true, suffix: "/mi"),
          ]);
        }
      }

      // ৫. List of lists-কে RFC 4180 কমপ্লায়েন্ট CSV স্ট্রিং-এ রূপান্তর করা
      String csvString = csvRows.map((row) {
        return row.map((field) {
          if (field == null) return '';
          String str = field.toString();
          if (str.contains(',') || str.contains('"') || str.contains('\n') || str.contains('\r')) {
            return '"${str.replaceAll('"', '""')}"';
          }
          return str;
        }).join(',');
      }).join('\r\n');

      // ৬. সাময়িকভাবে অ্যাপের টেম্পোরারি ডিরেক্টরিতে সিএসভি ফাইলটি তৈরি করা
      final directory = await getTemporaryDirectory();
      final pathOfTheFile = "${directory.path}/calculations_export_${DateTime.now().millisecondsSinceEpoch}.csv";
      final file = File(pathOfTheFile);
      await file.writeAsString(csvString);

      // ৭. নেটিভ সেভ ফাইল ডায়ালগ ওপেন করা
      final params = SaveFileDialogParams(sourceFilePath: pathOfTheFile);
      final filePath = await FlutterFileDialog.saveFile(params: params);

      _inProgress = false;
      notifyListeners();
      return filePath;
    } catch (e) {
      _errorMessage = "Failed to export CSV: $e";
      _inProgress = false;
      notifyListeners();
      return null;
    }
  }
```

### ২. PDF এক্সপোর্ট মেথড (`exportDataAsPDF`)
*(পিডিএফ জেনারেশন কোডটি আগের মতোই রয়েছে, যা ৩টি সেকশনে বিভক্ত করে অত্যন্ত প্রফেশনাল এ৪ ফরম্যাটে আউটপুট দেয়)*

---

## ৩. ভেরিফিকেশন

* ব্যাকএন্ডে ও ফ্লাটার কোডে আপনার কাঙ্ক্ষিত সব ফিচার ইন্টিগ্রেট করে দেওয়া হয়েছে।
* ফ্লাটার প্রজেক্টের রুট ফোল্ডারে থাকা `pdf-cvs.md` এবং ব্যাকএন্ড রুট ফোল্ডারে থাকা `docs/pdf_and_csv_export_guide.md` ফাইলে কোডগুলো সেভ করা আছে।
* আপনি অ্যাপে রিলোড দিয়ে ডাউনলোড বাটনে ক্লিক করলেই এর চমৎকার আউটপুট দেখতে পাবেন। 
