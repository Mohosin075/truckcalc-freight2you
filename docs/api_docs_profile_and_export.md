# API Integration Documentation: User Profile & Data Export

এই ডকুমেন্টেশনটিতে **User Profile Update** এবং **Calculations Export** করার API গুলোর বিস্তারিত বর্ণনা দেওয়া হলো। আপনি যেহেতু Flutter-এ মোবাইল অ্যাপ ডেভেলপ করছেন, তাই নিচে **Flutter (Dio এবং http package)** সহ রিয়েল-লাইফ কোড এক্সাম্পল দেওয়া হয়েছে।

---

## ১. User Profile Update API

ব্যবহারকারী তার প্রোফাইল তথ্য (যেমন: নাম, ফোন নম্বর, ঠিকানা, প্রোফাইল পিকচার ইত্যাদি) আপডেট করার জন্য এই API ব্যবহার করবেন। 

*   **URL:** `/api/v1/user/profile`
*   **Method:** `PATCH`
*   **Headers:**
    *   `Authorization: Bearer <ACCESS_TOKEN>`
    *   `Content-Type: multipart/form-data` (যদি প্রোফাইল পিকচার বা ইমেজ আপলোড করতে চান) অথবা `application/json` (যদি শুধু টেক্সট ডেটা আপডেট করতে চান এবং ইমেজ না থাকে)।

### A. রিকোয়েস্ট বডি এবং ফরম্যাট (Request Body & Format)

যেহেতু ব্যাকএন্ডে `fileAndBodyProcessorUsingDiskStorage` মিডলওয়্যার ব্যবহার করা হয়েছে, তাই আপনি একই সাথে প্রোফাইল ইমেজ ফাইল এবং অন্যান্য ফিল্ড (যেমন: nested JSON `address` বা `location`) পাঠাতে পারবেন। 

মিডলওয়্যারটি **`data`** নামের একটি টেক্সট ফিল্ড গ্রহণ করে এবং সেটির ভেতরের JSON স্ট্রিংকে পার্স করে মূল বডিতে রূপান্তর করে। আর ইমেজটি **`images`** ফিল্ডে ফাইল হিসেবে পাঠাতে হয়।

#### সমর্থিত ফিল্ডসমূহ (User Model Fields):
| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| **`images`** | `File` (multipart) | ব্যবহারকারীর প্রোফাইল পিকচার ফাইল। | `profile.png` / `avatar.jpg` |
| **`name`** | `String` | ব্যবহারকারীর নাম। | `"Mohosin Ahmed"` |
| **`phone`** | `String` | ফোন নম্বর। | `"+8801700000000"` |
| **`description`** | `String` | ব্যবহারকারীর সম্পর্কে সংক্ষিপ্ত বিবরণ। | `"Experienced truck driver & fleet manager."` |
| **`dateOfBirth`** | `String` (ISO Date-time) | জন্মতারিখ। | `"1995-10-15T00:00:00.000Z"` |
| **`address`** | `Object` (nested) | ঠিকানা সংক্রান্ত ডেটা। | `{ "city": "Dhaka", "postalCode": "1207", "country": "Bangladesh", "presentAddress": "Adabor", "permanentAddress": "Same" }` |
| **`location`** | `Object` (GeoJSON) | ভৌগোলিক অবস্থান। | `{ "type": "Point", "coordinates": [90.3563, 23.7745] }` (Note: `[longitude, latitude]`) |
| **`appId`** | `String` | অ্যাপের আইডি (যদি প্রয়োজন হয়)। | `"com.freight2you.truckcalc"` |
| **`deviceToken`** | `String` | পুশ নোটিফিকেশনের জন্য টোকেন। | `"fcm-token-123456789..."` |
| **`isOnboardingComplete`**| `Boolean` | অনবোর্ডিং সম্পূর্ণ হয়েছে কিনা। | `true` |

---

### B. cURL এক্সাম্পল (Multipart/Form-data)

```bash
curl --location --request PATCH 'http://localhost:5000/api/v1/user/profile' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--form 'images=@"/path/to/profile_pic.png"' \
--form 'data="{
    \"name\": \"Mohosin Ahmed\",
    \"phone\": \"+8801700000000\",
    \"description\": \"Professional Truck Driver\",
    \"address\": {
        \"city\": \"Dhaka\",
        \"postalCode\": \"1212\",
        \"country\": \"Bangladesh\",
        \"presentAddress\": \"Badda, Dhaka\"
    },
    \"location\": {
        \"type\": \"Point\",
        \"coordinates\": [90.4219, 23.7805]
    }
}"'
```

