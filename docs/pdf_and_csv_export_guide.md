# Calculations PDF & CSV Export Integration Guide (Flutter)

আপনার প্রশ্নের উত্তর এবং বর্তমান প্রজেক্টের অবস্থা নিচে বিস্তারিত আলোচনা করা হলো:

## ১. বর্তমান অবস্থা (Current Status)

*   **CSV Export:** **হ্যাঁ, এটি অলরেডি সম্পূর্ণরূপে ইমপ্লিমেন্ট করা আছে!** আপনার ব্যাকএন্ড থেকে ফ্ল্যাট ডাটা নিয়ে ডার্ট কোডের মাধ্যমে একটি প্রফেশনাল CSV স্ট্রিং ফরম্যাটে কনভার্ট করার সব কোড রেডি আছে।
*   **PDF Export:** **না, বর্তমানে প্রজেক্টের কোথাও (ব্যাকএন্ড বা ফ্লাটার অ্যাপ) PDF এক্সপোর্ট করার কোনো কোড করা নেই।** 

---

## ২. কেন Flutter-এ সরাসরি PDF জেনারেট করা সেরা সিদ্ধান্ত?

পিডিএফ মূলত একটি ডিজাইনের বিষয়। ব্যাকএন্ডে (Node.js) পিডিএফ জেনারেট করার চেয়ে সরাসরি ফ্লাটার অ্যাপে জেনারেট করা অনেক গুণ শ্রেয় এবং প্রফেশনাল। এর কারণসমূহ:
1. **অফলাইন সাপোর্ট:** সার্ভার বন্ধ থাকলেও আপনার অ্যাপে পিডিএফ জেনারেট হবে।
2. **সার্ভার স্পিড:** পিডিএফ রেন্ডারিং করতে অনেক মেমোরি ও প্রসেসিং পাওয়ার লাগে। ফ্লাটারে এটি করলে সার্ভারের ওপর বাড়তি কোনো চাপ পড়বে না।
3. **সহয ডিজাইন ও কাস্টমাইজেশন:** ফ্লাটারের `pdf` প্যাকেজ দিয়ে সাধারণ উইজেটের মতোই খুব সুন্দর লেআউট, টেবিল, হেডার এবং আপনার ব্র্যান্ডের কালার দিয়ে পিডিএফ জেনারেট করা যায়।

---

## ৩. Flutter-এ PDF Export ইমপ্লিমেন্ট করার প্রফেশনাল গাইডলাইন

নিচে সরাসরি কপি-পেস্ট করার উপযোগী ডার্ট কোড সহ গাইডলাইন দেওয়া হলো:

###ধাপ ১: `pubspec.yaml` ফাইলে PDF প্যাকেজ যুক্ত করা

প্রথমে আপনার ফ্লাটার অ্যাপের `pubspec.yaml` ফাইলে `pdf` প্যাকেজটি ডিপেন্ডেন্সি হিসেবে যুক্ত করুন:

```yaml
dependencies:
  flutter:
    sdk: flutter
  pdf: ^3.10.8                 # পিডিএফ জেনারেট করার জন্য
  flutter_file_dialog: ^0.3.1+1 # ডাউনলোড ডিরেক্টরিতে সেভ করার জন্য
  path_provider: ^2.1.5        # টেম্প ফাইল তৈরির জন্য
```
তারপর টার্মিনালে `flutter pub get` রান করুন।

---

### ধাপ ২: `CalculationController`-এ PDF জেনারেশন কোড যুক্ত করা

আপনার `lib/Service/Controller/calculation_controller.dart` ফাইলে প্রথমে ইম্পোর্ট করুন:
```dart
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
```

এরপর নিচের **`exportDataAsPDF()`** মেথডটি আপনার `CalculationController` ক্লাসের ভেতরে যুক্ত করে দিন:

