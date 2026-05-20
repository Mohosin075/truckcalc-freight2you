# Flutter Integration Guide: User Profile Update & Direct File Download

এই গাইডটিতে Flutter অ্যাপের জন্য **User Profile Update** (ইমেজ আপলোড ও নেস্টেড অবজেক্ট সহ) এবং **Calculations Data Direct Download** (মোবাইল ডিভাইসে সরাসরি ফাইল ডাউনলোড/সেভ করা) এর প্রফেশনাল ইমপ্লিমেন্টেশন গাইডলাইন দেওয়া হলো।

---

## ১. User Profile Update (Multipart with Nested JSON)

আমাদের ব্যাকএন্ডের `fileAndBodyProcessorUsingDiskStorage` মিডলওয়্যারটি একই সাথে **প্রোফাইল ইমেজ** এবং **নেস্টেড JSON ডাটা (যেমন: `address`, `location`)** আপডেট করার সুবিধা দেয়। 

### মূল মেকানিজম:
1. ইমেজ ফাইলটি **`images`** নামক ফর্ম-ডেটা কী (Form-data Key)-তে পাঠাতে হবে।
2. অন্য সব টেক্সট ও নেস্টেড অবজেক্ট ফিল্ডসমূহকে একটি ম্যাপ বা ক্লাসে রূপান্তর করে, সেটিকে Stringify (JSON encoded) করে **`data`** নামক ফর্ম-ডেটা কী-তে পাঠাতে হবে।

---

### ক. Flutter Controller & Service Implementation (Dio Package)

আপনার Flutter অ্যাপের `profile_controller.dart` বা যেখানে আপনি প্রোফাইল আপডেট হ্যান্ডেল করছেন, সেখানে নিচের কোডটি ব্যবহার করুন:

```dart
import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart' as dio;
import 'package:image_picker/image_picker.dart';

class ProfileController extends ChangeNotifier {
  bool _inProgress = false;
  String? _errorMessage;

  bool get inProgress => _inProgress;
  String? get errorMessage => _errorMessage;

  // ইমেজ সিলেক্ট করার জন্য ImagePicker
  final ImagePicker _picker = ImagePicker();
  File? _selectedImage;
  File? get selectedImage => _selectedImage;

  // গ্যালারি থেকে প্রোফাইল ইমেজ সিলেক্ট করা
  Future<void> pickProfileImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      _selectedImage = File(image.path);
      notifyListeners();
    }
  }

  // প্রোফাইল ও ইমেজ একসাথে ব্যাকএন্ডে আপডেট করা
  Future<bool> updateProfile({
    required String token,
    required String name,
    required String phone,
    required String city,
    required String country,
    required String postalCode,
  }) async {
    _inProgress = true;
    _errorMessage = null;
    notifyListeners();

    final url = 'http://YOUR_SERVER_IP:5000/api/v1/user/profile';
    final dioClient = dio.Dio();

    // Bearer টোকেন যুক্ত করা
    dioClient.options.headers = {
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
    };

    // ১. টেক্সট ফিল্ড ও নেস্টেড অবজেক্টের ম্যাপ তৈরি
    final Map<String, dynamic> jsonPayload = {
      'name': name,
      'phone': phone,
      'address': {
        'city': city,
        'country': country,
        'postalCode': postalCode,
        'presentAddress': '$city, $country',
      },
      // উদাহরণস্বরূপ Geo Location (লংগিটিউড, ল্যাটিটিউড)
      'location': {
        'type': 'Point',
        'coordinates': [90.4125, 23.8103], 
      }
    };

    // ২. FormData-তে রূপান্তর
    final Map<String, dynamic> formDataMap = {
      // ব্যাকএন্ড ডাটা ফিল্ডের জন্য স্ট্রিং তৈরি করা হলো
      'data': json.encode(jsonPayload), 
    };

    // ৩. ইমেজ ফাইল সিলেক্ট করা থাকলে সেটি Multipart-এ যুক্ত করা
    if (_selectedImage != null) {
      formDataMap['images'] = await dio.MultipartFile.fromFile(
        _selectedImage!.path,
        filename: _selectedImage!.path.split('/').last,
      );
    }

    final formData = dio.FormData.fromMap(formDataMap);

    try {
      final response = await dioClient.patch(
        url,
        data: formData,
      );

      _inProgress = false;
      if (response.statusCode == 200) {
        _selectedImage = null; // সফল আপলোড শেষে সিলেক্ট করা টেম্প ইমেজ ক্লিয়ার
        notifyListeners();
        return true;
      } else {
        _errorMessage = response.statusMessage ?? "Failed to update profile";
        notifyListeners();
        return false;
      }
    } on dio.DioException catch (e) {
      _inProgress = false;
      _errorMessage = e.response?.data?['message'] ?? e.message;
      notifyListeners();
      return false;
    }
  }
}
```