---

### C. Flutter Integration Code (User Profile Update)

Flutter অ্যাপে ফাইল এবং ডেটা একসাথে পাঠানোর জন্য নিচে **Dio** এবং **http** প্যাকেজের উদাহরণ দেওয়া হলো:

#### Option 1: Using `Dio` Package (Highly Recommended)
Dio ব্যবহার করলে ফাইল আপলোড এবং প্রোগ্রেস ট্র্যাকিং খুব সহজে করা যায়।

```dart
import 'dart:convert';
import 'package:dio/dio.dart' as dio;

Future<void> updateProfile({
  required String token,
  required String name,
  required String phone,
  required String city,
  required String country,
  String? imagePath, // Local file path, e.g., pickerResult.path
}) async {
  final url = 'http://YOUR_SERVER_IP:5000/api/v1/user/profile';
  final dioClient = dio.Dio();

  // Set Auth headers
  dioClient.options.headers = {
    'Authorization': 'Bearer $token',
    'Accept': 'application/json',
  };

  // Construct JSON Data payload
  final Map<String, dynamic> jsonPayload = {
    'name': name,
    'phone': phone,
    'address': {
      'city': city,
      'country': country,
    },
  };

  // Prepare FormData
  final formDataMap = <String, dynamic>{
    'data': json.encode(jsonPayload), // Pass stringified JSON to the 'data' field
  };

  // If user selected an image, append it as MultipartFile
  if (imagePath != null && imagePath.isNotEmpty) {
    formDataMap['images'] = await dio.MultipartFile.fromFile(
      imagePath,
      filename: imagePath.split('/').last,
    );
  }

  final formData = dio.FormData.fromMap(formDataMap);

  try {
    final response = await dioClient.patch(
      url,
      data: formData,
    );

    if (response.statusCode == 200) {
      print('Profile updated successfully: ${response.data}');
    } else {
      print('Failed to update profile: ${response.statusMessage}');
    }
  } on dio.DioException catch (e) {
    print('Dio Error: ${e.response?.data ?? e.message}');
  }
}
```

#### Option 2: Using `http` Package (Standard Flutter)
যদি আপনি সাধারণ `http` লাইব্রেরি ব্যবহার করতে চান:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;