```dart
// calculations ডাটা নিয়ে একটি সুন্দর PDF টেবিল রিপোর্ট তৈরি এবং ডাউনলোড করা
Future<String?> exportDataAsPDF() async {
  _inProgress = true;
  _errorMessage = null;
  notifyListeners();

  try {
    // ১. ব্যাকএন্ড থেকে হিসাবের তালিকা তুলে আনা
    final List<ExportedCalculation> list = await CalculationService.exportCalculationsFlat();
    
    if (list.isEmpty) {
      _errorMessage = "No calculations found to export";
      _inProgress = false;
      notifyListeners();
      return null;
    }

    // ২. PDF ডকুমেন্ট তৈরি করা
    final pdf = pw.Document();

    // ৩. PDF পেজ লেআউট ও টেবিল ডিজাইন করা
    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return [
            // কাস্টম হেডার ডিজাইন
            pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 10),
              border: const pw.Border(bottom: pw.BorderSide(color: PdfColors.grey300, width: 2)),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        "Freight2You Trucking Report", 
                        style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold, color: PdfColors.blueGrey900)
                      ),
                      pw.SizedBox(height: 4),
                      pw.Text(
                        "Generated on: ${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}", 
                        style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600)
                      ),
                    ]
                  ),
                  pw.Text(
                    "TOTAL CALCS: ${list.length}", 
                    style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.blue700)
                  ),
                ]
              )
            ),
            pw.SizedBox(height: 20),

            // ৪. হিসাবের ডাটা টেবিল তৈরি করা
            pw.TableHelper.fromTextArray(
              border: pw.TableBorder.all(color: PdfColors.grey200, width: 0.5),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.white),
              headerDecoration: const pw.BoxDecoration(color: PdfColors.blueGrey800),
              cellStyle: const pw.TextStyle(fontSize: 9),
              cellAlignment: pw.Alignment.centerLeft,
              headers: ['Date', 'Type', 'Revenue (\$)', 'Cost (\$)', 'Net Profit (\$)'],
              data: list.map((item) {
                final type = item.type;
                final date = "${item.createdAt.day}/${item.createdAt.month}/${item.createdAt.year}";
                
                // ক্যালকুলেশন টাইপ অনুযায়ী কলামের মান কাস্টমাইজ করা
                String revenue = "-";
                String cost = "-";
                String profit = "-";
                
                if (type == "LOAD") {
                  revenue = "${item.rawData['totalRevenue'] ?? 0}";
                  cost = "${item.rawData['totalCost'] ?? 0}";
                  profit = "${item.rawData['totalProfit'] ?? 0}";
                } else if (type == "GOAL") {
                  revenue = "${item.rawData['totalRevenue'] ?? 0}";
                  cost = "${item.rawData['totalCost'] ?? 0}";
                  profit = "${item.rawData['desiredWeeklyProfit'] ?? 0}";
                } else if (type == "COST") {
                  cost = "${item.rawData['totalWeeklyOperatingCost'] ?? 0}";
                }
                
                return [date, type, revenue, cost, profit];
              }).toList(),
            ),
          ];
        },
      ),
    );

    // ৫. সাময়িকভাবে অ্যাপের টেম্পোরারি ডিরেক্টরিতে পিডিএফ ফাইলটি তৈরি করা
    final directory = await getTemporaryDirectory();
    final pathOfTheFile = "${directory.path}/calculations_report_${DateTime.now().millisecondsSinceEpoch}.pdf";
    final file = File(pathOfTheFile);
    await file.writeAsBytes(await pdf.save());

    // ৬. নেটিভ সেভ ফাইল ডায়ালগ ওপেন করা (যাতে সরাসরি ডাউনলোডে পিডিএফ সেভ হতে পারে)
    final params = SaveFileDialogParams(sourceFilePath: pathOfTheFile);
    final filePath = await FlutterFileDialog.saveFile(params: params);

    _inProgress = false;
    notifyListeners();
    return filePath; // ডাউনলোড লোকেশন পাথের স্ট্রিং
  } catch (e) {
    _errorMessage = "Failed to export PDF: $e";
    _inProgress = false;
    notifyListeners();
    return null;
  }
}
```

---

###  ধাপ ৩: UI Integration (২টি বাটন লেআউট)

আপনার অ্যাপের ইউজার ইন্টারফেসে (যেমন `profile_page.dart` বা আপনার কাস্টম এক্সপোর্ট পেজে) আপনি ২টি সুন্দর আউটলাইন বাটন বা সাধারণ বাটন রাখতে পারেন। একটি **CSV ডাউনলোড** এর জন্য এবং আরেকটি **PDF ডাউনলোড** এর জন্য:

```dart
Widget _buildExportButtons(BuildContext context) {
  final controller = Provider.of<CalculationController>(context);

  return Row(
    children: [
      // ১. CSV ডাউনলোড বাটন
      Expanded(
        child: ElevatedButton.icon(
          onPressed: controller.inProgress 
            ? null 
            : () async {
                String? path = await controller.exportDataAndSave();
                if (path != null && context.mounted) {
                  showCustomSnackBar(context: context, message: "CSV Downloaded Successfully!", isError: false);
                }
              },
          icon: const Icon(Icons.table_view_outlined, color: Colors.yellow),
          label: const Text("Download CSV"),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white.withOpacity(0.05),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
      const SizedBox(width: 12),

      // ২. PDF ডাউনলোড বাটন
      Expanded(
        child: ElevatedButton.icon(
          onPressed: controller.inProgress 
            ? null 
            : () async {
                String? path = await controller.exportDataAsPDF();
                if (path != null && context.mounted) {
                  showCustomSnackBar(context: context, message: "PDF Report Downloaded!", isError: false);
                }
              },
          icon: const Icon(Icons.picture_as_pdf_outlined, color: Colors.redAccent),
          label: const Text("Download PDF"),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white.withOpacity(0.05),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
      ),
    ],
  );
}
```

### সারসংক্ষেপ:
*   **CSV** অলরেডি সার্ভার ও কন্ট্রোলারে সেটআপ করা আছে, জাস্ট ফাইল সেভার দিয়ে ডাউনলোড করতে হবে।
*   **PDF** সেটআপ করা নেই, তবে উপরে দেওয়া **`exportDataAsPDF()`** ফাংশনটি দিয়ে খুব সহজেই আপনি ফ্লাটার অ্যাপ থেকেই সম্পূর্ণ প্রফেশনাল পিডিএফ তৈরি ও ডাউনলোড করতে পারবেন। 
*   পিডিএফ জেনারেট করার কোড গাইডটি আপনার প্রজেক্টের স্থানীয় ফাইল হিসেবে এখানে সংরক্ষণ করা হয়েছে: [docs/pdf_and_csv_export_guide.md](file:///d:/Mohosin/Mohosin/projects/truckcalc-freight2you/docs/pdf_and_csv_export_guide.md)