---

## ২. Direct File Download (Direct Download)

মোবাইল অ্যাপে ব্যাকএন্ড থেকে জেনারেট করা ডাটা সরাসরি ব্যবহারকারীর ডিভাইসের **"Downloads"** বা অন্য কোনো ডিরেক্টরিতে ডাউনলোড করার জন্য ওএস-এর নেটিভ **Save File Dialog** ব্যবহার করা সবচেয়ে নির্ভরযোগ্য ও প্রফেশনাল পদ্ধতি।

### ওএস এর সীমাবদ্ধতা:
*   **Android Scoped Storage (10+):** সরাসরি `/storage/emulated/0/Download` এ ফাইল রাইট করতে গেলে পারমিশন এরর আসে।
*   **iOS Sandboxing:** অ্যাপের ডিরেক্টরির বাইরে আইওএস-এ সরাসরি ফাইল রাইট করা অসম্ভব।
*   **নেটিভ ফাইল ডায়ালগ সুবিধা:** এটি ব্যবহারের মাধ্যমে কোনো রকম স্টোরেজ পারমিশন চাওয়া ছাড়াই ব্যবহারকারী ফাইলটি নিজের ডিভাইসে সেভ বা ডাউনলোড করতে পারেন।

---

### ক. প্রজেক্ট সেটআপ (Setup)

আপনার Flutter প্রজেক্টের `pubspec.yaml` ফাইলে এই প্যাকেজটি যুক্ত করুন:

```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_file_dialog: ^0.3.1+1 # নেটিভ সেভ ডায়ালগের জন্য
  path_provider: ^2.1.5        # টেম্পোরারি ডিরেক্টরি ব্যবহারের জন্য
```

তারপর টার্মিনালে রান করুন:
```bash
flutter pub get
```

---

### খ. Controller ইমপ্লিমেন্টেশন (`calculation_controller.dart`)

আপনার কন্ট্রোলারে ফাইলটি ডাউনলোড করার জন্য নিচের ফাংশনটি যুক্ত করুন। এটি ডেটাবেস থেকে ডাটা নিয়ে এসে CSV ফাইল বানাবে এবং সেটিকে সরাসরি ব্যবহারকারীর ডিভাইসে সেভ করার ডায়ালগ ওপেন করবে:

```dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:flutter_file_dialog/flutter_file_dialog.dart';
import 'package:truckcalc/Model/exported_calculation.dart';
import 'package:truckcalc/Service/Api%20service/calculation_service.dart';

class CalculationController extends ChangeNotifier {
  bool _inProgress = false;
  String? _errorMessage;

  bool get inProgress => _inProgress;
  String? get errorMessage => _errorMessage;

  Future<String?> exportDataAndSave() async {
    _inProgress = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // ব্যাকএন্ড থেকে হিসাবের ফ্ল্যাট তালিকা তুলে আনা
      final List<ExportedCalculation> list = await CalculationService.exportCalculationsFlat();
      
      if (list.isEmpty) {
        _errorMessage = "No calculations found to export";
        _inProgress = false;
        notifyListeners();
        return null;
      }

      List<List<dynamic>> rows = [];
      
      // ১. CSV হেডার ডিফাইন করা
      List<String> headers = [
        "ID", "Type", "Created At", 
        "Base Rate (\$)", "Loaded Miles", "Fuel Surcharge (\$/mi)", "Tolls (\$)", "DH Miles", "DH Rate (\$/mi)", "Bonus (\$)", 
        "Cost Per Mile (\$)", "Driver Percentage (%)", "Total FSC (\$)", "Total DH (\$)", "Total Revenue (\$)", "Total Miles", 
        "Compensation Per Mile (\$/mi)", "Total Cost (\$)", "Profit Per Mile (\$/mi)", "Total Profit (\$)", "Driver Pay (\$)", "Owner Pay (\$)",
        "Desired Weekly Profit (\$)", "Days Per Week", "Max Miles Per Day", "Deadhead Pay Per Mile (\$/mi)", "Loaded Miles Needed", 
        "Min Target Rate (\$/mi)", "Max DH Per Day", "Max DH Per Week", "Miles Per Week", "Insurance (\$)", "Truck Payment (\$)", 
        "Escrow (\$)", "Repair Savings (\$)", "Driver Pay Fixed (\$)", "Permits (\$)", "Other Fixed (\$)", "Fuel Price (\$/gal)", 
        "Avg MPG", "Oil Changes Per Year", "Cost Per Oil Change (\$)", "Tire Cost Per Year (\$)", "Maintenance Cost Per Year (\$)", 
        "Total Weekly Fixed (\$)", "Weekly Fuel Cost (\$)", "Weekly Oil Change Cost (\$)", "Weekly Tire Cost (\$)", "Weekly Maintenance Cost (\$)", 
        "Total Weekly Variable (\$)", "Total Weekly Operating Cost (\$)", "True CPM (\$/mi)"
      ];
      rows.add(headers);

      // ২. হেডার টেক্সট থেকে অবজেক্টের কী-তে ম্যাপিং করা
      Map<String, String> fieldKeys = {
        "Base Rate (\$)": "baseRate",
        "Loaded Miles": "loadedMiles",
        "Fuel Surcharge (\$/mi)": "fuelSurcharge",
        "Tolls (\$)": "tolls",
        "DH Miles": "dhMiles",
        "DH Rate (\$/mi)": "dhRate",
        "Bonus (\$)": "bonus",
        "Cost Per Mile (\$)": "costPerMile",
        "Driver Percentage (%)": "driverPercentage",
        "Total FSC (\$)": "totalFSC",
        "Total DH (\$)": "totalDH",
        "Total Revenue (\$)": "totalRevenue",
        "Total Miles": "totalMiles",
        "Compensation Per Mile (\$/mi)": "compensationPerMile",
        "Total Cost (\$)": "totalCost",
        "Profit Per Mile (\$/mi)": "profitPerMile",
        "Total Profit (\$)": "totalProfit",
        "Driver Pay (\$)": "driverPay",
        "Owner Pay (\$)": "ownerPay",
        "Desired Weekly Profit (\$)": "desiredWeeklyProfit",
        "Days Per Week": "daysPerWeek",
        "Max Miles Per Day": "maxMilesPerDay",
        "Deadhead Pay Per Mile (\$/mi)": "deadheadPayPerMile",
        "Loaded Miles Needed": "loadedMilesNeeded",
        "Min Target Rate (\$/mi)": "minTargetRate",
        "Max DH Per Day": "maxDHPerDay",
        "Max DH Per Week": "maxDHPerWeek",
        "Miles Per Week": "milesPerWeek",
        "Insurance (\$)": "insurance",
        "Truck Payment (\$)": "truckPayment",
        "Escrow (\$)": "escrow",
        "Repair Savings (\$)": "repairSavings",
        "Driver Pay Fixed (\$)": "driverPayFixed",
        "Permits (\$)": "permits",
        "Other Fixed (\$)": "otherFixed",
        "Fuel Price (\$/gal)": "fuelPrice",
        "Avg MPG": "avgMPG",
        "Oil Changes Per Year": "oilChangesPerYear",
        "Cost Per Oil Change (\$)": "costPerOilChange",
        "Tire Cost Per Year (\$)": "tireCostPerYear",
        "Maintenance Cost Per Year (\$)": "maintenanceCostPerYear",
        "Total Weekly Fixed (\$)": "totalWeeklyFixed",
        "Weekly Fuel Cost (\$)": "weeklyFuelCost",
        "Weekly Oil Change Cost (\$)": "weeklyOilChangeCost",
        "Weekly Tire Cost (\$)": "weeklyTireCost",
        "Weekly Maintenance Cost (\$)": "weeklyMaintenanceCost",
        "Total Weekly Variable (\$)": "totalWeeklyVariable",
        "Total Weekly Operating Cost (\$)": "totalWeeklyOperatingCost",
        "True CPM (\$/mi)": "trueCPM"
      };

      // ৩. ডাটা পপুলেট করা
      for (var item in list) {
        List<dynamic> row = [
          item.id,
          item.type,
          item.createdAt.toIso8601String(),
        ];
        for (String header in headers.skip(3)) {
          String? key = fieldKeys[header];
          row.add(item.rawData[key] ?? "");
        }
        rows.add(row);
      }

      // ৪. CSV ফরম্যাটে স্ট্রিং তৈরি করা (RFC 4180 Standard Compliance)
      String csvString = rows.map((row) {
        return row.map((field) {
          if (field == null) return '';
          String str = field.toString();
          // কমা, কোটেশন বা নতুন লাইন থাকলে এস্কেপ করা
          if (str.contains(',') || str.contains('"') || str.contains('\n') || str.contains('\r')) {
            return '"${str.replaceAll('"', '""')}"';
          }
          return str;
        }).join(',');
      }).join('\r\n');

      // ৫. অ্যাপের ক্যাশ/টেম্প মেমোরিতে ফাইলটি সাময়িকভাবে সংরক্ষণ করা
      final directory = await getTemporaryDirectory();
      final pathOfTheFile = "${directory.path}/calculations_export_${DateTime.now().millisecondsSinceEpoch}.csv";
      final file = File(pathOfTheFile);
      await file.writeAsString(csvString);

      // ৬. নেтивной ওএস সেভ ডায়ালগ ওপেন করা (যা সরাসরি ডাউনলোড ডিরেক্টরিতে সেভ করতে সাহায্য করবে)
      final params = SaveFileDialogParams(sourceFilePath: pathOfTheFile);
      final filePath = await FlutterFileDialog.saveFile(params: params);

      _inProgress = false;
      notifyListeners();
      return filePath; // ডাউনলোড সফল হলে সেভ করা লোকেশন রিটার্ন হবে, ক্যানসেল করলে null
    } catch (e) {
      _errorMessage = "Failed to export & download: $e";
      _inProgress = false;
      notifyListeners();
      return null;
    }
  }
}
```