Future<void> updateProfileWithHttp({
  required String token,
  required String name,
  required String phone,
  required String city,
  String? imagePath,
}) async {
  final uri = Uri.parse('http://YOUR_SERVER_IP:5000/api/v1/user/profile');
  
  // Create multipart request
  final request = http.MultipartRequest('PATCH', uri);
  
  // Headers
  request.headers['Authorization'] = 'Bearer $token';

  // Construct JSON payload
  final Map<String, dynamic> jsonPayload = {
    'name': name,
    'phone': phone,
    'address': {
      'city': city,
    },
  };

  // Add the 'data' field containing stringified JSON
  request.fields['data'] = json.encode(jsonPayload);

  // Add file if exists
  if (imagePath != null && imagePath.isNotEmpty) {
    final fileStream = http.ByteStream(Stream.castFrom(
      Stream.fromIterable([await http.MultipartFile.fromPath('images', imagePath).then((f) => f.finalize())])
    ));
    // Alternate easier way:
    final multipartFile = await http.MultipartFile.fromPath(
      'images',
      imagePath,
      filename: path.basename(imagePath),
    );
    request.files.add(multipartFile);
  }

  try {
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      print('Profile updated: ${response.body}');
    } else {
      print('Error updating profile: ${response.body}');
    }
  } catch (e) {
    print('HTTP Error: $e');
  }
}
```

---

## ২. Export Data API (Calculation Export)

ব্যবহারকারী তার করা সমস্ত ট্রাকিং হিসাব-নিকাশ (Calculations) একটি সাধারণ/ফ্ল্যাটেনড্ ফরম্যাটে এক্সপোর্ট করার জন্য এই API ব্যবহার করবেন। ব্যাকএন্ডে এটি সমস্ত টাইপের হিসাব (`LOAD`, `GOAL`, `COST`) ডাটাবেস থেকে তুলে নিয়ে এসে সবগুলোকে মার্জ ও চ্যাপ্টা (flattened) করে দেয় যাতে সহজে CSV বা Excel জেনারেট করা যায়।

*   **URL:** `/api/v1/calculations/export`
*   **Method:** `GET`
*   **Headers:**
    *   `Authorization: Bearer <ACCESS_TOKEN>`
*   **Response Format:** `JSON Array`

---

### A. রেসপন্স ডাটা ফরম্যাট (Response Structure)

এই এপিআইটি ব্যবহারকারীর সমস্ত হিসাব নিয়ে একটি JSON অ্যারে রিটার্ন করে। প্রতিটি অবজেক্টের মধ্যে সাধারণ কিছু ফিল্ড থাকে এবং টাইপ অনুযায়ী আলাদা আলাদা ডেটা থাকে।

#### ১. Common Fields (সকল হিসাবের জন্য সাধারণ ফিল্ডসমূহ):
*   `id` : হিসাবটির ইউনিক ডাটাবেস আইডি।
*   `type` : হিসাবের ধরণ। ৩টি মান হতে পারে:
    *   `LOAD` : Load Calculator
    *   `GOAL` : Rate Planner / Weekly Goal Planner
    *   `COST` : CPM (Cost Per Mile) Calculator
*   `createdAt` : হিসাবটি তৈরির সময়।

---

#### ২. Type-specific Fields (হিসাবের ধরণ অনুযায়ী ফিল্ডসমূহ):

##### A. যখন `type` = `LOAD` (Load Surcharge/Profit Calculator):
| Field | Type | Description |
| :--- | :--- | :--- |
| `baseRate` | `Number` | মূল রেট প্রতি মাইল। |
| `loadedMiles` | `Number` | মোট লোডেড মাইল। |
| `fuelSurcharge` | `Number` | ফুয়েল সারচার্জ প্রতি মাইল। |
| `tolls` | `Number` | টোল ফি। |
| `dhMiles` | `Number` | ডেডহেড (DH) মাইল। |
| `dhRate` | `Number` | ডেডহেড রেট প্রতি মাইল। |
| `bonus` | `Number` | অতিরিক্ত বোনাস。 |
| `costPerMile` | `Number` | প্রতি মাইলের খরচ। |
| `driverPercentage`| `Number` | ড্রাইভারকে দেওয়া লভ্যাংশের শতকরা হার (%)। |
| `totalFSC` | `Number` | মোট ফুয়েল সারচার্জ (`fuelSurcharge * loadedMiles`) |
| `totalDH` | `Number` | মোট ডেডহেড চার্জ (`dhMiles * dhRate`) |
| `totalRevenue` | `Number` | মোট অর্জিত রেভিনিউ। |
| `totalMiles` | `Number` | মোট অতিক্রান্ত দূরত্ব (`loadedMiles + dhMiles`) |
| `compensationPerMile`|`Number`| প্রতি মাইলে ক্ষতিপূরণ বা আর্নিং। |
| `totalCost` | `Number` | মোট পরিচালনা খরচ। |
| `profitPerMile` | `Number` | প্রতি মাইলের নিট লাভ। |
| `totalProfit` | `Number` | মোট অর্জিত লাভ। |
| `driverPay` | `Number` | ড্রাইভারের পেমেন্ট। |
| `ownerPay` | `Number` | ওনার/মালিকের পেমেন্ট। |

##### B. যখন `type` = `GOAL` (Weekly Goal Planner / Rate Planner):
| Field | Type | Description |
| :--- | :--- | :--- |
| `desiredWeeklyProfit` | `Number` | সপ্তাহে কাঙ্ক্ষিত লাভ। |
| `costPerMile` | `Number` | প্রতি মাইলের রানিং কস্ট। |
| `daysPerWeek` | `Number` | সপ্তাহে কতদিন গাড়ি চলবে। |
| `maxMilesPerDay` | `Number` | দিনে সর্বোচ্চ কত মাইল গাড়ি চালানো যাবে। |
| `deadheadPayPerMile` | `Number` | ডেডহেডের জন্য প্রতি মাইলে পেমেন্ট। |
| `driverPercentage` | `Number` | ড্রাইভার শেয়ার (%)। |
| `loadedMilesNeeded` | `Number` | কাঙ্ক্ষিত লাভের জন্য প্রয়োজনীয় লোডেড মাইল। |
| `minTargetRate` | `Number` | ন্যূনতম টার্গেট রেট প্রতি মাইল। |
| `maxDHPerDay` | `Number` | দিনে সর্বোচ্চ ডেডহেড মাইল সুপারিশকৃত। |
| `maxDHPerWeek` | `Number` | সপ্তাহে সর্বোচ্চ ডেডহেড মাইল সুপারিশকৃত। |
| `totalRevenue` | `Number` | মোট প্রাক্কলিত রেভিনিউ। |
| `totalCost` | `Number` | মোট প্রাক্কলিত খরচ। |
| `driverPay` | `Number` | ড্রাইভার পেমেন্ট। |
| `ownerPay` | `Number` | ওনার পেমেন্ট। |

##### C. যখন `type` = `COST` (CPM - Cost Per Mile Calculator):
| Field | Type | Description |
| :--- | :--- | :--- |
| `milesPerWeek` | `Number` | সপ্তাহে অতিক্রান্ত মোট মাইল। |
| `insurance` | `Number` | ইন্স্যুরেন্স খরচ। |
| `truckPayment` | `Number` | ট্রাকের কিস্তি / পেমেন্ট। |
| `escrow` | `Number` | এসক্রো ফান্ড ডিপোজিট。 |
| `repairSavings` | `Number` | মেরামতের জন্য জমানো টাকা। |
| `driverPayFixed` | `Number` | ড্রাইভারের ফিক্সড বেতন। |
| `permits` | `Number` | পারমিটের খরচ। |
| `otherFixed` | `Number` | অন্যান্য ফিক্সড খরচ। |
| `fuelPrice` | `Number` | প্রতি গ্যালন ফুয়েলের মূল্য। |
| `avgMPG` | `Number` | গাড়ির গড় মাইলেজ (MPG)। |
| `oilChangesPerYear` | `Number` | বছরে কতবার মবিল/ইঞ্জিন অয়েল পরিবর্তন করা হয়। |
| `costPerOilChange` | `Number` | প্রতিবার ইঞ্জিন অয়েল পরিবর্তনের খরচ। |
| `tireCostPerYear` | `Number` | বছরে টায়ারের জন্য প্রাক্কলিত খরচ। |
| `maintenanceCostPerYear` | `Number` | বছরে অন্যান্য রক্ষণাবেক্ষণ খরচ। |
| `totalWeeklyFixed` | `Number` | প্রতি সপ্তাহের মোট ফিক্সড খরচ。 |
| `weeklyFuelCost` | `Number` | প্রতি সপ্তাহের মোট জ্বালানি তেল বাবদ খরচ। |
| `weeklyOilChangeCost` | `Number` | প্রতি সপ্তাহের গড় অয়েল চেঞ্জ খরচ। |
| `weeklyTireCost` | `Number` | প্রতি সপ্তাহের গড় টায়ার খরচ। |
| `weeklyMaintenanceCost`| `Number` | প্রতি সপ্তাহের গড় রক্ষণাবেক্ষণ খরচ। |
| `totalWeeklyVariable` | `Number` | প্রতি সপ্তাহের মোট পরিবর্তনশীল (variable) খরচ। |
| `totalWeeklyOperatingCost`| `Number`| প্রতি সপ্তাহের মোট অপারেটিং কস্ট。 |
| `trueCPM` | `Number` | প্রকৃত কস্ট প্রতি মাইল (True CPM)। |

---

### B. রেসপন্স এক্সাম্পল (Response JSON Sample)

```json
[
  {
    "id": "664c39fbd348b61a9c39e1bc",
    "type": "LOAD",
    "createdAt": "2026-05-20T03:15:00.000Z",
    "baseRate": 2.5,
    "loadedMiles": 500,
    "fuelSurcharge": 0.45,
    "tolls": 50,
    "dhMiles": 50,
    "dhRate": 1.2,
    "bonus": 100,
    "costPerMile": 1.8,
    "driverPercentage": 25,
    "totalFSC": 225,
    "totalDH": 60,
    "totalRevenue": 1685,
    "totalMiles": 550,
    "compensationPerMile": 3.06,
    "totalCost": 990,
    "profitPerMile": 1.26,
    "totalProfit": 695,
    "driverPay": 421.25,
    "ownerPay": 1263.75
  },
  {
    "id": "664c3c21d348b61a9c39e1e2",
    "type": "COST",
    "createdAt": "2026-05-20T04:20:00.000Z",
    "milesPerWeek": 3000,
    "insurance": 150,
    "truckPayment": 350,
    "escrow": 50,
    "repairSavings": 100,
    "driverPayFixed": 800,
    "permits": 20,
    "otherFixed": 30,
    "fuelPrice": 3.8,
    "avgMPG": 6.5,
    "oilChangesPerYear": 6,
    "costPerOilChange": 350,
    "tireCostPerYear": 2400,
    "maintenanceCostPerYear": 5000,
    "totalWeeklyFixed": 1500,
    "weeklyFuelCost": 1753.85,
    "weeklyOilChangeCost": 40.38,
    "weeklyTireCost": 46.15,
    "weeklyMaintenanceCost": 96.15,
    "totalWeeklyVariable": 1936.53,
    "totalWeeklyOperatingCost": 3436.53,
    "trueCPM": 1.15
  }
]
```

---

### C. Flutter Integration Code (Calculation Export)

Flutter-এ এই এপিআই কল করে ডাটা রিসিভ করার এবং পার্স করার একটি নমুনা নিচে দেওয়া হলো:

```dart
import 'package:dio/dio.dart';

