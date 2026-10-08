# Smart Health System

A Flutter mobile app for citizen-facing healthcare services, built around appointment booking, digital health records, alerts, emergency assistance, and nearby care discovery.

## Overview

Smart Health System is designed to help citizens:

- book hospital appointments
- access a digital health card
- view lab reports, medical history, and vaccination records
- find nearby hospitals and medicine availability
- join telemedicine consultations
- receive health alerts and ward risk updates
- use emergency assistance tools

The app uses **Supabase** as its backend and is structured as a multi-screen Flutter application with a bottom navigation experience for Home, Services, Health, Alerts, and Profile.

## Features

### Home

- personalized greeting for the logged-in user
- quick access to healthcare services
- health alerts banner
- community updates section
- emergency quick action

### Services

- book appointment
- find hospitals
- medicine availability
- telemedicine
- emergency help

### Health

- digital health card with PDF download
- medical history
- lab reports
- vaccination records

### Alerts and Risk

- recent health alerts with severity filtering
- alert details
- ward risk status and ward risk details
- Solapur risk map support

### Emergency

- emergency assistance flow
- first aid screen
- emergency action confirmation screens

### Profile and Settings

- profile overview
- language selection
- notifications and reminders
- complaints and feedback
- about app

## Tech Stack

- **Flutter**
- **Dart**
- **Supabase**
- **Shared Preferences**
- **Geolocator**
- **URL Launcher**
- **QR Flutter**
- **PDF / Printing**
- **Flutter Map**

## Dependencies

Main packages used in this project:

- `supabase_flutter`
- `shared_preferences`
- `url_launcher`
- `geolocator`
- `qr_flutter`
- `pdf`
- `printing`
- `path_provider`
- `flutter_map`
- `latlong2`
- `mobile_scanner`

## Project Structure

```text
lib/
├── config/
├── models/
├── screens/
│   ├── alerts/
│   ├── appointment/
│   ├── auth/
│   ├── emergency/
│   ├── health/
│   ├── hospitals/
│   ├── medicine/
│   ├── profile/
│   ├── risk/
│   ├── risk_map/
│   ├── telemedicine/
│   └── updates/
├── widgets/
└── main.dart
```

## Screens Included

- Login
- Registration
- Home
- Services
- Health
- Alerts
- Profile
- Appointment form and confirmation
- Queue tracking
- Telemedicine doctor selection and consultation
- Hospital finder
- Medicine search
- Health card
- Lab reports
- Medical history
- Vaccination records
- Emergency screens
- Community updates
- Ward risk details
- Solapur risk map

## Backend

This app is integrated with **Supabase**.

Backend usage in the project includes:

- authentication-style user lookup via `auth_users`
- citizen profile data from `citizens`
- hospitals and staff data
- appointments
- diagnostic reports
- vaccination records
- medicine stock
- alerts
- ward risk and health index data

Supabase initialization is currently configured inside:

- [`lib/main.dart`](/E:/Ware/citizen_health_app/lib/main.dart)

Client access is defined in:

- [`lib/config/supabase_config.dart`](/E:/Ware/citizen_health_app/lib/config/supabase_config.dart)

## Getting Started

### Prerequisites

- Flutter SDK installed
- Dart SDK installed
- Android Studio or VS Code
- an emulator or physical device

### Installation

```bash
git clone <your-repo-url>
cd citizen_health_app
flutter pub get
```

### Run the app

```bash
flutter run
```

## Assets

The project currently uses assets such as:

- app and avatar images
- SMC logo
- Solapur GeoJSON map data

Configured in `pubspec.yaml`.

## Notes

- This repository currently contains direct Supabase initialization in app code.
- If you plan to publish the repo publicly, move secrets and environment-specific configuration into a safer setup before release.
- Some features depend on device permissions such as location access and external storage/file handling.

## Recommended Improvements

- move Supabase credentials to environment-based config
- add formal authentication flows
- add named routes or centralized routing
- add tests for form validation and backend integration
- add CI for `flutter analyze` and test runs

## Build

```bash
flutter build apk
```

For other targets:

```bash
flutter build appbundle
flutter build ios
flutter build web
```

## License

Add your preferred license here.

## Author

Maintained as part of the Smart Health System project.