---

### গ. UI Integration Example (Profile/Settings Page Button)

ব্যবহারকারী যখন **"Export & Download File"** বাটনে প্রেস করবেন, তখন কিভাবে সেটি অ্যাপে রেন্ডার এবং ডাউনলোড সফল হওয়ার কনফার্মেশন মেসেজ দেখাবেন:

```dart
Widget _buildDownloadButton(BuildContext context) {
  return Consumer<CalculationController>(
    builder: (context, controller, child) {
      return InkWell(
        onTap: controller.inProgress 
          ? null 
          : () async {
              // ডাউনলোড ফাংশনটি কল করা
              String? savedPath = await controller.exportDataAndSave();
              
              if (context.mounted) {
                if (savedPath != null) {
                  // ডাউনলোড ও সেভ সফল হয়েছে!
                  showCustomSnackBar(
                    context: context,
                    message: "Calculations downloaded successfully to your device!",
                    isError: false,
                  );
                } else if (controller.errorMessage != null) {
                  // এরর মেসেজ শো করা
                  showCustomSnackBar(
                    context: context,
                    message: controller.errorMessage!,
                    isError: true,
                  );
                }
              }
            },
        borderRadius: BorderRadius.circular(12.r),
        child: Container(
          height: 45.h,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: Colors.white24),
            color: Colors.white.withOpacity(0.05),
          ),
          child: controller.inProgress
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                )
              : Text(
                  'Download Data (CSV)',
                  style: TextStyle(color: Colors.white, fontSize: 14.sp, fontWeight: FontWeight.w500),
                ),
        ),
      );
    },
  );
}
```