// Model to represent a generic flattened calculation item
class ExportedCalculation {
  final String id;
  final String type;
  final DateTime createdAt;
  final Map<String, dynamic> rawData; // holds all other dynamic fields

  ExportedCalculation({
    required this.id,
    required this.type,
    required this.createdAt,
    required this.rawData,
  });

  factory ExportedCalculation.fromJson(Map<String, dynamic> json) {
    // Extract base fields
    final id = json['id'] as String;
    final type = json['type'] as String;
    final createdAt = DateTime.parse(json['createdAt'] as String);
    
    // Put everything else in rawData map
    final rawData = Map<String, dynamic>.from(json)
      ..remove('id')
      ..remove('type')
      ..remove('createdAt');

    return ExportedCalculation(
      id: id,
      type: type,
      createdAt: createdAt,
      rawData: rawData,
    );
  }
}

// Fetch exported data from API
Future<List<ExportedCalculation>?> fetchExportData(String token) async {
  final url = 'http://YOUR_SERVER_IP:5000/api/v1/calculations/export';
  final dioClient = Dio();

  try {
    final response = await dioClient.get(
      url,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      ),
    );

    if (response.statusCode == 200 && response.data != null) {
      // The direct response data is a list inside the custom standard response or raw list
      // Depending on standard response model: { success: true, data: [...] }
      final responseBody = response.data;
      
      if (responseBody['success'] == true) {
        final List<dynamic> dataList = responseBody['data'];
        return dataList
            .map((item) => ExportedCalculation.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    }
  } on DioException catch (e) {
    print('Dio Error: ${e.response?.data ?? e.message}');
  }
  return null;
}
```

#### Flutter UI-তে কিভাবে CSV এক্সপোর্ট জেনারেট করবেন (সংক্ষিপ্ত নমুনা):
আপনি `csv` নামক ডার্ট প্যাকেজ ব্যবহার করে এই লিস্টকে সিএসভিতে কনভার্ট করতে পারেন:
```dart
import 'package:csv/csv.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';

Future<String> exportToCSVFile(List<ExportedCalculation> list) async {
  List<List<dynamic>> rows = [];
  
  // 1. Add headers
  rows.add(["ID", "Type", "Created At", "Details"]);

  // 2. Add data rows
  for (var item in list) {
    rows.add([
      item.id,
      item.type,
      item.createdAt.toIso8601String(),
      item.rawData.toString(), // simplifies representation or write conditional columns
    ]);
  }

  // Convert to CSV string
  String csvString = const ListToCsvConverter().convert(rows);

  // Write to temporary/documents directory
  final directory = await getApplicationDocumentsDirectory();
  final pathOfTheFile = "${directory.path}/calculations_export_${DateTime.now().millisecondsSinceEpoch}.csv";
  final file = File(pathOfTheFile);
  await file.writeAsString(csvString);

  return pathOfTheFile;
}
```
